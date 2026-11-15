import { evaluateExercise } from './answer.js';

export const DAY = 86400000;

export function enrollRetention(completed, saved = {}, now = Date.now()) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  let result = saved;
  for (const id of completed) {
    if (result[id]) continue;
    if (result === saved) result = { ...saved };
    result[id] = { enrolledAt: now, dueAt: now + DAY, attempts: 0, successfulChecks: 0, verifiedAt: null };
  }
  return result;
}

export function retentionSummary(progress, lessons, now = Date.now()) {
  const completed = new Set(progress.completed || []);
  const eligible = lessons.filter(lesson => completed.has(lesson.id) && lesson.exercises.some(e => e.type === 'choice'));
  const due = eligible.filter(lesson => progress.retention?.[lesson.id]?.dueAt <= now)
    .sort((a, b) => progress.retention[a.id].dueAt - progress.retention[b.id].dueAt);
  return { eligible, due, verified: eligible.filter(lesson => progress.retention?.[lesson.id]?.verifiedAt).length };
}

function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function retentionDeck(lesson, random = Math.random) {
  return shuffled(lesson.exercises.filter(e => e.type === 'choice'), random).slice(0, 5)
    .map(exercise => ({ ...exercise, options: shuffled(exercise.options, random) }));
}

// A frozen schedule token makes a double tap or an old open screen harmless.
export function finishRetention(progress, lessons, lessonId, expectedDueAt, answers, now = Date.now()) {
  const lesson = lessons.find(item => item.id === lessonId);
  const entry = progress.retention?.[lessonId];
  if (!lesson || !progress.completed.includes(lessonId) || !entry || entry.dueAt !== expectedDueAt || now < entry.dueAt) return progress;
  const pool = lesson.exercises.filter(e => e.type === 'choice');
  const required = Math.min(5, pool.length);
  if (!required || !Array.isArray(answers) || answers.length !== required || answers.some(a => !a || typeof a.input !== 'string') || new Set(answers.map(a => a.id)).size !== required) return progress;
  let correct = 0;
  for (const answer of answers) {
    const exercise = pool.find(e => e.id === answer.id);
    if (!exercise || !exercise.options.includes(answer.input)) return progress;
    if (evaluateExercise(exercise, answer.input).correct) correct++;
  }
  const accuracy = Math.round(correct / required * 100);
  const successfulChecks = accuracy >= 80 ? (entry.successfulChecks || 0) + 1 : 0;
  return { ...progress, retention: { ...progress.retention, [lessonId]: {
    ...entry, attempts: (entry.attempts || 0) + 1, successfulChecks, accuracy, lastCheckedAt: now,
    verifiedAt: successfulChecks >= 2 ? (entry.verifiedAt || now) : null,
    dueAt: now + DAY * (successfulChecks >= 2 ? 7 : successfulChecks === 1 ? 3 : 1),
  } } };
}
