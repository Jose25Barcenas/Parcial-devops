import { useEffect, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { credentialService } from '../services/credentialService'
import styles from '../styles/Verify.module.css'

const TYPE_LABELS = {
  acta_grado: 'Acta de grado',
  diploma: 'Diploma',
  certificado_notas: 'Certificado de notas',
  carta_admision: 'Carta de admision',
}

/**
 * Pagina PUBLICA de verificacion de credenciales.
 * No requiere sesion: es el destino del codigo QR impreso en el certificado.
 * Ruta: /verify/<CODIGO>
 */
export default function VerifyCredential() {
  const code = new URLSearchParams(window.location.search).get('code')
    || window.location.pathname.split('/verify/')[1]
    || ''

  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [qr, setQr] = useState('')

  const runVerify = useCallback(async () => {
    if (!code) {
      setState({ status: 'empty', data: null, error: null })
      return
    }
    setState({ status: 'loading', data: null, error: null })
    try {
      const data = await credentialService.verifyPublic(code)
      setState({ status: 'done', data, error: null })
    } catch (err) {
      setState({ status: 'error', data: null, error: err.message })
    }
  }, [code])

  useEffect(() => { runVerify() }, [runVerify])

  useEffect(() => {
    if (state.status !== 'done' || !state.data?.credential?.verificationUrl) return
    QRCode.toString(state.data.credential.verificationUrl, { type: 'svg', margin: 1, width: 180 })
      .then(setQr)
      .catch(() => setQr(''))
  }, [state])

  const d = state.data
  const c = d?.credential
  const authentic = d?.authentic

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brandBar} />
        <div className={styles.brand}>
          <div className={styles.brandMark}>UNAC</div>
          <div>
            <div className={styles.brandTitle}>Corporacion Universitaria Adventista</div>
            <div className={styles.brandSub}>Verificacion publica de credenciales</div>
          </div>
        </div>

        {state.status === 'loading' && (
          <div className={styles.center}>
            <div className={styles.spinner} />
            <p>Verificando credencial...</p>
          </div>
        )}

        {state.status === 'empty' && (
          <div className={styles.center}>
            <div className={styles.badgeUnknown}>Sin codigo</div>
            <h2>No se recibio ningun codigo</h2>
            <p className={styles.muted}>
              Escanee el codigo QR del certificado o escriba el codigo manualmente.
            </p>
            <form className={styles.searchForm} onSubmit={(e) => {
              e.preventDefault()
              const v = new FormData(e.target).get('code')
              if (v) window.location.href = `/verify/${String(v).trim().toUpperCase()}`
            }}>
              <input name="code" className={styles.input} placeholder="Ej: ACTA-Q3JRLSWS" required />
              <button className={styles.btn} type="submit">Verificar</button>
            </form>
          </div>
        )}

        {state.status === 'error' && (
          <div className={styles.center}>
            <div className={styles.badgeRevoked}>No encontrada</div>
            <h2>Credencial no encontrada</h2>
            <p className={styles.muted}>
              El codigo <strong>{code}</strong> no existe en el registro institucional.
              Verifique que lo haya copiado completo.
            </p>
            <button className={styles.btn} onClick={() => { window.location.href = '/verify' }}>
              Intentar otro codigo
            </button>
          </div>
        )}

        {state.status === 'done' && c && (
          <>
            <div className={`${styles.badge} ${authentic ? styles.badgeOk : styles.badgeBad}`}>
              {authentic ? 'Credencial autentica' : 'Credencial no valida'}
            </div>

            <div className={styles.chainRow}>
              <span className={styles.chainDot} data-ok={authentic ? '1' : '0'} />
              <span>{d.chainMessage}</span>
            </div>

            <div className={styles.body}>
              <div className={styles.credTitle}>{c.title}</div>
              <div className={styles.credType}>{TYPE_LABELS[c.type] || c.type}</div>

              <dl className={styles.fields}>
                <div><dt>Titular</dt><dd>{c.holderName}</dd></div>
                <div><dt>Programa</dt><dd>{c.program || '—'}</dd></div>
                <div><dt>Periodo</dt><dd>{c.period || '—'}</dd></div>
                <div><dt>Estado</dt>
                  <dd className={c.status === 'active' ? styles.okText : styles.badText}>
                    {c.status === 'active' ? 'Vigente' : `Revocada${c.revocationReason ? ` (${c.revocationReason})` : ''}`}
                  </dd>
                </div>
                <div><dt>Emitida</dt>
                  <dd>{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString('es-CO') : '—'}</dd>
                </div>
                <div><dt>Codigo</dt><dd><code>{c.verificationCode}</code></dd></div>
              </dl>

              <div className={styles.hashBlock}>
                <div className={styles.hashLabel}>Hash de integridad (SHA-256)</div>
                <code className={styles.hashValue}>{c.contentHash}</code>
                <div className={styles.hashLabel}>Ancla en el ledger (bloque)</div>
                <code className={styles.hashValue}>{c.anchorHash}</code>
              </div>

              {qr && (
                <div className={styles.qrWrap}>
                  <div dangerouslySetInnerHTML={{ __html: qr }} />
                  <div className={styles.qrCaption}>Escanee para volver a verificar</div>
                </div>
              )}
            </div>
          </>
        )}

        <div className={styles.footer}>
          Verificacion impulsada por registro inmutable (blockchain) · Solo se almacenan hashes SHA-256 ·
          Cumple Ley 1581 de 2012 (Habeas Data)
        </div>
      </div>
    </div>
  )
}
