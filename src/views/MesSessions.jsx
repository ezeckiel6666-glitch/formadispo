import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { COULEURS } from '../lib/constants'
import { Badge } from '../components/UI'

export default function MesSessions({ profile }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [profile])

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          formations(titre),
          clients(nom),
          session_formateurs!inner(*)
        `)
        .eq('session_formateurs.formateur_id', profile?.formateur_id)
        .order('date_debut', { ascending: true })

      if (error) throw error
      setSessions(data || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatutColor = (statut) => {
    const variants = {
      confirmée: 'success',
      en attente: 'primary',
      annulée: 'danger',
    }
    return variants[statut] || 'primary'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return <p style={{ color: COULEURS.text_main }}>Chargement...</p>
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div
        style={{
          backgroundColor: COULEURS.bg_card,
          border: `1px solid ${COULEURS.border}`,
          borderRadius: '8px',
          padding: '24px',
        }}
      >
        <h2 style={{ color: COULEURS.text_main, marginTop: 0 }}>Mes Sessions</h2>

        {sessions.length === 0 ? (
          <p style={{ color: COULEURS.text_sec }}>Aucune session affectée</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {sessions.map(s => (
              <div
                key={s.id}
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
                  marginBottom: '12px',
                }}>
                  <div>
                    <h3 style={{
                      color: COULEURS.text_main,
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                    }}>
                      {s.formations?.titre || 'Formation'}
                    </h3>
                    <p style={{
                      color: COULEURS.text_sec,
                      margin: '0 0 8px 0',
                      fontSize: '14px',
                    }}>
                      Client : {s.clients?.nom || 'Non spécifié'}
                    </p>
                  </div>
                  <Badge text={s.statut} variant={getStatutColor(s.statut)} />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '14px',
                  color: COULEURS.text_sec,
                }}>
                  <div>
                    <strong style={{ color: COULEURS.text_main }}>Date de début</strong>
                    <p style={{ margin: '4px 0 0 0' }}>
                      {formatDate(s.date_debut)}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: COULEURS.text_main }}>Date de fin</strong>
                    <p style={{ margin: '4px 0 0 0' }}>
                      {formatDate(s.date_fin)}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: COULEURS.text_main }}>Lieu</strong>
                    <p style={{ margin: '4px 0 0 0' }}>
                      {s.lieu || 'Non spécifié'}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: COULEURS.text_main }}>Effectif</strong>
                    <p style={{ margin: '4px 0 0 0' }}>
                      {s.effectif_prevu} stagiaire{s.effectif_prevu > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {s.bon_statut && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: `rgba(16, 185, 129, 0.1)`,
                    borderRadius: '4px',
                    border: `1px solid ${COULEURS.success}`,
                    color: COULEURS.success,
                    fontSize: '12px',
                  }}>
                    ✓ Bon d'intervention : {s.bon_statut}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
