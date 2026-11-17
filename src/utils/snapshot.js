export function stableJSON(value) {
  if (Array.isArray(value)) return `[${value.map(item => stableJSON(item) ?? 'null').join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => `${JSON.stringify(key)}:${stableJSON(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function snapshotKey(value) {
  const json = stableJSON(value);
  let a = 2166136261, b = 5381;
  for (let i = 0; i < json.length; i++) { a = Math.imul(a ^ json.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ json.charCodeAt(i); }
  return `${json.length}:${a >>> 0}:${b >>> 0}`;
}
export function backupEnvelope(progress, now = new Date().toISOString()) {
  return { format: 'LingoSpark Backup', backupVersion: 3, createdAt: now, checksum: snapshotKey(progress), progress };
}
export function parseBackup(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Некорректная копия');
  if (value.backupVersion > 3) throw new Error('Эта копия создана более новой версией приложения');
  const progress = value.format === 'LingoSpark Backup' ? value.progress : value;
  if (!progress || typeof progress.name !== 'string' || !Array.isArray(progress.completed) || progress.completed.some(id => typeof id !== 'string')) throw new Error('Некорректный прогресс');
  for (const key of ['completedTenses', 'completedBosses', 'completedGrammarTracks', 'mistakes', 'notebook', 'favorites', 'customWords', 'writingCompleted', 'readingCompleted', 'workCompleted']) if (progress[key] !== undefined && !Array.isArray(progress[key])) throw new Error(`Некорректное поле: ${key}`);
  for (const key of ['settings', 'reviewStats', 'reviewQueue', 'practiceDrafts', 'practiceResults', 'studyDrafts', 'practiceRewards', 'journeys', 'retention', 'world', 'stats', 'wordPreferences', 'lessonResults', 'activity']) if (progress[key] !== undefined && (!progress[key] || typeof progress[key] !== 'object' || Array.isArray(progress[key]))) throw new Error(`Некорректное поле: ${key}`);
  for (const key of ['totalXP', 'dailyXP', 'coins', 'dailyGoal']) if (progress[key] !== undefined && (!Number.isFinite(progress[key]) || progress[key] < 0)) throw new Error(`Некорректное число: ${key}`);
  if (value.format === 'LingoSpark Backup' && value.backupVersion === 3 && value.checksum !== snapshotKey(progress)) throw new Error('Копия повреждена или изменена');
  return progress;
}
export function recoverStoredProgress(primary, previous) {
  if (!primary && !previous) return null;
  let cause;
  for (const [raw, recovered] of [[primary, false], [previous, true]]) {
    if (!raw) continue;
    try { return { progress: parseBackup(JSON.parse(raw)), raw, recovered }; } catch (error) { cause = error; }
  }
  throw new Error(`Не удалось прочитать локальные копии: ${cause?.message || 'неизвестный формат'}`);
}
export function snapshotSummary(progress = {}) {
  return { lessons: progress.completed?.length || 0, tenses: progress.completedTenses?.length || 0, words: Object.keys(progress.reviewStats || {}).length, xp: progress.totalXP || 0, stages: Object.values(progress.journeys || {}).reduce((sum, topic) => sum + Object.values(topic?.stages || {}).filter(stage => stage?.completedAt).length, 0) };
}
