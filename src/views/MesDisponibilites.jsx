import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { COULEURS } from '../lib/constants'

const STATUTS = {
  disponible:   { label: 'Disponible',   color: '#10b981', bg: 'rgba(16,185,129,0.2)',  border: 'rgba(16,185,129,0.5)'  },
  indisponible: { label: 'Indisponible', color: '#f87171', bg: 'rgba(248,113,113,0.2)', border: 'rgba(248,113,113,0.5)' },
  a_confirmer:  { label: 'À confirmer',  color: '#f59e0b', bg: 'rgba(245,158,11,0.2)',  border: 'rgba(245,158,11,0.5)'  },
}

// Clic → cycle : neutre → disponible → indisponible → à confirmer → neutre
const CYCLE = [null, 'disponible', 'indisponible', 'a_confirmer']

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin',
               'Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function MesDisponibilites({ profile }) {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())   // 0‑11

  const [dispos,      setDispos]      = useState({})  // { 'YYYY-MM-DD': statut }
  const [sessionDays, setSessionDays] = useState({})  // { 'YYYY-MM-DD': [{ titre, statut }] }
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(null) // date en cours de sauvegarde

  const loadMonth = useCallback(async () => {
    if (!profile?.formateur_id) return
    setLoading(true)

    const firstStr = `${year}-${String(month+1).padStart(2,'0')}-01`
    const lastDay  = new Date(year, month+1, 0)
    const lastStr  = toDateStr(lastDay)

    try {
      // Disponibilités du mois
      const { data: dispData, error: e1 } = await supabase
        .from('disponibilites')
        .select('date, statut')
        .eq('formateur_id', profile.formateur_id)
        .gte('date', firstStr)
        .lte('date', lastStr)
      if (e1) throw e1

      const dispMap = {}
      for (const d of (dispData || [])) dispMap[d.date] = d.statut
      setDispos(dispMap)

      // Sessions qui chevauchent le mois
      // On filtre large (date_debut <= fin du mois) et on gère côté JS les cas
      // date_fin NULL ou date_fin < date_debut (données incorrectes)
      const { data: sessData, error: e2 } = await supabase
        .from('sessions')
        .select(`id, date_debut, date_fin, statut, formations(titre), session_formateurs!inner(formateur_id)`)
        .eq('session_formateurs.formateur_id', profile.formateur_id)
        .lte('date_debut', lastStr)
        .or(`date_fin.gte.${firstStr},date_fin.is.null,date_debut.gte.${firstStr}`)
      if (e2) throw e2

      // Étaler chaque session sur ses jours
      const sessMap = {}
      for (const s of (sessData || [])) {
        const start = new Date(s.date_debut + 'T00:00:00')
        // Si date_fin absente ou incohérente, on affiche sur date_debut uniquement
        const rawEnd = s.date_fin && s.date_fin >= s.date_debut
          ? new Date(s.date_fin + 'T00:00:00')
          : start
        const cur = new Date(start)
        while (cur <= rawEnd) {
          const str = toDateStr(cur)
          if (!sessMap[str]) sessMap[str] = []
          sessMap[str].push({ titre: s.formations?.titre || 'Session', statut: s.statut })
          cur.setDate(cur.getDate() + 1)
        }
      }
      setSessionDays(sessMap)
    } catch (err) {
      console.error('[Dispos] Erreur chargement:', err.message)
    } finally {
      setLoading(false)
    }
  }, [profile?.formateur_id, year, month])

  useEffect(() => { loadMonth() }, [loadMonth])

  const handleDayClick = async (dateStr) => {
    if (saving) return
    const current  = dispos[dateStr] ?? null
    const nextIdx  = (CYCLE.indexOf(current) + 1) % CYCLE.length
    const next     = CYCLE[nextIdx]

    setSaving(dateStr)
    // Mise à jour optimiste
    setDispos(prev => {
      const n = { ...prev }
      if (next === null) delete n[dateStr]
      else n[dateStr] = next
      return n
    })

    try {
      if (next === null) {
        const { error } = await supabase
          .from('disponibilites')
          .delete()
          .eq('formateur_id', profile.formateur_id)
          .eq('date', dateStr)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('disponibilites')
          .upsert(
            { formateur_id: profile.formateur_id, date: dateStr, statut: next },
            { onConflict: 'formateur_id,date' }
          )
        if (error) throw error
      }
    } catch (err) {
      // Rollback
      console.error('[Dispos] Erreur save:', err.message)
      setDispos(prev => {
        const n = { ...prev }
        if (current === null) delete n[dateStr]
        else n[dateStr] = current
        return n
      })
    } finally {
      setSaving(null)
    }
  }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }
  const nextMonth = () => { if (month === 11) { setMonth(0);  setYear(y => y+1) } else setMonth(m => m+1) }

  // Construction de la grille
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth  = new Date(year, month+1, 0).getDate()
  // Décalage : lundi = 0, dimanche = 6
  let startDow = firstOfMonth.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = toDateStr(today)

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{
        backgroundColor: COULEURS.bg_card,
        border: `1px solid ${COULEURS.border}`,
        borderRadius: '8px',
        padding: '24px',
      }}>

        {/* Navigation mois */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={prevMonth} style={{
            background: 'none', border: `1px solid ${COULEURS.border}`,
            color: COULEURS.text_main, borderRadius: '6px',
            padding: '6px 14px', cursor: 'pointer', fontSize: '18px',
          }}>‹</button>
          <h2 style={{ color: COULEURS.text_main, margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {MOIS[month]} {year}
          </h2>
          <button onClick={nextMonth} style={{
            background: 'none', border: `1px solid ${COULEURS.border}`,
            color: COULEURS.text_main, borderRadius: '6px',
            padding: '6px 14px', cursor: 'pointer', fontSize: '18px',
          }}>›</button>
        </div>

        {/* Légende */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
          {Object.entries(STATUTS).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: COULEURS.text_sec }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: val.bg, border: `1px solid ${val.border}` }} />
              {val.label}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: COULEURS.text_sec }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.5)' }} />
            Session assignée
          </div>
        </div>
        <p style={{ fontSize: '11px', color: COULEURS.text_sec, margin: '0 0 16px 0' }}>
          Cliquez sur un jour pour changer le statut · cycle : aucun → disponible → indisponible → à confirmer → aucun
        </p>

        {loading ? (
          <p style={{ color: COULEURS.text_sec, textAlign: 'center', padding: '32px 0' }}>Chargement…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {/* En-têtes */}
            {JOURS.map(j => (
              <div key={j} style={{
                textAlign: 'center', padding: '8px 2px',
                fontSize: '12px', fontWeight: '600', color: COULEURS.text_sec,
              }}>{j}</div>
            ))}

            {/* Cellules */}
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />

              const dateStr    = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const statut     = dispos[dateStr] ?? null
              const sessions   = sessionDays[dateStr] || []
              const isToday    = dateStr === todayStr
              const isSaving   = saving === dateStr
              const statutInfo = statut ? STATUTS[statut] : null

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  title={statut ? STATUTS[statut].label : 'Cliquer pour définir'}
                  style={{
                    minHeight: '60px',
                    padding: '6px',
                    borderRadius: '6px',
                    border: isToday
                      ? `2px solid ${COULEURS.primary}`
                      : `1px solid ${statutInfo ? statutInfo.border : COULEURS.border}`,
                    backgroundColor: statutInfo ? statutInfo.bg : 'transparent',
                    cursor: isSaving ? 'wait' : 'pointer',
                    opacity: isSaving ? 0.6 : 1,
                    transition: 'all 0.12s',
                    userSelect: 'none',
                  }}
                  onMouseEnter={e => { if (!isSaving) e.currentTarget.style.opacity = '0.8' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = isSaving ? '0.6' : '1' }}
                >
                  {/* Numéro du jour */}
                  <div style={{
                    fontSize: '13px',
                    fontWeight: isToday ? '700' : '400',
                    color: isToday ? COULEURS.primary : COULEURS.text_main,
                    marginBottom: sessions.length ? '4px' : 0,
                  }}>
                    {day}
                  </div>

                  {/* Badges sessions */}
                  {sessions.slice(0, 2).map((s, si) => (
                    <div key={si} style={{
                      fontSize: '10px',
                      padding: '1px 4px',
                      marginBottom: '2px',
                      backgroundColor: 'rgba(59,130,246,0.2)',
                      border: '1px solid rgba(59,130,246,0.4)',
                      borderRadius: '3px',
                      color: '#93c5fd',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {s.titre}
                    </div>
                  ))}
                  {sessions.length > 2 && (
                    <div style={{ fontSize: '10px', color: COULEURS.text_sec }}>+{sessions.length - 2}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
