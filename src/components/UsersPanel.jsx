import { useState, useEffect } from 'react'
import { userService } from '../services/userService'
import styles from '../styles/Dashboard.module.css'

const ROLE_META = {
  admin: { label: 'Admin', color: '#2A5783', bg: 'rgba(42,87,131,0.12)' },
  aspirant: { label: 'Aspirante', color: '#6B7280', bg: '#F3F4F6' },
}

const fmtDate = ts => (ts
  ? new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—')

export default function UsersPanel({ currentUserId }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const resp = await userService.getAll(1, 100)
        if (cancelled) return
        setUsers(resp.data || [])
        setError('')
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar los usuarios')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [reloadKey])

  async function toggleRole(u) {
    const newRole = u.role === 'admin' ? 'aspirant' : 'admin'
    if (!window.confirm(`Cambiar rol de ${u.fullName} a ${newRole}?`)) return
    setActingId(u.id)
    setError('')
    try {
      await userService.update(u.id, { role: newRole })
      setReloadKey(k => k + 1)
    } catch (err) {
      setError(err.message || 'Error al cambiar el rol')
    } finally {
      setActingId(null)
    }
  }

  async function removeUser(u) {
    if (!window.confirm(`Eliminar la cuenta de ${u.fullName}? Esta accion no se puede deshacer.`)) return
    setActingId(u.id)
    setError('')
    try {
      await userService.remove(u.id)
      setReloadKey(k => k + 1)
    } catch (err) {
      setError(err.message || 'Error al eliminar el usuario')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className={styles.dashboardCard} style={{ marginBottom: '1.5rem' }}>
      <div className={styles.dashboardCardHeader}>
        <h2 className={styles.dashboardCardTitle}>Gestion de Usuarios</h2>
        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{users.length} cuentas registradas</span>
      </div>
      <div className={styles.dashboardCardBody}>
        {error && <div className={styles.dashboardError}>{error}</div>}
        {loading ? (
          <p className={styles.adminEmpty}>Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p className={styles.adminEmpty}>Sin usuarios registrados</p>
        ) : users.map(u => {
          const role = ROLE_META[u.role] || ROLE_META.aspirant
          const isSelf = u.id === currentUserId
          return (
            <div key={u.id} className={styles.adminRow}>
              <div className={styles.adminRowInfo}>
                <span className={styles.adminRowName}>
                  {u.fullName} {isSelf && <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '0.75rem' }}>(tu)</span>}
                </span>
                <span className={styles.adminRowMeta}>{u.email} · {u.phone || 'sin telefono'} · alta {fmtDate(u.createdAt)}</span>
              </div>
              <div className={styles.adminRowActions}>
                <span className={styles.adminBadge} style={{ color: role.color, background: role.bg }}>{role.label}</span>
                {!isSelf && (
                  <>
                    <button
                      className={`${styles.adminBtn} ${styles.adminBtnNeutral}`}
                      disabled={actingId === u.id}
                      onClick={() => toggleRole(u)}
                    >
                      {actingId === u.id ? '...' : u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                    <button
                      className={`${styles.adminBtn} ${styles.adminBtnDanger}`}
                      disabled={actingId === u.id}
                      onClick={() => removeUser(u)}
                    >
                      {actingId === u.id ? '...' : 'Eliminar'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
