create function lingo_access.profile_collection_count(value jsonb) returns integer
language sql immutable security invoker set search_path = '' as $$
  select case jsonb_typeof(value)
    when 'array' then jsonb_array_length(value)
    when 'object' then (select count(*)::integer from jsonb_object_keys(value))
    else 0
  end
$$;

create function lingo_access.admin_user_profile(p_user_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := lingo_access.request_account();
  account jsonb;
  cloud public.user_progress%rowtype;
  saved jsonb;
begin
  if not exists (select 1 from lingo_access.staff where user_id = actor) then
    raise exception using errcode = '42501', message = 'admin_required';
  end if;

  select jsonb_build_object(
    'id', u.id, 'email', u.email, 'name', p.display_name,
    'created_at', u.created_at, 'email_confirmed_at', u.email_confirmed_at, 'last_sign_in_at', u.last_sign_in_at,
    'role', s.role, 'expires_at', l.expires_at, 'revoked_at', l.revoked_at,
    'licensed', l.user_id is not null and l.revoked_at is null and (l.expires_at is null or l.expires_at > now())
  ) into account
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join lingo_access.staff s on s.user_id = u.id
  left join lingo_access.licenses l on l.user_id = u.id
  where u.id = p_user_id and not u.is_anonymous and u.email is not null;
  if account is null then raise exception 'account_not_found'; end if;

  select * into cloud from public.user_progress where user_id = p_user_id;
  if not found then return jsonb_build_object('account', account, 'cloud', null); end if;
  saved := case when jsonb_typeof(cloud.progress) = 'object' then cloud.progress else '{}'::jsonb end;
  if account->>'name' is null and jsonb_typeof(saved->'name') = 'string' then
    account := account || jsonb_build_object('name', left(saved->>'name', 50));
  end if;

  return jsonb_build_object('account', account, 'cloud', jsonb_build_object(
    'updated_at', cloud.updated_at,
    'device_updated_at', cloud.device_updated_at,
    'summary', (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(saved) where (
        key in ('onboarded', 'c1Certificate') and jsonb_typeof(value) = 'boolean'
        or key in ('dailyGoal', 'totalXP', 'dailyXP', 'streak', 'coins', 'c1ExamBest', 'fullIeltsBest', 'tenseExamBest')
          and jsonb_typeof(value) = 'number'
        or key in ('lastStudyDate', 'learnerLevel', 'dailyDate') and jsonb_typeof(value) = 'string'
      )),
    'stats', (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(case when jsonb_typeof(saved->'stats') = 'object' then saved->'stats' else '{}'::jsonb end)
      where key in ('reviewCorrect', 'reviewTotal', 'dictationCorrect', 'dictationTotal', 'grammarCorrect', 'grammarTotal',
        'storiesCompleted', 'dialoguesCompleted', 'gamesPlayed', 'gameBest') and jsonb_typeof(value) = 'number'),
    'settings', (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(case when jsonb_typeof(saved->'settings') = 'object' then saved->'settings' else '{}'::jsonb end)
      where (key = 'accent' and jsonb_typeof(value) = 'string')
        or (key in ('speechRate', 'lessonSize') and jsonb_typeof(value) = 'number')
        or (key in ('strictChecking', 'challengeMode', 'largeText', 'reduceMotion', 'haptics', 'voiceFeedback')
          and jsonb_typeof(value) = 'boolean')),
    'counts', (select jsonb_object_agg(key, lingo_access.profile_collection_count(value))
      from jsonb_each(saved) where key in ('completedTenses', 'completedGrammarTracks', 'notebook', 'favorites',
        'mistakes', 'reviewQueue', 'reviewStats', 'customWords', 'ownedRewards', 'readingCompleted',
        'workCompleted', 'careerCompleted', 'writingCompleted', 'retention')),
    'completed', (select coalesce(jsonb_agg(value order by ordinal), '[]'::jsonb)
      from jsonb_array_elements(case when jsonb_typeof(saved->'completed') = 'array' then saved->'completed' else '[]'::jsonb end)
      with ordinality item(value, ordinal) where jsonb_typeof(value) = 'string'),
    'lesson_results', (select coalesce(jsonb_object_agg(key, jsonb_build_object(
        'attempts', case when jsonb_typeof(value->'attempts') = 'number' then value->'attempts' end,
        'accuracy', case when jsonb_typeof(value->'accuracy') = 'number' then value->'accuracy' end,
        'bestAccuracy', case when jsonb_typeof(value->'bestAccuracy') = 'number' then value->'bestAccuracy' end)), '{}'::jsonb)
      from jsonb_each(case when jsonb_typeof(saved->'lessonResults') = 'object' then saved->'lessonResults' else '{}'::jsonb end)
      where jsonb_typeof(value) = 'object'),
    'level_exam_best', (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(case when jsonb_typeof(saved->'levelExamBest') = 'object' then saved->'levelExamBest' else '{}'::jsonb end)
      where key in ('A1','A2','B1','B2','C1') and jsonb_typeof(value) = 'number'),
    'activity', (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(case when jsonb_typeof(saved->'activity') = 'object' then saved->'activity' else '{}'::jsonb end)
      where key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and jsonb_typeof(value) = 'number'),
    'journey_stages', (select coalesce(jsonb_object_agg(topic.key, done.total), '{}'::jsonb)
      from jsonb_each(case when jsonb_typeof(saved->'journeys') = 'object' then saved->'journeys' else '{}'::jsonb end) topic
      cross join lateral (select count(*) as total from
        jsonb_each(case when jsonb_typeof(topic.value->'stages') = 'object' then topic.value->'stages' else '{}'::jsonb end) stage
        where jsonb_typeof(stage.value->'completedAt') in ('number', 'string')) done
      where done.total > 0),
    'words', (select coalesce(jsonb_agg(jsonb_build_object('english', left(value->>'english', 300),
          'russian', left(value->>'russian', 300)) order by ordinal), '[]'::jsonb)
      from jsonb_array_elements(case when jsonb_typeof(saved->'customWords') = 'array' then saved->'customWords' else '[]'::jsonb end)
      with ordinality item(value, ordinal)
      where jsonb_typeof(value->'english') = 'string' and jsonb_typeof(value->'russian') = 'string')
  ));
end;
$$;

create function public.lingo_admin_user_profile(p_user_id uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select lingo_access.admin_user_profile(p_user_id)
$$;

revoke execute on function lingo_access.profile_collection_count(jsonb), lingo_access.admin_user_profile(uuid),
  public.lingo_admin_user_profile(uuid) from public, anon, authenticated;
grant execute on function lingo_access.admin_user_profile(uuid), public.lingo_admin_user_profile(uuid) to authenticated;
