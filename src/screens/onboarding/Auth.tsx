import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TextField } from '../../components/Field'
import { Logo } from '../../components/Logo'
import { useRepository } from '../../data/hooks'
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
