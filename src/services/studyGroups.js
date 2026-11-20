import { supabase } from '../lib/supabase';

export async function manageStudyGroups(action, options = {}) {
  const { data, error } = await supabase.rpc('lingo_study_group_admin', { p_action: action, p_options: options });
  if (error) throw error;
  return data;
}

export function loadStudyAssignments(signal) {
  return supabase.rpc('lingo_study_assignments').abortSignal(signal);
}
