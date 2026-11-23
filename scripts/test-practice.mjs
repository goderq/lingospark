import assert from 'node:assert/strict';
import { practiceCatalog, buildPracticeDeck } from '../src/data/practiceCatalog.js';
import { buildUnifiedReview, countDueReviewWords, reviewId, finishPracticeSession, validatePracticeSession, enqueuePhrase } from '../src/utils/unifiedReview.js';
import { evaluateExercise } from '../src/utils/answer.js';
import { choiceQualityIssues } from '../src/utils/contentQuality.js';
import { sampleExamQuestions } from '../src/utils/examDeck.js';
import { lessons } from '../src/data/course.js';
import { learningJourneys } from '../src/data/learningJourney.js';
import { DAY } from '../src/utils/retention.js';
import { practiceAlias } from '../src/utils/appNavigation.js';
import { groupPracticeDeck, groupPracticeKey, recordGroupStudy } from '../src/utils/groupStudy.js';
import { canOpenEventDay, eventBadges, eventDate, eventPracticeKey } from '../src/utils/studyEvents.js';

const now = Date.UTC(2026, 10, 16, 12);
const bank = practiceCatalog();
for (const exercise of bank) {
  assert.ok(evaluateExercise(exercise, exercise.answer).correct, exercise.id);
  if (exercise.type === 'choice') assert.deepEqual(choiceQualityIssues(exercise), [], exercise.id);
}
for (const level of ['A1', 'A2', 'B1', 'B2', 'C1']) for (const skill of ['mixed', 'grammar', 'vocabulary', 'listening', 'writing']) {
  const deck = buildPracticeDeck({ level, skill, size: 20 });
  assert.ok(deck.length > 0, `${level}:${skill}`);
  assert.equal(new Set(deck.map(item => item.id)).size, deck.length);
  assert.ok(deck.every(item => item.level === level));
  if (skill === 'listening') assert.ok(deck.every(item => item.speak && !item.prompt.includes(item.answer)));
}
for (const journey of learningJourneys) {
  assert.equal(journey.stages.length, 5);
  assert.ok(journey.ai.instruction.length > 40);
  for (const item of journey.stages.find(stage => stage.id === 'dialogue').exercises) assert.ok(item.line && !/what did you practi[cs]e|which phrase|use the first|from this lesson/i.test(item.line), item.id);
  const groupDeck = groupPracticeDeck(journey.id);
  assert.ok(groupDeck.length > 0 && groupDeck.length <= 10);
  assert.equal(new Set(groupDeck.map(item => item.id)).size, groupDeck.length);
  assert.ok(groupDeck.every(item => evaluateExercise(item, item.answer).correct));
}
assert.equal(learningJourneys.length, lessons.length);
assert.ok(practiceAlias('adaptive')); assert.ok(practiceAlias('skillSprint')); assert.equal(practiceAlias('dailyMixedExam').initialMode, 'exam');
assert.equal(practiceAlias('ielts'), null, 'unique IELTS training must remain accessible');

const sample = [{ id: 'one', type: 'translate', prompt: 'Переведи: hello', answer: 'привет', topic: 'Знакомство' }, { id: 'two', type: 'translate', prompt: 'Скажи: «Спасибо»', answer: 'Thank you', topic: 'Вежливость' }];
const session = { version: 1, id: 'attempt-1', mode: 'learn', deck: sample, index: 1, input: 'Thank you', built: [], checked: true, responses: [{ id: 'one', input: 'привет', assisted: true }, { id: 'two', input: 'Thank you', assisted: false }] };
const state = { completed: [], practiceDrafts: { main: session }, totalXP: 100, coins: 20 };
assert.ok(validatePracticeSession(session, true));
const result = finishPracticeSession(state, 'main', session, now);
assert.equal(result.practiceResults[session.id].correct, 2); assert.equal(result.practiceResults[session.id].unaided, 1);
assert.equal(result.practiceDrafts.main, null); assert.equal(result.coins, 20); assert.equal(result.totalXP, 101, 'only the unaided answer earns practice XP');
const repeated = finishPracticeSession(result, 'main', { ...session, id: 'attempt-2' }, now);
assert.equal(repeated.totalXP, 101, 'repeating the same exercise on the same day must not farm XP');
assert.equal(result.reviewQueue[reviewId(sample[0])].dueAt, now + 10 * 60000);
assert.equal(result.reviewQueue[reviewId(sample[1])].dueAt, now + DAY);
assert.equal(finishPracticeSession(result, 'main', session, now), result, 'double submission must not count twice');
assert.equal(finishPracticeSession(state, 'main', { ...session, responses: session.responses.slice(1) }, now), state, 'unfinished work must not be recorded');
assert.equal(validatePracticeSession({ ...session, mode: 'exam' }), false, 'an assisted attempt cannot masquerade as a cold test');
assert.equal(validatePracticeSession({ ...session, built: [99] }), false);
assert.equal(validatePracticeSession({ ...session, input: 'edited after checking' }), false);
assert.deepEqual(JSON.parse(JSON.stringify(session)), session);

