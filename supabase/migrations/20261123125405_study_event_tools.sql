alter table lingo_access.study_events
  add column draft boolean not null default false,
  add column formats text[],
  drop constraint study_events_topics_check,
  drop constraint study_events_name_check;
alter table lingo_access.study_events
  add constraint study_events_topics_check check (cardinality(topics) between (case when draft then 0 else 1 end) and 14),
  add constraint study_events_name_check check (char_length(name) between (case when draft then 0 else 2 end) and 80),
  add constraint study_events_formats_check check (formats is null or cardinality(formats) = cardinality(topics));
drop index lingo_access.study_events_published_name;
create unique index study_events_published_name on lingo_access.study_events (lower(name), starts_on)
  where cancelled_at is null and not draft;

create function lingo_access.study_event_report(p_event_id uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with event as (
    select cardinality(topics) as duration from lingo_access.study_events where id = p_event_id
  ), participants as materialized (
    select progress #> array['studyEventResults', p_event_id::text] as result
    from public.user_progress where jsonb_typeof(progress #> array['studyEventResults', p_event_id::text]) = 'object'
  ), daily as (
    select i as day, count(*) filter (where p.result->'days'->i::text = 'true'::jsonb) as completed
    from event cross join lateral generate_series(0,event.duration-1) i left join participants p on true group by i
  ), mistakes as (
    select d.day, answer.key as id, count(*) as total, count(*) filter (where answer.value = 'false'::jsonb) as errors
    from daily d cross join participants p
    cross join lateral jsonb_each(case when jsonb_typeof(p.result->'answers'->d.day::text) = 'object'
      then p.result->'answers'->d.day::text else '{}'::jsonb end) answer
    where p.result->'days'->d.day::text = 'true'::jsonb and jsonb_typeof(answer.value) = 'boolean'
      and answer.key ~ '^[A-Za-z0-9_-]{1,100}$'
    group by d.day, answer.key
  )
  select jsonb_build_object(
    'joined', (select count(*) from participants),
    'started', (select count(*) from participants where result->'started' = 'true'::jsonb
      or coalesce(result->'days','{}'::jsonb) <> '{}'::jsonb),
    'finished', (select count(*) from participants where jsonb_typeof(result->'badgeAt') = 'number'),
    'days', coalesce((select jsonb_agg(jsonb_build_object('index',d.day,'completed',d.completed,'items',
      coalesce((select jsonb_agg(to_jsonb(m) - 'day' order by m.errors desc, m.id)
        from (select * from mistakes where day = d.day and errors > 0 order by errors desc,id limit 10) m), '[]'::jsonb))
      order by d.day) from daily d), '[]'::jsonb)
  )
$$;
revoke execute on function lingo_access.study_event_report(uuid) from public, anon, authenticated;

create or replace function lingo_access.visible_study_events() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare today date := (now() at time zone 'UTC')::date;
begin
  perform lingo_access.request_account();
  return coalesce((
    select jsonb_agg(to_jsonb(e) order by sort_key, starts_on, id) from (
      select id, name, description, starts_on, ends_on, topics, formats,
        case when starts_on > today then 1 when ends_on < today then 2 else 0 end as sort_key
      from lingo_access.study_events where not draft and cancelled_at is null and ends_on >= today - 7
      order by sort_key, starts_on, id limit 50
    ) e
  ), '[]'::jsonb);
end;
$$;

create or replace function lingo_access.manage_study_events(p_action text, p_options jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := lingo_access.request_account();
  event_row lingo_access.study_events%rowtype;
  event_title text;
  event_description text;
  event_start date;
  event_topics text[];
  event_formats text[];
  event_key uuid;
  saving_draft boolean;
  page_offset integer;
begin
  perform 1 from lingo_access.staff where user_id = actor for share;
  if not found then raise exception using errcode = '42501', message = 'admin_required'; end if;

  case p_action
    when 'list' then
      page_offset := greatest(0, least(coalesce((p_options->>'offset')::integer, 0), 100000));
      return coalesce((select jsonb_agg(to_jsonb(e) order by starts_on desc, id desc) from (
        select id, name, description, starts_on, ends_on, topics, formats, draft, cancelled_at
        from lingo_access.study_events order by starts_on desc, id desc limit 30 offset page_offset
      ) e), '[]'::jsonb);
    when 'report' then
      event_key := (p_options->>'event_id')::uuid;
      if not exists(select 1 from lingo_access.study_events where id = event_key and not draft)
      then raise exception 'event_not_found'; end if;
      return lingo_access.study_event_report(event_key);
    when 'publish', 'save_draft' then
      event_key := (p_options->>'event_id')::uuid;
      saving_draft := p_action = 'save_draft';
      event_title := btrim(coalesce(p_options->>'name', ''));
      event_description := btrim(coalesce(p_options->>'description', ''));
      if char_length(event_title) > 80 or (not saving_draft and char_length(event_title) < 2) or char_length(event_description) > 280
      then raise exception 'invalid_event_name'; end if;
      if coalesce(p_options->>'starts_on','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      then raise exception 'invalid_event_date'; end if;
      begin
        event_start := (p_options->>'starts_on')::date;
      exception when invalid_datetime_format or datetime_field_overflow then
        raise exception 'invalid_event_date';
      end;
      if not saving_draft and event_start < (now() at time zone 'UTC')::date then raise exception 'invalid_event_date'; end if;
      if jsonb_typeof(p_options->'topics') is distinct from 'array' then raise exception 'invalid_event_topics'; end if;
      if jsonb_array_length(p_options->'topics') not between (case when saving_draft then 0 else 1 end) and 14 then raise exception 'invalid_event_topics'; end if;
      if exists (select 1 from jsonb_array_elements(p_options->'topics') item
        where jsonb_typeof(item) <> 'string' or (item #>> '{}') !~ '^[a-z][a-z0-9_-]{1,79}$')
      then raise exception 'invalid_event_topics'; end if;
      select coalesce(array_agg(value order by ordinal), array[]::text[]) into event_topics
        from jsonb_array_elements_text(p_options->'topics') with ordinality t(value, ordinal);
      if p_options ? 'formats' then
        if jsonb_typeof(p_options->'formats') is distinct from 'array' then raise exception 'invalid_event_formats'; end if;
        if jsonb_array_length(p_options->'formats') <> cardinality(event_topics) or exists (
          select 1 from jsonb_array_elements(p_options->'formats') item
          where jsonb_typeof(item) <> 'string' or (item #>> '{}') not in ('mixed','listening','dialogue','phrases')
        ) then raise exception 'invalid_event_formats'; end if;
        select coalesce(array_agg(value order by ordinal), array[]::text[]) into event_formats
          from jsonb_array_elements_text(p_options->'formats') with ordinality t(value, ordinal);
      end if;

      if event_key is not null then
        select * into event_row from lingo_access.study_events where id = event_key and cancelled_at is null for update;
        if not found then raise exception 'event_not_found'; end if;
        if not event_row.draft then
          if not saving_draft and event_row.name = event_title and event_row.description = event_description
            and event_row.starts_on = event_start and event_row.topics = event_topics and event_row.formats is not distinct from event_formats
          then return to_jsonb(event_row) - 'created_by'; end if;
          raise exception 'already_published';
        end if;
        update lingo_access.study_events set name = event_title, description = event_description, starts_on = event_start,
          topics = event_topics, formats = event_formats, draft = saving_draft where id = event_key
          returning * into event_row;
      elsif saving_draft then
        insert into lingo_access.study_events(name, description, starts_on, topics, formats, draft, created_by)
        values (event_title, event_description, event_start, event_topics, event_formats, true, actor) returning * into event_row;
      else
        insert into lingo_access.study_events(name, description, starts_on, topics, formats, created_by)
        values (event_title, event_description, event_start, event_topics, event_formats, actor)
        on conflict (lower(name), starts_on) where cancelled_at is null and not draft do nothing returning * into event_row;
        if not found then
          select * into event_row from lingo_access.study_events
            where lower(name) = lower(event_title) and starts_on = event_start and cancelled_at is null and not draft;
          if not found or event_row.topics is distinct from event_topics or event_row.description is distinct from event_description
            or event_row.formats is distinct from event_formats then raise exception 'event_already_exists'; end if;
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
