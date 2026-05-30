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
  const [view, setView] = useState('dashboard') // dashboard, monprofil, mespieaces, etc

  useEffect(() => {
    async function init() {
      const { data: { session: s } } = await supabase.auth.getSession()
      setSession(s)

      if (s) {
        const { profile: p } = await getCurrentProfile()
        setProfile(p)
      }
      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChanged(async (_event, s) => {
      setSession(s)
      if (s) {
        const { profile: p } = await getCurrentProfile()
        setProfile(p)
      }
    })

    return () => subscription?.unsubscribe()
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
