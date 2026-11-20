alter table lingo_access.events drop constraint events_kind_check;
alter table lingo_access.events
  add constraint events_kind_check check (kind in (
    'promo_created', 'promo_disabled', 'promo_redeemed', 'license_revoked', 'license_granted', 'license_extended'
  )),
  add column reason text check (char_length(reason) between 3 and 200),
  add column granted_days integer check (granted_days between 1 and 3650),
  add column request_key text check (char_length(request_key) between 12 and 80);
create unique index events_manual_grant_request_idx on lingo_access.events (actor_id, request_key) where request_key is not null;
create index promos_created_page_idx on lingo_access.promos (created_at desc, id desc);

create table lingo_access.role_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete set null,
  target_id uuid references auth.users(id) on delete set null,
  before_role text check (before_role in ('owner', 'admin')),
  after_role text check (after_role in ('owner', 'admin')),
  check (before_role is distinct from after_role)
);
alter table lingo_access.role_events enable row level security;
revoke all on lingo_access.role_events from public, anon, authenticated;
create index on lingo_access.role_events (occurred_at desc, id desc);
create index on lingo_access.role_events (actor_id);
create index on lingo_access.role_events (target_id);

create function lingo_access.record_role_event() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  account uuid;
  before_role text;
  after_role text;
begin
  if tg_op = 'DELETE' then
    account := old.user_id;
  else
    account := new.user_id;
    after_role := new.role;
  end if;
  if tg_op <> 'INSERT' then before_role := old.role; end if;
  if before_role is distinct from after_role then
    insert into lingo_access.role_events (actor_id, target_id, before_role, after_role)
    values (
      (select id from auth.users where id = auth.uid()),
      (select id from auth.users where id = account),
      before_role, after_role
    );
  end if;
  return null;
end;
$$;

create trigger journal_staff_changes after insert or update of role or delete on lingo_access.staff
  for each row execute function lingo_access.record_role_event();

create function lingo_access.admin_users(p_query text, p_filter text, p_offset integer) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  query text := lower(btrim(coalesce(p_query, '')));
begin
  if p_filter not in ('all', 'active', 'expiring', 'none') or char_length(query) > 254 then raise exception 'invalid_filter'; end if;
  return (
    with batch as materialized (
      select u.id, u.email, p.display_name as name, u.email_confirmed_at is not null as confirmed, u.created_at,
        s.role, l.expires_at, l.revoked_at, current_license.licensed
      from auth.users u
      left join public.profiles p on p.id = u.id
      left join lingo_access.staff s on s.user_id = u.id
      left join lingo_access.licenses l on l.user_id = u.id
      cross join lateral (select l.user_id is not null and l.revoked_at is null and (l.expires_at is null or l.expires_at > now()) as licensed) current_license
      where not u.is_anonymous and u.email is not null
        and (query = '' or position(query in lower(u.email)) > 0 or position(query in lower(p.display_name)) > 0)
        and (p_filter = 'all'
          or (p_filter = 'active' and current_license.licensed)
          or (p_filter = 'expiring' and current_license.licensed and l.expires_at <= now() + interval '7 days')
          or (p_filter = 'none' and not current_license.licensed and s.role is null))
      order by u.created_at desc nulls last, u.id desc limit 31 offset p_offset
    )
    select jsonb_build_object('users', coalesce((
      select jsonb_agg(to_jsonb(u) - 'created_at' order by u.created_at desc nulls last, u.id desc)
      from (select * from batch order by created_at desc nulls last, id desc limit 30) u
    ), '[]'::jsonb), 'has_more', (select count(*) > 30 from batch))
  );
end;
$$;

