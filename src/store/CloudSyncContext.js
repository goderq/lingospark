import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useProgress } from './ProgressContext';
import { cloudDecision } from '../utils/cloudDecision';
import { snapshotKey, backupEnvelope } from '../utils/snapshot';
import { readCloud, writeCloud } from '../services/cloudTransport';

const CloudSyncContext = createContext(null);
const CloudBootContext = createContext(false);
const OWNER_KEY = '@lingospark/cloud-owner-v1';
const baseKey = id => '@lingospark/cloud-base-v2:' + id;
export const recoveryKey = id => '@lingospark/cloud-recovery-v1:' + id;

export function CloudSyncProvider({ children }) {
  const { user, offlineSession } = useAuth();
  const { progress, ready, restoreProgress, localUpdatedAt, loadError } = useProgress();
  const [status, setStatus] = useState('offline');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [lastError, setLastError] = useState('');
  const [revision, setRevision] = useState(0);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [conflictVisible, setConflictVisible] = useState(false);
  const current = useRef({});
  current.current = { progress, ready, user, localUpdatedAt, loadError };
  const epoch = useRef(0), initialized = useRef(null), remoteRevision = useRef(0);
  const acknowledged = useRef(null), conflictRef = useRef(null);
  const timer = useRef(null), inFlight = useRef(null), uploadRef = useRef(null), initializeRef = useRef(null);
  const isCurrent = (id, generation) => current.current.user?.id === id && epoch.current === generation;
  const raiseConflict = useCallback(remote => {
    conflictRef.current = remote;
    setConflict(remote); setConflictVisible(true); setStatus('conflict');
  }, []);
  const acknowledge = useCallback(async (remote, id, generation) => {
    if (!isCurrent(id, generation)) return;
    const key = snapshotKey(remote.progress);
    acknowledged.current = key;
    remoteRevision.current = Number(remote.revision);
    setRevision(Number(remote.revision));
    setLastSyncedAt(remote.updated_at || null);
    setLastError('');
    await AsyncStorage.multiSet([[OWNER_KEY, id], [baseKey(id), JSON.stringify({ revision: remote.revision, key })]]);
    if (isCurrent(id, generation)) setStatus('synced');
  }, []);
  const upload = useCallback(async () => {
    const { user: account, progress: snapshot, localUpdatedAt: modifiedAt } = current.current;
    if (!account || conflictRef.current) return false;
    if (initialized.current !== account.id) return initializeRef.current?.();
    if (inFlight.current) return inFlight.current;
    const id = account.id, generation = epoch.current, key = snapshotKey(snapshot);
    if (key === acknowledged.current) { setStatus('synced'); return true; }
    const task = (async () => {
      setStatus('syncing'); setLastError('');
      try {
        const result = await writeCloud(supabase, id, snapshot, remoteRevision.current, modifiedAt);
        if (!isCurrent(id, generation)) return false;
        if (result.conflict) {
          const remote = await readCloud(supabase, id);
          if (isCurrent(id, generation) && remote) raiseConflict(remote);
          else if (isCurrent(id, generation)) throw new Error('Облачная копия изменилась. Повтори синхронизацию.');
          return false;
        }
        await acknowledge(result.data, id, generation);
        return true;
      } catch (error) {
        if (isCurrent(id, generation)) { setLastError(error.message); setStatus('error'); }
        return false;
      }
    })();
    inFlight.current = task;
    try { return await task; }
    finally {
      if (inFlight.current === task) inFlight.current = null;
      if (isCurrent(id, generation) && !conflictRef.current && acknowledged.current === key && snapshotKey(current.current.progress) !== key) {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => uploadRef.current?.(), 1800);
      }
    }
  }, [acknowledge, raiseConflict]);
  uploadRef.current = upload;

  useEffect(() => {
    const generation = ++epoch.current;
    clearTimeout(timer.current); initialized.current = null; inFlight.current = null;
    acknowledged.current = null; remoteRevision.current = 0; conflictRef.current = null;
    setConflict(null); setConflictVisible(false); setRevision(0); setLastError(''); setLastSyncedAt(null);
    if (!ready || !user || offlineSession) { setBootstrapping(false); setStatus('offline'); return; }
    const id = user.id;
    const initialize = async () => {
      if (!isCurrent(id, generation)) return false;
      setBootstrapping(true); setStatus('syncing');
      try {
        const [remote, owner, baseRaw] = await Promise.all([readCloud(supabase, id), AsyncStorage.getItem(OWNER_KEY), AsyncStorage.getItem(baseKey(id))]);
        if (!isCurrent(id, generation)) return false;
        if (current.current.loadError && !remote) throw new Error('Локальная копия не прочитана, облачная не найдена. Пустой прогресс не будет загружен.');
        let base = null;
        try { base = baseRaw ? JSON.parse(baseRaw) : null; } catch {}
        const decision = cloudDecision({ local: current.current.progress, remote, base, owner, userId: id });
        initialized.current = id;
        remoteRevision.current = Number(remote?.revision) || 0;
        setRevision(remoteRevision.current);
        if (decision === 'conflict') { raiseConflict(remote); return false; }
        if (decision === 'cloud' || decision === 'same') {
          if (decision === 'cloud') restoreProgress(remote.progress, remote.device_updated_at || remote.updated_at);
          await acknowledge(remote, id, generation);
          return true;
        }
        if (decision === 'clean') {
          const clean = { onboarded: true, name: user.user_metadata?.display_name || 'Друг', completed: [] };
          restoreProgress(clean);
          // Allow the provider to publish the clean account before automatic upload.
          await AsyncStorage.setItem(OWNER_KEY, id);
          setStatus('pending');
          return true;
        }
        return await uploadRef.current();
      } catch (error) {
        if (isCurrent(id, generation)) { initialized.current = null; setLastError(error.message); setStatus('error'); }
        return false;
      } finally { if (isCurrent(id, generation)) setBootstrapping(false); }
    };
    initializeRef.current = initialize;
    initialize();
    return () => { clearTimeout(timer.current); if (epoch.current === generation) epoch.current++; };
  }, [ready, user?.id, offlineSession, acknowledge, raiseConflict, restoreProgress]);

  useEffect(() => {
    if (!ready || !user || bootstrapping || initialized.current !== user.id || conflictRef.current) return;
    clearTimeout(timer.current);
    setStatus('pending');
    timer.current = setTimeout(() => uploadRef.current?.(), 1800);
    return () => clearTimeout(timer.current);
  }, [progress, ready, user?.id, bootstrapping]);
  const previousLoadError = useRef(loadError);
  useEffect(() => {
    if (previousLoadError.current && !loadError && user && initialized.current !== user.id) initializeRef.current?.();
    previousLoadError.current = loadError;
  }, [loadError, user?.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && initialized.current === current.current.user?.id && !conflictRef.current) uploadRef.current?.();
    });
    return () => subscription.remove();
  }, []);

  const resolveConflict = useCallback(async choice => {
    const remote = conflictRef.current, { user: account, progress: local } = current.current;
    if (!remote || !account || !['local', 'cloud'].includes(choice)) return false;
    const id = account.id, generation = epoch.current;
    setLastError(''); setStatus('syncing');
    try {
      await AsyncStorage.setItem(recoveryKey(id), JSON.stringify({ createdAt: new Date().toISOString(), local: backupEnvelope(local), cloud: backupEnvelope(remote.progress) }));
      if (!isCurrent(id, generation)) return false;
      if (choice === 'cloud') {
        // Re-read before replacing local state: the reviewed remote must still be current.
        const latest = await readCloud(supabase, id);
        if (!isCurrent(id, generation)) return false;
        if (!latest || Number(latest.revision) !== Number(remote.revision)) { if (latest) raiseConflict(latest); else throw new Error('Копия была удалена. Повтори синхронизацию.'); return false; }
        restoreProgress(latest.progress, latest.device_updated_at || latest.updated_at);
        await acknowledge(latest, id, generation);
      } else {
        const result = await writeCloud(supabase, id, local, Number(remote.revision), current.current.localUpdatedAt);
        if (!isCurrent(id, generation)) return false;
        if (result.conflict) { const latest = await readCloud(supabase, id); if (isCurrent(id, generation) && latest) raiseConflict(latest); return false; }
        await acknowledge(result.data, id, generation);
      }
      if (isCurrent(id, generation)) { conflictRef.current = null; setConflict(null); setConflictVisible(false); initialized.current = id; }
      return true;
    } catch (error) { if (isCurrent(id, generation)) { setLastError(error.message); setStatus('conflict'); } return false; }
  }, [acknowledge, raiseConflict, restoreProgress]);
  const restoreFromCloud = useCallback(async () => {
    const account = current.current.user; if (!account) return false;
    const generation = epoch.current;
    try {
      const remote = await readCloud(supabase, account.id);
      if (!isCurrent(account.id, generation)) return false;
      if (!remote) throw new Error('Облачная копия пока не найдена');
      if (snapshotKey(remote.progress) === snapshotKey(current.current.progress)) { await acknowledge(remote, account.id, generation); return true; }
      raiseConflict(remote); return false;
    } catch (error) { if (isCurrent(account.id, generation)) { setLastError(error.message); setStatus('error'); } return false; }
  }, [acknowledge, raiseConflict]);
  const showConflict = useCallback(() => setConflictVisible(true), []);
  const deferConflict = useCallback(() => setConflictVisible(false), []);
  const restoring = Boolean(user && ready && (bootstrapping || initialized.current !== user.id) && status !== 'error');
  const value = useMemo(() => ({ status, lastSyncedAt, lastError, revision, isRestoring: restoring, syncNow: upload, restoreFromCloud, conflict, conflictVisible, resolveConflict, showConflict, deferConflict }),
    [status, lastSyncedAt, lastError, revision, restoring, upload, restoreFromCloud, conflict, conflictVisible, resolveConflict, showConflict, deferConflict]);
  return <CloudBootContext.Provider value={restoring}><CloudSyncContext.Provider value={value}>{children}</CloudSyncContext.Provider></CloudBootContext.Provider>;
}
export const useCloudSync = () => useContext(CloudSyncContext);
export const useCloudBootstrap = () => useContext(CloudBootContext);
