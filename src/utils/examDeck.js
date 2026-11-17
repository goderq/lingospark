import { shuffleOptions } from './shuffle.js';
import { normalizeAnswer, answersMatch } from './answer.js';
import { snapshotKey } from './snapshot.js';

export function sampleExamQuestions(pool, size, seed) {
  const unique = new Map();
  for (const question of pool) {
    if (!question.prompt || !question.answer || !Array.isArray(question.options)) continue;
    const key = snapshotKey([normalizeAnswer(question.prompt), normalizeAnswer(question.answer), question.context || '', question.audio || '']);
    const accepted = [question.answer, ...(question.answers || [])];
    const options = [question.answer, ...question.options.filter(option => !accepted.some(answer => answersMatch(option, answer)))];
    if (new Set(options.map(normalizeAnswer)).size !== options.length || options.length < 2) continue;
    unique.set(key, { ...question, type: 'choice', id: `exam-${key}`, options });
  }
  return shuffleOptions([...unique.values()], seed).slice(0, size);
}
