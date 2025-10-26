import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const fallbackUrl = 'http://localhost:54321';
const fallbackAnonKey = 'test-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
  const message = 'Supabase environment variables are missing. Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
  if (import.meta.env.PROD && import.meta.env.MODE !== 'test') {
    throw new Error(message);
  }
  console.warn(`${message} Using fallback credentials for local usage.`);
}

export const supabase = createClient(supabaseUrl ?? fallbackUrl, supabaseAnonKey ?? fallbackAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
