import styles from '../styles/Dashboard.module.css'

export function BarChart({ data, height = 200, formatValue, formatY }) {
  const safeData = Array.isArray(data) ? data : []
  if (safeData.length === 0) return <div className={styles.donutEmpty}>Sin datos</div>
  const maxVal = Math.max(...safeData.map(d => d.value), 1)
  const valueLabel = formatValue || (v => v)
  const yLabel = formatY || valueLabel
  return (
    <div className={styles.barChart} style={{ height }}>
      <div className={styles.barChartYAxis}>
        {[maxVal, Math.round(maxVal * 0.75), Math.round(maxVal * 0.5), Math.round(maxVal * 0.25), 0].map((v, i) => (
          <span key={i} className={styles.barChartYLabel}>{yLabel(v)}</span>
        ))}
      </div>
      <div className={styles.barChartBars}>
        {safeData.map((d) => (
          <div key={d.label} className={styles.barChartCol}>
            <div className={styles.barChartBarWrapper}>
              <div className={styles.barChartBar} style={{ height: `${(d.value / maxVal) * 100}%`, background: d.color || '#2A5783' }}>
                <span className={styles.barChartBarValue}>{valueLabel(d.value)}</span>
              </div>
            </div>
            <span className={styles.barChartLabel}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DonutChart({ data, size = 160, strokeWidth = 24 }) {
  const safeData = Array.isArray(data) ? data : []
  const total = safeData.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return <div className={styles.donutEmpty}>Sin datos</div>

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const segments = safeData.reduce((acc, d) => {
    const pct = d.value / total
    const offset = circumference * acc.accumulated
    const length = circumference * pct
    acc.accumulated += pct
    acc.segments.push({ ...d, pct, offset, length })
    return acc
  }, { accumulated: 0, segments: [] }).segments

  return (
    <div className={styles.donutChart}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => (
          <circle key={i} cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${seg.length} ${circumference - seg.length}`}
            strokeDashoffset={-seg.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className={styles.donutSegment} />
        ))}
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" className={styles.donutTotal}>{total}</text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" className={styles.donutLabel}>total</text>
      </svg>
      <div className={styles.donutLegend}>
        {safeData.map((d) => (
          <div key={d.label} className={styles.donutLegendItem}>
            <span className={styles.donutLegendDot} style={{ background: d.color }} />
            <span className={styles.donutLegendText}>{d.label}: {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LineChart({ data, height = 200, series: seriesProp, formatY }) {
  if (!Array.isArray(data) || data.length === 0) return null

  const series = seriesProp || [
    { key: 'inscriptions', label: 'Inscripciones', color: '#2A5783' },
    { key: 'payments', label: 'Pagos', color: '#D6B656' },
    { key: 'documents', label: 'Documentos', color: '#5B9BD5' },
    { key: 'admissions', label: 'Admisiones', color: '#4B7F52' },
  ]

  const allValues = data.flatMap(d => series.map(s => d[s.key] || 0))
  const maxVal = Math.max(...allValues, 1)
  const yLabel = formatY || (v => v)

  return (
    <div className={styles.lineChart}>
      <div className={styles.lineChartLegend}>
        {series.map(s => (
          <div key={s.key} className={styles.lineChartLegendItem}>
            <span className={styles.lineChartLegendDot} style={{ background: s.color }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div className={styles.lineChartGrid} style={{ height }}>
        <div className={styles.lineChartYAxis}>
          {[maxVal, Math.round(maxVal * 0.5), 0].map((v, i) => (
            <span key={i} className={styles.lineChartYLabel}>{yLabel(v)}</span>
          ))}
        </div>
        <div className={styles.lineChartArea}>
          {series.map(s => {
            const points = data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100
              const y = 100 - ((d[s.key] || 0) / maxVal) * 100
              return `${x},${y}`
            }).join(' ')
            return (
              <svg key={s.key} className={styles.lineChartSvg} viewBox={`0 0 100 100`} preserveAspectRatio="none">
                <polyline points={points} fill="none" stroke={s.color} strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
              </svg>
            )
          })}
          <div className={styles.lineChartXLabels}>
            {data.map((d) => <span key={d.month}>{d.month}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function StageBar({ label, value, max, color, timeLabel, valueLabel }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const displayValue = valueLabel === undefined ? `${value} procesos` : valueLabel
  return (
    <div className={styles.stageBar}>
      <div className={styles.stageBarHeader}>
        <span className={styles.stageBarLabel}>{label}</span>
        <span className={styles.stageBarValue}>{displayValue}{timeLabel && ` · ${timeLabel}`}</span>
      </div>
      <div className={styles.stageBarTrack}>
        <div className={styles.stageBarFill} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
