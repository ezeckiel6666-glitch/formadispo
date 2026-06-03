import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { getCurrentProfile } from './lib/auth'
import Login from './views/Login'
import Dashboard from './views/Dashboard'
import { Spinner } from './components/UI'
import { COULEURS } from './lib/constants'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('dashboard')

  // 1) Listener auth : NE FAIT QUE stocker la session.
  //    ⚠️ Ne JAMAIS appeler une requête Supabase ici : le callback s'exécute
  //    pendant que GoTrue tient un verrou interne (navigator lock). Une requête
  //    .from(...) a besoin du même verrou pour attacher le header Authorization
  //    -> deadlock, la promesse ne se résout jamais (l'écran reste figé).
  useEffect(() => {
    console.log('[App] Setting up auth listener')

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      console.log('[App] Auth event:', event, s?.user?.email)
      setSession(s)
    })

    return () => data?.subscription?.unsubscribe()
  }, [])

  // 2) Chargement du profil : effet séparé déclenché par le changement d'user.
  //    Hors du callback onAuthStateChange => pas de deadlock de verrou.
  useEffect(() => {
    const user = session?.user
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    console.log('[App] Fetching profile for user:', user.id)

    // setTimeout(0) garantit qu'on sort du verrou interne GoTrue
    // (navigator.locks) avant de faire une requête Supabase.
    // Sans ça, le build production (Netlify) deadlock car React déclenche
    // cet effet pendant que GoTrue tient encore son verrou post-SIGNED_IN.
    // On passe le access_token directement : fetch HTTP brut, sans passer
    // par getSession() du client Supabase → contourne le verrou GoTrue.
    const accessToken = session?.access_token
    const timer = setTimeout(() => {
      if (cancelled) return
      getCurrentProfile(user, accessToken).then(({ profile: p }) => {
        if (cancelled) return
        console.log('[App] Profile loaded:', p?.id, 'actif:', p?.actif)
        setProfile(p)
        setLoading(false)
      })
    }, 0)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [session?.user?.id])

  if (loading) return <Spinner />

  if (!session) return <Login onLoginSuccess={() => {}} />

  if (!profile) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: COULEURS.bg_main,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}>
        <div style={{
          maxWidth: '500px',
          backgroundColor: COULEURS.bg_card,
          border: `1px solid ${COULEURS.border}`,
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center',
        }}>
          <h2 style={{ color: COULEURS.text_main, marginTop: 0 }}>Profil non disponible</h2>
          <p style={{ color: COULEURS.text_sec, lineHeight: '1.6' }}>
            Votre profil n'est pas encore disponible. Veuillez contacter l'administrateur pour activer votre accès.
          </p>
          <button
            onClick={() => {
              supabase.auth.signOut()
              setSession(null)
              setProfile(null)
            }}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              backgroundColor: COULEURS.danger,
              color: COULEURS.text_main,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  if (!profile.actif) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: COULEURS.bg_main,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}>
        <div style={{
          maxWidth: '500px',
          backgroundColor: COULEURS.bg_card,
          border: `1px solid ${COULEURS.border}`,
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center',
        }}>
          <h2 style={{ color: COULEURS.text_main, marginTop: 0 }}>Compte désactivé</h2>
          <p style={{ color: COULEURS.text_sec, lineHeight: '1.6' }}>
            Votre compte a été désactivé. Veuillez contacter l'administrateur.
          </p>
          <button
            onClick={() => {
              supabase.auth.signOut()
              setSession(null)
              setProfile(null)
            }}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              backgroundColor: COULEURS.danger,
              color: COULEURS.text_main,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
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
