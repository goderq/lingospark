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
const { chooseInitialProgressSource } = require("../utils/cloudSyncRules");
import { useAuth } from "./AuthContext";
import { useProgress } from "./ProgressContext";

const CloudSyncContext = createContext(null);

export function CloudSyncProvider({ children }) {
  const { user } = useAuth();
  const { progress, ready, restoreProgress, localUpdatedAt } = useProgress();
  const [status, setStatus] = useState("offline");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const initializedUser = useRef(null);
  const lastSyncedJson = useRef(null);
  const timer = useRef(null);

  const upload = useCallback(
    async (snapshot = progress) => {
      if (!user) return false;
      setStatus("syncing");
      const now = new Date().toISOString();
      const { error } = await supabase.from("user_progress").upsert(
        {
          user_id: user.id,
          progress: snapshot,
          device_updated_at: now,
          updated_at: now,
        },
        { onConflict: "user_id" },
      );
      if (error) {
        setStatus("error");
        return false;
      }
      initializedUser.current = user.id;
      lastSyncedJson.current = JSON.stringify(snapshot);
      setLastSyncedAt(now);
      setStatus("synced");
      return true;
    },
    [progress, user],
  );

  useEffect(() => {
    if (!ready || !user) {
      initializedUser.current = null;
      lastSyncedJson.current = null;
      setStatus("offline");
      return;
    }
    let active = true;
    const initialize = async () => {
      setStatus("syncing");
      const { data, error } = await supabase
        .from("user_progress")
        .select("progress, device_updated_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setStatus("error");
        return;
      }
      initializedUser.current = user.id;
      if (data?.progress && Object.keys(data.progress).length) {
        const cloudJson = JSON.stringify(data.progress);
        lastSyncedJson.current = cloudJson;
        setLastSyncedAt(data.updated_at || null);
        if (cloudJson === JSON.stringify(progress)) {
          setStatus("synced");
        } else if (
          chooseInitialProgressSource({
            local: progress,
            cloud: data.progress,
            localUpdatedAt,
            cloudUpdatedAt: data.device_updated_at || data.updated_at,
          }) === "local"
        ) {
          await upload(progress);
        } else {
          restoreProgress(data.progress);
          setStatus("synced");
        }
      } else {
        await upload(progress);
      }
    };
    initialize();
    return () => {
      active = false;
    };
  }, [ready, user?.id]);

  useEffect(() => {
    if (!ready || !user || initializedUser.current !== user.id) return;
    const snapshot = JSON.stringify(progress);
    if (snapshot === lastSyncedJson.current) return;
    if (timer.current) clearTimeout(timer.current);
    setStatus("pending");
    timer.current = setTimeout(() => upload(progress), 1800);
    return () => timer.current && clearTimeout(timer.current);
  }, [progress, ready, user?.id, upload]);

  const syncNow = useCallback(() => upload(progress), [upload, progress]);
  const value = useMemo(
    () => ({ status, lastSyncedAt, syncNow }),
    [status, lastSyncedAt, syncNow],
  );
  return (
    <CloudSyncContext.Provider value={value}>
      {children}
    </CloudSyncContext.Provider>
  );
}

export const useCloudSync = () => useContext(CloudSyncContext);
