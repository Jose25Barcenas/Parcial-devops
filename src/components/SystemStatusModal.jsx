import { useState, useEffect, useCallback, useRef } from 'react'
import styles from '../styles/Dashboard.module.css'

const REFRESH_MS = 10000

function fmtTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-CO', { hour12: false })
  } catch {
    return iso
  }
}

function statusTone(status) {
  if (status === 'ok') return { label: 'Operativo', color: '#1B5E20', bg: 'rgba(75,127,82,0.15)' }
  if (status === 'degraded') return { label: 'Degradado', color: '#B45309', bg: 'rgba(214,182,86,0.25)' }
  return { label: 'Caído', color: '#D32F2F', bg: 'rgba(211,47,47,0.12)' }
}

function ServiceRow({ name, ok, detail }) {
  return (
    <div className={styles.statusRow}>
      <span className={styles.statusRowDot} style={{ background: ok ? '#4B7F52' : '#D32F2F' }} />
      <span className={styles.statusRowName}>{name}</span>
      <span className={styles.statusRowState} style={{ color: ok ? '#4B7F52' : '#D32F2F' }}>
        {ok ? 'Operativo' : 'Caído'}
      </span>
      {detail && <span className={styles.statusRowDetail}>{detail}</span>}
    </div>
  )
}

/**
 * Modal "Estado del sistema" (solo dashboard admin).
 * Consulta GET /health (publico) y muestra API, MongoDB, Frontend y version.
 */
export default function SystemStatusModal({ onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [checkedAt, setCheckedAt] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const mountedRef = useRef(true)

  const check = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/health')
      const body = await res.json().catch(() => null)
      if (!mountedRef.current) return
      if (!body) {
        setError('Respuesta invalida del servidor')
        setData(null)
      } else {
        setError('')
        setData(body)
        setCheckedAt(new Date().toISOString())
      }
    } catch {
      if (!mountedRef.current) return
      setError('No se pudo consultar /health')
      setData(null)
      setCheckedAt(new Date().toISOString())
    } finally {
      if (mountedRef.current) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    check()
    const id = setInterval(check, REFRESH_MS)
    return () => {
      mountedRef.current = false
      clearInterval(id)
    }
  }, [check])

  const overall = statusTone(data?.status || (error ? 'down' : 'ok'))
  const dbUp = data?.database === 'up'
  const apiUp = !!data && !error

  return (
    <div className={styles.statusOverlay} onClick={onClose}>
      <div className={styles.statusModal} onClick={e => e.stopPropagation()}>
        <div className={styles.statusHeader}>
          <div>
            <h3 className={styles.statusTitle}>Estado del sistema</h3>
            <p className={styles.statusSubtitle}>Verificacion en vivo de los servicios de SION</p>
          </div>
          <button className={styles.statusClose} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className={styles.statusBadge} style={{ color: overall.color, background: overall.bg }}>
          <span className={styles.statusBadgeDot} style={{ background: overall.color }} />
          {error ? 'Sin conexion' : overall.label}
        </div>

        <div className={styles.statusList}>
          <ServiceRow name="Frontend (React)" ok detail="Esta pagina cargó" />
          <ServiceRow name="API Backend" ok={apiUp} detail={data?.service || 'sion-backend'} />
          <ServiceRow name="MongoDB" ok={dbUp} detail={dbUp ? 'Ping correcto' : 'Sin respuesta'} />
        </div>

        <div className={styles.statusMeta}>
          <div><span>Version</span><strong>{data?.version || '—'}</strong></div>
          <div><span>Ultima verificacion</span><strong>{fmtTime(checkedAt)}</strong></div>
        </div>

        {error && <p className={styles.statusError}>{error}</p>}

        <div className={styles.statusActions}>
          <button className={styles.statusRefresh} onClick={check} disabled={refreshing}>
            {refreshing ? 'Actualizando…' : 'Actualizar ahora'}
          </button>
          <button className={styles.statusCloseBtn} onClick={onClose}>Cerrar</button>
        </div>
        <p className={styles.statusHint}>Se actualiza solo cada 10 segundos mientras este abierto.</p>
      </div>
    </div>
  )
}
