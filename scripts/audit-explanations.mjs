import assert from 'node:assert/strict';
import { assemblyBlocks } from '../src/data/assemblyNotes.js';
import { lessons } from '../src/data/course.js';
import { tenseModules } from '../src/data/advancedCourse.js';
import { grammarQuestions, placementQuestions, stories } from '../src/data/practice.js';
import {
  expandExplanation,
  getExplanationExamples,
  getExplanationSections,
  getRelevantReinforcement,
  getAlternativeExplanations,
  getAssemblyExplanation,
  explainAssemblyAttempt,
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
    if (item.type === 'build') {
      assert.ok(assemblyBlocks(item), `${item.id}: missing or stale individual assembly notes`);
      assert.deepEqual(getAlternativeExplanations(item), [], `${item.id}: word tiles treated as wrong answers`);
      const assembly = getAssemblyExplanation(item);
      assert.ok(assembly && !assembly.includes('Почему не'), `${item.id}: missing assembly explanation`);
    }
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
    assert.ok(reinforcement, `${lesson.title}: missing linked task for ${item.id}`);
    assert.equal(reinforcement.sourceId, item.id, `${lesson.title}: reinforcement changed the source question`);
    if (reinforcement.isNew) {
      assert.notEqual(reinforcement.prompt, item.prompt);
      assert.ok(reinforcement.skill && reinforcement.explanation);
      assert.ok(reinforcement.options.includes(reinforcement.answer));
    }
    assert.ok(reinforcement.isNew, `${item.id}: original question reused`);
    assert.ok(!/^(Повтори этот же смысл|Закрепи эту же конструкцию):/u.test(reinforcement.prompt), `${item.id}: original prompt copied with a prefix`);
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

const nameExercise = lessons.flatMap((lesson) => lesson.exercises).find((item) => item.id === 'g3');
for (const practiceVariant of [0, 1]) {
  const linked = getRelevantReinforcement(nameExercise, true, { practiceVariant });
  assert.equal(linked.construction, 'name');
  assert.notEqual(linked.answer, nameExercise.answer);
  assert.ok(!linked.prompt.includes('Анна'));
}
assert.ok(getAssemblyExplanation(nameExercise).includes('My name → is → Anna'));
assert.ok(explainAssemblyAttempt(nameExercise, 'My Anna name is').includes('нарушен порядок'));
assert.ok(explainAssemblyAttempt(nameExercise, 'My name Anna').includes('Не хватает: is'));
assert.ok(explainAssemblyAttempt(nameExercise, 'My name is is Anna').includes('Лишние слова'));
assert.equal(explainAssemblyAttempt(nameExercise, 'My name is Anna'), 'Все слова на месте, порядок верный.');
assert.equal(getAssemblyExplanation({ type: 'choice', answer: 'Hello' }), null);

console.log(`Explanation audit passed: ${entries.length} questions, including individual course options and examples.`);
