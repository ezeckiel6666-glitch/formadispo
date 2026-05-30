import { supabase } from './supabase'

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

export async function getCurrentProfile() {
  try {
    console.log('[Auth] getCurrentProfile start')
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    console.log('[Auth] getSession done:', session?.session?.user?.id)
    if (sessionError || !session?.session?.user) {
      console.log('[Auth] No session, returning null')
      return { profile: null, error: sessionError }
    }

    console.log('[Auth] Fetching profile for user:', session.session.user.id)
    const { data, error } = await supabase
      .from('profils')
      .select('*')
      .eq('user_id', session.session.user.id)

    console.log('[Auth] Profile query done:', data?.length, error)
    if (error) {
      console.error('[Auth] Profile fetch error:', error)
      return { profile: null, error }
    }

    console.log('[Auth] Returning profile:', data?.[0]?.id || 'null')
    return { profile: data?.[0] || null, error: null }
  } catch (err) {
    console.error('[Auth] getCurrentProfile exception:', err)
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
    .eq('user_id', session.session.user.id)
}
