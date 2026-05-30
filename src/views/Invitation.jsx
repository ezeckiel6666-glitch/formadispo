import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { COULEURS } from '../lib/constants'
import { Spinner } from '../components/UI'

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

export default function Invitation({ session, onProfileCreated }) {
  const [loading, setLoading] = useState(false)
  const [formations, setFormations] = useState([])
  const [formData, setFormData] = useState({
    zones_activites: [],
    formations_specialisees: [],
    rayon_intervention: 50,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await supabase.from('formations').select('id, titre')

        if (err) throw err
        setFormations(data || [])
      } catch (err) {
        console.log('Note: formations pas chargées, utilise les données du serveur')
      }
    }

    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('[Invitation] Creating formateur + profile...')
      console.log('[Invitation] Form data:', formData)
      console.log('[Invitation] User email:', session.user.email)

      // 1. Créer formateur
      const formateurPayload = {
        nom: session.user.email.split('@')[0] || 'Formateur',
        prenom: 'Nouveau',
        email: session.user.email,
        specialites: formData.formations_specialisees || [],
        rayon_km: formData.rayon_intervention || 50,
        actif: true,
      }
      console.log('[Invitation] Inserting formateur:', formateurPayload)

      const formateurRes = await supabase
        .from('formateurs')
        .upsert(formateurPayload, { onConflict: 'email' })
        .select()

      console.log('[Invitation] Formateur response:', formateurRes)
      if (formateurRes.error) {
        console.error('[Invitation] Formateur error:', formateurRes.error)
        throw formateurRes.error
      }

      const formateurData = formateurRes.data?.[0]
      console.log('[Invitation] Formateur created:', formateurData?.id)

      if (!formateurData?.id) {
        throw new Error('Formateur ID not returned')
      }

      // 2. Créer profil
      console.log('[Invitation] Inserting profil with formateur_id:', formateurData.id)
      const profilRes = await supabase
        .from('profils')
        .insert({
          id: session.user.id,
          role: 'formateur',
          formateur_id: formateurData.id,
          actif: true,
        })
        .select()

      console.log('[Invitation] Profil response:', profilRes)
      if (profilRes.error) {
        console.error('[Invitation] Profil error:', profilRes.error)
        throw profilRes.error
      }

      const profilData = profilRes.data?.[0]
      console.log('[Invitation] Profile created:', profilData?.id)
      onProfileCreated(profilData || { ...formateurData, id: session.user.id })
    } catch (err) {
      console.error('[Invitation] Exception:', err)
      setError(err.message || 'Erreur lors de la création du profil')
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

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
        width: '100%',
        maxWidth: '600px',
        backgroundColor: COULEURS.bg_card,
        border: `1px solid ${COULEURS.border}`,
        borderRadius: '8px',
        padding: '32px',
      }}>
        <h1 style={{ color: COULEURS.text_main, marginTop: 0 }}>Complétez votre profil</h1>
        <p style={{ color: COULEURS.text_sec, marginBottom: '24px' }}>
          Bienvenue ! Veuillez remplir les informations suivantes pour finaliser votre inscription.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Zones d'activités */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: COULEURS.text_main, display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Zones d'activité
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              {ZONES_PREDEFINIES.map((z) => (
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

          {/* Formations spécialisées */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: COULEURS.text_main, display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Formations spécialisées
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              {formations.map((f) => (
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

          {/* Rayon intervention */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: COULEURS.text_main, display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Rayon d'intervention (km) : {formData.rayon_intervention}
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={formData.rayon_intervention}
              onChange={(e) => setFormData(prev => ({ ...prev, rayon_intervention: parseInt(e.target.value) }))}
              style={{
                width: '100%',
                cursor: 'pointer',
              }}
            />
          </div>

          {error && (
            <div style={{ color: COULEURS.danger, marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: COULEURS.primary,
              color: COULEURS.text_main,
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            {loading ? 'Création...' : 'Terminer mon inscription'}
          </button>
        </form>
      </div>
    </div>
  )
}
