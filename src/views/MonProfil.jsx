import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { COULEURS } from '../lib/constants'

const inputStyle = (disabled = false) => ({
  width: '100%',
  padding: '10px',
  backgroundColor: disabled ? '#1e293b' : '#0f172a',
  color: disabled ? COULEURS.text_sec : COULEURS.text_main,
  border: `1px solid ${COULEURS.border}`,
  borderRadius: '4px',
  boxSizing: 'border-box',
  fontFamily: 'Poppins, sans-serif',
  fontSize: '14px',
})

const labelStyle = {
  color: COULEURS.text_main,
  display: 'block',
  marginBottom: '6px',
  fontWeight: '500',
  fontSize: '14px',
}

const fieldStyle = { marginBottom: '20px' }

const sectionTitle = {
  color: COULEURS.text_sec,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  margin: '0 0 14px 0',
}

export default function MonProfil({ profile, onUpdate }) {
  const [formateur, setFormateur] = useState(null)
  const [formData, setFormData] = useState({ email: '', telephone: '', rayon_km: 50 })

  // Formations
  const [toutesFormations, setToutesFormations] = useState([])   // toutes les formations dispo
  const [formationsIds, setFormationsIds] = useState(new Set())  // IDs actuellement associés
  const [formationsOrigin, setFormationsOrigin] = useState(new Set()) // état initial (pour le diff)
  const [selectedFormation, setSelectedFormation] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!profile?.formateur_id) return
    load()
  }, [profile])

  async function load() {
    setLoading(true)
    try {
      // 1. Formateur
      const { data: fmt, error: e1 } = await supabase
        .from('formateurs').select('*').eq('id', profile.formateur_id).single()
      if (e1) throw e1
      setFormateur(fmt)
      setFormData({
        email: fmt.email || '',
        telephone: fmt.telephone || '',
        rayon_km: fmt.rayon_km ?? 50,
      })

      // 2. Toutes les formations (catalogue complet)
      const { data: allF, error: e2 } = await supabase
        .from('formations').select('id, titre, code').order('titre')
      if (e2) throw e2
      setToutesFormations(allF || [])

      // 3. Formations déjà associées à ce formateur
      const { data: ff, error: e3 } = await supabase
        .from('formateur_formations')
        .select('formation_id')
        .eq('formateur_id', profile.formateur_id)
      if (e3) throw e3
      const ids = new Set((ff || []).map(r => r.formation_id))
      setFormationsIds(ids)
      setFormationsOrigin(new Set(ids))
    } catch (err) {
      setMessage(`Erreur : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      // 1. Mettre à jour les champs formateur
      const { error: e1 } = await supabase
        .from('formateurs')
        .update({
          email: formData.email || null,
          telephone: formData.telephone || null,
          rayon_km: formData.rayon_km,
        })
        .eq('id', profile.formateur_id)
      if (e1) throw e1

      // 2. Diff formations : ajouts et suppressions
      const toAdd = [...formationsIds].filter(id => !formationsOrigin.has(id))
      const toRemove = [...formationsOrigin].filter(id => !formationsIds.has(id))

      if (toAdd.length > 0) {
        const { error: e2 } = await supabase
          .from('formateur_formations')
          .insert(toAdd.map(formation_id => ({ formateur_id: profile.formateur_id, formation_id })))
        if (e2) throw e2
      }
      if (toRemove.length > 0) {
        const { error: e3 } = await supabase
          .from('formateur_formations')
          .delete()
          .eq('formateur_id', profile.formateur_id)
          .in('formation_id', toRemove)
        if (e3) throw e3
      }

      // Mettre à jour l'origine après sauvegarde réussie
      setFormationsOrigin(new Set(formationsIds))
      setMessage('Profil mis à jour avec succès')
      onUpdate({ ...profile })
    } catch (err) {
      setMessage(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const toggleFormation = (id) => {
    setFormationsIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSelectedFormation('')
  }

  // Formations associées avec leur objet complet
  const formationsAssociees = toutesFormations.filter(f => formationsIds.has(f.id))
  // Formations disponibles à ajouter (pas encore associées)
  const formationsDispo = toutesFormations.filter(f => !formationsIds.has(f.id))

  if (loading) return <p style={{ color: COULEURS.text_main }}>Chargement...</p>
  if (!formateur) return <p style={{ color: COULEURS.danger }}>Formateur non trouvé</p>

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{
        backgroundColor: COULEURS.bg_card,
        border: `1px solid ${COULEURS.border}`,
        borderRadius: '8px',
        padding: '28px',
      }}>
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: formateur.couleur || COULEURS.primary, flexShrink: 0,
          }} />
          <div>
            <h2 style={{ color: COULEURS.text_main, margin: 0, fontSize: '20px' }}>
              {formateur.prenom} {formateur.nom}
            </h2>
            <p style={{ color: COULEURS.text_sec, margin: '2px 0 0 0', fontSize: '13px' }}>
              Formateur · {formateur.actif ? 'Actif' : 'Inactif'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave}>

          {/* ── Infos administratives (lecture seule) ── */}
          <p style={sectionTitle}>Informations administratives</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Nom</label>
              <input type="text" value={formateur.nom} disabled style={inputStyle(true)} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Prénom</label>
              <input type="text" value={formateur.prenom} disabled style={inputStyle(true)} />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Adresse</label>
            <input type="text" value={formateur.adresse || '—'} disabled style={inputStyle(true)} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Couleur de planning</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '4px',
                backgroundColor: formateur.couleur || '#ccc',
                border: `1px solid ${COULEURS.border}`, flexShrink: 0,
              }} />
              <input type="text" value={formateur.couleur || '—'} disabled style={{ ...inputStyle(true), flex: 1 }} />
            </div>
          </div>

          {/* ── Infos modifiables ── */}
          <p style={{ ...sectionTitle, marginTop: '8px' }}>Mes informations</p>

          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
              placeholder="votre@email.com"
              style={inputStyle()}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Téléphone</label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={e => setFormData(p => ({ ...p, telephone: e.target.value }))}
              placeholder="06 00 00 00 00"
              style={inputStyle()}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Rayon d'intervention : <strong>{formData.rayon_km} km</strong>
            </label>
            <input
              type="range" min="0" max="300"
              value={formData.rayon_km}
              onChange={e => setFormData(p => ({ ...p, rayon_km: parseInt(e.target.value) }))}
              style={{ width: '100%', accentColor: COULEURS.primary }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: COULEURS.text_sec, marginTop: '4px' }}>
              <span>0 km</span><span>300 km</span>
            </div>
          </div>

          {/* ── Formations ── */}
          <p style={{ ...sectionTitle, marginTop: '8px' }}>
            Formations habilitées ({formationsAssociees.length})
          </p>

          {/* Liste des formations associées */}
          <div style={{ marginBottom: '12px' }}>
            {formationsAssociees.length === 0 ? (
              <p style={{ color: COULEURS.text_sec, fontSize: '13px', margin: '0 0 8px 0' }}>
                Aucune formation associée
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {formationsAssociees.map(f => (
                  <span key={f.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '6px 12px',
                    backgroundColor: 'rgba(20,184,166,0.15)',
                    border: '1px solid rgba(20,184,166,0.4)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: COULEURS.text_main,
                  }}>
                    <span>
                      <strong>{f.titre}</strong>
                      {f.code && f.code !== f.titre && (
                        <span style={{ color: COULEURS.text_sec, marginLeft: '6px', fontSize: '11px' }}>
                          {f.code}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleFormation(f.id)}
                      title="Retirer cette formation"
                      style={{
                        background: 'none', border: 'none',
                        color: COULEURS.text_sec, cursor: 'pointer',
                        padding: '0', fontSize: '16px', lineHeight: 1,
                      }}
                    >×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Sélecteur pour ajouter une formation */}
            {formationsDispo.length > 0 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedFormation}
                  onChange={e => setSelectedFormation(e.target.value)}
                  style={{ ...inputStyle(), flex: 1 }}
                >
                  <option value="">— Ajouter une formation —</option>
                  {formationsDispo.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.titre}{f.code && f.code !== f.titre ? ` (${f.code})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => { if (selectedFormation) toggleFormation(selectedFormation) }}
                  disabled={!selectedFormation}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: selectedFormation ? COULEURS.primary : COULEURS.border,
                    color: COULEURS.text_main,
                    border: 'none', borderRadius: '4px',
                    cursor: selectedFormation ? 'pointer' : 'not-allowed',
                    fontWeight: '600', whiteSpace: 'nowrap',
                  }}
                >
                  + Ajouter
                </button>
              </div>
            )}
          </div>

          {message && (
            <div style={{
              padding: '12px', marginBottom: '16px', borderRadius: '4px',
              backgroundColor: message.includes('Erreur') ? 'rgba(248,113,113,0.15)' : 'rgba(16,185,129,0.15)',
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
              width: '100%', padding: '12px',
              backgroundColor: saving ? COULEURS.border : COULEURS.primary,
              color: COULEURS.text_main, border: 'none', borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: '600', fontSize: '16px',
            }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  )
}
