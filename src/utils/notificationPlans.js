import { savedStudyTargets } from './learningContinuation.js';
export { savedStudyTargets } from './learningContinuation.js';
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
  const wordsById = words instanceof Map ? words : new Map(words.map(word => [word.id, word]));
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
