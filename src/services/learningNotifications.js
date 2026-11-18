import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AI_MODELS } from '../data/aiModels';
import { localDay, planStudyReminder } from '../utils/notificationPlans';

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
      const hasWordHistory = Object.keys(progress.reviewStats || {}).length || progress.mistakes?.length || Object.keys(progress.reviewQueue || {}).length;
      const words = preferences.review && hasWordHistory ? (await import('../data/wordBank')).extendedWordBank : [];
      next = planStudyReminder({ progress, preferences, words: [...words, ...(progress.customWords || [])], lessons, now, lastDay: record.lastDay });
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

export function readNotificationResponse(response) {
  if (response?.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null;
  const request = response.notification?.request;
  const data = request?.content?.data;
  if (!request?.identifier || data?.source !== SOURCE) return null;
  if (data.kind === 'model' && AI_MODELS.some(model => model.id === data.modelId)) {
    return { kind: 'model', modelId: data.modelId, key: request.identifier };
  }
  if (request.identifier !== STUDY_ID || !Number.isFinite(data.fireAt)) return null;
  const key = `${request.identifier}-${data.fireAt}`;
  if (data.kind === 'review') return { kind: 'review', key };
  if (data.kind === 'resume' && typeof data.targetId === 'string' && ['quickSession', 'lesson', 'journey'].includes(data.targetType)) {
    return { kind: 'resume', key, target: { type: data.targetType, id: data.targetId, stageId: data.stageId } };
  }
  return null;
}
