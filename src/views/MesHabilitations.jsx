import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { COULEURS } from '../lib/constants'
import { Badge } from '../components/UI'

export default function MesHabilitations({ profile }) {
  const [habilitations, setHabilitations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('v_habilitations_statut')
          .select('*')
          .eq('formateur_id', profile?.formateur_id)
          .order('date_expiration', { ascending: true })

        if (error) throw error
        setHabilitations(data || [])
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }

    if (profile?.formateur_id) load()
  }, [profile])

  const getStatusBadge = (statut) => {
    const variants = {
      valide: 'success',
      'à renouveler': 'primary',
      expirée: 'danger',
    }
    return variants[statut] || 'primary'
  }

  const getDaysUntilExpiration = (date) => {
    const today = new Date()
    const expiry = new Date(date)
    const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    return days
  }

  if (loading) {
    return <p style={{ color: COULEURS.text_main }}>Chargement...</p>
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div
        style={{
          backgroundColor: COULEURS.bg_card,
          border: `1px solid ${COULEURS.border}`,
          borderRadius: '8px',
          padding: '24px',
        }}
      >
        <h2 style={{ color: COULEURS.text_main, marginTop: 0 }}>Mes Habilitations</h2>

        {habilitations.length === 0 ? (
          <p style={{ color: COULEURS.text_sec }}>Aucune habilitation enregistrée</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {habilitations.map(h => {
              const daysLeft = getDaysUntilExpiration(h.date_expiration)
              return (
                <div
                  key={h.id}
                  style={{
                    padding: '16px',
                    backgroundColor: `rgba(0, 0, 0, 0.2)`,
                    borderRadius: '4px',
                    border: `1px solid ${COULEURS.border}`,
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '8px',
                  }}>
                    <div>
                      <h3 style={{
                        color: COULEURS.text_main,
                        margin: '0 0 4px 0',
                        fontSize: '16px',
                      }}>
                        {h.titre_certification}
                      </h3>
                      <p style={{
                        color: COULEURS.text_sec,
                        margin: '0',
                        fontSize: '14px',
                      }}>
                        Valide jusqu'au {new Date(h.date_expiration).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge text={h.statut} variant={getStatusBadge(h.statut)} />
                  </div>

                  {daysLeft >= 0 && daysLeft <= 30 && (
                    <p style={{
                      color: COULEURS.danger,
                      fontSize: '12px',
                      margin: '8px 0 0 0',
                    }}>
                      ⚠️ {daysLeft} jour{daysLeft > 1 ? 's' : ''} avant expiration
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{
          marginTop: '24px',
          padding: '12px',
          backgroundColor: `rgba(250, 204, 21, 0.1)`,
          border: `1px solid ${COULEURS.accent}`,
          borderRadius: '4px',
          color: COULEURS.text_main,
          fontSize: '14px',
        }}>
          <strong>Note :</strong> Assurez-vous de renouveler vos habilitations avant expiration.
          Les sessions requérant une certification valide ne pourront être affectées sans cela.
        </div>
      </div>
    </div>
  )
}
