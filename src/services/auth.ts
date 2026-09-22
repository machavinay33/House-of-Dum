import { supabase } from '@/lib/supabase';

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** True only if the signed-in user is listed in public.admins. */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw error;
  return data === true;
}
