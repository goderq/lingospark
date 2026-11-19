import assert from 'node:assert/strict';
import { errorFeedback } from '../src/utils/errorFeedback.js';
import { getAlternativeExplanations, getRelevantReinforcement, getExplanationExamples, getExplanationSections } from '../src/utils/explanations.js';
import { getCoursePracticePhrases } from '../src/data/courseDialogues.js';
import { lessons } from '../src/data/course.js';
import { nextLearningStep, readQuickSession } from '../src/utils/learningContinuation.js';
import { learningJourneys } from '../src/data/learningJourney.js';
import { courseDialogueEvidence, dialogueGuidance } from '../src/utils/conversationCoach.js';
import { evaluateExercise } from '../src/utils/answer.js';
import { wordLearningDetails } from '../src/data/wordLearningData.js';

const task = (answer, extra = {}) => ({ id: 'test', type: 'translate', prompt: 'Переведи фразу', answer, ...extra });
assert.equal(errorFeedback(task('Я хотел бы записаться на приём'), 'Я хотел бы записаться на прием').kind, 'accepted');
assert.equal(errorFeedback(task('I am ready'), "I'm ready").kind, 'accepted');
assert.equal(errorFeedback(task('I can swim'), 'I cannot swim').kind, 'negation');
assert.equal(errorFeedback(task('My name is Anna'), 'My name Anna').kind, 'missing');
assert.equal(errorFeedback(task('My name is Anna'), 'My is name Anna').kind, 'order');
assert.equal(errorFeedback(task('My name is Anna'), 'Меня зовут Анна').kind, 'language');
assert.equal(errorFeedback(task('Hello', { answers: ['Hi'] }), 'Hi').kind, 'accepted');
const authored = task('is', { type: 'choice', options: ['is', 'am'], optionExplanations: { am: 'Am согласуется с I, а здесь подлежащее she.' } });
assert.equal(errorFeedback(authored, 'am').kind, 'authored');
assert.deepEqual(getAlternativeExplanations({ answer: 'Hello', answers: ['Hi'], options: ['Hello', 'Hi', 'Bye'] }).map(item => item.title), ['Почему не «Bye»']);
assert.ok(!getExplanationExamples({ prompt: 'Say ___ to a friend', answer: 'Hello', answers: ['Hi'] }, { selected: 'Hi' }).some(item => item.text.includes('✕')));
assert.ok(!getExplanationSections({ prompt: 'Is this gift for me?', answer: 'Это мне?' }).find(section => section.id === 'rule').text.includes('have/has + V3'));
const contrast = lessons[0].exercises.find(item => item.id === 'mega-greetings-2').optionExplanations['Where are you from?'];
assert.ok(contrast.includes('Откуда ты?') && contrast.includes('Это моя подруга Анна'), 'phrase alternatives must contrast their actual translations');

let progress = { completed: [], journeys: {} };
assert.equal(nextLearningStep(progress, learningJourneys[5].id).topicId, 'greetings');
assert.equal(nextLearningStep(progress, learningJourneys[5].id).locked, true);
assert.equal(nextLearningStep(progress).stageId, 'understand');
const session = { version: 1, id: 'quick-1', topicId: 'greetings', stageId: 'understand', step: 0, results: [] };
assert.deepEqual(readQuickSession(session, progress), session);
assert.equal(readQuickSession({ ...session, step: 1 }, progress), null);
assert.equal(readQuickSession({ ...session, topicId: learningJourneys[5].id }, progress), null);
assert.equal(readQuickSession({ ...session, stageId: 'dialogue' }, progress), null);
const paused = { ...session, step: 2, results: [{ correct: 1, total: 3, skipped: false }, { correct: 0, total: 0, skipped: true }] };
assert.deepEqual(readQuickSession(JSON.parse(JSON.stringify(paused)), progress), paused);
for (const topic of learningJourneys) {
  const phrases = getCoursePracticePhrases(topic.id);
  assert.equal(phrases.length, 2);
  assert.ok(phrases.every(item => item.english && item.russian && !item.russian.startsWith('Ответь')));
  const current = nextLearningStep(progress, topic.id);
  assert.equal(current.topicId, topic.id);
  assert.equal(current.locked, false);
  for (const stage of topic.stages) {
    progress = { ...progress, journeys: { ...progress.journeys, [topic.id]: { stages: { ...progress.journeys[topic.id]?.stages, [stage.id]: { completedAt: 1 } } } } };
    for (const exercise of stage.exercises) {
      const linked = getRelevantReinforcement(exercise);
      if (linked) { assert.notEqual(linked.prompt, exercise.prompt); assert.ok(evaluateExercise(linked, linked.answer).correct); }
    }
  }
  assert.equal(nextLearningStep(progress, topic.id).stageId, null);
  progress = { ...progress, completed: [...progress.completed, topic.id] };
}
const turns = [{ role: 'assistant', content: 'My name is Anna.' }, { role: 'user', kind: 'command', content: 'My name is Anna.' }];
assert.equal(courseDialogueEvidence('greetings', turns)[0].matched, false, 'assistant replies and commands cannot demonstrate learner practice');
assert.equal(courseDialogueEvidence('greetings', [...turns, { role: 'user', content: "I'm Anna" }])[0].matched, true);
assert.deepEqual(courseDialogueEvidence('unknown-topic', turns), []);
const guidanceFor = (text, previous) => dialogueGuidance([
  ...(previous ? [{ role: 'assistant', content: previous }] : []),
  { role: 'user', content: text },
]);
assert.match(guidanceFor('find'), /ask one specific question to clarify/i);
assert.match(guidanceFor('Can I pay by card?'), /answer the learner’s question directly/i);
assert.match(guidanceFor('I would like to book a table for tomorrow'), /use one concrete detail/i);
const previousQuestion = 'Do you usually play with friends or with a team?';
const fragmentGuidance = guidanceFor('With friends.', previousQuestion);
assert.match(fragmentGuidance, /follow up on the detail/i);
assert.ok(fragmentGuidance.includes(previousQuestion));
const clarificationGuidance = guidanceFor('What?', previousQuestion);
assert.match(clarificationGuidance, /clarify.*in simpler English/i);
assert.ok(clarificationGuidance.includes(previousQuestion));
const yesNoGuidance = guidanceFor('Yes.', 'Would you like the morning train?');
assert.match(yesNoGuidance, /yes or no.*move one step forward/i);
assert.ok(yesNoGuidance.includes('Would you like the morning train?'));
assert.equal(wordLearningDetails('family', 'семья').partOfSpeech, 'существительное');
assert.notEqual(wordLearningDetails('building', 'здание').partOfSpeech, 'глагол');
console.log('Learning quality passed: concrete feedback, accepted variants, linked skills, 43 prerequisite routes, resumable short sessions, learner-only dialogue evidence and contextual word labels.');
