import assert from 'node:assert/strict';
import { lessons } from '../src/data/course.js';
import { tenseModules } from '../src/data/advancedCourse.js';
import { grammarQuestions, placementQuestions, stories } from '../src/data/practice.js';
import {
  expandExplanation,
  getExplanationExamples,
  getExplanationSections,
  getRelevantReinforcement,
} from '../src/utils/explanations.js';

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
  const sections = getExplanationSections(item, { ...entry, selected });
  assert.equal(sections.length, 7, `${entry.topic}: expected seven explanation sections`);
  assert.ok(sections.every((section) => section.title && section.text), `${entry.topic}: empty explanation section`);
  assert.ok(getExplanationExamples(item, { ...entry, selected }).length > 0, `${entry.topic}: no worked example`);
}

for (const lesson of lessons) {
  for (const item of lesson.exercises) {
    assert.ok(
      String(item.explanation || '').length >= 80,
      `${lesson.title}: missing individual explanation for “${item.prompt}”`,
    );
    if (item.type !== 'choice') continue;
    const unrelatedNextQuestion = {
      id: 'unrelated',
      type: 'choice',
      prompt: 'Совершенно другая тема',
      options: ['One', 'Two'],
      answer: 'One',
    };
    const reinforcement = getRelevantReinforcement(item, unrelatedNextQuestion);
    assert.equal(reinforcement.sourceId, item.id, `${lesson.title}: reinforcement changed the source question`);
    if (reinforcement.isNew) {
      assert.notEqual(reinforcement.prompt, item.prompt);
      assert.ok(reinforcement.skill && reinforcement.explanation);
      assert.ok(reinforcement.options.includes(reinforcement.answer));
    } else {
      assert.equal(reinforcement.answer, item.answer);
      assert.ok(reinforcement.prompt.includes(item.prompt));
    }
    assert.ok(!reinforcement.prompt.includes(unrelatedNextQuestion.prompt), `${lesson.title}: unrelated next question leaked into reinforcement`);
    for (const option of item.options.filter((value) => value !== item.answer)) {
      const optionExplanation = item.optionExplanations?.[option];
      assert.ok(
        String(optionExplanation || '').length >= 80,
        `${lesson.title}: missing explanation for wrong option “${option}”`,
      );
      assert.ok(
        optionExplanation.includes(item.answer),
        `${lesson.title}: option explanation does not identify the correct answer`,
      );
    }
  }
}

console.log(`Explanation audit passed: ${entries.length} questions, including individual course options and examples.`);
