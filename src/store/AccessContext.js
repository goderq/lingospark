import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { isAccessStaff, licenseTiming, offlineLicense } from '../utils/licenseTiming';

const AccessContext = createContext(null);

export function AccessProvider({ children }) {
  const { user, offlineSession, retrySession } = useAuth();
  const account = user?.id;
  const [state, setState] = useState(null);
  const latest = useRef(0);
  const entitlement = useRef(null);
  const cacheKey = '@lingospark/access-v1/' + account;

  const refresh = useCallback(async () => {
    if (!account) return;
    const version = ++latest.current;
    const fromCache = async () => {
      const cached = entitlement.current?.account === account
        ? entitlement.current.snapshot
        : await AsyncStorage.getItem(cacheKey).then(JSON.parse).catch(() => null);
      return offlineLicense(cached);
    };
    let next;
    if (offlineSession) {
      next = await fromCache();
    } else {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      try {
        const { data, error, status } = await supabase.rpc('lingo_access_status').abortSignal(controller.signal);
        if (version !== latest.current) return;
        if (error && !status) {
          next = await fromCache();
        } else if (error || !data) {
          next = { error: 'Не удалось проверить лицензию. Обнови статус или войди снова.' };
          if (status === 401 || status === 403) {
            entitlement.current = { account, snapshot: null };
            await AsyncStorage.removeItem(cacheKey).catch(() => {});
          }
        } else {
          next = { ...data, verifiedAt: Date.now() };
          const staffAccess = isAccessStaff(data.role);
          const snapshot = data.licensed || staffAccess
            ? { licensed: !!data.licensed, staffAccess, expires_at: data.expires_at, verifiedAt: next.verifiedAt }
            : null;
          entitlement.current = { account, snapshot };
          if (snapshot) await AsyncStorage.setItem(cacheKey, JSON.stringify(snapshot)).catch(() => {});
          else await AsyncStorage.removeItem(cacheKey).catch(() => {});
        }
      } catch {
        next = await fromCache();
      } finally {
        clearTimeout(timeout);
      }
    }
    if (version === latest.current) setState({ ...next, account });
  }, [account, cacheKey, offlineSession]);

  useEffect(() => {
    if (!account) { setState(null); return; }
    refresh();
    const subscription = AppState.addEventListener('change', value => { if (value === 'active') refresh(); });
    const interval = setInterval(() => { if (AppState.currentState === 'active') refresh(); }, 60000);
    return () => { latest.current++; clearInterval(interval); subscription.remove(); };
  }, [account, refresh]);

  const redeem = async (code) => {
    const { data, error } = await supabase.rpc('lingo_redeem', { p_code: code.trim() });
    if (error) throw error;
    await refresh();
    return data;
  };
  const current = account && state?.account === account ? state : null;
  const { licensed, staffOffline, expired, offlineUntil } = licenseTiming(current || undefined);
  const isAdmin = !offlineSession && isAccessStaff(current?.role);
  return <AccessContext.Provider value={{
    ...current, licensed, staffOffline, expired, offlineUntil, loading: !!account && !current,
    allowed: licensed || isAdmin || staffOffline, isAdmin, refresh: offlineSession ? retrySession : refresh, redeem,
  }}>{children}</AccessContext.Provider>;
}

export const useAccess = () => useContext(AccessContext);

export async function manageAccess(action, options = {}) {
  const { data, error } = await supabase.rpc('lingo_admin', { p_action: action, p_options: options });
  if (error) throw error;
  return data;
}

export async function loadAccessEvents(before, email) {
  const options = before ? { p_before_at: before.occurred_at, p_before_id: before.id } : {};
  const { data, error } = email
    ? await supabase.rpc('lingo_access_account_events', { ...options, p_email: email })
    : await supabase.rpc('lingo_access_events', options);
  if (error) throw error;
  return data;
}
