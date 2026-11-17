import { lessons } from './course.js';
import { tenseModules } from './advancedCourse.js';
import { courseSupplement } from './courseSupplement.js';
import { grammarTracks } from './grammarAcademy.js';
import { grammarQuestions } from './practice.js';
import { skillSprintQuestions } from './skillSprint.js';
import { normalizeAnswer, answersMatch } from '../utils/answer.js';

let catalog;
export function practiceCatalog() {
  if (catalog) return catalog;
  const items = lessons.flatMap(lesson => lesson.exercises.map(exercise => ({ ...exercise, topicId: lesson.id, topic: lesson.title, level: lesson.difficulty.replace('+', ''), skill: exercise.type === 'build' || exercise.type === 'translate' ? 'writing' : /___|граммат|форма|форму|правильное предложение/i.test(exercise.prompt) ? 'grammar' : 'vocabulary' })));
  for (const module of tenseModules) module.exercises.forEach((exercise, index) => items.push({ ...exercise, id: `practice-tense-${module.id}-${index}`, type: 'choice', topic: module.name, level: module.level.replace('+', ''), skill: 'grammar', explanation: exercise.explanation || `${module.formula}. ${module.use}` }));
  for (const track of grammarTracks) track.exercises.forEach((exercise, index) => items.push({ ...exercise, id: `practice-track-${track.id}-${index}`, type: 'choice', topic: track.title, level: track.level.replace('+', ''), skill: 'grammar', explanation: exercise.explanation || track.formula }));
  grammarQuestions.forEach((exercise, index) => items.push({ ...exercise, id: `practice-grammar-${index}`, type: 'choice', skill: 'grammar', level: (exercise.level || 'A1').replace('+', '') }));
  skillSprintQuestions.forEach((exercise, index) => items.push({ ...exercise, id: `practice-sprint-${index}`, type: 'choice', skill: 'grammar', level: (exercise.level || 'A2').replace('+', '') }));
  for (const lesson of lessons) {
    const phrases = courseSupplement[lesson.id];
    phrases.forEach(([english, russian], index) => items.push({ id: `practice-phrase-${lesson.id}-${index}`, type: 'translate', prompt: `Переведи: ${english}`, answer: russian, speak: english, topicId: lesson.id, topic: lesson.title, level: lesson.difficulty.replace('+', ''), skill: 'vocabulary', explanation: `${english} — ${russian}` }));
    phrases.slice(0, 3).forEach(([english, russian], index) => items.push({ id: `practice-listen-${lesson.id}-${index}`, type: 'translate', prompt: 'Послушай и запиши английскую фразу.', answer: english, speak: english, topicId: lesson.id, topic: lesson.title, level: lesson.difficulty.replace('+', ''), skill: 'listening', explanation: `${english} — ${russian}` }));
  }
  catalog = items.map(item => {
    if (item.type !== 'choice') return item;
    const accepted = [item.answer, ...(item.answers || [])];
    const seen = new Set();
    const distractors = (item.options || []).filter(option => {
      const key = normalizeAnswer(option);
      if (seen.has(key) || accepted.some(answer => answersMatch(option, answer))) return false;
      seen.add(key); return true;
    });
    return { ...item, options: [item.answer, ...distractors] };
  }).filter(item => item.prompt && item.answer && (item.type !== 'choice' || item.options.length > 1));
  return catalog;
}

export function buildPracticeDeck({ level = 'A1', skill = 'mixed', topicId = 'all', size = 10 }, random = Math.random) {
  const pool = practiceCatalog().filter(item => item.level === level && (skill === 'mixed' || item.skill === skill) && (topicId === 'all' || item.topicId === topicId));
  const unique = new Map();
  for (const item of pool) unique.set(`${item.skill}:${normalizeAnswer(item.prompt)}:${normalizeAnswer(item.answer)}`, item);
  const shuffled = [...unique.values()];
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  return shuffled.slice(0, Math.min(50, Math.max(1, size)));
}
