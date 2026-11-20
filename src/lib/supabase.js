import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bqmeqmilenpaugacspeq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_k2lPlTcvI-mUs_qaRkE8bA_Hw_2l8wE";
export const authStorageKey = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: AsyncStorage,
      storageKey: authStorageKey,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  },
);
