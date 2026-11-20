import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../store/AuthContext';
import { loadStudyAssignments } from '../services/studyGroups';

export default function useStudyAssignments() {
  const { user, offlineSession } = useAuth();
  const account = user?.id;
  const [state, setState] = useState(null);
  useEffect(() => {
    if (!account) return;
    const key = '@lingospark/study-assignments-v1/' + account;
    let mounted = true;
    let controller;
    let confirmed = false;
    const show = assignments => {
      if (mounted && Array.isArray(assignments)) setState({ account, assignments });
    };
    AsyncStorage.getItem(key).then(raw => {
      if (!confirmed && raw) show(JSON.parse(raw));
    }).catch(() => {});
    const refresh = async () => {
      if (offlineSession) return;
      controller?.abort();
      const request = new AbortController();
      controller = request;
      const timer = setTimeout(() => request.abort(), 7000);
      try {
        const { data, error, status } = await loadStudyAssignments(request.signal);
        if (!mounted || request.signal.aborted) return;
        if (!error && Array.isArray(data)) {
          confirmed = true;
          show(data);
          await AsyncStorage.setItem(key, JSON.stringify(data));
        } else if (status === 401 || status === 403) {
          confirmed = true;
          show([]);
          await AsyncStorage.removeItem(key);
        }
      } catch {
        // A failed connection leaves the last confirmed assignments available.
      } finally {
        clearTimeout(timer);
      }
    };
    refresh();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => {
      mounted = false;
      controller?.abort();
      subscription.remove();
    };
  }, [account, offlineSession]);
  return account && state?.account === account ? state.assignments : [];
}
