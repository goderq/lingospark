import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { authStorageKey, supabase } from "../lib/supabase";

const GUEST_KEY = "@lingospark/guest-mode-v1";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [offlineUser, setOfflineUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const authRevision = useRef(0);

  const retrySession = useCallback(async () => {
    const revision = ++authRevision.current;
    const result = await supabase.auth.getSession().catch(() => null);
    if (!result || revision !== authRevision.current) return;
    const { data, error } = result;
    const stored = !data.session && isAuthRetryableFetchError(error)
      ? await AsyncStorage.getItem(authStorageKey).then(JSON.parse).catch(() => null)
      : null;
    if (revision !== authRevision.current) return;
    // An expired token is never used for API requests. The stored user only
    // identifies the account whose previously verified local access can be read.
    const cachedUser = stored?.access_token && stored.refresh_token && stored.user?.id && !stored.user.is_anonymous
      ? stored.user : null;
    setOfflineUser(cachedUser);
    setSession(data.session || null);
  }, []);

  useEffect(() => {
    let mounted = true;
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "INITIAL_SESSION") return;
      authRevision.current++;
      setSession(nextSession);
      setOfflineUser(null);
      if (nextSession) {
        setGuestMode(false);
        AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
      }
    });
    Promise.all([retrySession(), AsyncStorage.getItem(GUEST_KEY)])
      .then(([, guest]) => { if (mounted) setGuestMode(guest === "true"); })
      .catch(() => {})
      .finally(() => { if (mounted) setReady(true); });
    return () => {
      mounted = false;
      authRevision.current++;
      data.subscription.unsubscribe();
    };
  }, [retrySession]);

  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    const handleState = (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    };
    handleState(AppState.currentState);
    const subscription = AppState.addEventListener("change", handleState);
    return () => subscription.remove();
  }, []);

  const enterGuestMode = useCallback(async () => {
    setGuestMode(true);
    await AsyncStorage.setItem(GUEST_KEY, "true");
  }, []);
  const requestAuth = useCallback(() => {
    setGuestMode(false);
    AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
  }, []);
  const signIn = useCallback(async (email, password) => {
    const result = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return result;
  }, []);
  const signUp = useCallback(async (name, email, password) => {
    const result = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    });
    return result;
  }, []);
  const updateDisplayName = useCallback(async (name) => {
    const displayName = name.trim();
    if (!displayName || displayName.length > 50) return { error: { message: "Введи имя длиной до 50 символов." } };
    const result = await supabase.auth.updateUser({ data: { display_name: displayName } });
    if (result.data.user) {
      setSession(current => current?.user?.id === result.data.user.id ? { ...current, user: result.data.user } : current);
    }
    return result;
  }, []);
  const signOut = useCallback(async () => {
    let result = await supabase.auth.signOut({ scope: offlineUser ? 'local' : 'global' });
    if (!offlineUser && isAuthRetryableFetchError(result.error)) result = await supabase.auth.signOut({ scope: 'local' });
    setGuestMode(true);
    await AsyncStorage.setItem(GUEST_KEY, "true");
    return result;
  }, [offlineUser]);

  const value = useMemo(
    () => ({
      ready,
      session,
      user: session?.user || offlineUser,
      offlineSession: !session && !!offlineUser,
      retrySession,
      guestMode,
      enterGuestMode,
      requestAuth,
      signIn,
      signUp,
      updateDisplayName,
      signOut,
    }),
    [ready, session, offlineUser, retrySession, guestMode, enterGuestMode, requestAuth, signIn, signUp, updateDisplayName, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
