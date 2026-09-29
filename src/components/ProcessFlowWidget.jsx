import styles from '../styles/Dashboard.module.css'

const STAGE_LABELS = { inscription: 'Inscripcion', payment: 'Pago', documents: 'Documentos', admission: 'Admision', completed: 'Completado' }

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
