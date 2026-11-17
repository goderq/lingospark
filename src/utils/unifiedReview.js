import { snapshotKey } from './snapshot.js';
import { evaluateExercise, normalizeAnswer } from './answer.js';
import { retentionSummary, retentionDeck, DAY } from './retention.js';
import { advanceWordReview } from './wordSchedule.js';

export const reviewId = item => item.wordId ? `word-${item.wordId}-${item.direction || 'en-ru'}` : `review-${snapshotKey([normalizeAnswer(item.prompt).replace(/^(переведи|напиши перевод):\s*/, ''), normalizeAnswer(item.answer)])}`;
const dueTime = value => typeof value === 'number' ? value : Date.parse(value || '') || 0;

export function buildUnifiedReview(progress, words, lessons, now = Date.now(), limit = 12) {
  const deck = [], seen = new Set();
  const add = item => {
    const key = reviewId(item);
    if (!seen.has(key) && deck.length < limit) { seen.add(key); deck.push({ ...item, reviewId: key }); }
  };
  const memory = retentionSummary(progress, lessons, now);
  if (memory.due[0]) {
    const lesson = memory.due[0];
    retentionDeck(lesson).forEach(item => add({ ...item, topic: lesson.title, reason: 'Отложенная проверка урока', retentionLessonId: lesson.id, retentionDueAt: progress.retention[lesson.id].dueAt }));
  }
  if (deck.length >= limit) return deck;
  const byId = new Map(words.map(word => [word.id, word]));
  const queued = progress.reviewQueue || {};
  for (const entry of Object.values(queued).filter(entry => entry.dueAt <= now && entry.exercise && (!entry.exercise.wordId || byId.has(entry.exercise.wordId) && !progress.wordPreferences?.hidden?.includes(entry.exercise.wordId))).sort((a, b) => a.dueAt - b.dueAt)) {
    add({ ...entry.exercise, reason: entry.reason || 'Наступил срок повторения' });
    if (deck.length >= limit) return deck;
  }
  for (const mistake of progress.mistakes || []) {
    if (deck.length >= limit) return deck;
    if (dueTime(mistake.nextReviewAt) > now) continue;
    let item = { id: mistake.id, type: 'translate', prompt: mistake.prompt, answer: mistake.answer, answers: mistake.answers || [], explanation: mistake.explanation, topic: mistake.topic, sourceMistakeId: mistake.id, reason: `Ошибка: ${mistake.topic || 'практика'}` };
    const match = mistake.id?.match(/^review-(.*)-(en-ru|ru-en)$/);
    if (match) {
      const word = byId.get(match[1]);
      if (!word || progress.wordPreferences?.hidden?.includes(word.id)) continue;
      item = { ...item, skill: 'vocabulary', wordId: word.id, direction: match[2], answer: match[2] === 'ru-en' ? word.english : progress.wordPreferences?.customTranslations?.[word.id] || word.russian };
    }
    if (!item.prompt || !item.answer || queued[reviewId(item)]) continue;
    add(item);
  }
  for (const [id, stats] of Object.entries(progress.reviewStats || {})) {
    if (deck.length >= limit) break;
    const word = byId.get(id);
    if (!word || !stats?.total || dueTime(stats.dueDate) > now || progress.wordPreferences?.hidden?.includes(id)) continue;
    const item = { id: `word-${id}`, wordId: id, type: 'translate', skill: 'vocabulary', prompt: `Переведи: ${word.english}`, answer: progress.wordPreferences?.customTranslations?.[id] || word.russian, answers: word.translations || [], topic: 'Слова', explanation: word.example ? `${word.example}\n${word.exampleRu || ''}` : `${word.english} — ${word.russian}`, reason: 'Слово пора повторить' };
    if (!queued[reviewId(item)]) add(item);
  }
  return deck;
}

export function validatePracticeSession(session, requireComplete = false) {
  if (!session || session.version !== 1 || typeof session.id !== 'string' || !['learn', 'exam', 'review'].includes(session.mode) || !Array.isArray(session.deck) || !session.deck.length || session.deck.length > 50) return false;
  if (session.deck.some(item => !item || typeof item.id !== 'string' || typeof item.prompt !== 'string' || typeof item.answer !== 'string' || !item.answer)) return false;
  if (session.deck.some(item => item.type === 'choice' && (!Array.isArray(item.options) || !item.options.includes(item.answer)))) return false;
  if (!Number.isInteger(session.index) || session.index < 0 || session.index >= session.deck.length || !Array.isArray(session.responses)) return false;
  if (!Array.isArray(session.built) || typeof session.input !== 'string' || new Set(session.built).size !== session.built.length) return false;
  const current = session.deck[session.index];
  if (session.built.some(i => !Number.isInteger(i) || i < 0 || i >= (current.options?.length || 0))) return false;
  if (session.mode !== 'learn' && (session.help || session.assisted || session.responses.some(answer => answer?.assisted))) return false;
  if (requireComplete && session.index !== session.deck.length - 1) return false;
  const count = requireComplete ? session.deck.length : session.index + (session.checked ? 1 : 0);
  if (session.responses.length !== count || !session.responses.every((answer, i) => answer?.id === session.deck[i].id && typeof answer.input === 'string')) return false;
  const input = current.type === 'build' ? session.built.map(i => current.options[i]).join(' ') : session.input;
  return !session.checked || session.responses[session.index]?.input === input;
}

