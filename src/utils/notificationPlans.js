import { readQuickSession } from './learningContinuation.js';
import { readJourneyDraft, stageAvailable } from './learningJourney.js';
import { readLessonSession } from './lessonSession.js';
import { buildUnifiedReview } from './unifiedReview.js';

export function notificationPreferences(settings) {
  const { reminderHour: hour, remindersEnabled, reviewReminderEnabled, resumeReminderEnabled, modelNotificationEnabled } = settings || {};
  return {
    review: reviewReminderEnabled ?? !!remindersEnabled,
    resume: resumeReminderEnabled ?? !!remindersEnabled,
    model: modelNotificationEnabled === true,
    hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 19,
  };
}

export function savedStudyTargets(progress, lessons) {
  const targets = [];
  const quick = readQuickSession(progress.quickSession, progress);
  if (quick && quick.step < 3) targets.push({ type: 'quickSession', id: quick.id });
  const lesson = lessons.find(item => item.id === progress.lessonDraft?.lessonId);
  if (lesson && readLessonSession(lesson, progress.lessonDraft).lessonId) targets.push({ type: 'lesson', id: lesson.id });
  for (const [topicId, entry] of Object.entries(progress.journeys || {})) {
    const draft = entry?.draft;
    if (draft && stageAvailable(progress, topicId, draft.stageId) && readJourneyDraft(topicId, draft.stageId, draft).attemptId) {
      targets.push({ type: 'journey', id: topicId, stageId: draft.stageId });
    }
  }
  return targets;
}

export const localDay = time => {
  const date = new Date(time);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
};

export function planStudyReminder({ progress, preferences, words, lessons, now, lastDay }) {
  const target = preferences.resume ? savedStudyTargets(progress, lessons)[0] : null;
  if (!preferences.review && !target) return null;
  const today = localDay(now);
  const progressDate = new Date(now).toISOString().slice(0, 10);
  const studiedToday = progress.lastStudyDate === progressDate || progress.activity?.[progressDate] > 0 ||
    Object.values(progress.journeys || {}).some(entry => Object.values(entry?.stages || {})
      .some(stage => stage?.lastAttemptAt > 0 && localDay(stage.lastAttemptAt) === today));
  const candidates = [];
  for (let offset = 0; offset <= 35; offset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    date.setHours(preferences.hour, 0, 0, 0);
    const day = localDay(date);
    if (date.getTime() <= now || day === lastDay || (day === today && studiedToday)) continue;
    candidates.push(date.getTime());
  }
  const wordsById = new Map(words.map(word => [word.id, word]));
  const dueAt = time => preferences.review && buildUnifiedReview(progress, wordsById, lessons, time, 1).length > 0;
  if (target) {
    const fireAt = candidates[0];
    return dueAt(fireAt) ? { kind: 'review', fireAt } : { kind: 'resume', fireAt, target };
  }
  if (!dueAt(candidates.at(-1))) return null;
  // The next review becomes eligible once its due time passes.
  let first = 0, last = candidates.length - 1;
  while (first < last) {
    const mid = Math.floor((first + last) / 2);
    if (dueAt(candidates[mid])) last = mid;
    else first = mid + 1;
  }
  return { kind: 'review', fireAt: candidates[first] };
}
