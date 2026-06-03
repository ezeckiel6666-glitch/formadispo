import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Bypass navigator.locks de GoTrue.
    // En production (Netlify), GoTrue tient ce verrou pendant et après
    // SIGNED_IN, ce qui bloque tous les supabase.from() (qui appellent
    // getSession() → même verrou) → deadlock, données vides.
    // Safe pour une SPA mono-onglet sans service worker partagé.
    lock: (_name, _timeout, fn) => fn(),
  },
})
