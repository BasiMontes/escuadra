import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TextField } from '../../components/Field'
import { Logo } from '../../components/Logo'
import { PasswordRules } from '../../components/PasswordRules'
import { ErrorNotice, Skeleton } from '../../components/States'
import { useLoad, useRepository } from '../../data/hooks'
import { OnboardingShell } from '../../layouts/OnboardingShell'
import { validateEmail, validatePassword, validateUsername } from '../../lib/validation'
import styles from './Onboarding.module.css'

const APP_VERSION = 'Versión 1.0.4'

type Errors = Record<string, string | null>

/** Tarjeta de formulario con el panel de marca en desktop. */
function AuthLayout({
  step,
  title,
  subtitle,
  children,
  links,
}: {
  step: number | null
  title: string
  subtitle: string
  children: ReactNode
  links: ReactNode
}) {
  return (
    <OnboardingShell step={step} back={false} layout="split">
      <section className={styles.brandPanel} aria-hidden="true">
        <Logo size={96} shadow border="none" />
        <p className={styles.brandTitle}>
          Tu reto diario de fútbol empieza aquí
        </p>
        <p className={styles.brandText}>Crea tu perfil, elige tu competición y responde una pregunta cada día en 20 segundos.</p>
      </section>
      <div className={styles.formWrap}>
        <Card className={styles.formCard} pad="none">
          <h1 className={styles.formTitle}>{title}</h1>
          <p className={styles.formSub}>{subtitle}</p>
          {children}
          <div className={styles.links}>{links}</div>
        </Card>
        <p className={styles.version}>{APP_VERSION}</p>
      </div>
    </OnboardingShell>
  )
}

