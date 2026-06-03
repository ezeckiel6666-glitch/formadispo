import { supabase } from './supabase'

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

export async function getCurrentProfile(user) {
  try {
    console.log('[Auth] getCurrentProfile called with user:', user?.id)

    if (!user?.id) {
      console.log('[Auth] No user.id, returning null')
      return { profile: null, error: null }
    }

    console.log('[Auth] Fetching profile for user ID:', user.id)
    const { data, error, status } = await supabase
      .from('profils')
      .select('*')
      .eq('id', user.id)

    console.log('[Auth] Query status:', status)
    console.log('[Auth] Query data:', data)
    console.log('[Auth] Query error:', error)

    if (error) {
      console.error('[Auth] Profile fetch error:', error.message, error.code)
      return { profile: null, error }
    }

    if (!data || data.length === 0) {
      console.warn('[Auth] No profile found for user:', user.id)
      return { profile: null, error: null }
    }

    console.log('[Auth] Profile found:', data[0])
    return { profile: data[0], error: null }
  } catch (err) {
    console.error('[Auth] getCurrentProfile exception:', err.message)
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
