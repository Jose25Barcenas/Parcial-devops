import { useState, useEffect } from 'react'
import { analyticsService } from '../services/analyticsService'
import styles from '../styles/Dashboard.module.css'

const STAGE_CONFIG = {
  inscription: { label: 'Inscripcion', icon: '1', colorClass: 'processFlowCircleInscription' },
  payment: { label: 'Pago', icon: '2', colorClass: 'processFlowCirclePayment' },
  documents: { label: 'Documentos', icon: '3', colorClass: 'processFlowCircleDocuments' },
  admission: { label: 'Admision', icon: '4', colorClass: 'processFlowCircleAdmission' },
}

export function ProcessFlowDiagram() {
  const [processCounts, setProcessCounts] = useState({ inscription: 0, payment: 0, documents: 0, admission: 0, completed: 0 })
  const [stageAvgs, setStageAvgs] = useState({ inscription: 0, payment: 0, documents: 0, admission: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const [counts, avgs] = await Promise.all([
          analyticsService.getProcessesByStage(),
          analyticsService.getStageAverages(),
        ])
        if (cancelled) return
        setProcessCounts(counts || {})
        setStageAvgs(avgs || {})
      } catch (error) {
        console.error('Error loading process flow:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  const stages = ['inscription', 'payment', 'documents', 'admission']
  const nextStage = { inscription: 'payment', payment: 'documents', documents: 'admission' }

  if (loading) {
    return <div style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>Cargando flujo del proceso...</div>
  }

  return (
    <div className={styles.processFlow}>
      {stages.map((stage, i) => {
        const cfg = STAGE_CONFIG[stage]
        const count = processCounts[stage] || 0
        const avg = stageAvgs[stage] || 0
        const avgLabel = avg < 1 ? `${Math.round(avg * 24)}h` : `${avg} dias`

        return (
          <div key={stage} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div className={styles.processFlowNode}>
              <div className={`${styles.processFlowCircle} ${styles[cfg.colorClass]}`}>
                {cfg.icon}
              </div>
              <div className={styles.processFlowLabel}>{cfg.label}</div>
              <div className={styles.processFlowStats}>{count} en proceso</div>
              <div className={styles.processFlowTime}>Promedio: {avgLabel}</div>
            </div>
            {i < stages.length - 1 && (
              <div className={styles.processFlowArrow}>
                <div className={styles.processFlowArrowLine}>
                  <span className={styles.processFlowArrowTime}>
                    → {stageAvgs[nextStage[stage]] ? (stageAvgs[nextStage[stage]] < 1 ? `${Math.round(stageAvgs[nextStage[stage]] * 24)}h` : `${stageAvgs[nextStage[stage]]}d`) : '-'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div className={styles.processFlowNode}>
          <div className={`${styles.processFlowCircle} ${styles.processFlowCircleAdmission}`} style={{ background: processCounts.completed > 0 ? '#4B7F52' : '#D1D5DB' }}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
          </div>
          <div className={styles.processFlowLabel}>Completados</div>
          <div className={styles.processFlowStats}>{processCounts.completed} finalizados</div>
        </div>
      </div>
    </div>
  )
}

export function ProcessTable() {
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const data = await analyticsService.getTimeline()
        if (cancelled) return
        setTimeline(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error loading timeline:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  const stageLabels = {
    inscription: 'Inscripcion',
    payment: 'Pago',
    documents: 'Documentos',
    admission: 'Admision',
    completed: 'Completado',
  }

  const stageChipClass = {
    inscription: styles.stageChipInscription,
    payment: styles.stageChipPayment,
    documents: styles.stageChipDocuments,
    admission: styles.stageChipAdmission,
    completed: styles.stageChipCompleted,
  }

  const decisionClass = {
    admitted: styles.decisionAdmitted,
    rejected: styles.decisionRejected,
    pending: styles.decisionPending,
  }

  const decisionLabels = {
    admitted: 'Admitido',
    rejected: 'Rechazado',
    pending: 'Pendiente',
  }

  if (loading) {
    return <div style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>Cargando tabla de procesos...</div>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className={styles.processTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Programa</th>
            <th>Jornada</th>
            <th>Etapa Actual</th>
            <th>Decision</th>
            <th>Fecha Creacion</th>
          </tr>
        </thead>
        <tbody>
          {timeline.map(p => (
            <tr key={p.id}>
              <td><span className={styles.processTableId}>{p.id?.slice(-8) || p.id}</span></td>
              <td>{p.program}</td>
              <td>{p.schedule}</td>
              <td><span className={`${styles.stageChip} ${stageChipClass[p.currentStage]}`}>{stageLabels[p.currentStage]}</span></td>
              <td><span className={`${styles.decisionChip} ${decisionClass[p.decision]}`}>{decisionLabels[p.decision]}</span></td>
              <td><span className={styles.timeCell}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-CO') : '-'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
