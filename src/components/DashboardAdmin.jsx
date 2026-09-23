import { useState, useEffect } from 'react'
import { analyticsService } from '../services/analyticsService'
import { BarChart, DonutChart, LineChart, StageBar } from './Charts'
import { ProcessFlowDiagram, ProcessTable } from './ProcessTimeline'
import styles from '../styles/Dashboard.module.css'

const KPI_CONFIG = [
  { key: 'totalInscriptions', label: 'Total Inscripciones', icon: <svg width="20" height="20" fill="#2A5783" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>, bg: 'rgba(42,87,131,0.1)', trend: null },
  { key: 'admitted', label: 'Admitidos', icon: <svg width="20" height="20" fill="#4B7F52" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-5-5 1.41-1.41L10 13.17l7.59-7.59L19 7l-9 9z" /></svg>, bg: 'rgba(75,127,82,0.1)', trend: null },
  { key: 'completionRate', label: 'Tasa Completitud', icon: <svg width="20" height="20" fill="#D6B656" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>, bg: 'rgba(214,182,86,0.15)', trend: null },
  { key: 'avgTotalDays', label: 'Dias Promedio Total', icon: <svg width="20" height="20" fill="#5B9BD5" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>, bg: 'rgba(91,155,213,0.1)', trend: null },
]

const STAGE_COLORS = {
  inscription: '#2A5783',
  payment: '#D6B656',
  documents: '#5B9BD5',
  admission: '#4B7F52',
}

export default function DashboardAdmin({ onBack }) {
  const [kpis, setKpis] = useState(null)
  const [programData, setProgramData] = useState([])
  const [decisionData, setDecisionData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [stageAvgs, setStageAvgs] = useState({ inscription: 0, payment: 0, documents: 0, admission: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const [kpisData, programResp, decisionResp, monthlyResp, stageAvgData] = await Promise.all([
        analyticsService.getKPIs(),
        analyticsService.getProcessesByProgram(),
        analyticsService.getProcessesByDecision(),
        analyticsService.getMonthlyActivity(),
        analyticsService.getStageAverages(),
      ])

      setKpis(kpisData)
      setProgramData(programResp.map(d => ({ label: d.program?.split(' ').slice(0, 2).join(' ') || 'Sin programa', value: d.count })))
      setDecisionData(decisionResp)
      setMonthlyData(monthlyResp)
      setStageAvgs(stageAvgData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.dashboardWrapper}>
        <div className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.dashboardTitle}>Business Process Management</h1>
            <p className={styles.dashboardSubtitle}>Dashboard de analitica y metricas del proceso de admision</p>
          </div>
          <button onClick={onBack} className={styles.dashboardBackBtn}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Volver al proceso
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#6B7280', fontSize: '1.1rem' }}>
          Cargando datos del dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>Business Process Management</h1>
          <p className={styles.dashboardSubtitle}>Dashboard de analitica y metricas del proceso de admision</p>
        </div>
        <button onClick={onBack} className={styles.dashboardBackBtn}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver al proceso
        </button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {KPI_CONFIG.map(kpi => (
          <div key={kpi.key} className={styles.kpiCard}>
            <div className={styles.kpiCardHeader}>
              <div className={styles.kpiCardIcon} style={{ background: kpi.bg }}>{kpi.icon}</div>
              {kpi.trend && <span className={styles.kpiCardTrendUp}>{kpi.trend}</span>}
            </div>
            <div className={styles.kpiCardValue}>{kpis?.[kpi.key] ?? 0}{kpi.key === 'completionRate' || kpi.key === 'admissionRate' ? '%' : ''}</div>
            <div className={styles.kpiCardLabel}>{kpi.label}</div>
          </div>
        ))}
      </div>

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

        {/* Actividad mensual */}
        <div className={styles.dashboardCard} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.dashboardCardHeader}>
            <h2 className={styles.dashboardCardTitle}>Actividad Mensual</h2>
          </div>
          <div className={styles.dashboardCardBody}>
            <LineChart data={monthlyData} height={220} />
          </div>
        </div>

        {/* Tiempos promedio por etapa */}
        <div className={styles.dashboardCard}>
          <div className={styles.dashboardCardHeader}>
            <h2 className={styles.dashboardCardTitle}>Tiempo Promedio por Etapa</h2>
          </div>
          <div className={styles.dashboardCardBody}>
            <StageBar label="Inscripcion" value={stageAvgs.inscription || 0} max={5} color={STAGE_COLORS.inscription} timeLabel={(stageAvgs.inscription || 0) < 1 ? `${Math.round((stageAvgs.inscription || 0) * 24)}h` : `${stageAvgs.inscription || 0}d`} />
            <StageBar label="Pago" value={stageAvgs.payment || 0} max={5} color={STAGE_COLORS.payment} timeLabel={(stageAvgs.payment || 0) < 1 ? `${Math.round((stageAvgs.payment || 0) * 24)}h` : `${stageAvgs.payment || 0}d`} />
            <StageBar label="Documentos" value={stageAvgs.documents || 0} max={5} color={STAGE_COLORS.documents} timeLabel={(stageAvgs.documents || 0) < 1 ? `${Math.round((stageAvgs.documents || 0) * 24)}h` : `${stageAvgs.documents || 0}d`} />
            <StageBar label="Admision" value={stageAvgs.admission || 0} max={5} color={STAGE_COLORS.admission} timeLabel={(stageAvgs.admission || 0) < 1 ? `${Math.round((stageAvgs.admission || 0) * 24)}h` : `${stageAvgs.admission || 0}d`} />
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
    </div>
  )
}
