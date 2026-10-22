import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { credentialService } from '../services/credentialService'
import { api } from '../services/api'
import styles from '../styles/Credentials.module.css'

const TYPES = [
  { value: 'acta_grado', label: 'Acta de grado' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificado_notas', label: 'Certificado de notas' },
  { value: 'carta_admision', label: 'Carta de admision' },
]

const TYPE_LABELS = Object.fromEntries(TYPES.map(t => [t.value, t.label]))

export default function CredentialsPanel({ user }) {
  const [tab, setTab] = useState('credentials')
  const [creds, setCreds] = useState([])
  const [status, setStatus] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  const [issueForm, setIssueForm] = useState({ type: 'acta_grado', inscriptionId: '', period: '2026-II' })
  const [inscriptions, setInscriptions] = useState([])
  const [issuing, setIssuing] = useState(false)
  const [qrModal, setQrModal] = useState(null)
  const [qrSvg, setQrSvg] = useState('')

  async function loadAll() {
    setLoading(true)
    try {
      const [c, s, b, i] = await Promise.all([
        credentialService.getAll(1, 50),
        credentialService.ledgerStatus(),
        credentialService.ledgerBlocks(50),
        api.get('/inscriptions?page=1&limit=100').catch(() => ({ data: [] })),
      ])
      setCreds(c?.data || [])
      setStatus(s)
      setBlocks(b || [])
      setInscriptions(i?.data || [])
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    if (!qrModal?.verificationUrl) return
    QRCode.toString(qrModal.verificationUrl, { type: 'svg', margin: 1, width: 200 })
      .then(setQrSvg).catch(() => setQrSvg(''))
  }, [qrModal])

  async function handleIssue(e) {
    e.preventDefault()
    setIssuing(true)
    setMsg(null)
    try {
      const created = await credentialService.issue({
        type: issueForm.type,
        inscriptionId: issueForm.inscriptionId || undefined,
        period: issueForm.period,
      })
      setMsg({ type: 'ok', text: `Credencial ${created.verificationCode} emitida e anclada en el ledger.` })
      setIssueForm(f => ({ ...f, inscriptionId: '' }))
      await loadAll()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setIssuing(false)
    }
  }

  async function handleRevoke(cred) {
    const reason = window.prompt(`Motivo de revocacion de ${cred.verificationCode}:`, 'Correccion administrativa')
    if (!reason) return
    try {
      await credentialService.revoke(cred.id, reason)
      setMsg({ type: 'ok', text: `Credencial ${cred.verificationCode} revocada. Se anclo un bloque de revocacion.` })
      await loadAll()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  async function handleValidate() {
    try {
      const r = await credentialService.validateChain()
      setMsg({
        type: r.valid ? 'ok' : 'error',
        text: `${r.message} (${r.totalBlocks} bloques)`,
      })
      await loadAll()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>Credenciales academicas · Blockchain</h2>
          <p className={styles.sub}>
            Emision y verificacion de credenciales ancladas en un registro inmutable (solo hashes SHA-256).
          </p>
        </div>
        <button className={styles.validateBtn} onClick={handleValidate}>Validar cadena</button>
      </div>

      {status && (
        <div className={styles.stats}>
          <Stat label="Bloques" value={status.totalBlocks} />
          <Stat label="Credenciales" value={status.totalCredentials} />
          <Stat label="Revocadas" value={status.revokedCredentials} />
          <Stat label="Cadena" value={status.chainValid ? 'Integra' : 'Rota'} ok={status.chainValid} />
        </div>
      )}

      {msg && <div className={msg.type === 'ok' ? styles.msgOk : styles.msgErr}>{msg.text}</div>}

      <div className={styles.tabs}>
        {[
          { id: 'credentials', label: 'Credenciales' },
          { id: 'issue', label: 'Emitir' },
          { id: 'ledger', label: 'Ledger' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'credentials' && (
        loading ? <p className={styles.muted}>Cargando...</p> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Codigo</th><th>Tipo</th><th>Titular</th><th>Programa</th>
                  <th>Estado</th><th>Hash (12)</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {creds.length === 0 && (
                  <tr><td colSpan={7} className={styles.empty}>Sin credenciales emitidas aun.</td></tr>
                )}
                {creds.map(c => (
                  <tr key={c.id}>
                    <td><code className={styles.code}>{c.verificationCode}</code></td>
                    <td>{TYPE_LABELS[c.type] || c.type}</td>
                    <td>{c.holderName}</td>
                    <td>{c.program || '—'}</td>
                    <td>
                      <span className={c.status === 'active' ? styles.pillOk : styles.pillBad}>
                        {c.status === 'active' ? 'Vigente' : 'Revocada'}
                      </span>
                    </td>
                    <td><code className={styles.hashShort}>{(c.contentHash || '').slice(0, 12)}…</code></td>
                    <td className={styles.actions}>
                      <button className={styles.linkBtn} onClick={() => setQrModal(c)}>QR</button>
                      <a className={styles.linkBtn} href={c.verificationUrl} target="_blank" rel="noreferrer">Ver</a>
                      {c.status === 'active' && user?.role === 'admin' && (
                        <button className={styles.linkDanger} onClick={() => handleRevoke(c)}>Revocar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'issue' && (
        <form className={styles.form} onSubmit={handleIssue}>
          <label className={styles.field}>
            <span>Tipo de credencial</span>
            <select value={issueForm.type} onChange={e => setIssueForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>Inscripcion (opcional)</span>
            <select value={issueForm.inscriptionId}
              onChange={e => setIssueForm(f => ({ ...f, inscriptionId: e.target.value }))}>
              <option value="">-- sin inscripcion --</option>
              {inscriptions.map(i => (
                <option key={i.id} value={i.id}>{i.program} · {i.status}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Periodo</span>
            <input value={issueForm.period}
              onChange={e => setIssueForm(f => ({ ...f, period: e.target.value }))} />
          </label>
          <button className={styles.issueBtn} disabled={issuing}>
            {issuing ? 'Emitiendo...' : 'Emitir credencial'}
          </button>
          <p className={styles.hint}>
            Al emitir se calcula el SHA-256 del contenido, se firma con la llave institucional (PoA)
            y se ancla un bloque encadenado al anterior.
          </p>
        </form>
      )}

      {tab === 'ledger' && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>#</th><th>Tipo</th><th>Hash</th><th>Previous</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {blocks.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>Ledger vacio.</td></tr>
              )}
              {blocks.map(b => (
                <tr key={b.index}>
                  <td>{b.index}</td>
                  <td><span className={styles.pillNeutral}>{b.type}</span></td>
                  <td><code className={styles.hashShort}>{b.hash.slice(0, 16)}…</code></td>
                  <td><code className={styles.hashShort}>{b.previousHash.slice(0, 12)}…</code></td>
                  <td>{new Date(b.createdAt).toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {qrModal && (
        <div className={styles.overlay} onClick={() => setQrModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{qrModal.title}</h3>
            <p className={styles.muted}>Codigo: <code>{qrModal.verificationCode}</code></p>
            {qrSvg && <div className={styles.qrBox} dangerouslySetInnerHTML={{ __html: qrSvg }} />}
            <a className={styles.openLink} href={qrModal.verificationUrl} target="_blank" rel="noreferrer">
              Abrir verificacion
            </a>
            <button className={styles.closeBtn} onClick={() => setQrModal(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, ok }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={`${styles.statValue} ${ok === true ? styles.statOk : ok === false ? styles.statBad : ''}`}>
        {value}
      </div>
    </div>
  )
}
