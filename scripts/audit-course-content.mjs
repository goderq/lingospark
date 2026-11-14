import assert from 'node:assert/strict';
import { lessons } from '../src/data/course.js';
import { courseConversationTopics } from '../src/data/courseSupplement.js';
import { answersMatch, gradeAnswer, normalizeAnswer } from '../src/utils/answer.js';

const failures = [];
const seenLessonIds = new Set();
const seenExerciseIds = new Set();
const seenPrompts = new Map();
const hasLatin = (value) => /[a-z]/i.test(`${value || ''}`);
const hasCyrillic = (value) => /[а-яё]/i.test(`${value || ''}`);
const mixedScripts = (value) => hasLatin(value) && hasCyrillic(value);
const normalizedWords = (value) => normalizeAnswer(value).split(' ').filter(Boolean).sort();
const fail = (message) => failures.push(message);

for (const lesson of lessons) {
  if (seenLessonIds.has(lesson.id)) fail(`duplicate lesson id: ${lesson.id}`);
  seenLessonIds.add(lesson.id);
  if (lesson.exercises.length < 10) fail(`${lesson.id}: fewer than 10 exercises`);
  const conversationTopic = courseConversationTopics[lesson.id];
  if (!conversationTopic) fail(`${lesson.id}: missing English conversation topic`);
  if (hasCyrillic(conversationTopic)) fail(`${lesson.id}: conversation topic contains Russian text`);
  const conversationPhrase = [...lesson.exercises]
    .reverse()
    .find((exercise) => hasLatin(exercise.speak) && !hasCyrillic(exercise.speak))?.speak;
  if (!conversationPhrase) fail(`${lesson.id}: missing English phrase for final dialogue`);
  const lessonAnswers = new Map();
  const lessonSpeech = new Map();

  for (const exercise of lesson.exercises) {
    const location = `${lesson.id}/${exercise.id}`;
    if (seenExerciseIds.has(exercise.id)) fail(`duplicate exercise id: ${exercise.id}`);
    seenExerciseIds.add(exercise.id);
    if (!exercise.prompt?.trim()) fail(`${location}: empty prompt`);
    if (!exercise.answer?.trim()) fail(`${location}: empty answer`);

    const prompt = normalizeAnswer(exercise.prompt);
    if (seenPrompts.has(prompt)) {
      fail(`duplicate prompt: ${seenPrompts.get(prompt)} and ${location}`);
    } else seenPrompts.set(prompt, location);

    const answer = normalizeAnswer(exercise.answer);
    if (lessonAnswers.has(answer)) {
      fail(`${lesson.id}: repeated answer in ${lessonAnswers.get(answer)} and ${exercise.id}`);
    } else lessonAnswers.set(answer, exercise.id);

    const spoken = normalizeAnswer(exercise.speak);
    if (spoken && lessonSpeech.has(spoken)) {
      fail(`${lesson.id}: repeated phrase in ${lessonSpeech.get(spoken)} and ${exercise.id}`);
    } else if (spoken) lessonSpeech.set(spoken, exercise.id);

    for (const value of [exercise.answer, ...(exercise.answers || []), ...(exercise.options || [])]) {
      if (mixedScripts(value)) fail(`${location}: mixed-language answer/option: ${value}`);
    }

    if (exercise.type === 'choice') {
      if (!exercise.options?.includes(exercise.answer)) fail(`${location}: answer is absent from options`);
      if (new Set(exercise.options.map(normalizeAnswer)).size !== exercise.options.length) {
        fail(`${location}: duplicate options`);
      }
    }
    if (exercise.type === 'build') {
      assert.deepEqual(
        normalizedWords(exercise.options.join(' ')),
        normalizedWords(exercise.answer),
        `${location}: build tiles differ from answer`,
      );
    }
    if (exercise.type === 'translate') {
      const variants = [exercise.answer, ...(exercise.answers || [])];
      const expectedHasLatin = hasLatin(exercise.answer);
      const expectedHasCyrillic = hasCyrillic(exercise.answer);
      for (const variant of variants) {
        if (expectedHasLatin !== hasLatin(variant) || expectedHasCyrillic !== hasCyrillic(variant)) {
          fail(`${location}: accepted translations use different scripts`);
        }
      }
    }
  }
}

// Regression checks for the answer checker itself.
assert.equal(answersMatch('прием', 'приём'), true, 'е and ё must be equivalent');
assert.equal(answersMatch('I agree — я согласен', 'I agree'), false, 'bilingual English answer accepted');
assert.equal(answersMatch('Я согласен I agree', 'Я согласен'), false, 'bilingual Russian answer accepted');
assert.equal(gradeAnswer('I agree я согласен', ['I agree']).status, 'wrong');
assert.equal(gradeAnswer('Я согласен I agree', ['Я согласен']).status, 'wrong');

if (failures.length) {
  console.error(`Course audit failed with ${failures.length} problem(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  const taskCount = lessons.reduce((total, lesson) => total + lesson.exercises.length, 0);
  console.log(`Course audit passed: ${lessons.length} courses, ${taskCount} exercises, no repeated prompts or mixed-language answers.`);
}
