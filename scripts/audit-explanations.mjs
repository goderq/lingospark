import assert from 'node:assert/strict';
import { lessons } from '../src/data/course.js';
import { tenseModules } from '../src/data/advancedCourse.js';
import { grammarQuestions, placementQuestions, stories } from '../src/data/practice.js';
import { expandExplanation } from '../src/utils/explanations.js';

const entries = [
  ...lessons.flatMap((lesson) => lesson.exercises.map((item) => ({ item, topic: lesson.title }))),
  ...tenseModules.flatMap((module) => module.exercises.map((item) => ({
    item,
    topic: module.name,
    formula: module.formula,
    use: module.use,
    markers: module.markers,
  }))),
  ...grammarQuestions.map((item) => ({ item, topic: item.topic })),
  ...placementQuestions.map((item) => ({ item, topic: `Диагностика ${item.level}` })),
  ...stories.flatMap((story) => story.questions.map((item) => ({ item, topic: story.title }))),
];

const requiredSections = [
  'РЕЗУЛЬТАТ',
  'ПОЧЕМУ ЭТО ПРАВИЛЬНО',
  'РАЗБОР ТВОЕГО ОТВЕТА',
  'ПРАВИЛО',
  'РАЗБОР ПО ШАГАМ',
  'КАК ЗАПОМНИТЬ',
  'МИНИ-ПРОВЕРКА',
];

for (const entry of entries) {
  const { item } = entry;
  if (!item?.answer) continue;
  const selected = item.options?.find((option) => option !== item.answer) || 'другой ответ';
  const explanation = expandExplanation(item, { ...entry, selected });
  assert.ok(explanation.length >= 500, `${entry.topic}: explanation is too short for “${item.prompt}”`);
  requiredSections.forEach((section) =>
    assert.ok(explanation.includes(section), `${entry.topic}: missing ${section}`));
  assert.ok(!/\b(undefined|null)\b/.test(explanation), `${entry.topic}: broken explanation value`);
}

console.log(`Explanation audit passed: ${entries.length} course, tense, grammar, placement and story questions.`);
