import { useState, useEffect } from 'react'
import { inscriptionService } from '../services/inscriptionService'
import { admissionService } from '../services/admissionService'
import { userService } from '../services/userService'
import styles from '../styles/Dashboard.module.css'

const DECISION_META = {
  admitted: { label: 'Admitido', color: '#4B7F52', bg: 'rgba(75,127,82,0.12)' },
  rejected: { label: 'Rechazado', color: '#D32F2F', bg: 'rgba(211,47,47,0.1)' },
  pending: { label: 'En evaluacion', color: '#8A6D1A', bg: 'rgba(214,182,86,0.18)' },
}

const STATUS_META = {
  completed: { label: 'Pago completado', color: '#4B7F52', bg: 'rgba(75,127,82,0.12)' },
  pending: { label: 'Pago pendiente', color: '#8A6D1A', bg: 'rgba(214,182,86,0.18)' },
}

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() < 6 ? 'I' : 'II'}`
}

const fmtDate = ts => (ts
  ? new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—')

export default function AdmissionsPanel({ onUpdated }) {
  const [inscriptions, setInscriptions] = useState([])
  const [users, setUsers] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [insResp, usersResp, resResp] = await Promise.all([
          inscriptionService.getAll(1, 100),
          userService.getAll(1, 100),
          admissionService.getAll(1, 100),
        ])
        if (cancelled) return
        setInscriptions(insResp.data || [])
        setUsers(usersResp.data || [])
        setResults(resResp.data || [])
        setError('')
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar las admisiones')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [reloadKey])

  async function decide(inscriptionId, decision) {
    const label = decision === 'admitted' ? 'Admitir' : 'Rechazar'
    if (!window.confirm(`${label} esta inscripcion? Esta decision sera visible para el aspirante.`)) return
    setActingId(inscriptionId)
    setError('')
    try {
      await admissionService.create({ inscriptionId, decision, period: currentPeriod() })
      setReloadKey(k => k + 1)
      onUpdated?.()
    } catch (err) {
      setError(err.message || 'Error al registrar la decision')
    } finally {
      setActingId(null)
    }
  }

  async function changeDecision(result, decision) {
    const label = decision === 'admitted' ? 'admitir' : 'rechazar'
    if (!window.confirm(`Cambiar la decision a "${label}" para esta inscripcion?`)) return
    setActingId(result.id)
    setError('')
    try {
      await admissionService.update(result.id, {
        inscriptionId: result.inscriptionId,
        decision,
        period: result.period || currentPeriod(),
        notes: result.notes,
      })
      setReloadKey(k => k + 1)
      onUpdated?.()
    } catch (err) {
      setError(err.message || 'Error al actualizar la decision')
    } finally {
      setActingId(null)
    }
  }

  const usersById = Object.fromEntries(users.map(u => [u.id, u]))
  const insById = Object.fromEntries(inscriptions.map(i => [i.id, i]))
  const resolvedInscriptionIds = new Set(results.map(r => r.inscriptionId))
  const pending = inscriptions.filter(i => !resolvedInscriptionIds.has(i.id))

  const personName = ins => usersById[ins?.userId]?.fullName || 'Aspirante'

  return (
    <div className={styles.dashboardCard} style={{ marginBottom: '1.5rem' }}>
      <div className={styles.dashboardCardHeader}>
        <h2 className={styles.dashboardCardTitle}>Gestion de Admisiones</h2>
        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Decisiones del comite · periodo {currentPeriod()}</span>
      </div>
      <div className={styles.dashboardCardBody}>
        {error && <div className={styles.dashboardError}>{error}</div>}
        {loading ? (
          <p className={styles.adminEmpty}>Cargando admisiones...</p>
        ) : (
          <>
            <p className={styles.adminSectionTitle}>Inscripciones sin resultado ({pending.length})</p>
            {pending.length === 0 && <p className={styles.adminEmpty}>Todas las inscripciones tienen resultado</p>}
            {pending.map(ins => {
              const status = STATUS_META[ins.status] || STATUS_META.pending
              return (
                <div key={ins.id} className={styles.adminRow}>
                  <div className={styles.adminRowInfo}>
                    <span className={styles.adminRowName}>{personName(ins)}</span>
                    <span className={styles.adminRowMeta}>{ins.program} · {ins.schedule} · {fmtDate(ins.createdAt)}</span>
                  </div>
                  <div className={styles.adminRowActions}>
                    <span className={styles.adminBadge} style={{ color: status.color, background: status.bg }}>{status.label}</span>
                    <button
                      className={`${styles.adminBtn} ${styles.adminBtnSuccess}`}
                      disabled={actingId === ins.id}
                      onClick={() => decide(ins.id, 'admitted')}
                    >
                      {actingId === ins.id ? '...' : 'Admitir'}
                    </button>
                    <button
                      className={`${styles.adminBtn} ${styles.adminBtnDanger}`}
                      disabled={actingId === ins.id}
                      onClick={() => decide(ins.id, 'rejected')}
                    >
                      {actingId === ins.id ? '...' : 'Rechazar'}
                    </button>
                  </div>
                </div>
              )
            })}

            <p className={styles.adminSectionTitle}>Decisiones registradas ({results.length})</p>
            {results.length === 0 && <p className={styles.adminEmpty}>Sin decisiones aun</p>}
            {results.map(res => {
              const ins = insById[res.inscriptionId]
              const meta = DECISION_META[res.decision] || DECISION_META.pending
              return (
                <div key={res.id} className={styles.adminRow}>
                  <div className={styles.adminRowInfo}>
                    <span className={styles.adminRowName}>{personName(ins)}</span>
                    <span className={styles.adminRowMeta}>
                      {ins ? `${ins.program} · ${ins.schedule}` : 'Inscripcion'} · {res.evaluatedAt ? `evaluada ${fmtDate(res.evaluatedAt)}` : 'sin fecha de evaluacion'}
                    </span>
                  </div>
                  <div className={styles.adminRowActions}>
                    <span className={styles.adminBadge} style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                    {res.decision !== 'admitted' && (
                      <button
                        className={`${styles.adminBtn} ${styles.adminBtnSuccess}`}
                        disabled={actingId === res.id}
                        onClick={() => changeDecision(res, 'admitted')}
                      >
                        {actingId === res.id ? '...' : 'Admitir'}
                      </button>
                    )}
                    {res.decision !== 'rejected' && (
                      <button
                        className={`${styles.adminBtn} ${styles.adminBtnDanger}`}
                        disabled={actingId === res.id}
                        onClick={() => changeDecision(res, 'rejected')}
                      >
                        {actingId === res.id ? '...' : 'Rechazar'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
