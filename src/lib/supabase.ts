import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser client. Uses ONLY the public anon key; security is enforced by
 * Row Level Security and the SECURITY DEFINER functions in /supabase/migrations.
 * The service-role key must never be used in this project's frontend.
 */
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'supabase-not-configured', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const MEDIA_BUCKET = 'restaurant-media';

export const SITE_URL: string = (
  import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
).replace(/\/$/, '');
