export async function readCloud(client, userId) {
  const { data, error } = await client.from('user_progress').select('progress, revision, device_updated_at, updated_at').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(error.message || 'Не удалось прочитать облако');
  if (data && (!data.progress || typeof data.progress !== 'object' || Array.isArray(data.progress))) throw new Error('Некорректный формат облачного прогресса');
  return data;
}

// The user filter and revision predicate are part of the UPDATE itself.
// A prior SELECT followed by unconditional upsert would still lose edits.
export async function writeCloud(client, userId, progress, expectedRevision, modifiedAt, now = new Date().toISOString()) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('Некорректная версия облачной копии');
  const payload = { progress, revision: expectedRevision + 1, device_updated_at: modifiedAt || now, updated_at: now };
  const query = expectedRevision === 0
    ? client.from('user_progress').insert({ user_id: userId, ...payload })
    : client.from('user_progress').update(payload).eq('user_id', userId).eq('revision', expectedRevision);
  const { data, error } = await query.select('progress, revision, device_updated_at, updated_at').maybeSingle();
  if (error?.code === '23505' || (!error && !data)) return { conflict: true };
  if (error) throw new Error(error.message || 'Не удалось сохранить в облаке');
  return { data };
}
