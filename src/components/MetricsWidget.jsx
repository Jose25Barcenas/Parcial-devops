import { analyticsService } from '../services/analyticsService'
import styles from '../styles/Dashboard.module.css'

const STAGE_LABELS = { inscription: 'Inscripcion', payment: 'Pago', documents: 'Documentos', admission: 'Admision', completed: 'Completado' }

export function MetricsWidget({ currentStage }) {
  const kpis = analyticsService.getKPIs()
  const processCounts = analyticsService.getProcessesByStage()

  const inCurrentStage = processCounts[currentStage] || 0

  const avgTime = kpis.avgByStage[currentStage] || 0
  const avgLabel = avgTime < 1 ? `${Math.round(avgTime * 24)} horas` : avgTime === 1 ? '1 dia' : `${avgTime} dias`

  return (
    <div className={styles.metricsWidget}>
      <div className={styles.metricsWidgetTitle}>Metricas del proceso</div>

      <div className={styles.metricsWidgetItem}>
        <span className={styles.metricsWidgetItemLabel}>Tiempo promedio etapa</span>
        <span className={`${styles.metricsWidgetItemValue} ${styles.metricsWidgetItemValueNeutral}`}>{avgLabel}</span>
      </div>

      <div className={styles.metricsWidgetItem}>
        <span className={styles.metricsWidgetItemLabel}>En esta etapa</span>
        <span className={`${styles.metricsWidgetItemValue} ${styles.metricsWidgetItemValueWarn}`}>{inCurrentStage} aspirantes</span>
      </div>

      <div className={styles.metricsWidgetItem}>
        <span className={styles.metricsWidgetItemLabel}>Procesos completados</span>
        <span className={`${styles.metricsWidgetItemValue} ${styles.metricsWidgetItemValueOk}`}>{processCounts.completed || 0}</span>
      </div>

      <div className={styles.metricsWidgetItem}>
        <span className={styles.metricsWidgetItemLabel}>Tasa de admision</span>
        <span className={`${styles.metricsWidgetItemValue} ${styles.metricsWidgetItemValueOk}`}>{kpis.admissionRate}%</span>
      </div>

      <div className={styles.metricsWidgetFooter}>
        Datos actualizados: {new Date().toLocaleDateString('es-CO')}
      </div>
    </div>
  )
}

export function ProcessFlowWidget({ currentStage }) {
  const stages = ['inscription', 'payment', 'documents', 'admission']
  const currentIdx = stages.indexOf(currentStage)

  return (
    <div className={styles.processFlowWidget}>
      {stages.map((stage, i) => {
        const isDone = i < currentIdx
        const isActive = i === currentIdx
        const dotClass = isDone ? styles.processFlowWidgetDotDone : isActive ? styles.processFlowWidgetDotActive : styles.processFlowWidgetDotPending

        return (
          <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div className={styles.processFlowWidgetNode}>
              <div className={`${styles.processFlowWidgetDot} ${dotClass}`}>
                {isDone ? (
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
                ) : i + 1}
              </div>
              <div className={styles.processFlowWidgetLabel}>{STAGE_LABELS[stage]}</div>
            </div>
            {i < stages.length - 1 && (
              <div className={`${styles.processFlowWidgetArrow} ${i < currentIdx ? styles.processFlowWidgetArrowDone : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
