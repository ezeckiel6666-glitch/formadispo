import { supabase } from './supabase'

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

export async function getCurrentProfile() {
  try {
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.session?.user) {
      return { profile: null, error: sessionError }
    }

    const { data, error } = await supabase
      .from('profils')
      .select('*')
      .eq('user_id', session.session.user.id)

    if (error) {
      console.error('[Auth] Profile fetch error:', error)
      return { profile: null, error }
    }

    return { profile: data?.[0] || null, error: null }
  } catch (err) {
    console.error('[Auth] getCurrentProfile error:', err)
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
