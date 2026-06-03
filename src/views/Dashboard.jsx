import { useState } from 'react'
import { signOut } from '../lib/auth'
import { COULEURS, ROLES } from '../lib/constants'
import MonProfil from './MonProfil'
import MesPieces from './MesPieces'
import MesHabilitations from './MesHabilitations'
import MesSessions from './MesSessions'
import MesDisponibilites from './MesDisponibilites'
import Notifications from './Notifications'

const VIEWS = {
  dashboard: 'Accueil',
  monprofil: 'Mon Profil',
  mespieaces: 'Mes Pièces',
  meshabilitations: 'Mes Habilitations',
  messessions: 'Mes Sessions',
  mesdisponibilites: 'Mes Disponibilités',
  notifications: 'Notifications',
}

export default function Dashboard({
  profile,
  currentView,
  onViewChange,
  onLogout,
  onProfileUpdate,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    onLogout()
  }

  const renderView = () => {
    switch (currentView) {
      case 'monprofil':
        return <MonProfil profile={profile} onUpdate={onProfileUpdate} />
      case 'mespieaces':
        return <MesPieces profile={profile} />
      case 'meshabilitations':
        return <MesHabilitations profile={profile} />
      case 'messessions':
        return <MesSessions profile={profile} />
      case 'mesdisponibilites':
        return <MesDisponibilites profile={profile} />
      case 'notifications':
        return <Notifications profile={profile} />
      default:
        return <DashboardHome profile={profile} onNavClick={onViewChange} />
    }
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: COULEURS.bg_main,
    }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '250px',
          backgroundColor: `rgba(0, 0, 0, 0.3)`,
          borderRight: `1px solid ${COULEURS.border}`,
          padding: '20px',
          position: 'fixed',
          left: sidebarOpen ? 0 : '-250px',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          transition: 'left 0.3s',
          zIndex: 100,
        }}
      >
        <h2 style={{ color: COULEURS.accent, marginTop: 0 }}>FormaDispo</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(VIEWS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                onViewChange(key)
                setSidebarOpen(false)
              }}
              style={{
                padding: '12px',
                backgroundColor: currentView === key ? COULEURS.primary : 'transparent',
                color: COULEURS.text_main,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: currentView === key ? '600' : '400',
                fontSize: '14px',
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          style={{
            marginTop: '32px',
            width: '100%',
            padding: '12px',
            backgroundColor: COULEURS.danger,
            color: COULEURS.text_main,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          Déconnexion
        </button>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          marginLeft: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: `rgba(0, 0, 0, 0.2)`,
            borderBottom: `1px solid ${COULEURS.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: COULEURS.text_main,
              cursor: 'pointer',
              fontSize: '24px',
            }}
          >
            ☰
          </button>
          <h1 style={{ color: COULEURS.text_main, margin: 0, fontSize: '20px' }}>
            {VIEWS[currentView] || 'Accueil'}
          </h1>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {renderView()}
        </div>
      </main>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 50,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

function DashboardHome({ profile, onNavClick }) {
  const menuItems = [
    { key: 'monprofil', label: 'Mon Profil', icon: '👤' },
    { key: 'mespieaces', label: 'Mes Pièces', icon: '📄' },
    { key: 'meshabilitations', label: 'Mes Habilitations', icon: '🏅' },
    { key: 'messessions', label: 'Mes Sessions', icon: '📅' },
    { key: 'mesdisponibilites', label: 'Mes Disponibilités', icon: '🗓️' },
    { key: 'notifications', label: 'Notifications', icon: '🔔' },
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: COULEURS.bg_card,
        border: `1px solid ${COULEURS.border}`,
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <h2 style={{ color: COULEURS.text_main, marginTop: 0 }}>Bienvenue, {profile?.email || 'Formateur'}</h2>
        <p style={{ color: COULEURS.text_sec }}>Sélectionnez une section dans le menu de gauche pour commencer.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {menuItems.map(item => (
          <button
            key={item.key}
            onClick={() => onNavClick(item.key)}
            style={{
              padding: '20px',
              backgroundColor: COULEURS.bg_card,
              border: `1px solid ${COULEURS.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              color: COULEURS.text_main,
              transition: 'all 0.2s',
              fontSize: '16px',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = `rgba(109, 40, 217, 0.1)`
              e.target.style.borderColor = COULEURS.primary
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = COULEURS.bg_card
              e.target.style.borderColor = COULEURS.border
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