create function lingo_access.grant_timed_license(p_actor uuid, p_target uuid, p_options jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  grant_days integer := (p_options->>'license_days')::integer;
  grant_reason text := btrim(coalesce(p_options->>'reason', ''));
  grant_key text := coalesce(p_options->>'request_key', '');
  prior lingo_access.events%rowtype;
  current_license lingo_access.licenses%rowtype;
  extends_active boolean;
  new_expiry timestamptz;
begin
  if grant_days is null or grant_days not between 1 and 3650 then raise exception 'invalid_license_days'; end if;
  if char_length(grant_reason) not between 3 and 200 then raise exception 'invalid_license_reason'; end if;
  if grant_key !~ '^[A-Za-z0-9-]{12,80}$' then raise exception 'invalid_request_key'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_actor::text || ':' || grant_key, 844));
  select * into prior from lingo_access.events where actor_id = p_actor and request_key = grant_key;
  if found then
    if prior.target_id is distinct from p_target or prior.granted_days <> grant_days or prior.reason <> grant_reason then
      raise exception 'license_request_conflict';
    end if;
    return;
  end if;

  -- Serialize with promo redemption and license revocation on the same account.
  perform pg_advisory_xact_lock(hashtextextended(p_target::text, 281));
  select * into current_license from lingo_access.licenses where user_id = p_target;
  if found and current_license.revoked_at is null and current_license.expires_at is null then
    raise exception 'license_already_permanent';
  end if;
  extends_active := current_license.revoked_at is null and coalesce(current_license.expires_at > now(), false);
  new_expiry := (case when extends_active then current_license.expires_at else now() end) + make_interval(days => grant_days);
  insert into lingo_access.licenses(user_id, expires_at) values (p_target, new_expiry)
    on conflict (user_id) do update set expires_at = excluded.expires_at, revoked_at = null, updated_at = now();
  insert into lingo_access.events(occurred_at, kind, actor_id, target_id, expires_at, reason, granted_days, request_key)
    values (now(), case when extends_active then 'license_extended' else 'license_granted' end,
      p_actor, p_target, new_expiry, grant_reason, grant_days, grant_key);
end;
$$;

create function lingo_access.admin_role_events(p_offset integer) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with batch as materialized (
    select id, occurred_at, actor_id, target_id, before_role, after_role
    from lingo_access.role_events order by occurred_at desc, id desc limit 31 offset p_offset
  ), page as (
    select e.id, e.occurred_at, e.before_role, e.after_role, actor.email as actor_email, target.email as target_email
    from (select * from batch order by occurred_at desc, id desc limit 30) e
    left join auth.users actor on actor.id = e.actor_id
    left join auth.users target on target.id = e.target_id
  )
  select jsonb_build_object(
    'events', coalesce((select jsonb_agg(to_jsonb(p) order by p.occurred_at desc, p.id desc) from page p), '[]'::jsonb),
    'has_more', (select count(*) > 30 from batch)
  )
$$;

revoke execute on function lingo_access.record_role_event(), lingo_access.admin_users(text,text,integer),
  lingo_access.grant_timed_license(uuid,uuid,jsonb), lingo_access.admin_role_events(integer) from public, anon, authenticated;

