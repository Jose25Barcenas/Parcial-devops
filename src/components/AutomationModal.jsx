import { useState } from 'react'
import styles from '../styles/Components.module.css'

const FLOW_STEPS = [
  {
    n: 1,
    title: 'Aspirante crea inscripcion',
    desc: 'El usuario completa el formulario en el frontend React y el backend Spring Boot guarda la inscripcion en MongoDB.',
    tech: 'React + Spring Boot',
    color: '#2A5783',
  },
  {
    n: 2,
    title: 'Backend dispara evento',
    desc: 'Al guardar, N8nService envia un POST automatico al webhook de n8n con los datos del aspirante (email, nombre, programa).',
    tech: 'REST / Webhook',
    color: '#6B21A8',
  },
  {
    n: 3,
    title: 'n8n recibe y procesa',
    desc: 'n8n ejecuta el workflow: recibe el payload, lo formatea con un nodo Code y prepara el mensaje de confirmacion.',
    tech: 'n8n workflow',
    color: '#D6B656',
  },
  {
    n: 4,
    title: 'Accion automatizada',
    desc: 'El workflow queda listo para enviar email, notificar al admin o registrar en log. En la pestaña Executions se ve el historial.',
    tech: 'Email / Notificacion',
    color: '#4B7F52',
  },
]

const FLOWS = [
  {
    id: 'inscription',
    trigger: 'POST /inscriptions',
    name: 'Inscripción creada',
    event: 'inscription-created',
    color: '#2A5783',
    status: 'Activo',
    steps: [
      { label: 'Webhook', desc: 'Recibe el evento del backend con email, nombre, programa y jornada' },
      { label: 'Formatar Email', desc: 'Nodo Code JS: transforma el payload en asunto, cuerpo y destinatario' },
      { label: 'Registro', desc: 'Confirma la ejecución y queda en el historial de Executions' },
    ],
    payload: '{ inscriptionId, userId, program, schedule, status, email, name }',
  },
  {
    id: 'payment',
    trigger: 'PATCH /payments/{id}/confirm',
    name: 'Pago confirmado',
    event: 'payment-confirmed',
    color: '#4B7F52',
    status: 'Activo',
    steps: [
      { label: 'Webhook', desc: 'Recibe evento cuando tesorería o el sistema confirma un pago' },
      { label: 'Formatar Email', desc: 'Genera mensaje de confirmación con monto, método y programa' },
      { label: 'Registro', desc: 'Ejecución guardada con datos del pago para auditoría' },
    ],
    payload: '{ paymentId, inscriptionId, amount, method, transactionId, email, name, program }',
  },
  {
    id: 'user',
    trigger: 'POST /auth/register',
    name: 'Usuario registrado',
    event: 'user-registered',
    color: '#6B21A8',
    status: 'Activo',
    steps: [
      { label: 'Webhook', desc: 'Recibe evento cuando un aspirante crea su cuenta en el portal' },
      { label: 'Formatar Email', desc: 'Genera el mensaje de bienvenida con nombre y correo' },
      { label: 'Registro', desc: 'Ejecución guardada en el historial de n8n' },
    ],
    payload: '{ userId, email, name, role, registeredAt }',
  },
  {
    id: 'document',
    trigger: 'POST /documents/upload',
    name: 'Documento cargado',
    event: 'document-uploaded',
    color: '#D6B656',
    status: 'Activo',
    steps: [
      { label: 'Webhook', desc: 'Recibe evento con cada documento que sube el aspirante' },
      { label: 'Formatar Email', desc: 'Traduce el tipo de documento a texto legible (identidad, ICFES, diploma...)' },
      { label: 'Registro', desc: 'Historial util para detectar documentos faltantes' },
    ],
    payload: '{ documentId, inscriptionId, docType, status, userId, email, name, program, uploadedAt }',
  },
  {
    id: 'admission',
    trigger: 'POST /admissions',
    name: 'Resultado de admisión',
    event: 'admission-decided',
    color: '#4B7F52',
    status: 'Activo',
    steps: [
      { label: 'Webhook', desc: 'Recibe evento cuando el comité registra la decisión (admitted/rejected)' },
      { label: 'Formatar Email', desc: 'Convierte la decisión en mensaje legible con periodo y programa' },
      { label: 'Registro', desc: 'Queda registrado para auditoría del comité' },
    ],
    payload: '{ admissionId, inscriptionId, decision, period, notes, evaluatedAt, email, name, program }',
  },
]

