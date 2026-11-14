import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** true bila kredensial Supabase publik sudah diisi di frontend/.env */
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('xxxxxxxx'));

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'royal-adventure-auth' },
    })
  : null;
