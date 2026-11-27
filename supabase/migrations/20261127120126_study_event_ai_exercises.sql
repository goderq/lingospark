alter table lingo_access.study_events add column custom_days jsonb;

create function lingo_access.study_event_normalized(p_text text) returns text
language sql immutable security invoker set search_path = '' as $$
  select btrim(regexp_replace(
    translate(translate(lower(normalize(p_text, NFKC)), '–—ё', '--е'), '.,!?;:«»"''()[]{}‘’ʼ`', ''),
    '[[:space:]]+', ' ', 'g'));
$$;

create function lingo_access.valid_study_event_question(q jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
begin
  if jsonb_typeof(q) is distinct from 'object' then return false; end if;
  if (q - array['prompt','options','answer','explanation']) <> '{}'::jsonb
    or jsonb_typeof(q->'prompt') is distinct from 'string'
    or char_length(btrim(q->>'prompt')) not between 5 and 220
    or ((q->>'prompt') !~ '[а-яА-ЯёЁ]' and strpos(q->>'prompt', '___') = 0)
    or jsonb_typeof(q->'explanation') is distinct from 'string'
    or char_length(btrim(q->>'explanation')) not between 5 and 240
    or (q->>'explanation') !~ '[а-яА-ЯёЁ]'
    or jsonb_typeof(q->'options') is distinct from 'array'
    or jsonb_typeof(q->'answer') is distinct from 'number'
    or coalesce(q->>'answer','') !~ '^[0-2]$' then return false; end if;
  if jsonb_array_length(q->'options') <> 3 then return false; end if;
  if exists (select 1 from jsonb_array_elements(q->'options') as option(value)
    where jsonb_typeof(value) <> 'string' or char_length(btrim(value #>> '{}')) not between 1 and 120
      or (value #>> '{}') !~ '[A-Za-z]' or (value #>> '{}') ~ '[а-яА-ЯёЁ]') then return false; end if;
  return (select count(distinct lingo_access.study_event_normalized(value)) = 3
    from jsonb_array_elements_text(q->'options') as option(value));
end;
$$;

create function lingo_access.valid_study_event_exercises(p_days jsonb, p_topics text[], p_formats text[], p_publish boolean) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare
  pair jsonb;
  day_number integer;
  question_answer text;
  review_answer text;
  any_pair boolean := false;
begin
  if jsonb_typeof(p_days) is distinct from 'array' then return false; end if;
  if jsonb_array_length(p_days) <> cardinality(p_topics) then return false; end if;
  for pair, day_number in select value, ordinality::integer from jsonb_array_elements(p_days) with ordinality
  loop
    if pair = 'null'::jsonb then continue; end if;
    any_pair := true;
    if coalesce(p_formats[day_number], 'mixed') <> 'mixed'
      or jsonb_typeof(pair) is distinct from 'object' then return false; end if;
    if (pair - array['question','review','approved']) <> '{}'::jsonb
      or jsonb_typeof(pair->'approved') is distinct from 'boolean'
      or (p_publish and pair->'approved' <> 'true'::jsonb)
      or not lingo_access.valid_study_event_question(pair->'question')
      or not lingo_access.valid_study_event_question(pair->'review')
      or lingo_access.study_event_normalized(pair->'question'->>'prompt') = lingo_access.study_event_normalized(pair->'review'->>'prompt')
    then return false; end if;
    question_answer := lingo_access.study_event_normalized(pair->'question'->'options'->>((pair->'question'->>'answer')::integer));
    review_answer := lingo_access.study_event_normalized(pair->'review'->'options'->>((pair->'review'->>'answer')::integer));
    if strpos(question_answer, ' ') > 0 and question_answer = review_answer then return false; end if;
  end loop;
  return any_pair;
end;
$$;

revoke execute on function lingo_access.study_event_normalized(text), lingo_access.valid_study_event_question(jsonb),
  lingo_access.valid_study_event_exercises(jsonb,text[],text[],boolean) from public, anon, authenticated;

-- Legacy clients cannot grade generated questions, so they receive the catalog-only feed.
create function lingo_access.visible_study_events_for_client(include_custom boolean) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare today date := (now() at time zone 'UTC')::date;
begin
  perform lingo_access.request_account();
  return coalesce((
    select jsonb_agg(to_jsonb(e) order by sort_key, starts_on, id) from (
      select id, name, description, starts_on, ends_on, topics, formats, custom_days,
        case when starts_on > today then 1 when ends_on < today then 2 else 0 end as sort_key
      from lingo_access.study_events where not draft and cancelled_at is null and ends_on >= today - 7
        and (include_custom or custom_days is null)
      order by sort_key, starts_on, id limit 50
    ) e
  ), '[]'::jsonb);
end;
$$;

create or replace function lingo_access.visible_study_events() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select lingo_access.visible_study_events_for_client(false);
$$;

create function public.lingo_study_events_v2() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select lingo_access.visible_study_events_for_client(true);
$$;

revoke execute on function lingo_access.visible_study_events_for_client(boolean), public.lingo_study_events_v2()
  from public, anon, authenticated;
grant execute on function lingo_access.visible_study_events_for_client(boolean), public.lingo_study_events_v2()
  to authenticated;

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
  event_custom jsonb;
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
        select id, name, description, starts_on, ends_on, topics, formats, custom_days, draft, cancelled_at
        from lingo_access.study_events
        where custom_days is null or p_options->'include_custom' = 'true'::jsonb
        order by starts_on desc, id desc limit 30 offset page_offset
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

      event_custom := nullif(p_options->'custom_days', 'null'::jsonb);
      if event_custom is not null and not lingo_access.valid_study_event_exercises(event_custom, event_topics, event_formats, not saving_draft)
      then raise exception 'invalid_event_exercises'; end if;
      if event_key is not null then
        select * into event_row from lingo_access.study_events where id = event_key and cancelled_at is null for update;
        if not found then raise exception 'event_not_found'; end if;
        if event_row.custom_days is not null and not (p_options ? 'custom_days')
        then raise exception 'invalid_event_exercises'; end if;
        if not event_row.draft then
          if not saving_draft and event_row.name = event_title and event_row.description = event_description
            and event_row.starts_on = event_start and event_row.topics = event_topics and event_row.formats is not distinct from event_formats
            and event_row.custom_days is not distinct from event_custom
          then return to_jsonb(event_row) - 'created_by'; end if;
          raise exception 'already_published';
        end if;
        update lingo_access.study_events set name = event_title, description = event_description, starts_on = event_start,
          topics = event_topics, formats = event_formats, custom_days = event_custom, draft = saving_draft where id = event_key
          returning * into event_row;
      elsif saving_draft then
        insert into lingo_access.study_events(name, description, starts_on, topics, formats, custom_days, draft, created_by)
        values (event_title, event_description, event_start, event_topics, event_formats, event_custom, true, actor) returning * into event_row;
      else
        insert into lingo_access.study_events(name, description, starts_on, topics, formats, custom_days, created_by)
        values (event_title, event_description, event_start, event_topics, event_formats, event_custom, actor)
        on conflict (lower(name), starts_on) where cancelled_at is null and not draft do nothing returning * into event_row;
        if not found then
          select * into event_row from lingo_access.study_events
            where lower(name) = lower(event_title) and starts_on = event_start and cancelled_at is null and not draft;
          if not found or event_row.topics is distinct from event_topics or event_row.description is distinct from event_description
            or event_row.formats is distinct from event_formats or event_row.custom_days is distinct from event_custom
          then raise exception 'event_already_exists'; end if;
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
