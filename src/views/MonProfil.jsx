import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { updateProfile } from '../lib/auth'
import { COULEURS } from '../lib/constants'

const ZONES_PREDEFINIES = [
  { id: 'idf', nom: 'Île-de-France' },
  { id: 'aura', nom: 'Auvergne-Rhône-Alpes' },
  { id: 'occ', nom: 'Occitanie' },
  { id: 'na', nom: 'Nouvelle-Aquitaine' },
  { id: 'bfc', nom: 'Bourgogne-Franche-Comté' },
  { id: 'paca', nom: 'Provence-Alpes-Côte d\'Azur' },
  { id: 'bretagne', nom: 'Bretagne' },
  { id: 'normandie', nom: 'Normandie' },
  { id: 'npc', nom: 'Hauts-de-France' },
]

export default function MonProfil({ profile, onUpdate }) {
  const [formData, setFormData] = useState({
    zones_activites: profile?.zones_activites || [],
    formations_specialisees: profile?.formations_specialisees || [],
    rayon_intervention: profile?.rayon_intervention || 50,
  })
  const [formations, setFormations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('formations').select('id, titre')
        if (error) throw error
        setFormations(data || [])
      } catch (err) {
        setMessage(`Erreur: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const { error } = await updateProfile({
        zones_activites: formData.zones_activites,
        formations_specialisees: formData.formations_specialisees,
        rayon_intervention: formData.rayon_intervention,
      })

      if (error) throw error
      setMessage('Profil mis à jour avec succès')
      onUpdate({
        ...profile,
        ...formData,
      })
    } catch (err) {
      setMessage(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p style={{ color: COULEURS.text_main }}>Chargement...</p>
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div
        style={{
          backgroundColor: COULEURS.bg_card,
          border: `1px solid ${COULEURS.border}`,
          borderRadius: '8px',
          padding: '24px',
        }}
      >
        <h2 style={{ color: COULEURS.text_main, marginTop: 0 }}>Mon Profil</h2>

        <form onSubmit={handleSave}>
          {/* Zones */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              color: COULEURS.text_main,
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
            }}>
              Zones d'activité
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              {ZONES_PREDEFINIES.map(z => (
                <label key={z.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: COULEURS.text_main,
                }}>
                  <input
                    type="checkbox"
                    checked={formData.zones_activites.includes(z.id)}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        zones_activites: e.target.checked
                          ? [...prev.zones_activites, z.id]
                          : prev.zones_activites.filter(id => id !== z.id)
                      }))
                    }}
                  />
                  {z.nom}
                </label>
              ))}
            </div>
          </div>

          {/* Formations */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              color: COULEURS.text_main,
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
            }}>
              Formations spécialisées
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              {formations.map(f => (
                <label key={f.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: COULEURS.text_main,
                }}>
                  <input
                    type="checkbox"
                    checked={formData.formations_specialisees.includes(f.id)}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        formations_specialisees: e.target.checked
                          ? [...prev.formations_specialisees, f.id]
                          : prev.formations_specialisees.filter(id => id !== f.id)
                      }))
                    }}
                  />
                  {f.titre}
                </label>
              ))}
            </div>
          </div>

          {/* Rayon */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              color: COULEURS.text_main,
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
            }}>
              Rayon d'intervention : {formData.rayon_intervention} km
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={formData.rayon_intervention}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                rayon_intervention: parseInt(e.target.value)
              }))}
              style={{ width: '100%' }}
            />
          </div>

          {message && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '4px',
              backgroundColor: message.includes('Erreur') ? `rgba(248, 113, 113, 0.2)` : `rgba(16, 185, 129, 0.2)`,
              color: message.includes('Erreur') ? COULEURS.danger : COULEURS.success,
              fontSize: '14px',
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: COULEURS.primary,
              color: COULEURS.text_main,
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  )
}