const PLANNED = [
  { icon: '📧', title: 'Email de bienvenida', desc: 'SMTP real (Gmail/Outlook) al confirmar inscripción', status: 'Siguiente paso' },
  { icon: '📄', title: 'Recordatorio de documentos', desc: 'Cron diario que recuerda docs pendientes al aspirante', status: 'Planificado' },
  { icon: '🔔', title: 'Notificación al admin', desc: 'Alerta por Telegram/Slack cuando hay nuevo pago', status: 'Planificado' },
  { icon: '📊', title: 'Reporte semanal', desc: 'Resumen automático de inscripciones y pagos a decanatura', status: 'Planificado' },
]

const ARCHITECTURE = [
  { label: 'Frontend', tech: 'React 19 + Vite', desc: 'Portal del aspirante y dashboard admin' },
  { label: 'Backend', tech: 'Spring Boot 3 + Java 17', desc: 'API REST con JWT, dispara eventos a n8n' },
  { label: 'Base de datos', tech: 'MongoDB 7 (Atlas)', desc: 'Usuarios, inscripciones, pagos, documentos' },
  { label: 'Automatización', tech: 'n8n (self-hosted)', desc: 'Workflows visuales: webhooks → procesamiento → acciones' },
]

export function AutomationModal({ onClose }) {
  const [view, setView] = useState('intro') // 'intro' | 'detail'
  const [tab, setTab] = useState('flows')
  const [openFlow, setOpenFlow] = useState('inscription')
  const [activeStep, setActiveStep] = useState(null)

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.automationModal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.automationHeader}>
          <div>
            <div className={styles.automationBadge}>Procesos y Automatizacion</div>
            <h2 className={styles.automationTitle}>Flujo de automatizacion SION + n8n</h2>
            <p className={styles.automationSubtitle}>
              Cada vez que un aspirante crea una inscripcion, el backend dispara automaticamente un workflow en n8n.
            </p>
          </div>
          <button onClick={onClose} className={styles.automationClose}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>

        {view === 'intro' ? (
          <>
            {/* Diagrama explicativo */}
            <div className={styles.automationFlow}>
              {FLOW_STEPS.map((step, i) => (
                <div key={step.n} style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
                  <button
                    onClick={() => setActiveStep(activeStep === step.n ? null : step.n)}
                    className={`${styles.automationStep} ${activeStep === step.n ? styles.automationStepActive : ''}`}
                    style={{ '--step-color': step.color }}
                  >
                    <div className={styles.automationStepNumber} style={{ background: step.color }}>{step.n}</div>
                    <div className={styles.automationStepBody}>
                      <div className={styles.automationStepTitle}>{step.title}</div>
                      <div className={styles.automationStepTech}>{step.tech}</div>
                    </div>
                    {activeStep === step.n && (
                      <div className={styles.automationStepDesc}>{step.desc}</div>
                    )}
                  </button>
                  {i < FLOW_STEPS.length - 1 && (
                    <div className={styles.automationArrow}>
                      <svg width="20" height="20" fill="#9CA3AF" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer intro */}
            <div className={styles.automationFooter}>
              <div className={styles.automationInfoBox}>
                <div className={styles.automationInfoIcon}>
                  <svg width="18" height="18" fill="#2A5783" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                </div>
                <div>
                  <div className={styles.automationInfoTitle}>Como verlo en vivo</div>
                  <div className={styles.automationInfoText}>
                    1. Cree una inscripcion en este portal · 2. Abra <strong>n8n (localhost:5678)</strong> · 3. Vaya a la pestaña <strong>Executions</strong> · 4. Vera la ejecucion del workflow con los datos reales
                  </div>
                </div>
              </div>
              <button className={styles.automationDetailBtn} onClick={() => setView('detail')}>
                Ver detalle tecnico
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Tabs */}
            <div className={styles.automationTabs}>
              {[
                { id: 'flows', label: 'Workflows activos' },
                { id: 'planned', label: 'Automatizaciones' },
                { id: 'arch', label: 'Arquitectura' },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`${styles.automationTab} ${tab === t.id ? styles.automationTabActive : ''}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab: Workflows */}
            {tab === 'flows' && (
              <div className={styles.automationFlowsList}>
                {FLOWS.map(flow => (
                  <div key={flow.id} className={styles.automationFlowCard} style={{ '--flow-color': flow.color }}>
                    <button className={styles.automationFlowHeader} onClick={() => setOpenFlow(openFlow === flow.id ? null : flow.id)}>
                      <div className={styles.automationFlowLeft}>
                        <div className={styles.automationFlowDot} style={{ background: flow.color }} />
                        <div>
                          <div className={styles.automationFlowName}>{flow.name}</div>
                          <div className={styles.automationFlowTrigger}>{flow.trigger} → {flow.event}</div>
                        </div>
                      </div>
                      <div className={styles.automationFlowRight}>
                        <span className={styles.automationFlowStatus}>{flow.status}</span>
                        <svg width="16" height="16" fill="#9ca3af" viewBox="0 0 24 24"
                          style={{ transform: openFlow === flow.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                        </svg>
                      </div>
                    </button>
                    {openFlow === flow.id && (
                      <div className={styles.automationFlowBody}>
                        <div className={styles.automationFlowSteps}>
                          {flow.steps.map((s, i) => (
                            <div key={i} className={styles.automationFlowStepRow}>
                              <div className={styles.automationFlowStepNum} style={{ background: flow.color }}>{i + 1}</div>
                              <div>
                                <div className={styles.automationFlowStepLabel}>{s.label}</div>
                                <div className={styles.automationFlowStepDesc}>{s.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className={styles.automationFlowPayload}>
                          <span className={styles.automationFlowPayloadLabel}>Payload:</span>
                          <code>{flow.payload}</code>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div className={styles.automationHint}>
                  Para ver las ejecuciones: abra n8n → pestaña <strong>Executions</strong>. Cada evento (inscripción, pago, registro, documento o admisión) dispara una ejecución nueva.
                </div>
              </div>
            )}

            {/* Tab: Planned */}
            {tab === 'planned' && (
              <div className={styles.automationPlannedGrid}>
                {PLANNED.map((p, i) => (
                  <div key={i} className={styles.automationPlannedCard}>
                    <div className={styles.automationPlannedIcon}>{p.icon}</div>
                    <div className={styles.automationPlannedInfo}>
                      <div className={styles.automationPlannedTitle}>{p.title}</div>
                      <div className={styles.automationPlannedDesc}>{p.desc}</div>
                    </div>
                    <span className={`${styles.automationPlannedStatus} ${p.status === 'Siguiente paso' ? styles.automationPlannedStatusNext : ''}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
                <div className={styles.automationHint}>
                  Estas automatizaciones se configuran desde la UI de n8n arrastrando nodos. No requiere tocar codigo del backend.
                </div>
              </div>
            )}

            {/* Tab: Architecture */}
            {tab === 'arch' && (
              <div className={styles.automationArchGrid}>
                {ARCHITECTURE.map((a, i) => (
                  <div key={i} className={styles.automationArchCard}>
                    <div className={styles.automationArchNumber}>{i + 1}</div>
                    <div className={styles.automationArchLabel}>{a.label}</div>
                    <div className={styles.automationArchTech}>{a.tech}</div>
                    <div className={styles.automationArchDesc}>{a.desc}</div>
                  </div>
                ))}
                <div className={styles.automationHint}>
                  n8n corre como servicio Docker junto al backend y MongoDB. Los webhooks usan la red interna del compose.
                </div>
              </div>
            )}

            {/* Footer detalle */}
            <div className={styles.automationFooter}>
              <button className={styles.automationBackBtn} onClick={() => setView('intro')}>
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" /></svg>
                Volver al diagrama
              </button>
              <div className={styles.automationInfoBox}>
                <div className={styles.automationInfoIcon}>
                  <svg width="18" height="18" fill="#2A5783" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                </div>
                <div>
                  <div className={styles.automationInfoTitle}>Demo en vivo</div>
                  <div className={styles.automationInfoText}>
                    1. Cree una inscripcion · 2. Abra <strong>n8n (localhost:5678)</strong> · 3. Pestaña <strong>Executions</strong> · 4. Verá la ejecucion con los datos reales
                  </div>
                </div>
              </div>
              <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer" className={styles.automationLink}>
                Abrir n8n
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" /></svg>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
