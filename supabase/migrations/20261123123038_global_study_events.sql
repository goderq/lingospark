create table lingo_access.study_events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 280),
  starts_on date not null,
  topics text[] not null check (cardinality(topics) between 1 and 14),
  ends_on date generated always as (starts_on + (cardinality(topics) - 1)) stored,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create index on lingo_access.study_events (starts_on desc, id desc);
create index on lingo_access.study_events (created_by);
create unique index study_events_published_name on lingo_access.study_events (lower(name), starts_on) where cancelled_at is null;
alter table lingo_access.study_events enable row level security;
revoke all on lingo_access.study_events from public, anon, authenticated;

create function lingo_access.visible_study_events() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare today date := (now() at time zone 'UTC')::date;
begin
  perform lingo_access.request_account();
  return coalesce((
    select jsonb_agg(to_jsonb(e) order by sort_key, starts_on, id) from (
      select id, name, description, starts_on, ends_on, topics,
        case when starts_on > today then 1 when ends_on < today then 2 else 0 end as sort_key
      from lingo_access.study_events where cancelled_at is null and ends_on >= today - 7
      order by sort_key, starts_on, id limit 50
    ) e
  ), '[]'::jsonb);
end;
$$;

create function lingo_access.manage_study_events(p_action text, p_options jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := lingo_access.request_account();
  event_row lingo_access.study_events%rowtype;
  event_title text;
  event_description text;
  event_start date;
  event_topics text[];
  page_offset integer;
begin
  perform 1 from lingo_access.staff where user_id = actor for share;
  if not found then raise exception using errcode = '42501', message = 'admin_required'; end if;

  case p_action
    when 'list' then
      page_offset := greatest(0, least(coalesce((p_options->>'offset')::integer, 0), 100000));
      return coalesce((select jsonb_agg(to_jsonb(e) order by starts_on desc, id desc) from (
        select id, name, description, starts_on, ends_on, topics, cancelled_at
        from lingo_access.study_events order by starts_on desc, id desc limit 30 offset page_offset
      ) e), '[]'::jsonb);
    when 'publish' then
      event_title := btrim(coalesce(p_options->>'name', ''));
      event_description := btrim(coalesce(p_options->>'description', ''));
      if char_length(event_title) not between 2 and 80 or char_length(event_description) > 280
      then raise exception 'invalid_event_name'; end if;
      if coalesce(p_options->>'starts_on','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      then raise exception 'invalid_event_date'; end if;
      begin
        event_start := (p_options->>'starts_on')::date;
      exception when invalid_datetime_format or datetime_field_overflow then
        raise exception 'invalid_event_date';
      end;
      if event_start < (now() at time zone 'UTC')::date then raise exception 'invalid_event_date'; end if;
      if jsonb_typeof(p_options->'topics') is distinct from 'array' then raise exception 'invalid_event_topics'; end if;
      if jsonb_array_length(p_options->'topics') not between 1 and 14 then raise exception 'invalid_event_topics'; end if;
      if exists (select 1 from jsonb_array_elements(p_options->'topics') item
        where jsonb_typeof(item) <> 'string' or (item #>> '{}') !~ '^[a-z][a-z0-9_-]{1,79}$')
      then raise exception 'invalid_event_topics'; end if;
      select array_agg(value order by ordinal) into event_topics
        from jsonb_array_elements_text(p_options->'topics') with ordinality t(value, ordinal);
      insert into lingo_access.study_events(name, description, starts_on, topics, created_by)
      values (event_title, event_description, event_start, event_topics, actor)
      on conflict (lower(name), starts_on) where cancelled_at is null do nothing
      returning * into event_row;
      if not found then
        select * into event_row from lingo_access.study_events
          where lower(name) = lower(event_title) and starts_on = event_start and cancelled_at is null;
        if not found or event_row.topics is distinct from event_topics or event_row.description is distinct from event_description then
          raise exception 'event_already_exists';
        end if;
      end if;
      return to_jsonb(event_row) - 'created_by';
    when 'cancel' then
      update lingo_access.study_events set cancelled_at = now()
        where id = (p_options->>'event_id')::uuid and cancelled_at is null;
      return '{}'::jsonb;
    else raise exception 'unknown_event_action';
  end case;
end;
$$;

create function public.lingo_study_events() returns jsonb
language sql stable security invoker set search_path = '' as $$ select lingo_access.visible_study_events() $$;
create function public.lingo_study_event_admin(p_action text, p_options jsonb default '{}'::jsonb) returns jsonb
language sql security invoker set search_path = '' as $$ select lingo_access.manage_study_events(p_action, p_options) $$;

revoke execute on function lingo_access.visible_study_events(), lingo_access.manage_study_events(text,jsonb),
  public.lingo_study_events(), public.lingo_study_event_admin(text,jsonb) from public, anon, authenticated;
grant execute on function lingo_access.visible_study_events(), lingo_access.manage_study_events(text,jsonb),
  public.lingo_study_events(), public.lingo_study_event_admin(text,jsonb) to authenticated;
