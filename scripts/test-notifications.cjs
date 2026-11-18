const assert = require('node:assert/strict');
const load = require('./load-data.cjs');
const { notificationPreferences, planStudyReminder, localDay, savedStudyTargets } = load('src/utils/notificationPlans');
const { enqueuePhrase } = load('src/utils/unifiedReview');
const { lessonContentKey } = load('src/utils/lessonSession');
const { lessons } = load('src/data/course');

const at = day => new Date(2026, 0, day, 19).getTime();
const morning = new Date(2026, 0, 5, 9).getTime();
const preferences = notificationPreferences({ remindersEnabled: true });
assert.deepEqual(preferences, { review: true, resume: true, model: false, hour: 19 });
assert.equal(notificationPreferences({ remindersEnabled: true, reviewReminderEnabled: false }).review, false);

const lesson = lessons[0];
const lessonDraft = {
  lessonId: lesson.id, version: 2, contentKey: lessonContentKey(lesson),
  index: 1, correctCount: 1, lessonMistakes: [],
};
const target = { type: 'lesson', id: lesson.id };
assert.deepEqual(savedStudyTargets({ lessonDraft }, lessons), [target]);
assert.deepEqual(savedStudyTargets({ lessonDraft: { ...lessonDraft, contentKey: 'old' } }, lessons), []);

const plan = (progress, options = {}) => planStudyReminder({ progress, preferences, words: [], lessons, now: morning, ...options });
assert.equal(plan({}), null);
assert.deepEqual(plan({ lessonDraft }), { kind: 'resume', fireAt: at(5), target });
const date = new Date(morning).toISOString().slice(0, 10);
assert.deepEqual(plan({ lessonDraft, activity: { [date]: 1 } }), { kind: 'resume', fireAt: at(6), target });
assert.deepEqual(plan({ lessonDraft }, { lastDay: localDay(morning) }), { kind: 'resume', fireAt: at(6), target });
const phrase = enqueuePhrase({}, { english: 'My name is Anna', russian: 'Меня зовут Анна' }, morning);
assert.deepEqual(plan({ ...phrase, lessonDraft }, { now: morning + 86400000 }), { kind: 'review', fireAt: at(6) });
assert.deepEqual(plan(phrase), { kind: 'review', fireAt: at(6) });
assert.deepEqual(plan({ ...phrase, lessonDraft }), { kind: 'resume', fireAt: at(5), target });
assert.deepEqual(plan({ ...phrase, lessonDraft }, { now: at(5) + 1 }), { kind: 'review', fireAt: at(6) });

const word = { id: 'hello', english: 'hello', russian: 'привет' };
const wordProgress = { reviewStats: { hello: { dueDate: new Date(at(25)).toISOString(), total: 1 } } };
assert.deepEqual(plan(wordProgress, { words: [word] }), { kind: 'review', fireAt: at(25) });
assert.equal(plan({ ...wordProgress, wordPreferences: { hidden: ['hello'] } }, { words: [word] }), null);

async function testService() {
  const fixture = require('./mock-local-ai.cjs')();
  const { scheduled, setNotificationPermissions } = fixture;
  const service = fixture.serviceLoad('src/services/learningNotifications.js');
  const studyId = 'lingospark-study-reminder';
  const sync = (progress, options = preferences) => service.syncStudyNotification({ progress, preferences: options, lessons });
  const respond = identifier => ({
    actionIdentifier: 'default', notification: { request: scheduled.get(identifier) },
  });
  const realNow = Date.now;
  Date.now = () => morning;
  try {
    scheduled.set('legacy', { identifier: 'legacy', content: { title: 'Пора немного английского ✨' } });
    await service.sendTestNotification();
    await sync({ lessonDraft });
    assert.equal(scheduled.has('legacy'), false);
    assert.equal(scheduled.size, 2, 'one learning reminder plus the manual test');
    assert.deepEqual(service.readNotificationResponse(respond(studyId)).target, { ...target, stageId: undefined });
    assert.equal(JSON.stringify(scheduled.get(studyId)).includes(lesson.title), false);
    await sync({ lessonDraft, activity: { [date]: 1 } });
    assert.equal(scheduled.get(studyId).trigger.date, at(6));
    await sync({});
    assert.ok(!scheduled.has(studyId));
    await sync({ lessonDraft });
    Date.now = () => at(5) + 1;
    scheduled.delete(studyId);
    await sync({ lessonDraft }, { ...preferences, hour: 21 });
    assert.equal(localDay(scheduled.get(studyId).trigger.date), localDay(at(6)), 'changing the time must not add a second notice today');
    const due = { completed: [lesson.id], retention: { [lesson.id]: { dueAt: morning } } };
    await sync(due);
    assert.equal(service.readNotificationResponse(respond(studyId)).kind, 'review');
    setNotificationPermissions({ granted: false, canAskAgain: false });
    await sync(due);
    assert.equal(scheduled.size, 1, 'unrelated notification survives permission changes');
    assert.equal(await service.requestLearningNotifications(), false);
    const model = load('src/data/aiModels').AI_MODELS[0];
    await service.notifyModelReady(model);
    assert.equal(scheduled.size, 1);
    service.setModelNoticesEnabled(true);
    await service.notifyModelReady(model);
    assert.equal(scheduled.size, 1);
    setNotificationPermissions({ granted: true });
    await service.notifyModelReady(model);
    const modelNotice = [...scheduled.values()].at(-1);
    assert.equal(service.readNotificationResponse(respond(modelNotice.identifier)).modelId, model.id);
    assert.equal(service.readNotificationResponse({ ...respond(modelNotice.identifier), actionIdentifier: 'custom' }), null);
  } finally {
    Date.now = realNow;
  }
}
testService().then(() => console.log('Notifications passed: due review and resume priority, day limit, legacy cleanup, privacy and model routing.'), error => {
  console.error(error);
  process.exitCode = 1;
});
