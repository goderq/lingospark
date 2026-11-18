import assert from 'node:assert/strict';
import { contextDialogues, contextDialogueForTopic } from '../src/data/contextDialogues.js';
import { courseExercisesForAttempt } from '../src/data/courseRepeatVariants.js';
import { lessons } from '../src/data/course.js';
import { evaluateExercise } from '../src/utils/answer.js';
import { getRelevantReinforcement } from '../src/utils/explanations.js';
import { buildUnifiedReview, enqueueConstructionReview } from '../src/utils/unifiedReview.js';

assert.equal(contextDialogues.length, 7);
assert.deepEqual([...new Set(contextDialogues.map(scene => scene.level))], ['A1', 'A2', 'B1']);
const ids = new Set();
for (const scene of contextDialogues) {
  assert.equal(scene.steps.length, 3);
  for (const item of scene.steps) {
    assert.ok(!ids.has(item.id));
    ids.add(item.id);
    assert.ok(item.answers.length >= 3 && item.dialogueHint && item.audio && item.explanation);
    for (const answer of [item.answer, ...item.answers]) assert.ok(evaluateExercise(item, answer).correct);
    assert.ok(!evaluateExercise(item, `${item.answer} спасибо`).correct);
  }
}
assert.equal(contextDialogueForTopic('shopping')?.id, 'refund');
assert.equal(contextDialogueForTopic('work')?.id, 'colleague');
const appointment = contextDialogues.find(scene => scene.id === 'appointment').steps[1];
assert.ok(!evaluateExercise(appointment, 'Could I move my appointment to Tuesday?').correct);
const coffee = contextDialogues.find(scene => scene.id === 'coffee');
assert.ok(!evaluateExercise(coffee.steps[1], 'For here, please.').correct);

let changed = 0;
for (const lesson of lessons) {
  assert.equal(courseExercisesForAttempt(lesson, 0), lesson.exercises);
  const first = courseExercisesForAttempt(lesson, 1);
  const second = courseExercisesForAttempt(lesson, 2);
  assert.equal(first.length, lesson.exercises.length);
  assert.equal(second.length, first.length);
  first.forEach((item, index) => {
    if (item === lesson.exercises[index]) return;
    changed++;
    assert.equal(item.sourceExerciseId, lesson.exercises[index].id);
    assert.equal(item.type, lesson.exercises[index].type);
    assert.notEqual(item.prompt, lesson.exercises[index].prompt);
    assert.notEqual(item.prompt, second[index].prompt);
    assert.ok(evaluateExercise(item, item.answer).correct);
    if (item.type === 'choice') {
      assert.equal(item.options.filter(option => evaluateExercise(item, option).correct).length, 1);
    } else {
      assert.deepEqual([...item.options].sort(), item.answer.split(' ').sort());
    }
  });
}
assert.equal(changed, 7);

const today = new Date(2026, 10, 18, 12).getTime();
const tomorrow = new Date(2026, 10, 19, 12).getTime();
for (const id of ['pa1', 'pa3', 'pp5', 'ph2']) {
  const original = lessons.flatMap(lesson => lesson.exercises).find(item => item.id === id);
  const reinforcement = getRelevantReinforcement(original);
  assert.ok(reinforcement?.construction);
  const progress = enqueueConstructionReview({}, reinforcement.construction, today);
  assert.equal(buildUnifiedReview(progress, [], lessons, today).length, 0);
  const [item] = buildUnifiedReview(progress, [], lessons, tomorrow);
  assert.ok(item.context);
  assert.notEqual(item.prompt, original.prompt);
  assert.notEqual(item.prompt, reinforcement.prompt);
}
console.log('Context practice passed: 21 written turns, 7 rotating course questions and 4 new delayed constructions.');
