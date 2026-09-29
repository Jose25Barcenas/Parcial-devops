import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import { authService } from './services/authService.js'
import { inscriptionService } from './services/inscriptionService.js'
import { paymentService } from './services/paymentService.js'
import { documentService } from './services/documentService.js'
import { admissionService } from './services/admissionService.js'
import DashboardAdmin from './components/DashboardAdmin.jsx'
import { ProcessFlowWidget } from './components/ProcessFlowWidget.jsx'
import styles from './styles/Components.module.css'
import authStyles from './styles/Auth.module.css'
import layoutStyles from './styles/Layout.module.css'
import inscripcionStyles from './styles/Inscripcion.module.css'
import pagoStyles from './styles/Pago.module.css'
import documentosStyles from './styles/Documentos.module.css'
import resultadosStyles from './styles/Resultados.module.css'

const STEPS = [
  { id: 'inscripcion', label: 'Inscripcion', n: 1 },
  { id: 'pago', label: 'Pago', n: 2 },
  { id: 'documentos', label: 'Documentos', n: 3 },
  { id: 'resultados', label: 'Resultados', n: 4 },
]

const PROGRAMS = [
  'Ingenieria de Sistemas', 'Ingenieria Industrial', 'Administracion de Empresas',
  'Administracion Publica', 'Contaduria Publica', 'Enfermeria', 'Teologia', 'Licenciatura en Educacion',
]

const SCHEDULES = ['Diurna', 'Nocturna', 'Fines de Semana']

const DOC_TYPES = [
  { id: 'identity', label: 'Documento de Identidad', desc: 'Cedula de ciudadania, tarjeta de identidad o cedula de extranjeria vigente.' },
  { id: 'icfes', label: 'Resultados ICFES / Pruebas de Estado', desc: 'Resultado oficial de las Pruebas Saber 11 emitido por el ICFES.' },
  { id: 'diploma', label: 'Titulo o Diploma de Bachiller', desc: 'Diploma original o copia autenticada del titulo de bachillerato.' },
  { id: 'acta', label: 'Acta de Grado', desc: 'Acta de grado de bachillerato emitida por la institucion educativa.' },
  { id: 'adicional', label: 'Documento Academico Adicional', desc: 'Certificado de notas de 10° y 11° o documento academico complementario.' },
]
const DOC_TYPE_COUNT = DOC_TYPES.length

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

const AppContext = createContext()

function useApp() {
  return useContext(AppContext)
}

function Badge({ color, bg, dot = false, children }) {
  return (
    <span className={layoutStyles.badge} style={{ color, background: bg }}>
      {dot && <span className={layoutStyles.badgeDot} />}
      {children}
    </span>
  )
}

function Btn({ children, onClick, type = 'button', variant = 'primary', size = 'md', disabled = false, fullWidth = false, icon, style }) {
  const sizeClass = size === 'sm' ? styles.btnSm : size === 'lg' ? styles.btnLg : size === 'xl' ? styles.btnXl : styles.btnMd
  const variantClass = variant === 'secondary' ? styles.btnSecondary : variant === 'ghost' ? styles.btnGhost : variant === 'danger' ? styles.btnDanger : variant === 'success' ? styles.btnSuccess : styles.btnPrimary
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style}
      className={`${styles.btn} ${sizeClass} ${variantClass} ${fullWidth ? styles.btnFullWidth : ''}`}>
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      {children}
    </button>
  )
}

function Card({ children, className = '', style }) {
  return <div className={`${layoutStyles.card} ${className}`} style={style}>{children}</div>
}

function SecLabel({ n, label }) {
  return (
    <div className={layoutStyles.secLabel}>
      <div className={layoutStyles.secLabelNumber}>{n}</div>
      <h3 className={layoutStyles.secLabelText}>{label}</h3>
    </div>
  )
}

function Field({ label, type = 'text', placeholder, value, onChange, onBlur, required = false, options }) {
  const fieldId = label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={fieldId} className={styles.fieldLabel}>
        {label}{required && <span className={styles.fieldRequired}> *</span>}
      </label>
      {options
        ? <select id={fieldId} value={value} onChange={e => onChange?.(e.target.value)} onBlur={onBlur} className={styles.fieldSelect}>
            <option value="">Seleccionar...</option>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        : <input id={fieldId} type={type} placeholder={placeholder} value={value} onChange={e => onChange?.(e.target.value)} onBlur={onBlur} className={styles.fieldInput} />}
    </div>
  )
}