export function Registro() {
  const repo = useRepository()
  const navigate = useNavigate()
  const [values, setValues] = useState({ username: '', email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: null }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Errors = {
      username: validateUsername(values.username),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    setSending(true)
    setFormError(null)
    try {
      await repo.signUp({ username: values.username.trim(), email: values.email.trim(), password: values.password })
      navigate('/onboarding/competiciones')
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout
      step={1}
      title="¡Bienvenido!"
      subtitle="Crea tu perfil para empezar"
      links={
        <p>
          ¿Ya tienes cuenta?{' '}
          <Link to="/entrar" data-testid="registro-ir-a-entrar">
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField
          label="Nombre de usuario"
          look="flat"
          placeholder="EJ: SQUAD_LEADER"
          autoComplete="username"
          value={values.username}
          onChange={set('username')}
          error={errors.username ?? undefined}
          data-testid="registro-usuario"
        />
        <TextField
          label="Correo electrónico"
          look="flat"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          value={values.email}
          onChange={set('email')}
          error={errors.email ?? undefined}
          data-testid="registro-email"
        />
        <TextField
          label="Contraseña"
          look="flat"
          type="password"
          placeholder="********"
          autoComplete="new-password"
          value={values.password}
          onChange={set('password')}
          error={errors.password ?? undefined}
          hint="Mínimo 8 caracteres, un número y un carácter especial"
          data-testid="registro-contrasena"
        />
        {formError && (
          <p className={styles.formError} role="alert" data-testid="registro-error">
            {formError}
          </p>
        )}
        <Button type="submit" block className={styles.submit} disabled={sending} data-testid="registro-continuar">
          {sending ? 'Creando…' : 'Continuar'}
        </Button>
      </form>
    </AuthLayout>
  )
}

export function Entrar() {
  const repo = useRepository()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Errors = {
      email: validateEmail(values.email),
      password: values.password ? null : 'Escribe tu contraseña.',
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    setSending(true)
    setFormError(null)
    try {
      await repo.signIn({ email: values.email.trim(), password: values.password })
      navigate('/inicio')
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout
      step={null}
      title="¡Hola de nuevo!"
      subtitle="Inicia sesión para seguir jugando"
      links={
        <>
          <p>
            <Link to="/recuperar" data-testid="entrar-olvide">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          <p>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" data-testid="entrar-ir-a-registro">
              Regístrate
            </Link>
          </p>
        </>
      }
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField
          label="Correo electrónico"
          look="flat"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          error={errors.email ?? undefined}
          data-testid="entrar-email"
        />
        <TextField
          label="Contraseña"
          look="flat"
          type="password"
          placeholder="********"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          error={errors.password ?? undefined}
          data-testid="entrar-contrasena"
        />
        {formError && (
          <p className={styles.formError} role="alert" data-testid="entrar-error">
            {formError}
          </p>
        )}
        <Button type="submit" block className={styles.submit} disabled={sending} data-testid="entrar-continuar">
          {sending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  )
}

export function Recuperar() {
  const repo = useRepository()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validateEmail(email)
    setError(err)
    if (err) return
    await repo.requestPasswordReset(email.trim())
    setSent(true)
  }

  return (
    <AuthLayout
      step={null}
      title="Recupera tu cuenta"
      subtitle="Te enviaremos un enlace por correo"
      links={
        <p>
          <Link to="/entrar" data-testid="recuperar-volver">
            Volver a iniciar sesión
          </Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField
          label="Correo electrónico"
          look="flat"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setSent(false)
          }}
          error={error ?? undefined}
          data-testid="recuperar-email"
        />
        {sent && (
          <p className={styles.formNote} role="status" data-testid="recuperar-enviado">
            Si existe una cuenta con ese correo, recibirás un enlace en unos minutos.
          </p>
        )}
        <Button type="submit" block className={styles.submit} data-testid="recuperar-enviar">
          Enviar enlace
        </Button>
      </form>
    </AuthLayout>
  )
}

/** Destino del enlace del correo de "Recupera tu cuenta". */
export function NuevaContrasena() {
  const [params] = useSearchParams()
  const link = params.get('enlace')
  const { data: valid, error, loading, reload } = useLoad((r) => r.checkResetLink(link), [link])
  const expired = valid === false

  return (
    <AuthLayout
      step={null}
      title={expired ? 'Enlace caducado' : 'Nueva contraseña'}
      subtitle={expired ? 'Este enlace ya no sirve' : 'Elige la que usarás a partir de ahora'}
      links={
        <p>
          <Link to="/entrar" data-testid="nueva-volver">
            Volver a iniciar sesión
          </Link>
        </p>
      }
    >
      {error && <ErrorNotice message="No se ha podido comprobar el enlace." onRetry={reload} />}
      {loading && <Skeleton height={260} />}
      {valid === true && <FormularioNueva link={link} />}
      {expired && (
        <div className={styles.form}>
          <p>Pide uno nuevo para cambiar tu contraseña.</p>
          <Button to="/recuperar" block className={styles.submit} data-testid="nueva-pedir-otro">
            Pedir otro enlace
          </Button>
        </div>
      )}
    </AuthLayout>
  )
}

function FormularioNueva({ link }: { link: string | null }) {
  const repo = useRepository()
  const sending = useRef(false)
  const [values, setValues] = useState({ next: '', confirm: '' })
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const mismatch =
    values.confirm !== values.next && values.confirm !== '' && (confirmTouched || values.confirm.length >= values.next.length)
  const ready = !validatePassword(values.next) && values.next === values.confirm

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    setFormError(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!ready || sending.current) return
    sending.current = true
    setBusy(true)
    try {
      await repo.resetPassword({ link, password: values.next })
      setDone(true)
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      sending.current = false
      setBusy(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {/* Siempre presente para que el lector de pantalla anuncie el cambio */}
      <p role="status" className={done ? styles.formNote : 'visually-hidden'} data-testid="nueva-aviso">
        {done ? 'Contraseña actualizada.' : ''}
      </p>
      {done ? (
        <Button to="/entrar" block className={styles.submit} data-testid="nueva-entrar">
          Iniciar sesión
        </Button>
      ) : (
        <>
          <div className={styles.passwordBlock}>
            <TextField
              label="Nueva contraseña"
              look="flat"
              type="password"
              autoComplete="new-password"
              placeholder="********"
              value={values.next}
              onChange={set('next')}
              data-testid="nueva-contrasena"
            />
            <PasswordRules value={values.next} testId="nueva-reglas" />
          </div>
          <TextField
            label="Confirmar contraseña"
            look="flat"
            type="password"
            autoComplete="new-password"
            placeholder="********"
            value={values.confirm}
            onChange={set('confirm')}
            onBlur={() => setConfirmTouched(true)}
            error={mismatch ? 'Las contraseñas no coinciden.' : undefined}
            data-testid="nueva-confirmar"
          />
          {formError && (
            <p role="alert" className={styles.formError} data-testid="nueva-error">
              {formError}
            </p>
          )}
          <Button
            type="submit"
            block
            variant={ready && !busy ? 'primary' : 'disabled'}
            className={styles.submit}
            data-testid="nueva-guardar"
          >
            Guardar contraseña
          </Button>
        </>
      )}
    </form>
  )
}