export function finishPracticeSession(progress, draftKey, session, now = Date.now()) {
  if (!validatePracticeSession(session, true) || progress.practiceResults?.[session.id]) return progress;
  const grades = session.deck.map((item, i) => ({ item, response: session.responses[i], correct: evaluateExercise(item, session.responses[i].input).correct }));
  const queue = { ...(progress.reviewQueue || {}) }, reviewStats = { ...(progress.reviewStats || {}) };
  const resolved = new Set();
  for (const { item, response, correct } of grades) {
    if (item.retentionLessonId) continue;
    const id = reviewId(item), old = queue[id];
    const unaided = correct && !response.assisted;
    const streak = unaided ? (old?.streak || 0) + 1 : 0;
    const interval = unaided ? [1, 3, 7, 14, 30][Math.min(streak - 1, 4)] : 0;
    queue[id] = { id, exercise: item, streak, dueAt: now + (interval ? interval * DAY : 10 * 60000), attempts: (old?.attempts || 0) + 1, lastAccuracy: unaided ? 100 : 0, reason: !correct ? 'Повтор после ошибки' : response.assisted ? 'Проверка после подсказки' : 'Наступил срок повторения' };
    if (unaided && item.sourceMistakeId) resolved.add(item.sourceMistakeId);
    if (item.wordId) reviewStats[item.wordId] = advanceWordReview(reviewStats[item.wordId], correct, now, !response.assisted);
  }
  const correct = grades.filter(item => item.correct).length;
  const unaided = grades.filter(item => item.correct && !item.response.assisted).length;
  const skills = {};
  for (const { item, response, correct } of grades) {
    if (!['grammar', 'vocabulary', 'listening', 'writing', 'conversation'].includes(item.skill)) continue;
    const skill = skills[item.skill] || { total: 0, unaided: 0 };
    skill.total++; if (correct && !response.assisted) skill.unaided++; skills[item.skill] = skill;
  }
  const date = new Date(now).toISOString().slice(0, 10);
  const rewarded = new Set(progress.practiceRewards?.date === date ? progress.practiceRewards.ids : []);
  let earnedXP = 0;
  for (const { item, response, correct } of grades) if (correct && !response.assisted && !rewarded.has(reviewId(item))) { rewarded.add(reviewId(item)); earnedXP++; }
  const record = { id: session.id, mode: session.mode, total: grades.length, correct, unaided, assisted: session.responses.filter(item => item.assisted).length, earnedXP, skills, at: now };
  const results = Object.fromEntries(Object.entries({ ...progress.practiceResults, [session.id]: record }).sort((a, b) => b[1].at - a[1].at).slice(0, 50));
  const yesterday = new Date(now - DAY).toISOString().slice(0, 10);
  const actions = progress.dailyActions?.date === date ? progress.dailyActions : { date, lessons: 0, reviews: 0, dictations: 0 };
  return { ...progress, practiceResults: results, practiceDrafts: { ...progress.practiceDrafts, [draftKey]: null }, reviewQueue: queue, reviewStats,
    practiceRewards: { date, ids: [...rewarded] }, totalXP: (progress.totalXP || 0) + earnedXP, dailyXP: (progress.dailyDate === date ? progress.dailyXP || 0 : 0) + earnedXP,
    dailyDate: date, lastStudyDate: date, streak: progress.lastStudyDate === date ? progress.streak || 1 : progress.lastStudyDate === yesterday ? (progress.streak || 0) + 1 : 1,
    activity: { ...progress.activity, [date]: (progress.activity?.[date] || 0) + 1 }, dailyActions: { ...actions, practice: (actions.practice || 0) + 1, unifiedReviews: (actions.unifiedReviews || 0) + (session.mode === 'review' ? 1 : 0), reviews: (actions.reviews || 0) + (session.mode === 'review' ? 1 : 0) },
    mistakes: (progress.mistakes || []).filter(item => !resolved.has(item.id)) };
}

export function enqueuePhrase(progress, phrase, now = Date.now()) {
  if (typeof phrase?.english !== 'string' || typeof phrase?.russian !== 'string' || !phrase.english.trim() || !phrase.russian.trim() || /[а-яё]/i.test(phrase.english) || phrase.english.length > 300 || phrase.russian.length > 600) return progress;
  const item = { id: `phrase-${snapshotKey(phrase.english)}`, type: 'translate', skill: 'vocabulary', prompt: `Скажи по-английски: ${phrase.russian}`, answer: phrase.english, topic: phrase.topic || 'Фраза из диалога', explanation: `${phrase.english} — ${phrase.russian}` };
  const id = reviewId(item);
  if (progress.reviewQueue?.[id]) return progress;
  return { ...progress, reviewQueue: { ...progress.reviewQueue, [id]: { id, exercise: item, dueAt: now + DAY, streak: 0, attempts: 0, reason: 'Сохранённая фраза из разговора' } } };
}
