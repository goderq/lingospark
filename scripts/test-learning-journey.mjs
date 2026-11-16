import assert from 'node:assert/strict';
import { learningJourneys, greetingJourney } from '../src/data/learningJourney.js';
import { stageAvailable, gradeJourneyStage, finishJourneyStage, readJourneyDraft, skillEvidence, courseTutorContext } from '../src/utils/learningJourney.js';
import { evaluateExercise } from '../src/utils/answer.js';
import { mainTabs, navigationTarget } from '../src/utils/appNavigation.js';
import { lessonContentKey, readLessonSession } from '../src/utils/lessonSession.js';
import { trainingPassed } from '../src/utils/trainingResult.js';
import { lessons } from '../src/data/course.js';
import { choiceQualityIssues } from '../src/utils/contentQuality.js';

let progress = { completed: [], journeys: {}, totalXP: 0 };
assert.equal(stageAvailable(progress, 'greetings', 'understand'), true);
assert.equal(stageAvailable(progress, 'greetings', 'dialogue'), false);
assert.equal(stageAvailable(progress, 'missing', 'understand'), false);
assert.equal(gradeJourneyStage('greetings', 'understand', []), null);
for (const journey of learningJourneys) {
  for (const stage of journey.stages) {
    assert.equal(stageAvailable(progress, journey.id, stage.id), true);
    const responses = stage.exercises.map(e => ({ id: e.id, input: e.answer }));
    for (const exercise of stage.exercises) {
      assert.ok(evaluateExercise(exercise, exercise.answer).correct, exercise.id);
      assert.ok(exercise.explanation.length > 30, exercise.id);
      if (exercise.type === 'choice') assert.deepEqual(choiceQualityIssues(exercise), [], exercise.id);
      if (exercise.type === 'build') assert.deepEqual([...exercise.options].sort(), exercise.answer.split(' ').sort());
      if (stage.mode === 'listen') {
        assert.ok(exercise.speak);
        assert.ok(!exercise.prompt.includes(exercise.answer), 'listening prompt must not reveal the sentence');
      }
    }
    const failedResponses = stage.exercises.map(e => ({ id: e.id, input: 'an unrelated answer' }));
    const failed = finishJourneyStage(progress, journey.id, stage.id, failedResponses, `${stage.id}-failed`, 100);
    assert.equal(failed.journeys[journey.id].stages[stage.id].completedAt, null);
    assert.equal(failed.journeys[journey.id].stages[stage.id].accuracy, 0);
    const next = finishJourneyStage(failed, journey.id, stage.id, responses, `${stage.id}-success`, 200);
    assert.equal(next.journeys[journey.id].stages[stage.id].completedAt, 200);
    assert.equal(next.journeys[journey.id].stages[stage.id].attempts, 2);
    assert.equal(next.journeys[journey.id].draft, null);
    assert.equal(finishJourneyStage(next, journey.id, stage.id, responses, `${stage.id}-success`, 300), next);
    assert.deepEqual(next.completed, [], 'topic stages must not open courses');
    assert.equal(next.totalXP, 0, 'repeated topic practice must not farm course XP');
    progress = next;
  }
}
const evidence = skillEvidence(progress);
assert.equal(evidence.length, 5);
assert.ok(evidence.every(skill => skill.evidence.length === 1));
assert.ok(skillEvidence({}).every(skill => skill.evidence.length === 0), 'fresh user must not get a skill score');
const legacyEvidence = skillEvidence({ stats: { dictationTotal: 4, dictationCorrect: 3, dialoguesCompleted: 2 }, writingCompleted: ['writing-1'] });
assert.ok(legacyEvidence.find(item => item.id === 'listening').evidence[0].detail.includes('3 из 4'));
assert.equal(legacyEvidence.find(item => item.id === 'writing').evidence.length, 1, 'existing written work must remain visible');
const context = courseTutorContext(greetingJourney.ai, 'A1', greetingJourney.ai.topic);
assert.ok(context.includes('Sam') && context.includes('один короткий вопрос'));
assert.equal(courseTutorContext(greetingJourney.ai, 'C1', greetingJourney.ai.topic), '');
assert.equal(courseTutorContext(greetingJourney.ai, 'A1', 'Работа'), '');
assert.equal(courseTutorContext(null, 'A1', greetingJourney.ai.topic), '');
const draft = { version: 1, stageId: 'words', attemptId: 'a', index: 1, responses: [{ id: 'j-words-1', input: 'name' }], input: 'fri', built: [], checked: false, teaching: false };
assert.deepEqual(readJourneyDraft('greetings', 'words', JSON.parse(JSON.stringify(draft))), draft);
assert.deepEqual(readJourneyDraft('greetings', 'words', { ...draft, checked: true }), {});
assert.deepEqual(readJourneyDraft('greetings', 'words', { ...draft, index: 100 }), {});
assert.deepEqual(readJourneyDraft('greetings', 'words', { ...draft, built: [1, 1] }), {});
const lesson = lessons[0];
const snapshot = { version: 2, lessonId: lesson.id, contentKey: lessonContentKey(lesson), index: 2, correctCount: 2, checked: true, built: ['My', 'name', 'is', 'Anna'], lessonMistakes: [{ exercise: lesson.exercises[1], selected: 'Wrong' }], conversation: false, remediation: false };
assert.deepEqual(readLessonSession(lesson, JSON.parse(JSON.stringify(snapshot))), snapshot);
assert.deepEqual(readLessonSession(lesson, { ...snapshot, contentKey: 'old-content' }), {});
assert.deepEqual(readLessonSession(lesson, { ...snapshot, correctCount: 100 }), {});
assert.deepEqual(readLessonSession(lesson, { ...snapshot, correctCount: 0 }), {}, 'a resumed draft must keep every already answered question accounted for');
assert.notEqual(lessonContentKey(lesson), lessonContentKey({ ...lesson, exercises: lesson.exercises.map((e, i) => i ? e : { ...e, prompt: 'Changed question' }) }));
assert.deepEqual(readLessonSession(lesson, { ...snapshot, remediation: true, remediationIndex: 9 }), {});
assert.deepEqual(readLessonSession(lesson, { ...snapshot, conversation: true, conversationStep: 2 }), {});
assert.deepEqual(readLessonSession(lesson, { lessonId: lesson.id, index: 2, lives: 0 }), {}, 'legacy drafts with no recorded scores must not invent accuracy');
assert.equal(mainTabs.length, 5);
assert.equal(new Set(mainTabs.map(([id]) => id)).size, 5);
assert.deepEqual(navigationTarget('review'), { tab: 'learn', overlay: { type: 'review' } });
assert.deepEqual(navigationTarget('course'), { tab: 'learn', overlay: { type: 'course' } });
assert.deepEqual(navigationTarget('lingoWorld'), { tab: 'world', overlay: null });
for (const [id] of mainTabs) assert.deepEqual(navigationTarget(id), { tab: id, overlay: null });
assert.ok(trainingPassed(4, 5));
assert.equal(trainingPassed(3, 5), false);
assert.equal(trainingPassed(0, 0), false);
assert.equal(trainingPassed(9, 5), false);
console.log('Learning 3.0: authored stages, gates, grading, drafts, evidence, tutor context, navigation and training thresholds passed.');