function AuthCard({ title, onClose, children }) {
  return (
    <div className={authStyles.authWrapper}>
      <div className={`${authStyles.authCard} animate-slide-in`}>
        <div className={authStyles.authHeader}>
          <h3 className={authStyles.authTitle}>{title}</h3>
          {onClose && (
            <button onClick={onClose} className={authStyles.authCloseBtn}>
              <svg className={authStyles.authCloseIcon} fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

function ScreenLayout({ children, hero }) {
  return (
    <div className={layoutStyles.screenLayout}>
      {hero}
      <div className={`${layoutStyles.screenContent} animate-slide-in`}>
        {children}
      </div>
    </div>
  )
}

function SuccessBanner({ title, description, action }) {
  return (
    <div className={layoutStyles.successBanner}>
      <div className={layoutStyles.successBannerInner}>
        <div className={layoutStyles.successIcon}>
          <svg className={layoutStyles.successIconSvg} fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
        </div>
        <div>
          <div className={layoutStyles.successTitle}>{title}</div>
          <p className={layoutStyles.successDesc}>{description}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <ScreenLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>Cargando...</div>
      </div>
    </ScreenLayout>
  )
}

function ErrorMessage({ message, onRetry }) {
  return (
    <div style={{ padding: '1rem', background: '#FEF2F2', borderRadius: '0.75rem', border: '1px solid #FECACA', marginBottom: '1rem' }}>
      <p style={{ color: '#D32F2F', fontSize: '0.875rem', margin: 0 }}>{message}</p>
      {onRetry && (
        <Btn size="sm" variant="ghost" onClick={onRetry} style={{ marginTop: '0.5rem' }}>
          Reintentar
        </Btn>
      )}
    </div>
  )
}

// ─── SideProgress ────────────────────────────────────────────────────────────
function SideProgress({ stage }) {
  const stageOrder = ['inscripcion', 'inscripcion-done', 'pago', 'pago-done', 'documentos', 'documentos-done', 'resultados']
  const si = stageOrder.indexOf(stage)

  const rows = [
    { key: 'inscripcion', doneKey: 'inscripcion-done', label: 'Inscripcion', sub: 'Aspirante' },
    { key: 'pago', doneKey: 'pago-done', label: 'Pago', sub: 'Entidad Financiera / Tesoreria' },
    { key: 'documentos', doneKey: 'documentos-done', label: 'Documentos', sub: 'UNAC / Admisiones' },
    { key: 'resultados', doneKey: 'resultados', label: 'Resultados', sub: 'UNAC / SION' },
  ]

  const getStatus = (key, doneKey) => {
    const ki = stageOrder.indexOf(key)
    const di = stageOrder.indexOf(doneKey)
    if (si >= di) return 'done'
    if (si >= ki) return 'active'
    return 'locked'
  }

  const statusLabel = { done: 'Completado', active: 'En progreso', locked: 'Bloqueado' }

  return (
    <div className={layoutStyles.sideProgress}>
      <div className={layoutStyles.sideProgressTitle}>Estado de mi proceso</div>
      <div>
        {rows.map(({ key, doneKey, label, sub }, i) => {
          const s = getStatus(key, doneKey)
          return (
            <div key={key} className={layoutStyles.sideProgressRow}>
              <div className={layoutStyles.sideProgressTimeline}>
                <div className={`${layoutStyles.sideProgressDot} ${s === 'done' ? layoutStyles.sideProgressDotDone : s === 'active' ? layoutStyles.sideProgressDotActive : layoutStyles.sideProgressDotLocked}`}>
                  {s === 'done'
                    ? <svg className={layoutStyles.sideProgressDotIcon} fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
                    : s === 'active'
                    ? <div className={layoutStyles.sideProgressDotPulse} />
                    : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d1d5db' }} />}
                </div>
                {i < rows.length - 1 && <div className={`${layoutStyles.sideProgressLine} ${s === 'done' ? layoutStyles.sideProgressLineDone : layoutStyles.sideProgressLineLocked}`} />}
              </div>
              <div className={layoutStyles.sideProgressContent}>
                <div className={layoutStyles.sideProgressLabel}>
                  <span className={`${layoutStyles.sideProgressName} ${s === 'done' ? layoutStyles.sideProgressNameDone : s === 'active' ? layoutStyles.sideProgressNameActive : layoutStyles.sideProgressNameLocked}`}>{label}</span>
                  <span className={`${layoutStyles.sideProgressBadge} ${s === 'done' ? layoutStyles.sideProgressBadgeDone : s === 'active' ? layoutStyles.sideProgressBadgeActive : layoutStyles.sideProgressBadgeLocked}`}>
                    {statusLabel[s]}
                  </span>
                </div>
                <div className={layoutStyles.sideProgressSub}>{sub}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LoginScreen() {
  const [view, setView] = useState('login')
  if (view === 'register') return <RegisterForm onBack={() => setView('login')} />
  if (view === 'forgot') return <ForgotPasswordForm onBack={() => setView('login')} />
  return <LoginForm onShowRegister={() => setView('register')} onForgot={() => setView('forgot')} />
}

function LoginForm({ onShowRegister, onForgot }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, remember)
    } catch (err) {
      setError(err.message || 'Credenciales invalidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Iniciar Sesion">
      <form onSubmit={handleSubmit}>
        <div className={authStyles.authForm}>
          {error && <p className={authStyles.authError}>{error}</p>}
          <Field label="Correo electronico" type="email" placeholder="jose.barcenas@correo.com" value={email} onChange={setEmail} required />
          <Field label="Contrasena" type="password" placeholder="********" value={password} onChange={setPassword} required />
          <div className={authStyles.authRememberRow}>
            <label className={authStyles.authRememberLabel}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className={authStyles.authRememberCheckbox} />
              <span className={authStyles.authHint}>Recordarme</span>
            </label>
            <button type="button" onClick={onForgot} className={`${authStyles.authSwitchBtn} ${authStyles.authForgotLink}`}>Olvidaste tu contrasena?</button>
          </div>
          <Btn type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar Sesion'}
          </Btn>
          <div className={authStyles.authSwitchText}>
            <span>No tienes una cuenta?</span>
            <button type="button" onClick={onShowRegister} className={authStyles.authSwitchBtn}>Crear cuenta</button>
          </div>
        </div>
      </form>
    </AuthCard>
  )
}

function ForgotPasswordForm({ onBack }) {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Correo requerido')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Correo invalido')
      return
    }
    setLoading(true)
    try {
      const res = await authService.forgotPassword(email)
      setDemoCode(res.demoCode || '')
      setStep('code')
    } catch (err) {
      setError(err.message || 'Error al solicitar el codigo')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    if (!code.trim()) {
      setError('Codigo requerido')
      return
    }
    if (password.length < 6) {
      setError('La contrasena debe tener minimo 6 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Las contrasenas no coinciden')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(email, code.trim(), password)
      setStep('done')
    } catch (err) {
      setError(err.message || 'Error al restablecer la contrasena')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <AuthCard title="Contrasena Restablecida" onClose={onBack}>
        <div className={authStyles.authForm}>
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(75,127,82,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="24" height="24" fill="#4B7F52" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Contrasena actualizada</h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>Tu contrasena fue restablecida. Ahora puedes iniciar sesion.</p>
            <Btn fullWidth size="lg" onClick={onBack}>Ir a Iniciar Sesion</Btn>
          </div>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Recuperar Contrasena" onClose={onBack}>
      {step === 'email' && (
        <form onSubmit={handleSend}>
          <div className={authStyles.authForm}>
            {error && <p className={authStyles.authError}>{error}</p>}
            <p style={{ fontSize: '0.875rem', color: '#4B5563', margin: 0 }}>Escribe tu correo y te enviaremos un codigo para restablecer tu contrasena.</p>
            <Field label="Correo electronico" type="email" placeholder="jose.barcenas@correo.com" value={email} onChange={setEmail} required />
            <Btn type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Enviando codigo...' : 'Enviar codigo'}
            </Btn>
            <div className={authStyles.authSwitchText}>
              <button type="button" onClick={onBack} className={authStyles.authSwitchBtn}>Volver a iniciar sesion</button>
            </div>
          </div>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleReset}>
          <div className={authStyles.authForm}>
            {error && <p className={authStyles.authError}>{error}</p>}
            {demoCode ? (
              <div style={{ padding: '0.75rem 1rem', background: '#FFF8E7', border: '1px solid #F0E0B0', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#8A6D1A' }}>
                Modo demostracion: tu codigo de recuperacion es <strong>{demoCode}</strong> (vence en 10 minutos).
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#4B5563', margin: 0 }}>Si el correo existe en el sistema, recibiras un codigo de recuperacion.</p>
            )}
            <Field label="Codigo de recuperacion" placeholder="123456" value={code} onChange={setCode} required />
            <Field label="Nueva contrasena" type="password" placeholder="********" value={password} onChange={setPassword} required />
            <p className={authStyles.authHint}>Minimo 6 caracteres</p>
            <Field label="Confirmar contrasena" type="password" placeholder="********" value={confirm} onChange={setConfirm} required />
            <Btn type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Restableciendo...' : 'Restablecer contrasena'}
            </Btn>
            <div className={authStyles.authSwitchText}>
              <button type="button" onClick={onBack} className={authStyles.authSwitchBtn}>Volver a iniciar sesion</button>
            </div>
          </div>
        </form>
      )}
    </AuthCard>
  )
}

const REGISTER_VALIDATORS = {
  fullName: v => (!v || !v.trim() ? 'Nombre requerido' : undefined),
  email: v => (!v || !v.trim() ? 'Correo requerido' : (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? 'Correo invalido' : undefined)),
  phone: v => (!v || !v.trim() ? 'Telefono requerido' : (!/^[0-9\s+()-]{7,15}$/.test(v.trim()) ? 'Telefono invalido' : undefined)),
  password: v => (!v ? 'Contrasena requerida' : (v.length < 6 ? 'Minimo 6 caracteres' : undefined)),
  terms: v => (!v ? 'Debe aceptar terminos' : undefined),
}

function RegisterForm({ onBack }) {
  const { register } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const values = { fullName, email, phone, password, terms: accepted }

  function setErrorFor(name, err) {
    setErrors(prev => {
      const next = { ...prev }
      if (err) next[name] = err
      else delete next[name]
      return next
    })
  }

  function handleFieldChange(name, value, setter) {
    setter(value)
    if (touched[name]) setErrorFor(name, REGISTER_VALIDATORS[name](value))
  }

  function handleTermsChange(checked) {
    setAccepted(checked)
    if (touched.terms) setErrorFor('terms', REGISTER_VALIDATORS.terms(checked))
  }

  function handleBlur(name) {
    setTouched(prev => (prev[name] ? prev : { ...prev, [name]: true }))
    setErrorFor(name, REGISTER_VALIDATORS[name](values[name]))
  }

  function validate() {
    const newErrors = {}
    Object.entries(REGISTER_VALIDATORS).forEach(([name, fn]) => {
      const err = fn(values[name])
      if (err) newErrors[name] = err
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    setTouched({ fullName: true, email: true, phone: true, password: true, terms: true })
    if (!validate()) return
    setLoading(true)
    try {
      await register({ fullName, email, phone: phone.trim(), password })
      setRegistered(true)
    } catch (err) {
      setApiError(err.message || 'Error al crear cuenta')
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <AuthCard title="Cuenta Creada" onClose={onBack}>
        <div className={authStyles.authForm}>
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(75,127,82,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="24" height="24" fill="#4B7F52" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Cuenta creada exitosamente</h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>Tu cuenta ha sido registrada. Ahora puedes iniciar sesion.</p>
            <Btn fullWidth size="lg" onClick={onBack}>Ir a Iniciar Sesion</Btn>
          </div>
      </div>
    </AuthCard>
    )
  }

  return (
    <AuthCard title="Crear Cuenta" onClose={onBack}>
      <form onSubmit={handleSubmit}>
        <div className={authStyles.authForm}>
          {apiError && <p className={authStyles.authError}>{apiError}</p>}
          <div>
            <Field label="Nombre completo" placeholder="Jose Barcenas" value={fullName} onChange={v => handleFieldChange('fullName', v, setFullName)} onBlur={() => handleBlur('fullName')} required />
            {errors.fullName && <p className={authStyles.authError}>{errors.fullName}</p>}
          </div>
          <div>
            <Field label="Correo electronico" type="email" placeholder="jose.barcenas@correo.com" value={email} onChange={v => handleFieldChange('email', v, setEmail)} onBlur={() => handleBlur('email')} required />
            {errors.email && <p className={authStyles.authError}>{errors.email}</p>}
          </div>
          <div>
            <Field label="Telefono" placeholder="300 123 4567" value={phone} onChange={v => handleFieldChange('phone', v, setPhone)} onBlur={() => handleBlur('phone')} required />
            {errors.phone && <p className={authStyles.authError}>{errors.phone}</p>}
          </div>
          <div>
            <Field label="Contrasena" type="password" placeholder="********" value={password} onChange={v => handleFieldChange('password', v, setPassword)} onBlur={() => handleBlur('password')} required />
            {errors.password && <p className={authStyles.authError}>{errors.password}</p>}
            <p className={authStyles.authHint}>Minimo 6 caracteres</p>
          </div>
          <div>
            <label className={authStyles.authRememberLabel}>
              <input type="checkbox" checked={accepted} onChange={e => handleTermsChange(e.target.checked)} onBlur={() => handleBlur('terms')} className={styles.checkbox} />
              <span className={authStyles.authHint}>Acepto los terminos y condiciones</span>
            </label>
            {errors.terms && <p className={authStyles.authError}>{errors.terms}</p>}
          </div>
          <Btn type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Btn>
          <div className={authStyles.authSwitchText}>
            <span>Ya tienes cuenta?</span>
            <button type="button" onClick={onBack} className={authStyles.authSwitchBtn}>Iniciar sesion</button>
          </div>
        </div>
      </form>
    </AuthCard>
  )
}

function AppHeader({ onLogout, onDashboard, isAdmin }) {
  const { screen, setScreen, currentStep } = useApp()
  const idx = STEPS.findIndex(s => s.id === screen)

  return (
    <header className={layoutStyles.header}>
      <div className={layoutStyles.headerTop}>
        <div className={layoutStyles.headerBrand}>
          <div className={layoutStyles.headerLogo}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#2A5783"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" /></svg>
          </div>
          <div>
            <div className={layoutStyles.headerName}>CORPORACION UNIVERSITARIA ADVENTISTA</div>
            <div className={layoutStyles.headerSubtitle}>Portal de Inscripciones y Admisiones</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isAdmin && (
            <button onClick={onDashboard} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>
              Dashboard BPM
            </button>
          )}
          <button onClick={onLogout} className={layoutStyles.headerLogout}>
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" /></svg>
            Cerrar sesion
          </button>
        </div>
      </div>
      <div className={layoutStyles.headerNav}>
        <div className={layoutStyles.headerNavInner}>
          {STEPS.map((step, i) => {
            const done = i < idx
            const active = i === idx
            const canAccess = i <= currentStep
            return (
              <button key={step.id} onClick={() => canAccess && setScreen(step.id)} disabled={!canAccess}
                className={`${layoutStyles.headerStep} ${active ? layoutStyles.headerStepActive : done ? layoutStyles.headerStepDone : layoutStyles.headerStepPending} ${!canAccess ? layoutStyles.headerStepDisabled : ''}`}>
                <span className={`${layoutStyles.stepBadge} ${done ? layoutStyles.stepBadgeDone : active ? layoutStyles.stepBadgeActive : layoutStyles.stepBadgePending}`}>
                  {done ? '\u2713' : step.n}
                </span>
                {step.label}
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}

// ─── Screen 1: Inscripcion ──────────────────────────────────────────────────
function ScreenInscripcion() {
  const { setScreen, setCurrentStep, setFormData } = useApp()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [programa, setPrograma] = useState('')
  const [jornada, setJornada] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [inscriptionNum, setInscriptionNum] = useState('')

  function validate() {
    const newErrors = {}
    if (!nombre.trim()) newErrors.nombre = 'Nombre requerido'
    if (!apellido.trim()) newErrors.apellido = 'Apellido requerido'
    if (!email.trim()) newErrors.email = 'Correo requerido'
    else if (!EMAIL_REGEX.test(email)) newErrors.email = 'Correo invalido'
    if (!telefono.trim()) newErrors.telefono = 'Telefono requerido'
    if (!programa) newErrors.programa = 'Programa requerido'
    if (!jornada) newErrors.jornada = 'Jornada requerida'
    if (!accepted) newErrors.terms = 'Debe aceptar terminos'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    setApiError('')
    if (!validate()) return
    setLoading(true)
    try {
      const created = await inscriptionService.create({ program: programa, schedule: jornada })
      setInscriptionNum(created?.id || '')
      setFormData({ nombre, apellido, email, telefono, programa, jornada })
      setSubmitted(true)
      setCurrentStep(1)
    } catch (err) {
      setApiError(err.message || 'Error al crear inscripcion')
    } finally {
      setLoading(false)
    }
  }

  const hero = (
    <div className={layoutStyles.hero}>
      <div className={layoutStyles.heroInner}>
        <div>
          <h1 className={layoutStyles.heroTitle}>Inicia tu proceso de inscripcion</h1>
          <p className={layoutStyles.heroDesc}>Completa la informacion solicitada para registrar tu inscripcion y continuar con el proceso de admision.</p>
        </div>
        <div className={layoutStyles.heroRight}>
          <div className={layoutStyles.heroPeriodLabel}>Periodo academico</div>
          <div className={layoutStyles.heroPeriodValue}>2026 — Segundo Semestre</div>
          <div className={layoutStyles.heroBadge} style={{ background: 'rgba(214,182,86,0.2)', color: '#D6B656' }}>
            <span className={layoutStyles.heroBadgeDot} />
            Inscripcion en progreso
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ScreenLayout hero={hero}>
      {apiError && <ErrorMessage message={apiError} />}

      {submitted && (
        <div className={inscripcionStyles.successCard}>
          <div className={inscripcionStyles.successCardHeader}>
            <div className={inscripcionStyles.successCardIcon}>
              <svg className={inscripcionStyles.successCardIconSvg} fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className={inscripcionStyles.successCardTitle}>Inscripcion registrada correctamente</div>
              <p className={inscripcionStyles.successCardDesc}>Tu informacion ha sido registrada correctamente. Para continuar con el proceso debes realizar el pago de inscripcion.</p>
              <div className={inscripcionStyles.successCardGrid}>
                {[['N° de Inscripcion', inscriptionNum], ['Fecha de registro', new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })], ['Estado', 'Registrada']].map(([k, v]) => (
                  <div key={k} className={inscripcionStyles.successCardField}>
                    <div className={inscripcionStyles.successCardFieldLabel}>{k}</div>
                    <div className={`${inscripcionStyles.successCardFieldValue} ${k === 'Estado' ? inscripcionStyles.successCardFieldValueOk : ''}`}>{v}</div>
                  </div>
                ))}
              </div>
              <Btn size="lg" onClick={() => setScreen('pago')}
                icon={<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}>
                Continuar al pago
              </Btn>
            </div>
          </div>
        </div>
      )}

      {!submitted && (
        <div className={layoutStyles.gridLayout}>
          <div className={layoutStyles.gridMain}>
            {/* Datos personales */}
            <Card>
              <SecLabel n="1" label="Datos Personales" />
              <div className={inscripcionStyles.formGrid}>
                <div className={inscripcionStyles.formGroup}>
                  <Field label="Nombre" value={nombre} onChange={setNombre} required />
                  {errors.nombre && <p className={inscripcionStyles.formError}>{errors.nombre}</p>}
                </div>
                <div className={inscripcionStyles.formGroup}>
                  <Field label="Apellido" value={apellido} onChange={setApellido} required />
                  {errors.apellido && <p className={inscripcionStyles.formError}>{errors.apellido}</p>}
                </div>
                <div className={inscripcionStyles.formGroup}>
                  <Field label="Correo" type="email" value={email} onChange={setEmail} required />
                  {errors.email && <p className={inscripcionStyles.formError}>{errors.email}</p>}
                </div>
                <div className={inscripcionStyles.formGroup}>
                  <Field label="Telefono" value={telefono} onChange={setTelefono} required />
                  {errors.telefono && <p className={inscripcionStyles.formError}>{errors.telefono}</p>}
                </div>
              </div>
            </Card>

            {/* Programa */}
            <Card>
              <SecLabel n="2" label="Programa Academico" />
              <div className={inscripcionStyles.formGrid}>
                <div className={inscripcionStyles.formGroup}>
                  <Field label="Programa" options={PROGRAMS} value={programa} onChange={setPrograma} required />
                  {errors.programa && <p className={inscripcionStyles.formError}>{errors.programa}</p>}
                </div>
                <div className={inscripcionStyles.formGroup}>
                  <Field label="Jornada" options={SCHEDULES} value={jornada} onChange={setJornada} required />
                  {errors.jornada && <p className={inscripcionStyles.formError}>{errors.jornada}</p>}
                </div>
                <div className={inscripcionStyles.formGroup}>
                </div>
              </div>
              {programa && (
                <div className={inscripcionStyles.programsGrid}>
                  {PROGRAMS.map(p => (
                    <button key={p} onClick={() => setPrograma(p)}
                      className={`${inscripcionStyles.programCard} ${programa === p ? inscripcionStyles.programCardSelected : ''}`}>
                      <div className={`${inscripcionStyles.programCardName} ${programa === p ? inscripcionStyles.programCardNameSelected : ''}`}>{p}</div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Terminos */}
            <Card>
              <SecLabel n="3" label="Terminos y Condiciones" />
              <label className={inscripcionStyles.termsLabel}>
                <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className={styles.checkbox} />
                <span className={inscripcionStyles.termsText}>
                  Acepto los terminos y condiciones y autorizo el tratamiento de mis datos personales.{' '}
                  <button type="button" onClick={() => setShowTerms(true)} className={inscripcionStyles.termsLink}>
                    Ver terminos y condiciones
                  </button>
                  <span style={{ color: '#D32F2F' }}> *</span>
                </span>
              </label>
              {errors.terms && <p className={inscripcionStyles.formError}>{errors.terms}</p>}
              <div className={inscripcionStyles.formActions}>
                <Btn size="lg" disabled={!accepted || loading} onClick={handleSubmit}
                  icon={<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}>
                  {loading ? 'Guardando...' : 'Guardar y continuar'}
                </Btn>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className={layoutStyles.gridSidebar}>
            <SideProgress stage={submitted ? 'inscripcion-done' : 'inscripcion'} />
            <div className={layoutStyles.sidebarCard}>
              <div className={layoutStyles.sidebarTitle}>Informacion del proceso</div>
              {[
                ['Periodo', `${new Date().getFullYear()} — ${new Date().getMonth() < 6 ? '1°' : '2°'} Semestre`],
                ['Estado', submitted ? 'Inscripcion registrada' : 'En progreso'],
                ['Cierre de inscripciones', `31 ${new Date().getMonth() < 6 ? 'Dic' : 'Jun'} ${new Date().getFullYear()}`],
                ['Costo de inscripcion', '$80.000 COP'],
              ].map(([k, v]) => (
                <div key={k} className={layoutStyles.infoRow}>
                  <span className={layoutStyles.infoRowLabel}>{k}</span>
                  <span className={`${layoutStyles.infoRowValue} ${k === 'Estado' && submitted ? layoutStyles.infoRowValueSuccess : ''}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className={layoutStyles.sidebarCard}>
              <div className={layoutStyles.sidebarTitle}>Soporte de Admisiones</div>
              <div className={layoutStyles.supportItem}>
                <svg className={layoutStyles.supportIcon} fill="#2A5783" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                admisiones@cua.edu.co
              </div>
              <div className={layoutStyles.supportItem}>
                <svg className={layoutStyles.supportIcon} fill="#2A5783" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
                (604) 311 7000 ext. 200
              </div>
              <div className={layoutStyles.supportItem}>
                <svg className={layoutStyles.supportIcon} fill="#2A5783" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
                Chat de soporte en linea
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTerms && (
        <div className={layoutStyles.modalOverlay}>
          <div className={layoutStyles.modalContent}>
            <div className={layoutStyles.modalHeader}>
              <h3 className={layoutStyles.modalTitle}>Terminos y Condiciones</h3>
              <button onClick={() => setShowTerms(false)} className={layoutStyles.modalClose}>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
              </button>
            </div>
            <div className={layoutStyles.modalBody}>
              <p>La Corporacion Universitaria Adventista (CUA) recopila los datos personales del aspirante para los fines del proceso de inscripcion, seleccion y admision al programa academico seleccionado.</p>
              <p>El pago de inscripcion no es reembolsable una vez procesado. La inscripcion no garantiza la admision al programa.</p>
              <p>La informacion suministrada debe ser veraz y verificable. Cualquier falsedad causara la nulidad automatica del proceso.</p>
              <p>Los datos personales seran tratados conforme a la Ley 1581 de 2012 y no seran compartidos con terceros sin autorizacion del titular.</p>
              <p>La CUA se reserva el derecho de modificar el calendario academico y los cupos disponibles con previa comunicacion oficial.</p>
            </div>
            <div className={layoutStyles.modalFooter}>
              <Btn variant="ghost" onClick={() => setShowTerms(false)} fullWidth>Cerrar</Btn>
              <Btn onClick={() => { setAccepted(true); setShowTerms(false) }} fullWidth>Aceptar terminos</Btn>
            </div>
          </div>
        </div>
      )}
    </ScreenLayout>
  )
}

// ─── Screen 2: Pago ─────────────────────────────────────────────────────────
function ScreenPago() {
  const { setScreen, setCurrentStep, formData, user } = useApp()
  const [method, setMethod] = useState(null)
  const [paid, setPaid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inscriptions, setInscriptions] = useState([])
  const [selectedInscription, setSelectedInscription] = useState(null)
  const fileRef = useRef(null)
  const [comprobante, setComprobante] = useState(null)
  const [receiptNum] = useState(() => `REC-${Date.now().toString(36).toUpperCase()}`)
  const [receiptDates] = useState(() => {
    const now = Date.now()
    const fmt = ts => new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    return { issued: fmt(now), due: fmt(now + 7 * 24 * 60 * 60 * 1000) }
  })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({ docNumber: '', bank: '' })
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [existingPayment, setExistingPayment] = useState(null)

  const methods = [
    { id: 'pse', icon: '🏦', label: 'PSE', desc: 'Pago en linea', actor: 'Entidad Financiera' },
    { id: 'tarjeta', icon: '💳', label: 'Tarjeta Credito / Debito', desc: 'Visa, Mastercard, Amex', actor: 'Entidad Financiera' },
    { id: 'banco', icon: '🏛️', label: 'Entidad Financiera', desc: 'Pago usando referencia del recibo', actor: 'Entidad Financiera' },
    { id: 'caja', icon: '🪙', label: 'Caja / Tesoreria CUA', desc: 'Pago presencial en campus', actor: 'Tesoreria CUA' },
  ]

  function handleDownloadReceipt() {
    const ins = inscriptions.find(i => i.id === selectedInscription)
    const aspirante = formData ? `${formData.nombre} ${formData.apellido}` : user?.fullName || ''
    const programa = formData?.programa || ins?.program || ''
    const fecha = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    const vence = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    const periodo = `${new Date().getFullYear()} - ${new Date().getMonth() < 6 ? 'Primer' : 'Segundo'} Semestre`
    const metodo = method ? methods.find(m => m.id === method)?.label || method : 'Por seleccionar'

    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo de Pago - ${receiptNum}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 3px solid #2A5783; padding-bottom: 15px; margin-bottom: 20px; }
          .uni-name { font-size: 18px; font-weight: bold; color: #2A5783; margin: 0; }
          .receipt-title { font-size: 22px; font-weight: bold; color: #1a3a5c; margin: 8px 0; }
          .receipt-number { font-size: 14px; color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
          .info-item { padding: 8px; background: #f8f9fa; border-radius: 4px; }
          .info-label { font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 4px; }
          .info-value { font-size: 14px; font-weight: bold; color: #333; }
          .amount-box { text-align: center; background: #2A5783; color: white; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .amount-label { font-size: 14px; opacity: 0.9; }
          .amount-value { font-size: 32px; font-weight: bold; margin-top: 5px; }
          .notes { font-size: 12px; color: #666; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
          .notes p { margin: 4px 0; }
          .footer { text-align: center; font-size: 11px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
          .badge { display: inline-block; background: #D6B656; color: #333; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="uni-name">Corporacion Universitaria Adventista</p>
          <h1 class="receipt-title">Recibo de Inscripcion</h1>
          <p class="receipt-number">No. <strong>${escapeHtml(receiptNum)}</strong></p>
          <span class="badge">Pago pendiente</span>
        </div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Aspirante</div><div class="info-value">${escapeHtml(aspirante)}</div></div>
          <div class="info-item"><div class="info-label">Correo</div><div class="info-value">${escapeHtml(user?.email || '')}</div></div>
          <div class="info-item"><div class="info-label">Programa</div><div class="info-value">${escapeHtml(programa)}</div></div>
          <div class="info-item"><div class="info-label">Periodo</div><div class="info-value">${escapeHtml(periodo)}</div></div>
          <div class="info-item"><div class="info-label">Concepto</div><div class="info-value">Derecho de Inscripcion</div></div>
          <div class="info-item"><div class="info-label">Metodo de pago</div><div class="info-value">${escapeHtml(metodo)}</div></div>
        </div>
        <div class="amount-box">
          <div class="amount-label">Valor a Pagar</div>
          <div class="amount-value">$80.000 COP</div>
        </div>
        <div style="font-size: 13px; color: #555; margin-bottom: 15px;">
          <strong>Fecha de emision:</strong> ${fecha} &nbsp;|&nbsp; <strong>Fecha de vencimiento:</strong> ${vence}
        </div>
        <div class="notes">
          <p><strong>NOTAS:</strong></p>
          <p>- El pago de inscripcion no es reembolsable.</p>
          <p>- La inscripcion no garantiza la admision al programa.</p>
          <p>- Presentar este recibo al momento del pago.</p>
        </div>
        <div class="footer">Generado por Sistema SION - ${fecha}</div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const timelineItems = [
    { label: 'Recibo generado', done: true },
    { label: 'Pago realizado', done: paid },
    { label: 'Confirmacion financiera', done: paid },
    { label: 'Acceso a documentos', done: paid },
  ]

  const checkExistingPayment = useCallback(async (inscriptionId) => {
    try {
      const payment = await paymentService.getByInscription(inscriptionId)
      setExistingPayment(payment)
      if (payment?.status === 'completed') {
        setPaid(true)
        setCurrentStep(2)
      }
    } catch {
      setExistingPayment(null)
    }
  }, [setCurrentStep])

  useEffect(() => {
    let cancelled = false
    async function loadInscriptions() {
      try {
        const data = await inscriptionService.getMy()
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setInscriptions(list)
        if (list.length > 0) {
          setSelectedInscription(list[0].id)
          await checkExistingPayment(list[0].id)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar inscripciones')
      }
    }
    loadInscriptions()
    return () => { cancelled = true }
  }, [checkExistingPayment])

  async function handleInscriptionSelect(e) {
    const id = e.target.value
    setSelectedInscription(id)
    setPaid(false)
    setExistingPayment(null)
    await checkExistingPayment(id)
  }

  async function handlePayment() {
    if (!selectedInscription || !method) return
    if (method === 'pse' || method === 'tarjeta') {
      setShowPaymentModal(true)
      return
    }
    setLoading(true)
    setError('')
    try {
      const payment = existingPayment || await paymentService.create({ inscriptionId: selectedInscription, method })
      if (comprobante?.file && payment?.id) {
        await paymentService.uploadReceipt(payment.id, comprobante.file)
      }
      if (payment?.id && payment.status !== 'completed') {
        await paymentService.confirm(payment.id, `TXN-${method.toUpperCase()}-${Date.now()}`)
      }
      setPaid(true)
      setCurrentStep(2)
    } catch (err) {
      setError(err.message || 'Error al procesar pago')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmOnlinePayment() {
    if (!paymentData.docNumber || !paymentData.bank) return
    setPaymentProcessing(true)
    setError('')
    try {
      const payment = existingPayment || await paymentService.create({ inscriptionId: selectedInscription, method })
      await new Promise(r => setTimeout(r, 2000))
      if (payment?.id && payment.status !== 'completed') {
        await paymentService.confirm(payment.id, `TXN-${method.toUpperCase()}-${Date.now()}`)
      }
      setPaid(true)
      setCurrentStep(2)
      setShowPaymentModal(false)
    } catch (err) {
      setError(err.message || 'Error al procesar pago')
    } finally {
      setPaymentProcessing(false)
    }
  }

  if (paid) {
    return (
      <ScreenLayout>
        <SuccessBanner title="Pago registrado" description="Tu pago fue registrado. Ya puedes cargar documentos."
          action={<Btn size="lg" variant="success" onClick={() => setScreen('documentos')}>Continuar a documentos</Btn>} />
      </ScreenLayout>
    )
  }

  const hero = (
    <div className={layoutStyles.hero}>
      <div className={layoutStyles.heroInner}>
        <div>
          <h1 className={layoutStyles.heroTitle}>Pago de Inscripcion</h1>
          <p className={layoutStyles.heroDesc}>Actores: <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Aspirante · Entidad Financiera / Tesoreria · Sistema SION</strong></p>
        </div>
        <Badge color="#D6B656" bg="rgba(214,182,86,0.15)" dot>Pago pendiente de confirmacion</Badge>
      </div>
    </div>
  )

  return (
    <ScreenLayout hero={hero}>
      {error && <ErrorMessage message={error} />}

      {inscriptions.length === 0 && (
        <div style={{ padding: '1rem', background: '#FFF8E7', borderRadius: '0.75rem', border: '1px solid #F0E0B0', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <p style={{ color: '#8A6D1A', fontSize: '0.875rem', margin: 0 }}>No tienes inscripciones registradas. Crea tu inscripcion primero para poder pagar.</p>
          <Btn size="sm" variant="secondary" onClick={() => setScreen('inscripcion')}>Ir a Inscripcion</Btn>
        </div>
      )}

      {inscriptions.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <label className={styles.fieldLabel}>Selecciona inscripcion</label>
          <select value={selectedInscription || ''} onChange={handleInscriptionSelect} className={styles.fieldSelect}>
            {inscriptions.map(ins => (
              <option key={ins.id} value={ins.id}>{ins.program} - {ins.schedule}</option>
            ))}
          </select>
        </div>
      )}

      <div className={layoutStyles.gridLayout}>
        <div className={layoutStyles.gridMain}>
          {/* Recibo */}
          <Card>
            <SecLabel n="1" label="Recibo de Inscripcion — Sistema SION" />
            <div className={pagoStyles.receipt}>
              <div className={pagoStyles.receiptHeader}>
                <div>
                  <div className={pagoStyles.receiptLabel}>Corporacion Universitaria Adventista</div>
                  <div className={pagoStyles.receiptTitle}>Recibo de Inscripcion</div>
                  <div className={pagoStyles.receiptNumber}>No. <strong>{receiptNum}</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge color="#D6B656" bg="rgba(214,182,86,0.15)">Pago pendiente</Badge>
                  <div className={pagoStyles.receiptDate}>Emitido: {receiptDates.issued} · Vence: {receiptDates.due}</div>
                </div>
              </div>
              <div className={pagoStyles.receiptInfo}>
                {[['Aspirante', formData ? `${formData.nombre} ${formData.apellido}` : user?.fullName || ''], ['Programa', formData?.programa || inscriptions.find(i => i.id === selectedInscription)?.program || ''], ['Periodo', `${new Date().getFullYear()} – ${new Date().getMonth() < 6 ? 'Primer' : 'Segundo'} Semestre`], ['Concepto', 'Derecho de Inscripcion']].map(([k, v]) => (
                  <div key={k}>
                    <div className={pagoStyles.receiptInfoLabel}>{k}</div>
                    <div className={pagoStyles.receiptInfoValue}>{v}</div>
                  </div>
                ))}
              </div>
              <div className={pagoStyles.receiptAmount}>
                <span className={pagoStyles.receiptAmountLabel}>Valor de inscripcion</span>
                <span className={pagoStyles.receiptAmountValue}>$80.000 COP</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Btn variant="secondary" size="sm" onClick={handleDownloadReceipt} icon={<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}>Descargar recibo</Btn>
              <Btn variant="ghost" size="sm" onClick={handleDownloadReceipt} icon={<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17H17.01M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}>Imprimir recibo</Btn>
            </div>
          </Card>

          {/* Metodos */}
          <Card>
            <SecLabel n="2" label="Metodos de Pago" />
            <div className={pagoStyles.methodsGrid}>
              {methods.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`${pagoStyles.methodBtn} ${method === m.id ? pagoStyles.methodBtnSelected : ''}`}>
                  <span className={pagoStyles.methodIcon}>{m.icon}</span>
                  <div className={pagoStyles.methodInfo}>
                    <div className={pagoStyles.methodLabel}>{m.label}</div>
                    <div className={pagoStyles.methodDesc}>{m.desc}</div>
                    <div className={pagoStyles.methodActor}>{m.actor}</div>
                  </div>
                  {method === m.id && <svg className={pagoStyles.methodCheck} fill="#2A5783" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-5-5 1.41-1.41L10 13.17l7.59-7.59L19 7l-9 9z" /></svg>}
                </button>
              ))}
            </div>

            {/* Upload comprobante */}
            {(method === 'caja' || method === 'banco') && (
              <div className={pagoStyles.uploadArea}>
                <div className={pagoStyles.uploadTitle}>Carga el comprobante de pago</div>
                <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const f = e.target.files?.[0]; setComprobante(f ? { file: f, name: f.name } : null) }} />
                <div onClick={() => fileRef.current?.click()} className={pagoStyles.uploadBox} style={{ borderColor: 'rgba(42,87,131,0.34)' }}>
                  {comprobante
                    ? <div className={pagoStyles.uploadSuccess}>
                        <svg width="20" height="20" fill="#4B7F52" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
                        {comprobante.name}
                      </div>
                    : <>
                        <svg className={pagoStyles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <div className={pagoStyles.uploadText}>Arrastra tu comprobante aqui o <span className={pagoStyles.uploadTextHighlight}>selecciona un archivo</span></div>
                        <div className={pagoStyles.uploadHint}>Formatos permitidos: PDF, JPG o PNG · Max. 5 MB</div>
                      </>}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className={pagoStyles.timeline}>
              <div className={pagoStyles.timelineTitle}>Estado del proceso de pago</div>
              <div className={pagoStyles.timelineSteps}>
                {timelineItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < timelineItems.length - 1 ? 1 : 'none' }}>
                    <div className={pagoStyles.timelineStep}>
                      <div className={`${pagoStyles.timelineCircle} ${item.done ? pagoStyles.timelineCircleDone : pagoStyles.timelineCirclePending}`}>
                        {item.done ? '✓' : i + 1}
                      </div>
                      <div className={`${pagoStyles.timelineLabel} ${item.done ? pagoStyles.timelineLabelDone : pagoStyles.timelineLabelPending}`}>
                        {item.label}
                      </div>
                    </div>
                    {i < timelineItems.length - 1 && (
                      <div className={`${pagoStyles.timelineLine} ${item.done ? pagoStyles.timelineLineDone : pagoStyles.timelineLinePending}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={pagoStyles.footerRow}>
              <span className={pagoStyles.footerHint}>{method ? (comprobante ? 'Comprobante listo' : 'Metodo seleccionado') : 'Selecciona un metodo'}</span>
              <Btn disabled={!method || !selectedInscription || loading || ((method === 'banco' || method === 'caja') && !comprobante)} onClick={handlePayment}>
                {loading ? 'Procesando...' : 'Realizar pago'}
              </Btn>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className={layoutStyles.gridSidebar}>
          <SideProgress stage={paid ? 'pago-done' : 'pago'} />
          <ProcessFlowWidget currentStage="payment" />
          <div className={layoutStyles.sidebarCard}>
            <div className={layoutStyles.sidebarTitle}>Estados del pago</div>
            {[
              { label: 'Pago pendiente de confirmacion', color: '#D6B656', active: !paid },
              { label: 'Pago recibido por entidad', color: '#2A5783', active: false },
              { label: 'Pago confirmado a la CUA', color: '#4B7F52', active: paid },
            ].map((s, i) => (
              <div key={i} className={layoutStyles.infoRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.active ? s.color : '#e5e7eb', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: s.active ? s.color : '#9ca3af', fontWeight: s.active ? 600 : 400 }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal for PSE / Tarjeta */}
      {showPaymentModal && (
        <div className={layoutStyles.modalOverlay}>
          <div className={layoutStyles.modalContent} style={{ maxWidth: '480px' }}>
            <div className={layoutStyles.modalHeader}>
              <h3 className={layoutStyles.modalTitle}>
                {method === 'pse' ? 'Pago PSE - Transferencia en Linea' : 'Pago con Tarjeta'}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className={layoutStyles.modalClose}>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
              </button>
            </div>
            <div className={layoutStyles.modalBody}>
              <div style={{ background: '#F0F7FF', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#2A5783' }}>
                {method === 'pse' ? 'Seras redirigido a tu banco para completar la transferencia.' : 'Ingresa los datos de tu tarjeta para procesar el pago.'}
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label className={styles.fieldLabel}>Numero de documento *</label>
                <input type="text" placeholder="1234567890" value={paymentData.docNumber} onChange={e => setPaymentData({...paymentData, docNumber: e.target.value})} className={styles.fieldInput} />
              </div>

              {method === 'pse' && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className={styles.fieldLabel}>Banco *</label>
                  <select value={paymentData.bank} onChange={e => setPaymentData({...paymentData, bank: e.target.value})} className={styles.fieldSelect}>
                    <option value="">Seleccionar banco...</option>
                    <option value="bancolombia">Bancolombia</option>
                    <option value="davivienda">Davivienda</option>
                    <option value="bbva">BBVA</option>
                    <option value="bogota">Banco de Bogota</option>
                    <option value="colpatria">Colpatria</option>
                    <option value="av Villas">AV Villas</option>
                    <option value="daviplata">Daviplata</option>
                    <option value="nequi">Nequi</option>
                  </select>
                </div>
              )}

              {method === 'tarjeta' && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className={styles.fieldLabel}>Numero de tarjeta *</label>
                  <input type="text" placeholder="XXXX XXXX XXXX XXXX" maxLength="19" value={paymentData.bank} onChange={e => setPaymentData({...paymentData, bank: e.target.value})} className={styles.fieldInput} />
                </div>
              )}

              <div style={{ background: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>Inscripcion</span>
                  <span style={{ fontSize: '0.8125rem', color: '#374151' }}>$80.000 COP</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: '0.375rem', marginTop: '0.375rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>Total a pagar</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2A5783' }}>$80.000 COP</span>
                </div>
              </div>
            </div>
            <div className={layoutStyles.modalFooter}>
              <Btn variant="ghost" onClick={() => setShowPaymentModal(false)} fullWidth>Cancelar</Btn>
              <Btn fullWidth onClick={handleConfirmOnlinePayment} disabled={!paymentData.docNumber || !paymentData.bank || paymentProcessing}>
                {paymentProcessing ? 'Procesando...' : method === 'pse' ? 'Confirmar transferencia' : 'Pagar con tarjeta'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </ScreenLayout>
  )
}

// ─── Screen 3: Documentos ───────────────────────────────────────────────────
function ScreenDocumentos() {
  const { setScreen, setCurrentStep } = useApp()
  const [docs, setDocs] = useState([])
  const [inscriptions, setInscriptions] = useState([])
  const [selectedInscription, setSelectedInscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const inscriptionsData = await inscriptionService.getMy()
        if (cancelled) return
        const list = Array.isArray(inscriptionsData) ? inscriptionsData : []
        setInscriptions(list)
        if (list.length > 0) {
          const firstId = list[0].id
          setSelectedInscription(firstId)
          await loadDocs(firstId)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar inscripciones')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  async function loadDocs(inscriptionId) {
    try {
      const docsData = await documentService.getByInscription(inscriptionId)
      setDocs(Array.isArray(docsData) ? docsData : [])
    } catch (err) {
      setError(err.message || 'Error al cargar documentos')
    }
  }

  async function handleInscriptionChange(e) {
    const id = e.target.value
    setSelectedInscription(id)
    await loadDocs(id)
  }

  async function handleUpload(docType) {
    if (!selectedInscription) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      setUploading(docType)
      setError('')
      try {
        await documentService.upload(selectedInscription, docType, file)
        await loadDocs(selectedInscription)
      } catch (err) {
        setError(err.message || 'Error al subir documento')
      } finally {
        setUploading(null)
      }
    }
    input.click()
  }

  if (loading) return <LoadingSpinner />

  const allDone = DOC_TYPES.every(dt => docs.some(d => d.docType === dt.id && d.status === 'uploaded'))
  const uploadedN = docs.filter(d => d.status === 'uploaded').length
  const pct = Math.round((uploadedN / DOC_TYPES.length) * 100)

  const hero = (
    <div className={layoutStyles.hero}>
      <div className={layoutStyles.heroInner}>
        <div className={documentosStyles.docsHeaderInfo}>
          <h1 className={layoutStyles.heroTitle}>Carga de Documentos</h1>
          <p className={layoutStyles.heroDesc}>Actores: <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Aspirante · Sistema SION · UNAC / Admisiones</strong></p>
          <p className={layoutStyles.heroDesc} style={{ marginTop: '0.125rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>Adjunta los documentos requeridos para continuar con tu proceso de admision.</p>
        </div>
        <div className={documentosStyles.docsHeaderStats}>
          <div className={documentosStyles.docsCount}>
            <div className={documentosStyles.docsCountNumber}>{uploadedN}/{DOC_TYPES.length}</div>
            <div className={documentosStyles.docsCountLabel}>documentos cargados</div>
          </div>
          <div className={documentosStyles.progressCircle}>
            <svg viewBox="0 0 36 36" className={documentosStyles.progressCircleSvg} width="64" height="64">
              <circle cx="18" cy="18" r="15.9" className={documentosStyles.progressCircleBg} />
              <circle cx="18" cy="18" r="15.9" className={documentosStyles.progressCircleFill}
                strokeDasharray={`${pct} 100`} strokeDashoffset="25" />
            </svg>
            <div className={documentosStyles.progressCircleText}>{pct}%</div>
          </div>
        </div>
      </div>
    </div>
  )

  const cfg = {
    pending: { label: 'Pendiente', color: '#9ca3af', bg: '#f3f4f6' },
    uploaded: { label: 'Cargado', color: '#4B7F52', bg: 'rgba(75,127,82,0.1)' },
  }

  return (
    <ScreenLayout hero={hero}>
      {error && <ErrorMessage message={error} />}

      {inscriptions.length === 0 && (
        <div style={{ padding: '1rem', background: '#FFF8E7', borderRadius: '0.75rem', border: '1px solid #F0E0B0', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <p style={{ color: '#8A6D1A', fontSize: '0.875rem', margin: 0 }}>No tienes inscripciones registradas. Crea tu inscripcion primero para subir documentos.</p>
          <Btn size="sm" variant="secondary" onClick={() => setScreen('inscripcion')}>Ir a Inscripcion</Btn>
        </div>
      )}

      {inscriptions.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <label className={styles.fieldLabel}>Selecciona inscripcion</label>
          <select value={selectedInscription || ''} onChange={handleInscriptionChange} className={styles.fieldSelect}>
            {inscriptions.map(ins => (
              <option key={ins.id} value={ins.id}>{ins.program} - {ins.schedule}</option>
            ))}
          </select>
        </div>
      )}

      {allDone && (
        <div className={documentosStyles.allDoneBanner}>
          <div className={documentosStyles.allDoneContent}>
            <svg className={documentosStyles.allDoneIcon} fill="#4B7F52" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-5-5 1.41-1.41L10 13.17l7.59-7.59L19 7l-9 9z" /></svg>
            <div>
              <div className={documentosStyles.allDoneText}>Documentos aprobados</div>
              <div className={documentosStyles.allDoneDesc}>Tu documentacion esta completa y ha sido validada correctamente.</div>
            </div>
          </div>
          <Btn size="sm" variant="success" onClick={() => { setCurrentStep(3); setScreen('resultados') }}>Finalizar proceso</Btn>
        </div>
      )}

      <div className={layoutStyles.gridLayout}>
        <div className={layoutStyles.gridMain}>
          <div className={documentosStyles.docsList}>
            {DOC_TYPES.map(dt => {
              const doc = docs.find(d => d.docType === dt.id)
              const uploaded = doc?.status === 'uploaded'
              const isUploading = uploading === dt.id
              const status = uploaded ? 'uploaded' : 'pending'
              const c = cfg[status]
              return (
                <div key={dt.id} className={documentosStyles.docCard}>
                  <div className={`${documentosStyles.docIcon} ${status === 'uploaded' ? documentosStyles.docIconApproved : documentosStyles.docIconPending}`}>
                    {uploaded
                      ? <svg width="20" height="20" fill="#4B7F52" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
                      : <svg width="20" height="20" fill="#9ca3af" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>}
                  </div>
                  <div className={documentosStyles.docInfo}>
                    <div className={documentosStyles.docHeader}>
                      <span className={documentosStyles.docLabel}>{dt.label}</span>
                      <span className={`${documentosStyles.docBadge} ${uploaded ? documentosStyles.docBadgeApproved : documentosStyles.docBadgePending}`}>{c.label}</span>
                    </div>
                    <div className={documentosStyles.docStatus}>{dt.desc}</div>
                  </div>
                  <div className={documentosStyles.docActions}>
                    {uploaded ? (
                      <Btn size="sm" variant="ghost" disabled>Cargado</Btn>
                    ) : (
                      <Btn size="sm" onClick={() => handleUpload(dt.id)} disabled={isUploading}
                        icon={<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}>
                        {isUploading ? 'Subiendo...' : 'Subir archivo'}
                      </Btn>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className={layoutStyles.gridSidebar}>
          <SideProgress stage={allDone ? 'documentos-done' : 'documentos'} />
          <ProcessFlowWidget currentStage="documents" />
        </div>
      </div>
    </ScreenLayout>
  )
}

// ─── Screen 4: Resultados ───────────────────────────────────────────────────
function ScreenResultados() {
  const { formData } = useApp()
  const [result, setResult] = useState(null)
  const [latestIns, setLatestIns] = useState(null)
  const [payment, setPayment] = useState(null)
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadResult() {
      try {
        const data = await admissionService.getMy()
        if (!cancelled) setResult(data)
      } catch (err) {
        if (cancelled) return
        if (err.status === 404) {
          setResult(null)
        } else {
          setError(err.message || 'Error al cargar el resultado')
        }
      }
      try {
        const insList = await inscriptionService.getMy()
        if (cancelled) return
        const ins = Array.isArray(insList) ? insList[0] : null
        setLatestIns(ins)
        if (ins) {
          const [pay, docsData] = await Promise.all([
            paymentService.getByInscription(ins.id).catch(() => null),
            documentService.getByInscription(ins.id).catch(() => []),
          ])
          if (cancelled) return
          setPayment(pay)
          setDocs(Array.isArray(docsData) ? docsData : [])
        }
      } catch {
        // sin datos auxiliares: el timeline muestra los estados pendientes
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadResult()
    return () => { cancelled = true }
  }, [])

  if (loading) return <LoadingSpinner />

  const fmtDate = ts => (ts
    ? new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    : null)
  const paidDone = payment?.status === 'completed'
  const uploadedTypes = new Set(docs.map(d => d.docType)).size
  const lastUpload = docs[0]?.uploadedAt || null
  const decided = !!result && result.decision !== 'pending'

  const timelineItems = [
    { label: 'Inscripcion registrada', date: fmtDate(latestIns?.createdAt) || 'Sin registro', done: !!latestIns },
    { label: 'Pago confirmado', date: paidDone ? (fmtDate(payment.paidAt) || fmtDate(payment.createdAt)) : 'Pendiente', done: paidDone },
    { label: 'Documentos cargados', date: uploadedTypes > 0 ? `${uploadedTypes}/${DOC_TYPE_COUNT} cargados · ${fmtDate(lastUpload)}` : `0/${DOC_TYPE_COUNT} cargados`, done: uploadedTypes >= DOC_TYPE_COUNT },
    { label: 'Evaluacion academica', date: decided ? (fmtDate(result.evaluatedAt) || 'Evaluada') : 'En proceso', active: !decided, done: decided },
    { label: 'Resultado final', date: result?.decision === 'admitted' ? 'Admitido' : result?.decision === 'rejected' ? 'No admitido' : 'Pendiente', done: result?.decision === 'admitted' || result?.decision === 'rejected' },
  ]

  const hero = (
    <div className={layoutStyles.hero}>
      <div className={layoutStyles.heroInner}>
        <div>
          <h1 className={layoutStyles.heroTitle}>Resultado de Admision</h1>
          <p className={layoutStyles.heroDesc}>Consulta el estado de tu solicitud.</p>
        </div>
      </div>
    </div>
  )

  return (
    <ScreenLayout hero={hero}>
      {error && <ErrorMessage message={error} />}

      {(!result || result.decision === 'pending') && (
        <div className={resultadosStyles.resultCard}>
          <div className={resultadosStyles.resultCardInner}>
            <div className={resultadosStyles.resultIcon}>
              <svg className={resultadosStyles.resultIconSvg} fill="#D6B656" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L11 14.5V7h1.5v6.86l4.62 2.74-.89 1.4z" /></svg>
            </div>
            <div>
              <div className={resultadosStyles.resultTitle}>Tu solicitud esta en evaluacion</div>
              <p className={resultadosStyles.resultDesc}>Te notificaremos cuando haya un resultado.</p>
            </div>
          </div>
        </div>
      )}

      {result?.decision === 'admitted' && (
        <div className={resultadosStyles.admittedCard}>
          <div className={resultadosStyles.admittedTitle}>Felicitaciones!</div>
          <p className={resultadosStyles.admittedDesc}>Has sido admitido en la Corporacion Universitaria Adventista.</p>
          <div className={resultadosStyles.admittedGrid}>
            <div className={resultadosStyles.admittedField}>
              <div className={resultadosStyles.admittedFieldLabel}>Programa</div>
              <div className={resultadosStyles.admittedFieldValue}>{formData?.programa || latestIns?.program || 'No registrado'}</div>
            </div>
            <div className={resultadosStyles.admittedField}>
              <div className={resultadosStyles.admittedFieldLabel}>Periodo</div>
              <div className={resultadosStyles.admittedFieldValue}>{result.period || '2026-II'}</div>
            </div>
          </div>
          {result.notes && (
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#4B5563' }}>{result.notes}</p>
          )}
        </div>
      )}

      {result?.decision === 'rejected' && (
        <div className={resultadosStyles.rejectedCard}>
          <div className={resultadosStyles.rejectedTitle}>Resultado de tu proceso</div>
          <p className={resultadosStyles.rejectedDesc}>En esta ocasion no fue posible aprobar tu solicitud. Te invitamos a consultar alternativas.</p>
          {result.notes && (
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#4B5563' }}>{result.notes}</p>
          )}
          <p className={resultadosStyles.rejectedDesc}>
            Para reincribirte o resolver dudas, escribe a <strong>admisiones@unac.edu.co</strong>.
          </p>
        </div>
      )}

      {/* Timeline */}
      <Card style={{ marginTop: '1.5rem' }}>
        <SecLabel n="4" label="Historial del proceso" />
        <div className={resultadosStyles.timeline}>
          {timelineItems.map((item, i) => (
            <div key={i} className={resultadosStyles.timelineItem}>
              <div className={resultadosStyles.timelineItemLine}>
                <div className={`${resultadosStyles.timelineItemDot} ${item.done ? resultadosStyles.timelineItemDotDone : item.active ? resultadosStyles.timelineItemDotActive : resultadosStyles.timelineItemDotPending}`}>
                  {item.done ? '✓' : i + 1}
                </div>
                {i < timelineItems.length - 1 && (
                  <div className={`${resultadosStyles.timelineItemConnector} ${item.done ? resultadosStyles.timelineItemConnectorDone : resultadosStyles.timelineItemConnectorPending}`} />
                )}
              </div>
              <div className={resultadosStyles.timelineItemContent}>
                <div className={resultadosStyles.timelineItemHeader}>
                  <span className={`${resultadosStyles.timelineItemLabel} ${item.done ? resultadosStyles.timelineItemLabelDone : item.active ? resultadosStyles.timelineItemLabelActive : resultadosStyles.timelineItemLabelPending}`}>{item.label}</span>
                  <span className={resultadosStyles.timelineItemDate}>{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Metrics Sidebar */}
      <div style={{ marginTop: '1.5rem' }}>
        <ProcessFlowWidget currentStage="admission" />
      </div>
    </ScreenLayout>
  )
}

function getSavedProgress(userId) {
  if (!userId) return null
  try {
    const saved = localStorage.getItem(`inscriptionProgress_${userId}`)
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
}

function saveProgress(userId, screen, currentStep, formData) {
  if (!userId) return
  try {
    localStorage.setItem(`inscriptionProgress_${userId}`, JSON.stringify({ screen, currentStep, formData }))
  } catch {
    // almacenamiento no disponible: el progreso no persiste entre sesiones
  }
}

function clearProgress(userId) {
  if (!userId) return
  try {
    localStorage.removeItem(`inscriptionProgress_${userId}`)
  } catch {
    // almacenamiento no disponible
  }
}

export default function App() {
  const { user, loading: authLoading, logout } = useAuth()

  if (authLoading) return <LoadingSpinner />

  if (!user) return <LoginScreen />

  // key=user.id fuerza un remount limpio por cuenta: el estado (screen,
  // currentStep, formData) de una cuenta nunca se filtra a la siguiente
  return <AppShell key={user.id} user={user} onLogout={logout} />
}

function AppShell({ user, onLogout }) {
  const isAdmin = user.role === 'admin'
  const [initial] = useState(() => {
    const saved = getSavedProgress(user.id)
    if (saved && (saved.screen !== 'dashboard' || isAdmin)) return saved
    return null
  })
  const [screen, setScreen] = useState(initial?.screen || 'inscripcion')
  const [currentStep, setCurrentStep] = useState(initial?.currentStep ?? 0)
  const [formData, setFormData] = useState(initial?.formData || null)

  useEffect(() => {
    saveProgress(user.id, screen, currentStep, formData)
  }, [user, screen, currentStep, formData])

  function handleLogout() {
    clearProgress(user.id)
    onLogout()
  }

  function handleDashboard() {
    if (isAdmin) setScreen('dashboard')
  }

  function handleBackFromDashboard() {
    setScreen('inscripcion')
  }

  const activeScreen = screen === 'dashboard' && !isAdmin ? 'inscripcion' : screen

  return (
    <AppContext.Provider value={{ screen: activeScreen, setScreen, currentStep, setCurrentStep, formData, setFormData, user }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F5F5F5' }}>
        <AppHeader onLogout={handleLogout} onDashboard={handleDashboard} isAdmin={isAdmin} />
        {activeScreen === 'dashboard' && <DashboardAdmin onBack={handleBackFromDashboard} user={user} />}
        {activeScreen === 'inscripcion' && <ScreenInscripcion />}
        {activeScreen === 'pago' && <ScreenPago />}
        {activeScreen === 'documentos' && <ScreenDocumentos />}
        {activeScreen === 'resultados' && <ScreenResultados />}
      </div>
    </AppContext.Provider>
  )
}
