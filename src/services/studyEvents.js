import { supabase } from '../lib/supabase';

export function loadStudyEvents(signal) {
  return supabase.rpc('lingo_study_events_v2').abortSignal(signal);
}

export async function manageStudyEvents(action, options = {}) {
  const { data, error } = await supabase.rpc('lingo_study_event_admin', { p_action: action, p_options: options });
  if (error) throw error;
  return data;
}
