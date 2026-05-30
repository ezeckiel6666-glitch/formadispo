import { useState } from 'react'
import { signInWithEmail, signInWithMagicLink } from '../lib/auth'
import { COULEURS } from '../lib/constants'

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usePassword, setUsePassword] = useState(true)
  const [sent, setSent] = useState(false)

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await signInWithEmail(email, password)
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      onLoginSuccess()
    }
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await signInWithMagicLink(email)
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

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
        maxWidth: '400px',
        backgroundColor: COULEURS.bg_card,
        border: `1px solid ${COULEURS.border}`,
        borderRadius: '8px',
        padding: '32px',
      }}>
        <h1 style={{ color: COULEURS.text_main, textAlign: 'center', margin: '0 0 32px 0' }}>
          FormaDispo
        </h1>

        {sent ? (
          <div style={{ color: COULEURS.success, textAlign: 'center' }}>
            <p>Lien de connexion envoyé à {email}</p>
            <p style={{ fontSize: '14px', color: COULEURS.text_sec }}>Vérifiez votre email et cliquez sur le lien.</p>
          </div>
        ) : (
          <form onSubmit={usePassword ? handlePasswordLogin : handleMagicLink}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: COULEURS.text_main, display: 'block', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
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
              />
            </div>

            {usePassword && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: COULEURS.text_main, display: 'block', marginBottom: '8px' }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                />
              </div>
            )}

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
                padding: '10px',
                backgroundColor: COULEURS.primary,
                color: COULEURS.text_main,
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                marginBottom: '12px',
              }}
            >
              {loading ? 'Connexion...' : usePassword ? 'Se connecter' : 'Envoyer le lien'}
            </button>

            <button
              type="button"
              onClick={() => setUsePassword(!usePassword)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'transparent',
                color: COULEURS.accent,
                border: `1px solid ${COULEURS.accent}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              {usePassword ? 'Ou utiliser un lien magique' : 'Ou utiliser un mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