create or replace function lingo_access.admin(p_action text, p_options jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account uuid := lingo_access.request_account();
  actor_role text;
  target uuid;
  code text;
  target_email text;
  promo_label text;
  filter_key text := coalesce(p_options->>'filter', 'all');
  page_offset integer;
begin
  select role into actor_role from lingo_access.staff where user_id = account for share;
  if actor_role is null then raise exception using errcode = '42501', message = 'admin_required'; end if;
  if p_action in ('list_users', 'list_role_events', 'list_promos') then
    page_offset := greatest(0, least(coalesce((p_options->>'offset')::integer, 0), 100000));
  end if;
  case p_action
    when 'list_users' then
      return lingo_access.admin_users(p_options->>'query', filter_key, page_offset);
    when 'list_role_events' then
      if actor_role <> 'owner' then raise exception using errcode = '42501', message = 'owner_required'; end if;
      return lingo_access.admin_role_events(page_offset);
    when 'list_promos' then
      if filter_key not in ('all', 'active', 'expired', 'exhausted', 'disabled') then raise exception 'invalid_filter'; end if;
      return (select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc, p.id desc), '[]'::jsonb) from (
        select id, suffix, label, license_days, use_limit, used, redeem_until, disabled_at, created_at,
          use_limit - used as remaining, status
        from lingo_access.promos
        cross join lateral (select case
          when disabled_at is not null then 'disabled'
          when redeem_until <= now() then 'expired'
          when used >= use_limit then 'exhausted'
          else 'active' end as status) state
        where filter_key = 'all' or status = filter_key
        order by created_at desc, id desc limit 50 offset page_offset
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
    when 'find_user', 'grant_admin', 'revoke_admin', 'revoke_license', 'grant_license' then
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
      elsif p_action = 'grant_license' then
        perform lingo_access.grant_timed_license(account, target, p_options);
      elsif p_action = 'revoke_license' then
        perform pg_advisory_xact_lock(hashtextextended(target::text, 281));
        update lingo_access.licenses set revoked_at = now(), updated_at = now() where user_id = target and revoked_at is null;
      end if;
      return (
        select jsonb_build_object('email', target_email, 'name', p.display_name, 'role', s.role,
          'licensed', coalesce(l.revoked_at is null and (l.expires_at is null or l.expires_at > now()) and l.user_id is not null, false),
          'expires_at', l.expires_at, 'revoked_at', l.revoked_at)
        from (select target as id) a
        left join public.profiles p on p.id = a.id
        left join lingo_access.staff s on s.user_id = a.id
        left join lingo_access.licenses l on l.user_id = a.id
      );
    else raise exception 'unknown_access_action';
  end case;
end;
$$;

create or replace function lingo_access.list_events_filtered(p_before_at timestamptz, p_before_id uuid, p_email text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  account uuid := lingo_access.request_account();
  subject uuid;
begin
  if not exists (select 1 from lingo_access.staff where user_id = account) then
    raise exception using errcode = '42501', message = 'admin_required';
  end if;
  if (p_before_at is null) <> (p_before_id is null) then raise exception 'invalid_journal_cursor'; end if;

  if p_email is not null then
    if char_length(p_email) not between 3 and 254 then raise exception 'account_not_found'; end if;
    select id into subject from auth.users where lower(email) = lower(btrim(p_email)) and email_confirmed_at is not null and not is_anonymous;
    if subject is null then raise exception 'account_not_found'; end if;
  end if;

  return (
    with batch as materialized (
      select id, occurred_at, kind, actor_id, target_id, promo_label, promo_suffix, expires_at, historical, reason, granted_days
      from lingo_access.events
      where (subject is null or target_id = subject)
        and (p_before_at is null or (occurred_at, id) < (p_before_at, p_before_id))
      order by occurred_at desc, id desc
      limit 31
    ), page as (
      select e.id, e.occurred_at, e.kind, e.promo_label, e.promo_suffix, e.expires_at, e.historical, e.reason, e.granted_days,
        actor.email as actor_email, target.email as target_email
      from (select * from batch order by occurred_at desc, id desc limit 30) e
      left join auth.users actor on actor.id = e.actor_id
      left join auth.users target on target.id = e.target_id
    )
    select jsonb_build_object(
      'events', coalesce((select jsonb_agg(to_jsonb(p) order by p.occurred_at desc, p.id desc) from page p), '[]'::jsonb),
      'has_more', (select count(*) > 30 from batch),
      'license', case when subject is not null then (
        select jsonb_build_object(
          'licensed', coalesce(l.revoked_at is null and (l.expires_at is null or l.expires_at > now()) and l.user_id is not null, false),
          'expires_at', l.expires_at,
          'revoked_at', l.revoked_at
        )
        from (select subject as id) a left join lingo_access.licenses l on l.user_id = a.id
      ) end
    )
  );
end;
$$;
