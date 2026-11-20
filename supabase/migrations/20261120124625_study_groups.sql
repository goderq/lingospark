create table lingo_access.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create table lingo_access.study_group_members (
  group_id uuid not null references lingo_access.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create table lingo_access.study_group_assignments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references lingo_access.study_groups(id) on delete cascade,
  topic_id text not null check (topic_id ~ '^[a-z][a-z0-9_-]{1,79}$'),
  created_at timestamptz not null default now(),
  due_on date not null,
  cancelled_at timestamptz
);
create index on lingo_access.study_groups (created_at desc, id desc);
create index on lingo_access.study_groups (created_by);
create index on lingo_access.study_group_members (user_id, group_id);
create index on lingo_access.study_group_assignments (group_id, due_on, id);
create unique index study_group_assignment_active on lingo_access.study_group_assignments (group_id, topic_id, due_on)
  where cancelled_at is null;

alter table lingo_access.study_groups enable row level security;
alter table lingo_access.study_group_members enable row level security;
alter table lingo_access.study_group_assignments enable row level security;
revoke all on lingo_access.study_groups, lingo_access.study_group_members, lingo_access.study_group_assignments
  from public, anon, authenticated;

create function lingo_access.my_study_assignments() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare account uuid := lingo_access.request_account();
begin
  return coalesce((
    select jsonb_agg(to_jsonb(a) order by a.due_on, a.created_at, a.id)
    from (
      select t.id, t.topic_id, t.due_on, t.created_at, g.name as group_name
      from lingo_access.study_group_members m
      join lingo_access.study_groups g on g.id = m.group_id and g.archived_at is null
      join lingo_access.study_group_assignments t on t.group_id = g.id and t.cancelled_at is null
      where m.user_id = account
      order by t.due_on, t.created_at, t.id
    ) a
  ), '[]'::jsonb);
end;
$$;