const word = { id: 'hello', english: 'hello', russian: 'привет', translations: ['здравствуйте'] };
const oldState = { completed: [], reviewStats: { hello: { total: 1, dueDate: '2026-11-15' } }, mistakes: [{ id: 'review-hello-en-ru', type: 'Слово', prompt: 'hello', answer: 'привет', topic: 'Слова' }], wordPreferences: {} };
const oldDeck = buildUnifiedReview(oldState, [word], lessons, now);
assert.equal(oldDeck.length, 1, 'a due word and its mistake must merge'); assert.equal(oldDeck[0].sourceMistakeId, 'review-hello-en-ru');
const wordSession = { version: 1, id: 'word-attempt', mode: 'review', deck: oldDeck, index: 0, input: 'привет', built: [], checked: true, responses: [{ id: oldDeck[0].id, input: 'привет', assisted: false }] };
const corrected = finishPracticeSession(oldState, 'review', wordSession, now);
assert.equal(corrected.mistakes.length, 0); assert.equal(corrected.reviewStats.hello.total, 2);
assert.equal(buildUnifiedReview(corrected, [word], lessons, now).length, 0, 'a scheduled item must not reappear through its legacy stats');
assert.equal(buildUnifiedReview({ ...oldState, wordPreferences: { hidden: ['hello'] } }, [word], lessons, now).length, 0);
assert.equal(countDueReviewWords(oldState, [word], now), 1, 'count a word and its mistake once');
assert.equal(countDueReviewWords({ ...oldState, wordPreferences: { hidden: ['hello'] } }, [word], now), 0);
assert.equal(countDueReviewWords(oldState, [], now), 0, 'removed words do not count');
assert.equal(countDueReviewWords(corrected, [word], now), 0, 'an older stat cannot override a later review');
assert.equal(countDueReviewWords(corrected, [word], now + DAY), 1);
assert.equal(countDueReviewWords({ reviewStats: { hello: { total: 1, dueDate: now + 60000 } } }, [word], now), 0);

const scheduled = { completed: [lessons[0].id], retention: { [lessons[0].id]: { dueAt: now - DAY } } };
const memoryDeck = buildUnifiedReview(scheduled, [], lessons, now);
assert.equal(memoryDeck.length, Math.min(5, lessons[0].exercises.filter(item => item.type === 'choice').length));
assert.ok(memoryDeck.every(item => item.retentionLessonId === lessons[0].id));
const withPhrase = enqueuePhrase({ completed: [] }, { english: 'Could I see the menu?', russian: 'Можно посмотреть меню?', topic: 'ИИ' }, now);
assert.equal(buildUnifiedReview(withPhrase, [], lessons, now).length, 0);
assert.equal(buildUnifiedReview(withPhrase, [], lessons, now + DAY).length, 1);
assert.equal(enqueuePhrase(withPhrase, { english: 'Could I see the menu?', russian: 'Можно посмотреть меню?' }, now), withPhrase);

const duplicated = [lessons[0].exercises[0], lessons[0].exercises[0], ...lessons[0].exercises.filter(item => item.type === 'choice')];
const exam = sampleExamQuestions(duplicated, 30, 42);
assert.equal(exam.length, lessons[0].exercises.filter(item => item.type === 'choice').length);
assert.equal(new Set(exam.map(item => item.id)).size, exam.length);
const assignmentId = '00000000-0000-4000-8000-000000000001';
const groupKey = groupPracticeKey(assignmentId);
const groupDraft = recordGroupStudy({}, groupKey);
assert.equal(groupDraft.groupStudyResults[assignmentId].status, 'started');
const question = { id: 'group-question', type: 'translate', prompt: 'Скажи «Привет»', answer: 'Hello' };
const groupAttempt = { version: 1, id: 'group-attempt', mode: 'exam', deck: [question], index: 0,
  input: 'Hello', built: [], checked: true, responses: [{ id: question.id, input: 'Hello' }] };
const groupCompleted = finishPracticeSession(groupDraft, groupKey, groupAttempt, now);
assert.deepEqual(groupCompleted.groupStudyResults[assignmentId], { status: 'completed', correct: 1, total: 1 });
assert.equal(recordGroupStudy(groupCompleted, groupKey), groupCompleted, 'starting a retake preserves the latest submitted result');
assert.equal(finishPracticeSession(groupCompleted, groupKey, groupAttempt, now), groupCompleted, 'a duplicate submission is ignored');
assert.deepEqual(groupPracticeDeck('unknown-group-topic'), []);
const event = { id: '00000000-0000-4000-8000-000000000002', name: 'Неделя общения', starts_on: eventDate(now), topics: ['greetings', 'travel'] };
const firstDay = eventPracticeKey(event.id, 0), secondDay = eventPracticeKey(event.id, 1);
assert.equal(canOpenEventDay(event, 0, now - DAY), false);
assert.equal(canOpenEventDay(event, 1, now), false);
assert.equal(canOpenEventDay(event, 0, now + DAY), true, 'the previous day remains available through the event');
assert.equal(canOpenEventDay(event, 1, now + 2 * DAY), false);
const firstEventResult = finishPracticeSession({}, firstDay, groupAttempt, now, { event, index: 0 });
assert.deepEqual(firstEventResult.studyEventResults[event.id].days, { 0: true });
assert.deepEqual(eventBadges(firstEventResult), []);
const future = finishPracticeSession(firstEventResult, secondDay, { ...groupAttempt, id: 'locked-attempt' }, now, { event, index: 1 });
assert.deepEqual(future.studyEventResults, firstEventResult.studyEventResults);
const finishedEvent = finishPracticeSession(firstEventResult, secondDay, { ...groupAttempt, id: 'valid-event-2' }, now + DAY, { event, index: 1 });
assert.deepEqual(eventBadges(finishedEvent), [{ id: event.id, name: event.name }]);
const repeatedEvent = finishPracticeSession(finishedEvent, secondDay, { ...groupAttempt, id: 'event-retake' }, now + DAY, { event, index: 1 });
assert.equal(repeatedEvent.studyEventResults, finishedEvent.studyEventResults);
console.log(`Practice passed: ${bank.length} pooled questions, all levels/skills, ${learningJourneys.length} topic conversations, drafts, assisted grading, review merging, delays and exam deduplication.`);
