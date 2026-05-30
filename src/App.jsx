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
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('dashboard')

  useEffect(() => {
    console.log('[App] Setting up auth listener')

    const { data } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log('[App] Auth event:', event, s?.user?.email)
      setSession(s)

      if (s && event === 'SIGNED_IN') {
        console.log('[App] User signed in, fetching profile...')
        const { profile: p } = await getCurrentProfile()
        console.log('[App] Profile loaded:', p?.id)
        setProfile(p)
      }
    })

    return () => data?.subscription?.unsubscribe()
  }, [])

  if (loading) return <Spinner />

  if (!session) return <Login onLoginSuccess={() => {}} />

  if (!profile || !profile?.actif) {
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