-- Report only submitted scores. Drafts and the learner's actual answers stay in their profile.
create function lingo_access.study_assignment_report(p_group uuid, p_assignment uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with roster as (
    select m.user_id as id, u.email, p.display_name as name, r.progress #> array['groupStudyResults', p_assignment::text] as result
    from lingo_access.study_group_members m
    join auth.users u on u.id = m.user_id
    left join public.profiles p on p.id = m.user_id
    left join public.user_progress r on r.user_id = m.user_id
    where m.group_id = p_group
  ), grades as (
    select id, email, name, result->>'status' as recorded_status,
      case when result->>'total' ~ '^[1-9][0-9]?$' then (result->>'total')::integer end as total,
      case when result->>'correct' ~ '^(0|[1-9][0-9]?)$' then (result->>'correct')::integer end as correct
    from roster
  ), reported as (
    select id, email, name,
      case when recorded_status = 'completed' and total between 1 and 50 and correct between 0 and total then 'completed'
        when recorded_status in ('started', 'completed') then 'started' else 'new' end as status,
      case when recorded_status = 'completed' and total between 1 and 50 and correct between 0 and total then total - correct end as errors,
      case when recorded_status = 'completed' and total between 1 and 50 and correct between 0 and total then total end as total
    from grades
  )
  select coalesce(jsonb_agg(to_jsonb(r) order by coalesce(r.name, r.email), r.id), '[]'::jsonb) from reported r
$$;

create function lingo_access.manage_study_groups(p_action text, p_options jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := lingo_access.request_account();
  group_key uuid;
  assignment_key uuid;
  group_row lingo_access.study_groups%rowtype;
  target uuid;
  email_query text;
  group_name text;
  topic text;
  days integer;
  page_offset integer;
begin
  perform 1 from lingo_access.staff where user_id = actor for share;
  if not found then raise exception using errcode = '42501', message = 'admin_required'; end if;

  if p_action = 'list_groups' then
    page_offset := greatest(0, least(coalesce((p_options->>'offset')::integer, 0), 100000));
    return (
      with batch as materialized (
        select g.id, g.name, g.archived_at, g.created_at,
          (select count(*) from lingo_access.study_group_members m where m.group_id = g.id) as member_count
        from lingo_access.study_groups g order by g.archived_at nulls first, g.created_at desc, g.id desc
        limit 31 offset page_offset
      )
      select jsonb_build_object(
        'groups', coalesce((select jsonb_agg(to_jsonb(b) order by b.archived_at nulls first, b.created_at desc, b.id desc)
          from (select * from batch order by archived_at nulls first, created_at desc, id desc limit 30) b), '[]'::jsonb),
        'has_more', (select count(*) > 30 from batch)
      )
    );
  end if;
  if p_action = 'create_group' then
    group_name := btrim(coalesce(p_options->>'name', ''));
    if char_length(group_name) not between 2 and 80 then raise exception 'invalid_group_name'; end if;
    insert into lingo_access.study_groups(name, created_by)
    values (group_name, actor) returning * into group_row;
    return to_jsonb(group_row) - 'created_by';
  end if;

  group_key := (p_options->>'group_id')::uuid;
  select * into group_row from lingo_access.study_groups where id = group_key for update;
  if not found then raise exception 'group_not_found'; end if;

  if p_action = 'group_detail' then
    return jsonb_build_object(
      'group', to_jsonb(group_row) - 'created_by',
      'members', coalesce((select jsonb_agg(jsonb_build_object('id', m.user_id, 'email', u.email, 'name', p.display_name)
        order by coalesce(p.display_name, u.email), m.user_id)
        from lingo_access.study_group_members m join auth.users u on u.id = m.user_id
        left join public.profiles p on p.id = m.user_id where m.group_id = group_key), '[]'::jsonb),
      'assignments', coalesce((select jsonb_agg(
          (to_jsonb(t) - 'group_id') || to_jsonb(summary) order by t.created_at desc, t.id desc)
        from lingo_access.study_group_assignments t
        cross join lateral (
          select count(*) filter (where item->>'status' = 'completed') as completed,
            count(*) filter (where item->>'status' = 'started') as started,
            coalesce(sum((item->>'errors')::integer), 0) as errors,
            coalesce(sum((item->>'total')::integer), 0) as answers
          from jsonb_array_elements(lingo_access.study_assignment_report(group_key,t.id)) item
        ) summary
        where t.group_id = group_key and t.cancelled_at is null), '[]'::jsonb)
    );
  end if;
  if p_action = 'assignment_report' then
    assignment_key := (p_options->>'assignment_id')::uuid;
    if not exists (select 1 from lingo_access.study_group_assignments where group_id = group_key and id = assignment_key and cancelled_at is null)
    then raise exception 'assignment_not_found'; end if;
    return lingo_access.study_assignment_report(group_key, assignment_key);
  end if;
  if p_action in ('archive_group', 'restore_group') then
    update lingo_access.study_groups set archived_at = case when p_action = 'archive_group' then now() end where id = group_key;
    return '{}'::jsonb;
  end if;
  if group_row.archived_at is not null then raise exception 'group_archived'; end if;

  case p_action
    when 'add_member' then
      email_query := lower(btrim(coalesce(p_options->>'email', '')));
      if char_length(email_query) not between 3 and 254 then raise exception 'account_not_found'; end if;
      select id into target from auth.users where lower(email) = email_query and email_confirmed_at is not null and not is_anonymous;
      if target is null then raise exception 'account_not_found'; end if;
      insert into lingo_access.study_group_members(group_id,user_id) values (group_key,target) on conflict do nothing;
    when 'remove_member' then
      delete from lingo_access.study_group_members where group_id = group_key and user_id = (p_options->>'user_id')::uuid;
    when 'assign_topic' then
      topic := coalesce(p_options->>'topic_id','');
      days := (p_options->>'days')::integer;
      if days is null or days not between 1 and 60 then raise exception 'invalid_assignment_days'; end if;
      if topic !~ '^[a-z][a-z0-9_-]{1,79}$' then raise exception 'invalid_topic'; end if;
      insert into lingo_access.study_group_assignments(group_id,topic_id,due_on)
        values (group_key, topic, current_date + days)
        on conflict (group_id,topic_id,due_on) where cancelled_at is null do nothing;
    when 'cancel_assignment' then
      update lingo_access.study_group_assignments set cancelled_at = now()
        where group_id = group_key and id = (p_options->>'assignment_id')::uuid and cancelled_at is null;
    else raise exception 'unknown_group_action';
  end case;
  return '{}'::jsonb;
end;
$$;

create function public.lingo_study_assignments() returns jsonb
language sql stable security invoker set search_path = '' as $$ select lingo_access.my_study_assignments() $$;
create function public.lingo_study_group_admin(p_action text, p_options jsonb default '{}'::jsonb) returns jsonb
language sql security invoker set search_path = '' as $$ select lingo_access.manage_study_groups(p_action, p_options) $$;

revoke execute on function lingo_access.my_study_assignments(), lingo_access.manage_study_groups(text,jsonb),
  lingo_access.study_assignment_report(uuid,uuid), public.lingo_study_assignments(), public.lingo_study_group_admin(text,jsonb)
  from public, anon, authenticated;
grant execute on function lingo_access.my_study_assignments(), lingo_access.manage_study_groups(text,jsonb),
  public.lingo_study_assignments(), public.lingo_study_group_admin(text,jsonb) to authenticated;
