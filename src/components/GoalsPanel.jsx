import { useState, useEffect, useRef } from 'react'
import { analyticsService } from '../services/analyticsService'
import { goalService } from '../services/goalService'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/Dashboard.module.css'
import formStyles from '../styles/Components.module.css'

const GOAL_TYPES = [
  { key: 'inscriptions', label: 'Inscripciones totales', unit: 'count' },
  { key: 'revenue', label: 'Ingresos por inscripcion (COP)', unit: 'currency' },
  { key: 'admitted', label: 'Aspirantes admitidos', unit: 'count' },
  { key: 'documents', label: 'Documentos cargados', unit: 'count' },
  { key: 'admissionRate', label: 'Tasa de admision (%)', unit: 'percent' },
]

function formatGoalValue(value, unit) {
  const num = Number(value) || 0
  if (unit === 'currency') return `$${Math.round(num).toLocaleString('es-CO')}`
  if (unit === 'percent') return `${Math.round(num)}%`
  return Math.round(num).toLocaleString('es-CO')
}

function defaultPeriod() {
  return `${new Date().getFullYear()}-${new Date().getMonth() < 6 ? 'I' : 'II'}`
}

export default function GoalsPanel() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ key: 'inscriptions', label: 'Inscripciones totales', target: '', period: defaultPeriod() })

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    loadGoals()
    return () => { mountedRef.current = false }
  }, [])

  async function loadGoals() {
    try {
      const data = await analyticsService.getGoalsProgress()
      if (!mountedRef.current) return
      setGoals(Array.isArray(data) ? data : [])
    } catch (err) {
      if (!mountedRef.current) return
      setError(err.message || 'Error al cargar metas')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm({ key: 'inscriptions', label: 'Inscripciones totales', target: '', period: defaultPeriod() })
    setFormError('')
    setShowForm(true)
  }

  function openEdit(goal) {
    setEditingId(goal.id)
    const type = GOAL_TYPES.find(t => t.key === goal.key)
    setForm({ key: goal.key, label: goal.label || type?.label || goal.key, target: String(goal.target ?? ''), period: goal.period || defaultPeriod() })
    setFormError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setFormError('')
  }

  function handleTypeChange(key) {
    const type = GOAL_TYPES.find(t => t.key === key)
    setForm(prev => ({ ...prev, key, label: type ? type.label : prev.label }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const target = Number(form.target)
    if (!form.label.trim()) {
      setFormError('El nombre de la meta es requerido')
      return
    }
    if (!Number.isFinite(target) || target <= 0) {
      setFormError('La meta debe ser un numero mayor a 0')
      return
    }

    const payload = { key: form.key, label: form.label.trim(), target, period: form.period.trim() || defaultPeriod() }

    setSaving(true)
    try {
      if (editingId) {
        await goalService.update(editingId, payload)
      } else {
        await goalService.create(payload)
      }
      setShowForm(false)
      await loadGoals()
    } catch (err) {
      setFormError(err.message || 'Error al guardar la meta')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(goal) {
    if (!window.confirm(`¿Eliminar la meta "${goal.label}"?`)) return
    try {
      await goalService.remove(goal.id)
      await loadGoals()
    } catch (err) {
      setError(err.message || 'Error al eliminar la meta')
    }
  }

  const overallPercent = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + Math.min(g.percent ?? 0, 100), 0) / goals.length)
    : 0

  return (
    <div className={styles.dashboardCard} style={{ marginBottom: '1.5rem' }}>
      <div className={styles.dashboardCardHeader}>
        <h2 className={styles.dashboardCardTitle}>Metas del Periodo</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {goals.length > 0 && (
            <span className={styles.goalsOverall}>Cumplimiento global: {overallPercent}%</span>
          )}
          {isAdmin && !showForm && (
            <button onClick={openCreate} className={styles.goalsAddBtn}>
              + Nueva meta
            </button>
          )}
        </div>
      </div>

      <div className={styles.dashboardCardBody}>
        {error && <p className={styles.goalsError}>{error}</p>}

        {showForm && (
          <form onSubmit={handleSubmit} className={styles.goalsForm}>
            <div className={styles.goalsFormGrid}>
              <div>
                <label className={formStyles.fieldLabel}>Indicador</label>
                <select value={form.key} onChange={e => handleTypeChange(e.target.value)} className={formStyles.fieldSelect}>
                  {GOAL_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={formStyles.fieldLabel}>Nombre de la meta</label>
                <input type="text" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                  className={formStyles.fieldInput} placeholder="Ej: Inscripciones totales" />
              </div>
              <div>
                <label className={formStyles.fieldLabel}>Valor objetivo</label>
                <input type="number" min="1" step="1" value={form.target}
                  onChange={e => setForm({ ...form, target: e.target.value })}
                  className={formStyles.fieldInput} placeholder="Ej: 50" />
              </div>
              <div>
                <label className={formStyles.fieldLabel}>Periodo</label>
                <input type="text" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                  className={formStyles.fieldInput} placeholder="2026-II" />
              </div>
            </div>
            {formError && <p className={styles.goalsError}>{formError}</p>}
            <div className={styles.goalsFormActions}>
              <button type="button" onClick={closeForm} className={`${formStyles.btn} ${formStyles.btnGhost} ${formStyles.btnSm}`}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} className={`${formStyles.btn} ${formStyles.btnPrimary} ${formStyles.btnSm}`}>
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear meta'}
              </button>
            </div>
          </form>
        )}

        {loading && <p className={styles.goalsEmpty}>Cargando metas...</p>}

        {!loading && goals.length === 0 && !showForm && (
          <div className={styles.goalsEmpty}>
            <p>No hay metas configuradas {isAdmin ? 'todavia.' : 'disponibles.'}</p>
            {isAdmin && (
              <button onClick={openCreate} className={`${formStyles.btn} ${formStyles.btnPrimary} ${formStyles.btnSm}`}>
                Crear primera meta
              </button>
            )}
          </div>
        )}

        {!loading && goals.length > 0 && (
          <div className={styles.goalsGrid}>
            {goals.map(goal => {
              const pct = Math.min(Math.max(goal.percent ?? 0, 0), 100)
              const achieved = goal.achieved
              return (
                <div key={goal.id} className={styles.goalCard}>
                  <div className={styles.goalCardHeader}>
                    <span className={styles.goalCardTitle}>{goal.label}</span>
                    <span className={`${styles.goalCardBadge} ${achieved ? styles.goalCardBadgeOk : styles.goalCardBadgePending}`}>
                      {achieved ? 'Lograda' : 'Pendiente'}
                    </span>
                  </div>

                  <div className={styles.goalValues}>
                    <div className={styles.goalValueItem}>
                      <span className={styles.goalValueLabel}>Real</span>
                      <span className={`${styles.goalValueNumber} ${achieved ? styles.goalValueNumberOk : ''}`}>
                        {formatGoalValue(goal.actual, goal.unit)}
                      </span>
                    </div>
                    <div className={styles.goalValueItem}>
                      <span className={styles.goalValueLabel}>Meta</span>
                      <span className={styles.goalValueNumberGoal}>{formatGoalValue(goal.target, goal.unit)}</span>
                    </div>
                  </div>

                  <div className={styles.goalProgressTrack}>
                    <div className={`${styles.goalProgressFill} ${achieved ? styles.goalProgressFillOk : styles.goalProgressFillPending}`}
                      style={{ width: `${pct}%` }} />
                  </div>

                  <div className={styles.goalFooter}>
                    <span className={styles.goalPercent}>{goal.percent ?? 0}% cumplido</span>
                    <span className={styles.goalPeriod}>{goal.period}</span>
                  </div>

                  {isAdmin && !showForm && (
                    <div className={styles.goalActions}>
                      <button onClick={() => openEdit(goal)} className={styles.goalActionBtn}>Editar</button>
                      <button onClick={() => handleDelete(goal)} className={`${styles.goalActionBtn} ${styles.goalActionBtnDanger}`}>Eliminar</button>
                    </div>
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
