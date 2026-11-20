create schema lingo_access;
revoke all on schema lingo_access from public, anon, authenticated;
grant usage on schema lingo_access to authenticated;
alter default privileges in schema lingo_access revoke execute on functions from public;

create table lingo_access.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin')),
  appointed_at timestamptz not null default now()
);
create table lingo_access.promos (
  id uuid primary key default gen_random_uuid(),
  code_hash bytea not null unique,
  suffix text not null,
  label text not null check (char_length(label) between 1 and 80),
  license_days integer check (license_days between 1 and 3650),
  use_limit integer not null check (use_limit between 1 and 100000),
  used integer not null default 0 check (used >= 0 and used <= use_limit),
  redeem_until timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create table lingo_access.licenses (
  user_id uuid primary key references auth.users(id) on delete cascade,
  expires_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now()
);
create table lingo_access.redemptions (
  promo_id uuid not null references lingo_access.promos(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  primary key (promo_id, user_id)
);
create index on lingo_access.redemptions(user_id);
create index on lingo_access.promos(created_by);
alter table lingo_access.staff enable row level security;
alter table lingo_access.promos enable row level security;
alter table lingo_access.licenses enable row level security;
alter table lingo_access.redemptions enable row level security;
revoke all on all tables in schema lingo_access from public, anon, authenticated;

create function lingo_access.request_account() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare account uuid := auth.uid();
begin
  if account is null or coalesce(auth.jwt()->>'is_anonymous', 'false') = 'true'
    or not exists (select 1 from auth.sessions s where s.user_id = account and s.id = (auth.jwt()->>'session_id')::uuid)
  then
    raise exception using errcode = '42501', message = 'account_required';
  end if;
  return account;
end;
$$;

create function lingo_access.status() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare account uuid := lingo_access.request_account();
begin
  return (
    select jsonb_build_object(
      'role', s.role,
      'licensed', coalesce(l.revoked_at is null and (l.expires_at is null or l.expires_at > now()) and l.user_id is not null, false),
      'expires_at', l.expires_at
    )
    from (select account as id) a
    left join lingo_access.staff s on s.user_id = a.id
    left join lingo_access.licenses l on l.user_id = a.id
  );
end;
$$;

create function lingo_access.redeem(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account uuid := lingo_access.request_account();
  normalized text := upper(regexp_replace(coalesce(p_code, ''), '[[:space:]-]+', '', 'g'));
  promo lingo_access.promos%rowtype;
  existing_license lingo_access.licenses%rowtype;
  next_expiry timestamptz;
begin
  if normalized !~ '^[A-F0-9]{20}$' then raise exception 'promo_unavailable'; end if;

  perform pg_advisory_xact_lock(hashtextextended(account::text, 281));
  select * into promo from lingo_access.promos
    where code_hash = sha256(convert_to(normalized, 'UTF8')) for update;
  if not found then raise exception 'promo_unavailable'; end if;
  if exists (select 1 from lingo_access.redemptions where promo_id = promo.id and user_id = account) then
    return lingo_access.status() || jsonb_build_object('already_redeemed', true);
  end if;
  if promo.disabled_at is not null or promo.used >= promo.use_limit
    or (promo.redeem_until is not null and promo.redeem_until <= now())
  then raise exception 'promo_unavailable'; end if;

  select * into existing_license from lingo_access.licenses where user_id = account;
  if existing_license.user_id is not null and existing_license.revoked_at is null and existing_license.expires_at is null then
    return lingo_access.status() || jsonb_build_object('permanent_access', true);
  end if;
  if promo.license_days is not null then
    next_expiry := greatest(now(), case when existing_license.revoked_at is null then existing_license.expires_at end)
      + make_interval(days => promo.license_days);
  end if;
  insert into lingo_access.licenses(user_id, expires_at) values (account, next_expiry)
    on conflict (user_id) do update set expires_at = excluded.expires_at, revoked_at = null, updated_at = now();
  insert into lingo_access.redemptions(promo_id, user_id) values (promo.id, account);
  update lingo_access.promos set used = used + 1 where id = promo.id;
  return lingo_access.status();
end;
$$;

create function lingo_access.admin(p_action text, p_options jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account uuid := lingo_access.request_account();
  actor_role text;
  target uuid;
  code text;
  target_email text;
  promo_label text;
begin
  select role into actor_role from lingo_access.staff where user_id = account for share;
  if actor_role is null then raise exception using errcode = '42501', message = 'admin_required'; end if;
  case p_action
    when 'list_promos' then
      return (select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc, p.id desc), '[]'::jsonb) from (
        select id, suffix, label, license_days, use_limit, used, redeem_until, disabled_at, created_at
        from lingo_access.promos order by created_at desc, id desc limit 50 offset greatest(0, least(coalesce((p_options->>'offset')::integer, 0), 100000))
      ) p);
    when 'create_promo' then
      promo_label := btrim(coalesce(p_options->>'label', ''));
      if char_length(promo_label) not between 1 and 80 then raise exception 'invalid_promo_label'; end if;
      if p_options->>'redeem_days' is not null and (p_options->>'redeem_days')::integer not between 1 and 3650 then raise exception 'invalid_promo_period'; end if;
      code := upper(left(replace(gen_random_uuid()::text, '-', ''), 20));
      insert into lingo_access.promos(code_hash, suffix, label, license_days, use_limit, redeem_until, created_by)
      values (sha256(convert_to(code, 'UTF8')), right(code, 4), promo_label, (p_options->>'license_days')::integer,
        (p_options->>'use_limit')::integer, now() + make_interval(days => (p_options->>'redeem_days')::integer), account);
      return jsonb_build_object('code', code);
    when 'disable_promo' then
      update lingo_access.promos set disabled_at = now()
        where id = (p_options->>'id')::uuid and disabled_at is null;
      return '{}'::jsonb;
    when 'find_user', 'grant_admin', 'revoke_admin', 'revoke_license' then
      target_email := lower(btrim(coalesce(p_options->>'email', '')));
      if char_length(target_email) not between 3 and 254 then raise exception 'account_not_found'; end if;
      select id into target from auth.users where lower(email) = target_email and email_confirmed_at is not null and not is_anonymous;
      if target is null then raise exception 'account_not_found'; end if;
      if p_action in ('grant_admin', 'revoke_admin') then
        if actor_role <> 'owner' then raise exception using errcode = '42501', message = 'owner_required'; end if;
        if p_action = 'grant_admin' then
          insert into lingo_access.staff(user_id, role) values (target, 'admin') on conflict (user_id) do nothing;
        else
          delete from lingo_access.staff where user_id = target and role = 'admin';
        end if;
      elsif p_action = 'revoke_license' then
        perform pg_advisory_xact_lock(hashtextextended(target::text, 281));
        update lingo_access.licenses set revoked_at = now(), updated_at = now() where user_id = target and revoked_at is null;
      end if;
      return (
        select jsonb_build_object('email', target_email, 'name', p.display_name, 'role', s.role,
          'licensed', coalesce(l.revoked_at is null and (l.expires_at is null or l.expires_at > now()) and l.user_id is not null, false),
          'expires_at', l.expires_at)
        from (select target as id) a
        left join public.profiles p on p.id = a.id
        left join lingo_access.staff s on s.user_id = a.id
        left join lingo_access.licenses l on l.user_id = a.id
      );
    else raise exception 'unknown_access_action';
  end case;
end;
$$;

create function public.lingo_access_status() returns jsonb
language sql stable security invoker set search_path = '' as $$ select lingo_access.status() $$;
create function public.lingo_redeem(p_code text) returns jsonb
language sql security invoker set search_path = '' as $$ select lingo_access.redeem(p_code) $$;
create function public.lingo_admin(p_action text, p_options jsonb default '{}'::jsonb) returns jsonb
language sql security invoker set search_path = '' as $$ select lingo_access.admin(p_action, p_options) $$;

revoke all on all functions in schema lingo_access from public, anon, authenticated;
grant execute on function lingo_access.status(), lingo_access.redeem(text), lingo_access.admin(text, jsonb) to authenticated;
revoke execute on function public.lingo_access_status(), public.lingo_redeem(text), public.lingo_admin(text, jsonb) from public, anon, authenticated;
grant execute on function public.lingo_access_status(), public.lingo_redeem(text), public.lingo_admin(text, jsonb) to authenticated;

create function lingo_access.sync_display_name() returns trigger
language plpgsql security definer set search_path = '' as $$
declare display_name text := nullif(btrim(new.raw_user_meta_data->>'display_name'), '');
begin
  if display_name is not null and char_length(display_name) <= 50 then
    insert into public.profiles(id, display_name) values (new.id, display_name)
      on conflict (id) do update set display_name = excluded.display_name, updated_at = now();
  end if;
  return new;
end;
$$;
revoke execute on function lingo_access.sync_display_name() from public, anon, authenticated;
create trigger lingo_profile_on_signup after insert on auth.users
  for each row execute function lingo_access.sync_display_name();
create trigger lingo_profile_on_name_change after update of raw_user_meta_data on auth.users
  for each row when (old.raw_user_meta_data->>'display_name' is distinct from new.raw_user_meta_data->>'display_name')
  execute function lingo_access.sync_display_name();
