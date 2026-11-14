import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
const { chooseAccountBootstrap } = require("../utils/cloudSyncRules");
import { useAuth } from "./AuthContext";
import { useProgress } from "./ProgressContext";

const CloudSyncContext = createContext(null);
const OWNER_KEY = "@lingospark/cloud-owner-v1";

export function CloudSyncProvider({ children }) {
  const { user } = useAuth();
  const { progress, ready, restoreProgress, localUpdatedAt } = useProgress();
  const [status, setStatus] = useState("offline");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [lastError, setLastError] = useState("");
  const [revision, setRevision] = useState(0);
  const initializedUser = useRef(null);
  const remoteRevision = useRef(0);
  const lastSyncedJson = useRef(null);
  const timer = useRef(null);

  const upload = useCallback(
    async (snapshot = progress) => {
      if (!user) return false;
      setStatus("syncing");
      setLastError("");
      const now = new Date().toISOString();
      const nextRevision = Math.max(1, remoteRevision.current + 1);
      const { data, error } = await supabase.from("user_progress").upsert(
        {
          user_id: user.id,
          progress: snapshot,
          revision: nextRevision,
          device_updated_at: now,
          updated_at: now,
        },
        { onConflict: "user_id" },
      ).select("revision, updated_at").single();
      if (error) {
        setLastError(error.message || "Не удалось сохранить прогресс");
        setStatus("error");
        return false;
      }
      await AsyncStorage.setItem(OWNER_KEY, user.id);
      initializedUser.current = user.id;
      lastSyncedJson.current = JSON.stringify(snapshot);
      remoteRevision.current = Number(data?.revision) || nextRevision;
      setRevision(remoteRevision.current);
      setLastSyncedAt(data?.updated_at || now);
      setStatus("synced");
      return true;
    },
    [progress, user],
  );

  useEffect(() => {
    if (!ready || !user) {
      initializedUser.current = null;
      lastSyncedJson.current = null;
      setRevision(0);
      remoteRevision.current = 0;
      setLastError("");
      setStatus("offline");
      return;
    }
    let active = true;
    const initialize = async () => {
      setStatus("syncing");
      setLastError("");
      const [{ data, error }, localOwner] = await Promise.all([
        supabase
          .from("user_progress")
          .select("progress, revision, device_updated_at, updated_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        AsyncStorage.getItem(OWNER_KEY),
      ]);
      if (!active) return;
      if (error) {
        initializedUser.current = user.id;
        setLastError(error.message || "Не удалось загрузить облачный прогресс");
        setStatus("error");
        return;
      }
      initializedUser.current = user.id;
      remoteRevision.current = Number(data?.revision) || 0;
      setRevision(remoteRevision.current);
      if (data?.progress && Object.keys(data.progress).length) {
        const cloudJson = JSON.stringify(data.progress);
        lastSyncedJson.current = cloudJson;
        setLastSyncedAt(data.updated_at || null);
        if (cloudJson === JSON.stringify(progress)) {
          setStatus("synced");
        } else if (
          chooseAccountBootstrap({
            local: progress,
            cloud: data.progress,
            localUpdatedAt,
            cloudUpdatedAt: data.device_updated_at || data.updated_at,
            localOwner,
            userId: user.id,
          }) === "local"
        ) {
          await upload(progress);
        } else {
          restoreProgress(data.progress);
          await AsyncStorage.setItem(OWNER_KEY, user.id);
          setStatus("synced");
        }
      } else {
        if (chooseAccountBootstrap({ localOwner, userId: user.id, cloud: null }) === "clean") {
          const cleanAccount = {
            onboarded: true,
            name: user.user_metadata?.display_name || "Друг",
          };
          restoreProgress(cleanAccount);
          await upload(cleanAccount);
        } else {
          await upload(progress);
        }
      }
    };
    initialize();
    return () => {
      active = false;
    };
  }, [ready, user?.id]);

  useEffect(() => {
    if (!ready || !user || initializedUser.current !== user.id) return;
    if (timer.current) clearTimeout(timer.current);
    setStatus("pending");
    timer.current = setTimeout(() => {
      const snapshot = JSON.stringify(progress);
      if (snapshot === lastSyncedJson.current) {
        setStatus("synced");
        return;
      }
      upload(progress);
    }, 1800);
    return () => timer.current && clearTimeout(timer.current);
  }, [progress, ready, user?.id, upload]);

  const syncNow = useCallback(() => upload(progress), [upload, progress]);
  const restoreFromCloud = useCallback(async () => {
    if (!user) return false;
    setStatus("syncing");
    setLastError("");
    const { data, error } = await supabase
      .from("user_progress")
      .select("progress, revision, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !data?.progress) {
      setLastError(error?.message || "Облачная копия пока не найдена");
      setStatus("error");
      return false;
    }
    restoreProgress(data.progress);
    lastSyncedJson.current = JSON.stringify(data.progress);
    initializedUser.current = user.id;
    await AsyncStorage.setItem(OWNER_KEY, user.id);
    remoteRevision.current = Number(data.revision) || 0;
    setRevision(remoteRevision.current);
    setLastSyncedAt(data.updated_at || null);
    setStatus("synced");
    return true;
  }, [restoreProgress, user]);
  const isRestoring = Boolean(user && initializedUser.current !== user.id);
  const value = useMemo(
    () => ({ status, lastSyncedAt, lastError, revision, isRestoring, syncNow, restoreFromCloud }),
    [status, lastSyncedAt, lastError, revision, isRestoring, syncNow, restoreFromCloud],
  );
  return (
    <CloudSyncContext.Provider value={value}>
      {children}
    </CloudSyncContext.Provider>
  );
}

export const useCloudSync = () => useContext(CloudSyncContext);
