import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AccessContext = createContext(null);
const OFFLINE_MS = 7 * 86400000;

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
        next = data;
        if (version !== latest.current) return;
        if (data.licensed) {
          await AsyncStorage.setItem(cacheKey, JSON.stringify({ expires_at: data.expires_at, verifiedAt: Date.now() })).catch(() => {});
        } else {
          await AsyncStorage.removeItem(cacheKey).catch(() => {});
        }
      }
    } catch {
      const cached = await AsyncStorage.getItem(cacheKey).then(JSON.parse).catch(() => null);
      const age = Date.now() - (cached?.verifiedAt ?? 0);
      const valid = cached && age >= 0 && age < OFFLINE_MS && (!cached.expires_at || Date.parse(cached.expires_at) > Date.now());
      next = valid ? { licensed: true, expires_at: cached.expires_at, offline: true } : {
        error: 'Подключись к интернету, чтобы проверить доступ.',
      };
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
  const licensed = !!current?.licensed && (!current.expires_at || Date.parse(current.expires_at) > Date.now());
  const isAdmin = current?.role === 'owner' || current?.role === 'admin';
  return <AccessContext.Provider value={{ ...current, licensed, loading: !!account && !current, allowed: licensed || isAdmin, isAdmin, refresh, redeem }}>{children}</AccessContext.Provider>;
}

export const useAccess = () => useContext(AccessContext);

export async function manageAccess(action, options = {}) {
  const { data, error } = await supabase.rpc('lingo_admin', { p_action: action, p_options: options });
  if (error) throw error;
  return data;
}
