import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { lessons } from '../data/course';
import { useProgressStore } from '../store/ProgressContext';
import { readNotificationResponse, setModelNoticesEnabled, syncStudyNotification } from '../services/learningNotifications';
import { notificationPreferences, savedStudyTargets } from '../utils/notificationPlans';

const disabled = { review: false, resume: false, model: false, hour: 19 };
const scheduleFields = ['quickSession', 'lessonDraft', 'completed', 'journeys', 'lastStudyDate', 'activity',
  'retention', 'reviewQueue', 'reviewStats', 'mistakes', 'customWords', 'wordPreferences'];

export default function useLearningNotifications({ ready, active, onOpen }) {
  const store = useProgressStore();
  const seen = useRef(null);
  const open = useRef(onOpen);
  open.current = onOpen;

  useEffect(() => {
    if (!ready) return;
    let timer, previous, lastPreferences;
    const refresh = ({ force = false, immediate = false } = {}) => {
      const { progress } = store.getSnapshot();
      const preferences = active ? notificationPreferences(progress.settings) : disabled;
      setModelNoticesEnabled(preferences.model);
      const samePreferences = lastPreferences && preferences.review === lastPreferences.review &&
        preferences.resume === lastPreferences.resume && preferences.hour === lastPreferences.hour;
      if (!force && previous && (!active || (samePreferences && scheduleFields.every(field => previous[field] === progress[field])))) return;
      const justStudied = previous && (previous.activity !== progress.activity || previous.lastStudyDate !== progress.lastStudyDate);
      previous = progress;
      lastPreferences = preferences;
      clearTimeout(timer);
      const sync = () => {
        timer = undefined;
        syncStudyNotification({ progress, preferences, lessons }).catch(() => {});
      };
      if (immediate || !samePreferences || justStudied) sync();
      else timer = setTimeout(sync, 400);
    };
    refresh({ force: true });
    const unsubscribe = store.subscribe(() => refresh());
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh({ force: true });
      else if (state === 'background' && timer) refresh({ force: true, immediate: true });
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
      subscription.remove();
      setModelNoticesEnabled(false);
    };
  }, [ready, active, store]);

  useEffect(() => {
    if (!active) return;
    let mounted = true;
    const handleTap = response => {
      const notice = readNotificationResponse(response);
      if (!notice || seen.current === notice.key) return;
      seen.current = notice.key;
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
      const { progress } = store.getSnapshot();
      if (notice.kind !== 'event' && !notificationPreferences(progress.settings)[notice.kind]) return;
      if (notice.kind === 'resume' && !savedStudyTargets(progress, lessons).some(target =>
        target.type === notice.target.type && target.id === notice.target.id && target.stageId === notice.target.stageId)) return;
      open.current(notice);
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(handleTap);
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (mounted) handleTap(response);
    }).catch(() => {});
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [active, store]);
}
