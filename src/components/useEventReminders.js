import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProgressStore } from '../store/ProgressContext';
import { requestLearningNotifications, syncEventReminders } from '../services/learningNotifications';
import { notificationPreferences } from '../utils/notificationPlans';

const empty = {};
export default function useEventReminders({ ready, active, account, events }) {
  const store = useProgressStore();
  const [state, setState] = useState(null);
  const currentAccount = useRef(account);
  currentAccount.current = account;
  const cacheKey = '@lingospark/event-reminders-v1/' + account;
  useEffect(() => {
    let mounted = true;
    if (account) AsyncStorage.getItem(cacheKey).then(raw => {
      if (mounted) setState({ account, enabled: JSON.parse(raw) || {} });
    }).catch(() => { if (mounted) setState({ account, enabled: {} }); });
    return () => { mounted = false; };
  }, [account, cacheKey]);
  const enabled = account && state?.account === account ? state.enabled : null;
  const toggle = useCallback(async id => {
    if (!account || !enabled) return false;
    const next = { ...enabled };
    if (next[id]) delete next[id];
    else {
      if (!await requestLearningNotifications()) return false;
      next[id] = true;
    }
    await AsyncStorage.setItem(cacheKey, JSON.stringify(next));
    if (currentAccount.current === account) setState({ account, enabled: next });
    return true;
  }, [account, cacheKey, enabled]);

  useEffect(() => {
    if (!ready) return;
    if (!active) {
      syncEventReminders({ events: [], enabled: empty }).catch(() => {});
      return;
    }
    if (!enabled || !events) return;
    let previous, hour;
    const refresh = (force = false) => {
      const progress = store.getSnapshot().progress;
      const nextHour = notificationPreferences(progress.settings).hour;
      if (!force && previous === progress.studyEventResults && hour === nextHour) return;
      previous = progress.studyEventResults;
      hour = nextHour;
      syncEventReminders({ account, events, enabled, results: previous, hour }).catch(() => {});
    };
    refresh(true);
    const unsubscribe = store.subscribe(() => refresh());
    const subscription = AppState.addEventListener('change', status => { if (status === 'active') refresh(true); });
    return () => { unsubscribe(); subscription.remove(); };
  }, [account, active, enabled, events, ready, store]);
  return { enabled: enabled || empty, toggle, loaded: !!enabled };
}
