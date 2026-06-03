import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { COULEURS } from '../lib/constants'

export default function MesPieces({ profile }) {
  const [pieces, setPieces] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)
  const [type, setType] = useState('cv')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPieces()
  }, [profile])

  const loadPieces = async () => {
    try {
      const { data, error } = await supabase
        .from('pieces_formateur')
        .select('*')
        .eq('formateur_id', profile?.formateur_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPieces(data || [])
    } catch (err) {
      setMessage(`Erreur: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setMessage('Veuillez sélectionner un fichier')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      // Sanitiser le nom : accents → ASCII, espaces → tirets, caractères spéciaux supprimés
      const sanitize = (name) =>
        name
          .normalize('NFD').replace(/[̀-ͯ]/g, '') // enlève les accents
          .replace(/\s+/g, '-')                              // espaces → tirets
          .replace(/[^a-zA-Z0-9.\-_]/g, '')                 // retire tout le reste sauf . - _

      const safeName = sanitize(file.name)
      const fileName = `${profile.formateur_id}/${type}/${Date.now()}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('pieces_formateurs')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { error: dbError } = await supabase
        .from('pieces_formateur')
        .insert({
          formateur_id: profile.formateur_id,
          type,
          libelle: file.name,
          storage_path: fileName,
          statut: 'en attente',
        })

      if (dbError) throw dbError

      setFile(null)
      setType('cv')
      setMessage('Fichier uploadé avec succès')
      await loadPieces()
    } catch (err) {
      setMessage(`Erreur: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (piece) => {
    try {
      const { data, error } = await supabase.storage
        .from('pieces_formateurs')
        .createSignedUrl(piece.storage_path, 60) // URL valable 60 secondes

      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      setMessage(`Erreur téléchargement: ${err.message}`)
    }
  }

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'valide':
        return COULEURS.success
      case 'en attente':
        return COULEURS.accent
      case 'rejete':
        return COULEURS.danger
      default:
        return COULEURS.text_sec
    }
  }

  if (loading) {
    return <p style={{ color: COULEURS.text_main }}>Chargement...</p>
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Upload form */}
      <div
        style={{
          backgroundColor: COULEURS.bg_card,
          border: `1px solid ${COULEURS.border}`,
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ color: COULEURS.text_main, marginTop: 0 }}>Ajouter une pièce</h3>

        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              color: COULEURS.text_main,
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
            }}>
              Type de document
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1e293b',
                color: COULEURS.text_main,
                border: `1px solid ${COULEURS.border}`,
                borderRadius: '4px',
                fontFamily: 'Poppins, sans-serif',
                boxSizing: 'border-box',
              }}
            >
              <option value="cv">CV</option>
              <option value="diplome">Diplôme</option>
              <option value="assurance">Assurance</option>
              <option value="autres">Autres</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              color: COULEURS.text_main,
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
            }}>
              Fichier
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0])}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1e293b',
                color: COULEURS.text_main,
                border: `1px solid ${COULEURS.border}`,
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: '12px', color: COULEURS.text_sec, margin: '8px 0 0 0' }}>
              Formats acceptés: PDF, DOC, DOCX, JPG, PNG
            </p>
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
            disabled={uploading || !file}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: COULEURS.primary,
              color: COULEURS.text_main,
              border: 'none',
              borderRadius: '4px',
              cursor: uploading || !file ? 'not-allowed' : 'pointer',
              fontWeight: '600',
            }}
          >
            {uploading ? 'Upload...' : 'Uploader'}
          </button>
        </form>
      </div>

      {/* Pieces list */}
      <div
        style={{
          backgroundColor: COULEURS.bg_card,
          border: `1px solid ${COULEURS.border}`,
          borderRadius: '8px',
          padding: '24px',
        }}
      >
        <h3 style={{ color: COULEURS.text_main, marginTop: 0 }}>Mes pièces</h3>

        {pieces.length === 0 ? (
          <p style={{ color: COULEURS.text_sec }}>Aucune pièce uploadée</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {pieces.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: `rgba(0, 0, 0, 0.2)`,
                  borderRadius: '4px',
                  border: `1px solid ${COULEURS.border}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: COULEURS.text_main, margin: '0 0 4px 0', fontWeight: '500' }}>
                    {p.libelle}
                  </p>
                  <p style={{ color: COULEURS.text_sec, margin: '0', fontSize: '12px' }}>
                    {p.type} · {p.date_depot ? new Date(p.date_depot).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleDownload(p)}
                    title="Télécharger"
                    style={{
                      background: 'none',
                      border: `1px solid ${COULEURS.border}`,
                      borderRadius: '4px',
                      color: COULEURS.text_sec,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: '14px',
                    }}
                  >
                    ↓
                  </button>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      backgroundColor: getStatutColor(p.statut),
                      color: COULEURS.text_main,
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    {p.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
