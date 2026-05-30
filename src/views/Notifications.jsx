import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { COULEURS } from '../lib/constants'
import { Badge } from '../components/UI'

export default function Notifications({ profile }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous') // tous, non_lus, lus

  useEffect(() => {
    loadNotifications()
  }, [profile, filter])

  const loadNotifications = async () => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (profile?.id) {
        query = query.eq('destinataire', profile.id)
      }

      if (filter === 'non_lus') {
        query = query.eq('lu', false)
      } else if (filter === 'lus') {
        query = query.eq('lu', true)
      }

      const { data, error } = await query.limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('id', notificationId)

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, lu: true } : n)
      )
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    } else {
      return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
    }
  }

  const unreadCount = notifications.filter(n => !n.lu).length

  if (loading) {
    return <p style={{ color: COULEURS.text_main }}>Chargement...</p>
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <div style={{
          backgroundColor: COULEURS.bg_card,
          border: `1px solid ${COULEURS.border}`,
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <p style={{ color: COULEURS.text_sec, margin: '0 0 8px 0', fontSize: '14px' }}>
            Non lus
          </p>
          <p style={{ color: COULEURS.primary, margin: 0, fontSize: '24px', fontWeight: '600' }}>
            {unreadCount}
          </p>
        </div>
        <div style={{
          backgroundColor: COULEURS.bg_card,
          border: `1px solid ${COULEURS.border}`,
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <p style={{ color: COULEURS.text_sec, margin: '0 0 8px 0', fontSize: '14px' }}>
            Total
          </p>
          <p style={{ color: COULEURS.text_main, margin: 0, fontSize: '24px', fontWeight: '600' }}>
            {notifications.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
      }}>
        {['tous', 'non_lus', 'lus'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === f ? COULEURS.primary : 'transparent',
              color: COULEURS.text_main,
              border: `1px solid ${filter === f ? COULEURS.primary : COULEURS.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {f === 'tous' ? 'Tous' : f === 'non_lus' ? 'Non lus' : 'Lus'}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div style={{
        backgroundColor: COULEURS.bg_card,
        border: `1px solid ${COULEURS.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        {notifications.length === 0 ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: COULEURS.text_sec,
          }}>
            {filter === 'non_lus' ? 'Aucune notification non lue' : 'Aucune notification'}
          </div>
        ) : (
          <div>
            {notifications.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '16px',
                  borderBottom: `1px solid ${COULEURS.border}`,
                  backgroundColor: n.lu ? 'transparent' : `rgba(109, 40, 217, 0.05)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `rgba(0, 0, 0, 0.2)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = n.lu ? 'transparent' : `rgba(109, 40, 217, 0.05)`
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  gap: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      color: COULEURS.text_main,
                      margin: '0 0 4px 0',
                      fontSize: '15px',
                      fontWeight: n.lu ? '400' : '600',
                    }}>
                      {n.titre}
                    </p>
                    <p style={{
                      color: COULEURS.text_sec,
                      margin: '0 0 8px 0',
                      fontSize: '14px',
                    }}>
                      {n.contenu}
                    </p>
                    <p style={{
                      color: COULEURS.text_sec,
                      margin: '0',
                      fontSize: '12px',
                    }}>
                      {formatDate(n.created_at)}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexDirection: 'column',
                  }}>
                    {!n.lu && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: COULEURS.primary,
                          color: COULEURS.text_main,
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                      >
                        Marquer comme lu
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: 'transparent',
                        color: COULEURS.danger,
                        border: `1px solid ${COULEURS.danger}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
