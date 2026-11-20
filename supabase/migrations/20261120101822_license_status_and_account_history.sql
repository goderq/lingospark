create or replace function lingo_access.status() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare account uuid := lingo_access.request_account();
begin
  return (
    select jsonb_build_object(
      'role', s.role,
      'licensed', coalesce(l.revoked_at is null and (l.expires_at is null or l.expires_at > now()) and l.user_id is not null, false),
      'expires_at', l.expires_at,
      'revoked_at', l.revoked_at
    )
    from (select account as id) a
    left join lingo_access.staff s on s.user_id = a.id
    left join lingo_access.licenses l on l.user_id = a.id
  );
end;
$$;

create index events_target_timeline_idx on lingo_access.events (target_id, occurred_at desc, id desc);
drop index lingo_access.events_target_id_idx;

create function lingo_access.list_events_filtered(p_before_at timestamptz, p_before_id uuid, p_email text) returns jsonb
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
      select id, occurred_at, kind, actor_id, target_id, promo_label, promo_suffix, expires_at, historical
      from lingo_access.events
      where (subject is null or target_id = subject)
        and (p_before_at is null or (occurred_at, id) < (p_before_at, p_before_id))
      order by occurred_at desc, id desc
      limit 31
    ), page as (
      select e.id, e.occurred_at, e.kind, e.promo_label, e.promo_suffix, e.expires_at, e.historical,
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

create or replace function public.lingo_access_events(p_before_at timestamptz default null, p_before_id uuid default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select lingo_access.list_events_filtered(p_before_at, p_before_id, null)
$$;

create function public.lingo_access_account_events(p_email text, p_before_at timestamptz default null, p_before_id uuid default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select lingo_access.list_events_filtered(p_before_at, p_before_id, coalesce(p_email, ''))
$$;

revoke execute on function lingo_access.list_events_filtered(timestamptz, uuid, text), public.lingo_access_account_events(text,timestamptz,uuid) from public, anon, authenticated;
grant execute on function lingo_access.list_events_filtered(timestamptz, uuid, text), public.lingo_access_account_events(text,timestamptz,uuid) to authenticated;
drop function lingo_access.list_events(timestamptz, uuid);
