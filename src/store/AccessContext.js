import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { licenseTiming, offlineLicense } from '../utils/licenseTiming';

const AccessContext = createContext(null);

export function AccessProvider({ children }) {
  const { user } = useAuth();
  const account = user?.id;
  const [state, setState] = useState(null);
  const latest = useRef(0);
  const cacheKey = '@lingospark/access-v1/' + account;

  const refresh = useCallback(async () => {
    if (!account) return;
    const version = ++latest.current;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    let next;
    try {
      const { data, error, status } = await supabase.rpc('lingo_access_status').abortSignal(controller.signal);
      if (error && status) {
        next = { error: 'Не удалось проверить лицензию. Обнови статус или войди снова.' };
        if (status === 401 || status === 403) await AsyncStorage.removeItem(cacheKey).catch(() => {});
      } else if (error) {
        throw error;
      } else {
        next = { ...data, verifiedAt: Date.now() };
        if (version !== latest.current) return;
        if (data.licensed) {
          await AsyncStorage.setItem(cacheKey, JSON.stringify({ expires_at: data.expires_at, verifiedAt: next.verifiedAt })).catch(() => {});
        } else {
          await AsyncStorage.removeItem(cacheKey).catch(() => {});
        }
      }
    } catch {
      const cached = await AsyncStorage.getItem(cacheKey).then(JSON.parse).catch(() => null);
      next = offlineLicense(cached);
    } finally {
      clearTimeout(timeout);
    }
    if (version === latest.current) setState({ ...next, account });
  }, [account, cacheKey]);

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
  const { licensed, expired, offlineUntil } = licenseTiming(current || undefined);
  const isAdmin = current?.role === 'owner' || current?.role === 'admin';
  return <AccessContext.Provider value={{ ...current, licensed, expired, offlineUntil, loading: !!account && !current, allowed: licensed || isAdmin, isAdmin, refresh, redeem }}>{children}</AccessContext.Provider>;
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
