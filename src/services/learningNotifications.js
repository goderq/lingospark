import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { planEventReminders } from '../utils/eventReminderPlan';
import { AI_MODELS } from '../data/aiModels';
import { localDay, planStudyReminder } from '../utils/notificationPlans';
import { hasReviewWordCandidates } from '../utils/unifiedReview';
import { includeCustomReviewWords, loadReviewWordIndex } from '../utils/reviewWords';

const SOURCE = 'lingospark';
const STUDY_ID = 'lingospark-study-reminder';
const STUDY_KEY = '@lingospark/study-notification-v1';
const LEGACY_TITLE = 'Пора немного английского ✨';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const isAllowed = permission => permission.granted ||
  permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
  permission.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL;

export async function requestLearningNotifications() {
  const current = await Notifications.getPermissionsAsync();
  return isAllowed(current) || (current.canAskAgain && isAllowed(await Notifications.requestPermissionsAsync()));
}

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Проверка уведомлений LingoSpark', body: 'Локальные уведомления включены.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 },
  });
}

let modelNoticesEnabled = false;
export function setModelNoticesEnabled(enabled) {
  modelNoticesEnabled = enabled;
}

export async function notifyModelReady(model) {
  if (!modelNoticesEnabled || !isAllowed(await Notifications.getPermissionsAsync()) || !modelNoticesEnabled) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Модель скачана',
      body: `${model.shortTitle || model.title} готова к запуску.`,
      data: { source: SOURCE, kind: 'model', modelId: model.id },
    },
    trigger: null,
  });
}

const copy = {
  review: { title: 'Пора повторить', body: 'Готово короткое повторение по твоему прогрессу.' },
  resume: { title: 'Продолжить занятие', body: 'Открой сохранённое занятие с того же шага.' },
};

let scheduleTail = Promise.resolve();
let scheduleRevision = 0;

export function syncStudyNotification({ progress, preferences, lessons }) {
  const revision = ++scheduleRevision;
  const schedule = async () => {
    const requests = await Notifications.getAllScheduledNotificationsAsync();
    const stored = await AsyncStorage.getItem(STUDY_KEY);
    let record = {};
    try { record = JSON.parse(stored) || {}; } catch {}

    const scheduled = requests.find(item => item.identifier === STUDY_ID);
    const now = Date.now();
    if (record.fireAt > 0 && record.fireAt <= now) record = { lastDay: localDay(record.fireAt) };
    const allowed = (preferences.review || preferences.resume) && isAllowed(await Notifications.getPermissionsAsync());
    let next = null;
    if (allowed) {
      const index = preferences.review && hasReviewWordCandidates(progress) ? await loadReviewWordIndex() : new Map();
      const words = includeCustomReviewWords(index, progress.customWords);
      next = planStudyReminder({ progress, preferences, words, lessons, now, lastDay: record.lastDay });
    }
    if (revision !== scheduleRevision) return;

    await Promise.all(requests.filter(item => item.content.title === LEGACY_TITLE && !item.content.data?.source)
      .map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)));

    const data = scheduled?.content.data;
    if (next && data?.source === SOURCE && data.kind === next.kind && data.fireAt === next.fireAt &&
      data.targetType === next.target?.type && data.targetId === next.target?.id && data.stageId === next.target?.stageId && record.fireAt === next.fireAt) return;

    if (scheduled) await Notifications.cancelScheduledNotificationAsync(STUDY_ID);
    record = { lastDay: record.lastDay };
    if (next?.fireAt > Date.now() && revision === scheduleRevision) {
      await Notifications.scheduleNotificationAsync({
        identifier: STUDY_ID,
        content: {
          ...copy[next.kind],
          data: {
            source: SOURCE, kind: next.kind, fireAt: next.fireAt,
            ...(next.target && { targetType: next.target.type, targetId: next.target.id }),
            ...(next.target?.stageId && { stageId: next.target.stageId }),
          },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: next.fireAt },
      });
      record.fireAt = next.fireAt;
    }
    const serialized = JSON.stringify(record);
    if (serialized !== stored) await AsyncStorage.setItem(STUDY_KEY, serialized);
  };
  scheduleTail = scheduleTail.catch(() => {}).then(schedule);
  return scheduleTail;
}

const EVENT_PREFIX = 'lingospark-event-reminder-';
let eventSchedule = Promise.resolve();
let eventRevision = 0;

export function syncEventReminders(options) {
  const revision = ++eventRevision;
  const schedule = async () => {
    const requests = (await Notifications.getAllScheduledNotificationsAsync())
      .filter(item => item.identifier.startsWith(EVENT_PREFIX));
    const plans = options.events.length && Object.keys(options.enabled).length &&
      isAllowed(await Notifications.getPermissionsAsync()) ? planEventReminders(options) : [];
    if (revision !== eventRevision) return;
    const pending = new Map(plans.map(plan => [EVENT_PREFIX + plan.day, plan]));
    for (const request of requests) {
      const saved = request.content.data;
      const next = pending.get(request.identifier);
      if (next && saved?.eventId === next.eventId && saved?.fireAt === next.fireAt && saved?.account === options.account) {
        pending.delete(request.identifier);
      } else {
        await Notifications.cancelScheduledNotificationAsync(request.identifier);
      }
    }
    for (const [identifier, plan] of pending) {
      if (revision !== eventRevision) return;
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: { title: plan.title, body: 'Тебя ждут задания события.',
          data: { source: SOURCE, kind: 'event', eventId: plan.eventId, account: options.account, fireAt: plan.fireAt } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: plan.fireAt },
      });
    }
  };
  eventSchedule = eventSchedule.catch(() => {}).then(schedule);
  return eventSchedule;
}

export function readNotificationResponse(response) {
  if (response?.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null;
  const request = response.notification?.request;
  const data = request?.content?.data;
  if (!request?.identifier || data?.source !== SOURCE) return null;
  if (data.kind === 'model' && AI_MODELS.some(model => model.id === data.modelId)) {
    return { kind: 'model', modelId: data.modelId, key: request.identifier };
  }
  if (data.kind === 'event' && request.identifier.startsWith(EVENT_PREFIX) && typeof data.eventId === 'string' &&
    typeof data.account === 'string' && Number.isFinite(data.fireAt)) {
    return { kind: 'event', eventId: data.eventId, account: data.account, key: request.identifier + '-' + data.fireAt };
  }
  if (request.identifier !== STUDY_ID || !Number.isFinite(data.fireAt)) return null;
  const key = `${request.identifier}-${data.fireAt}`;
  if (data.kind === 'review') return { kind: 'review', key };
  if (data.kind === 'resume' && typeof data.targetId === 'string' && ['quickSession', 'lesson', 'journey'].includes(data.targetType)) {
    return { kind: 'resume', key, target: { type: data.targetType, id: data.targetId, stageId: data.stageId } };
  }
  return null;
}
