import { COULEURS } from '../lib/constants'

export function Badge({ text, variant = 'primary' }) {
  const bgColor = variant === 'danger' ? COULEURS.danger : variant === 'success' ? COULEURS.success : COULEURS.primary
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '4px',
      backgroundColor: bgColor,
      color: COULEURS.text_main,
      fontSize: '12px',
      fontWeight: '600',
    }}>
      {text}
    </span>
  )
}

export function Toast({ message, type = 'info' }) {
  const bgColor = type === 'danger' ? COULEURS.danger : type === 'success' ? COULEURS.success : COULEURS.primary
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '16px 20px',
      borderRadius: '8px',
      backgroundColor: bgColor,
      color: COULEURS.text_main,
      zIndex: 9999,
    }}>
      {message}
    </div>
  )
}

export function Spinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: `4px solid ${COULEURS.border}`,
        borderTop: `4px solid ${COULEURS.primary}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export function Modal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: COULEURS.bg_card,
        borderRadius: '8px',
        border: `1px solid ${COULEURS.border}`,
        padding: '24px',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: COULEURS.text_main, marginTop: 0 }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}
