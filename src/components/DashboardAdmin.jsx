import { useState, useEffect, useRef } from 'react'
import { analyticsService } from '../services/analyticsService'
import { BarChart, DonutChart, LineChart, StageBar } from './Charts'
import { ProcessFlowDiagram, ProcessTable } from './ProcessTimeline'
import GoalsPanel from './GoalsPanel'
import AdmissionsPanel from './AdmissionsPanel'
import UsersPanel from './UsersPanel'
import styles from '../styles/Dashboard.module.css'

const fmtCOP = v => `$${Math.round(Number(v) || 0).toLocaleString('es-CO')}`
const fmtCompactCOP = v => {
  const n = Number(v) || 0
  if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (Math.abs(n) >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${Math.round(n)}`
}

const METHOD_LABELS = { pse: 'PSE', tarjeta: 'Tarjeta', banco: 'Banco', caja: 'Tesoreria' }

const KPI_CONFIG = [
  { key: 'totalInscriptions', label: 'Total Inscripciones', icon: <svg width="20" height="20" fill="#2A5783" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>, bg: 'rgba(42,87,131,0.1)', format: v => v },
  { key: 'admitted', label: 'Admitidos', icon: <svg width="20" height="20" fill="#4B7F52" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-5-5 1.41-1.41L10 13.17l7.59-7.59L19 7l-9 9z" /></svg>, bg: 'rgba(75,127,82,0.1)', format: v => v },
  { key: 'completionRate', label: 'Tasa Completitud', icon: <svg width="20" height="20" fill="#D6B656" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>, bg: 'rgba(214,182,86,0.15)', format: v => `${v}%` },
  { key: 'avgTotalDays', label: 'Dias Promedio Total', icon: <svg width="20" height="20" fill="#5B9BD5" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>, bg: 'rgba(91,155,213,0.1)', format: v => v },
]

const REVENUE_KPI_CONFIG = [
  { key: 'totalCollected', label: 'Recaudado', icon: <svg width="20" height="20" fill="#4B7F52" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1H6.32c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" /></svg>, bg: 'rgba(75,127,82,0.1)', format: fmtCOP, small: true },
  { key: 'totalPending', label: 'Por Cobrar', icon: <svg width="20" height="20" fill="#D6B656" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>, bg: 'rgba(214,182,86,0.15)', format: fmtCOP, small: true },
  { key: 'countCollected', label: 'Pagos Confirmados', icon: <svg width="20" height="20" fill="#2A5783" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-5-5 1.41-1.41L10 13.17l7.59-7.59L19 7l-9 9z" /></svg>, bg: 'rgba(42,87,131,0.1)', format: v => v },
  { key: 'avgAmount', label: 'Promedio por Pago', icon: <svg width="20" height="20" fill="#5B9BD5" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" /></svg>, bg: 'rgba(91,155,213,0.1)', format: fmtCOP, small: true },
]

const STAGE_COLORS = {
  inscription: '#2A5783',
  payment: '#D6B656',
  documents: '#5B9BD5',
  admission: '#4B7F52',
}

const STAGE_ROWS = [
  { key: 'inscription', label: 'Inscripcion', color: STAGE_COLORS.inscription },
  { key: 'payment', label: 'Pago', color: STAGE_COLORS.payment },
  { key: 'documents', label: 'Documentos', color: STAGE_COLORS.documents },
  { key: 'admission', label: 'Admision', color: STAGE_COLORS.admission },
  { key: 'completed', label: 'Completados', color: '#1B5E20' },
]

function KpiCard({ kpi, data }) {
  const value = data?.[kpi.key] ?? 0
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiCardHeader}>
        <div className={styles.kpiCardIcon} style={{ background: kpi.bg }}>{kpi.icon}</div>
      </div>
      <div className={`${styles.kpiCardValue} ${kpi.small ? styles.kpiCardValueSm : ''}`}>{kpi.format(value)}</div>
      <div className={styles.kpiCardLabel}>{kpi.label}</div>
    </div>
  )
}

export default function DashboardAdmin({ onBack, user }) {
  const [kpis, setKpis] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [programData, setProgramData] = useState([])
  const [decisionData, setDecisionData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [revenueMonthly, setRevenueMonthly] = useState([])
  const [stageAvgs, setStageAvgs] = useState({ inscription: 0, payment: 0, documents: 0, admission: 0 })
  const [stageCounts, setStageCounts] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    loadDashboardData()
    return () => { mountedRef.current = false }
  }, [])

  async function loadDashboardData() {
    try {
      const [
        kpisData, programResp, decisionResp, monthlyResp, stageAvgData,
        revenueData, revenueMonthlyData, stageCountsData,
      ] = await Promise.all([
        analyticsService.getKPIs(),
        analyticsService.getProcessesByProgram(),
        analyticsService.getProcessesByDecision(),
        analyticsService.getMonthlyActivity(),
        analyticsService.getStageAverages(),
        analyticsService.getRevenue(),
        analyticsService.getRevenueMonthly(),
        analyticsService.getProcessesByStage(),
      ])

      if (!mountedRef.current) return
      setKpis(kpisData || null)
      setProgramData((Array.isArray(programResp) ? programResp : []).map(d => ({ label: d.program?.split(' ').slice(0, 2).join(' ') || 'Sin programa', value: d.count })))
      setDecisionData(Array.isArray(decisionResp) ? decisionResp : [])
      setMonthlyData(Array.isArray(monthlyResp) ? monthlyResp : [])
      setStageAvgs(stageAvgData || {})
      setRevenue(revenueData || null)
      setRevenueMonthly(Array.isArray(revenueMonthlyData) ? revenueMonthlyData : [])
      setStageCounts(stageCountsData || {})
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError(err.message || 'Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const methodData = (revenue?.byMethod || []).map(m => ({
    label: METHOD_LABELS[m.method] || m.method,
    value: m.collected || 0,
    color: m.method === 'pse' ? '#2A5783' : m.method === 'tarjeta' ? '#4B7F52' : m.method === 'banco' ? '#5B9BD5' : '#D6B656',
  }))

  const totalInscriptions = kpis?.totalInscriptions || 0

  const header = (
    <div className={styles.dashboardHeader}>
      <div>
        <h1 className={styles.dashboardTitle}>Business Process Management</h1>
        <p className={styles.dashboardSubtitle}>Dashboard de analitica, metricas e indicadores del proceso de admision</p>
      </div>
      <button onClick={onBack} className={styles.dashboardBackBtn}>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Volver al proceso
      </button>
    </div>
  )

  if (loading) {
    return (
      <div className={styles.dashboardWrapper}>
        {header}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#6B7280', fontSize: '1.1rem' }}>
          Cargando datos del dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dashboardWrapper}>
      {header}

      {error && (
        <div className={styles.dashboardError}>{error}</div>
      )}

      {/* KPI Cards - Gestion */}
      <h2 className={styles.dashboardSectionTitle}>Indicadores de Gestion</h2>
      <div className={styles.kpiGrid}>
        {KPI_CONFIG.map(kpi => (
          <KpiCard key={kpi.key} kpi={kpi} data={kpis} />
        ))}
      </div>

      {/* KPI Cards - Ingresos */}
      <h2 className={styles.dashboardSectionTitle}>Indicadores de Ingresos</h2>
      <div className={styles.kpiGrid}>
        {REVENUE_KPI_CONFIG.map(kpi => (
          <KpiCard key={kpi.key} kpi={kpi} data={revenue} />
        ))}
      </div>

      {/* Metas del periodo */}
      <GoalsPanel />

      {/* Gestion de admisiones */}
      <AdmissionsPanel onUpdated={loadDashboardData} />

      {/* Process Flow BPM */}
      <div className={styles.dashboardCard} style={{ marginBottom: '1.5rem' }}>
        <div className={styles.dashboardCardHeader}>
          <h2 className={styles.dashboardCardTitle}>Flujo del Proceso de Admision</h2>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Tiempos promedio entre etapas</span>
        </div>
        <div className={styles.dashboardCardBody}>
          <ProcessFlowDiagram />
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.dashboardGrid}>
        {/* Inscripciones por programa */}
        <div className={styles.dashboardCard}>
          <div className={styles.dashboardCardHeader}>
            <h2 className={styles.dashboardCardTitle}>Inscripciones por Programa</h2>
          </div>
          <div className={styles.dashboardCardBody}>
            <BarChart data={programData} height={220} />
          </div>
        </div>

        {/* Distribucion por decision */}
        <div className={styles.dashboardCard}>
          <div className={styles.dashboardCardHeader}>
            <h2 className={styles.dashboardCardTitle}>Distribucion por Decision</h2>
          </div>
          <div className={styles.dashboardCardBody}>
            <DonutChart data={decisionData} />
          </div>
        </div>

        {/* Ingresos por metodo */}
        <div className={styles.dashboardCard}>
          <div className={styles.dashboardCardHeader}>
            <h2 className={styles.dashboardCardTitle}>Ingresos por Metodo de Pago</h2>
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Valores recaudados en COP</span>
          </div>
          <div className={styles.dashboardCardBody}>
            {methodData.length > 0
              ? <BarChart data={methodData} height={220} formatValue={fmtCompactCOP} />
              : <p style={{ color: '#9CA3AF', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>Sin pagos registrados aun</p>}
          </div>
        </div>

        {/* Conversion por etapa */}
        <div className={styles.dashboardCard}>
          <div className={styles.dashboardCardHeader}>
            <h2 className={styles.dashboardCardTitle}>Conversion por Etapa</h2>
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Sobre {totalInscriptions} inscripciones</span>
          </div>
          <div className={styles.dashboardCardBody}>
            {STAGE_ROWS.map(row => (
              <StageBar
                key={row.key}
                label={row.label}
                value={stageCounts[row.key] || 0}
                max={Math.max(totalInscriptions, 1)}
                color={row.color}
                valueLabel={`${stageCounts[row.key] || 0} inscripciones`}
                timeLabel={`${totalInscriptions > 0 ? Math.round(((stageCounts[row.key] || 0) / totalInscriptions) * 100) : 0}% del total`}
              />
            ))}
          </div>
        </div>

        {/* Tiempos promedio por etapa */}
        <div className={styles.dashboardCard}>
          <div className={styles.dashboardCardHeader}>
            <h2 className={styles.dashboardCardTitle}>Tiempo Promedio por Etapa</h2>
          </div>
          <div className={styles.dashboardCardBody}>
            {[['Inscripcion', 'inscription'], ['Pago', 'payment'], ['Documentos', 'documents'], ['Admision', 'admission']].map(([label, key]) => {
              const v = stageAvgs[key] || 0
              const duration = v < 1 ? `${Math.round(v * 24)}h` : v === 1 ? '1 dia' : `${v} dias`
              return (
                <StageBar key={key} label={label} value={v} max={5} color={STAGE_COLORS[key]} valueLabel={duration} />
              )
            })}
          </div>
        </div>

        {/* Resumen */}
        <div className={styles.dashboardCard}>
          <div className={styles.dashboardCardHeader}>
            <h2 className={styles.dashboardCardTitle}>Resumen del Proceso</h2>
          </div>
          <div className={styles.dashboardCardBody}>
            <div className={styles.metricsWidgetItem}>
              <span className={styles.metricsWidgetItemLabel}>Procesos activos</span>
              <span className={`${styles.metricsWidgetItemValue} ${styles.metricsWidgetItemValueWarn}`}>{kpis?.pending ?? 0}</span>
            </div>
            <div className={styles.metricsWidgetItem}>
              <span className={styles.metricsWidgetItemLabel}>Tasa de admision</span>
              <span className={`${styles.metricsWidgetItemValue} ${styles.metricsWidgetItemValueOk}`}>{kpis?.admissionRate ?? 0}%</span>
            </div>
            <div className={styles.metricsWidgetItem}>
              <span className={styles.metricsWidgetItemLabel}>Total procesados</span>
              <span className={`${styles.metricsWidgetItemValue} ${styles.metricsWidgetItemValueNeutral}`}>{kpis?.totalInscriptions ?? 0}</span>
            </div>
            <div className={styles.metricsWidgetItem}>
              <span className={styles.metricsWidgetItemLabel}>Rechazados</span>
              <span className={`${styles.metricsWidgetItemValue}`} style={{ color: '#D32F2F' }}>{kpis?.rejected ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actividad mensual */}
      <div className={styles.dashboardCard} style={{ marginBottom: '1.5rem' }}>
        <div className={styles.dashboardCardHeader}>
          <h2 className={styles.dashboardCardTitle}>Actividad Mensual</h2>
        </div>
        <div className={styles.dashboardCardBody}>
          <LineChart data={monthlyData} height={220} />
        </div>
      </div>

      {/* Ingresos mensuales */}
      <div className={styles.dashboardCard} style={{ marginBottom: '1.5rem' }}>
        <div className={styles.dashboardCardHeader}>
          <h2 className={styles.dashboardCardTitle}>Ingresos Mensuales</h2>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Recaudado vs por cobrar (COP)</span>
        </div>
        <div className={styles.dashboardCardBody}>
          <LineChart
            data={revenueMonthly}
            height={220}
            series={[
              { key: 'collected', label: 'Recaudado', color: '#4B7F52' },
              { key: 'pending', label: 'Por cobrar', color: '#D6B656' },
            ]}
            formatY={fmtCompactCOP}
          />
        </div>
      </div>

      {/* Process Table */}
      <div className={styles.dashboardCard}>
        <div className={styles.dashboardCardHeader}>
          <h2 className={styles.dashboardCardTitle}>Detalle de Procesos Activos</h2>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Tiempos por etapa en dias</span>
        </div>
        <div className={styles.dashboardCardBody}>
          <ProcessTable />
        </div>
      </div>

      {/* Gestion de usuarios */}
      <UsersPanel currentUserId={user?.id} />
    </div>
  )
}
