import { supabase } from './supabase'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

/**
 * Charge le profil d'un utilisateur.
 *
 * Si `accessToken` est fourni, on fait un fetch HTTP direct avec ce token
 * pour contourner le verrou interne de GoTrue (navigator.locks).
 * Sans ça, le build de production deadlock : le client Supabase appelle
 * getSession() qui essaie d'acquérir le même verrou que tient onAuthStateChange.
 */
export async function getCurrentProfile(user, accessToken = null) {
  if (!user?.id) return { profile: null, error: null }

  try {
    if (accessToken) {
      // Fetch direct — bypasse totalement le verrou GoTrue
      const url = `${SUPABASE_URL}/rest/v1/profils?id=eq.${user.id}&select=*`
      const res = await fetch(url, {
        headers: {
          'apikey':        SUPABASE_ANON,
          'Authorization': `Bearer ${accessToken}`,
          'Accept':        'application/json',
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return { profile: data[0] ?? null, error: null }
    }

    // Fallback : client Supabase classique (utilisé hors contexte onAuthStateChange)
    const { data, error } = await supabase.from('profils').select('*').eq('id', user.id)
    if (error) throw error
    return { profile: data[0] ?? null, error: null }
  } catch (err) {
    console.error('[Auth] getCurrentProfile error:', err.message)
    return { profile: null, error: err }
  }
}

export async function signInWithEmail(email, password) {
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function signInWithMagicLink(email) {
  return await supabase.auth.signInWithOtp({ email })
}

export async function verifyMagicLink(token) {
  return await supabase.auth.verifyOtp({ token_hash: token, type: 'email' })
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function updateProfile(updates) {
  const { data: session } = await supabase.auth.getSession()
  if (!session.session?.user) return { error: new Error('Not authenticated') }

  return await supabase
    .from('profils')
    .update(updates)
    .eq('id', session.session.user.id)
}
