create table lingo_access.events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null,
  kind text not null check (kind in ('promo_created', 'promo_disabled', 'promo_redeemed', 'license_revoked')),
  actor_id uuid references auth.users(id) on delete set null,
  target_id uuid references auth.users(id) on delete set null,
  promo_label text,
  promo_suffix text,
  expires_at timestamptz,
  historical boolean not null default false
);
create index on lingo_access.events (occurred_at desc, id desc);
create index on lingo_access.events (actor_id);
create index on lingo_access.events (target_id);
alter table lingo_access.events enable row level security;
revoke all on lingo_access.events from public, anon, authenticated;

create function lingo_access.record_promo_event() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into lingo_access.events (occurred_at, kind, actor_id, promo_label, promo_suffix)
    values (new.created_at, 'promo_created', coalesce(auth.uid(), new.created_by), new.label, new.suffix);
  else
    insert into lingo_access.events (occurred_at, kind, actor_id, promo_label, promo_suffix)
    values (new.disabled_at, 'promo_disabled', auth.uid(), new.label, new.suffix);
  end if;
  return new;
end;
$$;

create function lingo_access.record_redemption_event() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  insert into lingo_access.events (occurred_at, kind, actor_id, target_id, promo_label, promo_suffix, expires_at)
  select new.redeemed_at, 'promo_redeemed', coalesce(auth.uid(), new.user_id), new.user_id, p.label, p.suffix, l.expires_at
  from lingo_access.promos p
  left join lingo_access.licenses l on l.user_id = new.user_id
  where p.id = new.promo_id;
  return new;
end;
$$;

create function lingo_access.record_revocation_event() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  insert into lingo_access.events (occurred_at, kind, actor_id, target_id, expires_at)
  values (new.revoked_at, 'license_revoked', auth.uid(), new.user_id, old.expires_at);
  return new;
end;
$$;

revoke execute on function lingo_access.record_promo_event(), lingo_access.record_redemption_event(), lingo_access.record_revocation_event() from public, anon, authenticated;

create trigger journal_promo_created after insert on lingo_access.promos
  for each row execute function lingo_access.record_promo_event();
create trigger journal_promo_disabled after update of disabled_at on lingo_access.promos
  for each row when (old.disabled_at is null and new.disabled_at is not null)
  execute function lingo_access.record_promo_event();
create trigger journal_promo_redeemed after insert on lingo_access.redemptions
  for each row execute function lingo_access.record_redemption_event();
create trigger journal_license_revoked after update of revoked_at on lingo_access.licenses
  for each row when (old.revoked_at is null and new.revoked_at is not null)
  execute function lingo_access.record_revocation_event();

-- Earlier rows preserve the known facts only. Previous expiration dates
-- and the actor of an earlier disable or revocation were not recorded.
insert into lingo_access.events (occurred_at, kind, actor_id, target_id, promo_label, promo_suffix, historical)
select created_at, 'promo_created', created_by, null::uuid, label, suffix, true from lingo_access.promos
union all
select disabled_at, 'promo_disabled', null, null, label, suffix, true from lingo_access.promos where disabled_at is not null
union all
select r.redeemed_at, 'promo_redeemed', r.user_id, r.user_id, p.label, p.suffix, true
from lingo_access.redemptions r join lingo_access.promos p on p.id = r.promo_id
union all
select revoked_at, 'license_revoked', null, user_id, null, null, true from lingo_access.licenses where revoked_at is not null;

create function lingo_access.list_events(p_before_at timestamptz, p_before_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare account uuid := lingo_access.request_account();
begin
  if not exists (select 1 from lingo_access.staff where user_id = account) then
    raise exception using errcode = '42501', message = 'admin_required';
  end if;
  if (p_before_at is null) <> (p_before_id is null) then raise exception 'invalid_journal_cursor'; end if;

  return (
    with batch as materialized (
      select id, occurred_at, kind, actor_id, target_id, promo_label, promo_suffix, expires_at, historical
      from lingo_access.events
      where p_before_at is null or (occurred_at, id) < (p_before_at, p_before_id)
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
      'has_more', (select count(*) > 30 from batch)
    )
  );
end;
$$;

create function public.lingo_access_events(p_before_at timestamptz default null, p_before_id uuid default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select lingo_access.list_events(p_before_at, p_before_id)
$$;

revoke execute on function lingo_access.list_events(timestamptz, uuid), public.lingo_access_events(timestamptz, uuid) from public, anon, authenticated;
grant execute on function lingo_access.list_events(timestamptz, uuid), public.lingo_access_events(timestamptz, uuid) to authenticated;
