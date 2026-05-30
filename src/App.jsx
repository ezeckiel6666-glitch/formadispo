import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { getCurrentProfile } from './lib/auth'
import Login from './views/Login'
import Invitation from './views/Invitation'
import Dashboard from './views/Dashboard'
import { Spinner } from './components/UI'
import { COULEURS } from './lib/constants'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('dashboard')

  useEffect(() => {
    async function init() {
      try {
        console.log('[App] Initializing...')
        const { data: { session: s }, error: sessErr } = await supabase.auth.getSession()
        console.log('[App] Session:', s?.user?.email || 'none', sessErr)
        setSession(s)

        if (s) {
          const { profile: p, error: profErr } = await getCurrentProfile()
          console.log('[App] Profile:', p?.id || 'none', profErr)
          setProfile(p)
        }
        console.log('[App] Init complete')
      } catch (err) {
        console.error('[App] Init error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()

    // Simple auth listener
    let unsubscribe
    try {
      const subscription = supabase.auth.onAuthStateChange(async (event, s) => {
        console.log('[App] Auth state changed:', event, s?.user?.email)
        setSession(s)
        if (s) {
          const { profile: p } = await getCurrentProfile()
          setProfile(p)
        }
      })
      unsubscribe = subscription?.data?.subscription?.unsubscribe
    } catch (err) {
      console.error('[App] Auth listener error:', err)
    }

    return () => {
      unsubscribe?.()
    }
  }, [])

  if (loading) return <Spinner />

  if (!session) return <Login onLoginSuccess={() => {}} />

  if (!profile || !profile.actif) {
    return <Invitation session={session} onProfileCreated={(p) => setProfile(p)} />
  }

  return (
    <div style={{
      fontFamily: 'Poppins, sans-serif',
      backgroundColor: COULEURS.bg_main,
      color: COULEURS.text_main,
      minHeight: '100vh',
    }}>
      <Dashboard
        profile={profile}
        currentView={view}
        onViewChange={setView}
        onLogout={() => {
          setSession(null)
          setProfile(null)
          setView('dashboard')
        }}
        onProfileUpdate={setProfile}
      />
    </div>
  )
}
