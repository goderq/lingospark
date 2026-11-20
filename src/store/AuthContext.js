import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import { supabase } from "../lib/supabase";

const GUEST_KEY = "@lingospark/guest-mode-v1";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    Promise.all([supabase.auth.getSession(), AsyncStorage.getItem(GUEST_KEY)])
      .then(([{ data }, guest]) => {
        setSession(data.session || null);
        setGuestMode(guest === "true");
      })
      .finally(() => setReady(true));

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setGuestMode(false);
        AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

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
    const result = await supabase.auth.signOut();
    setGuestMode(true);
    await AsyncStorage.setItem(GUEST_KEY, "true");
    return result;
  }, []);

  const value = useMemo(
    () => ({
      ready,
      session,
      user: session?.user || null,
      guestMode,
      enterGuestMode,
      requestAuth,
      signIn,
      signUp,
      updateDisplayName,
      signOut,
    }),
    [ready, session, guestMode, enterGuestMode, requestAuth, signIn, signUp, updateDisplayName, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
