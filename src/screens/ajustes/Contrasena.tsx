import { useRef, useState, type FormEvent } from 'react'
import { Circle, CircleCheck } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TextField } from '../../components/Field'
import { cx } from '../../components/cx'
import { useRepository } from '../../data/hooks'
import { AppShell } from '../../layouts/AppShell'
import { PASSWORD_RULES, validatePassword } from '../../lib/validation'
import styles from './Contrasena.module.css'

const EMPTY = { current: '', next: '', confirm: '' }

export function Contrasena() {
  const repo = useRepository()
  const sending = useRef(false)
  const [values, setValues] = useState(EMPTY)
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const mismatch =
    values.confirm !== values.next && values.confirm !== '' && (confirmTouched || values.confirm.length >= values.next.length)
  const repeated = values.next !== '' && values.next === values.current
  const ready = values.current !== '' && !validatePassword(values.next) && values.next === values.confirm && !repeated

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    setFormError(null)
    setDone(false)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!ready || sending.current) return
    sending.current = true
    setBusy(true)
    try {
      await repo.changePassword({ current: values.current, next: values.next })
      setValues(EMPTY)
      setConfirmTouched(false)
      setDone(true)
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      sending.current = false
      setBusy(false)
    }
  }

  return (
    <AppShell tab="perfil" title="Cambiar contraseña" narrow>
      <Card className={styles.card}>
        <form onSubmit={onSubmit} noValidate>
          <h2>Seguridad</h2>
          <TextField
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            value={values.current}
            onChange={set('current')}
            className={styles.current}
            data-testid="contrasena-actual"
          />
          <div className={styles.block}>
            <TextField
              label="Nueva contraseña"
              type="password"
              autoComplete="new-password"
              placeholder="Tu nueva contraseña"
              value={values.next}
              onChange={set('next')}
              error={repeated ? 'La nueva contraseña debe ser distinta de la actual.' : undefined}
              data-testid="contrasena-nueva"
            />
            <Rules value={values.next} testId="contrasena-reglas-nueva" />
          </div>
          <div className={styles.block}>
            <TextField
              label="Confirmar nueva contraseña"
              type="password"
              autoComplete="new-password"
              placeholder="Tu nueva contraseña"
              value={values.confirm}
              onChange={set('confirm')}
              onBlur={() => setConfirmTouched(true)}
              error={mismatch ? 'Las contraseñas no coinciden.' : undefined}
              data-testid="contrasena-confirmar"
            />
            <Rules value={values.confirm} testId="contrasena-reglas-confirmar" />
          </div>
          <div className={styles.submit}>
            {formError && (
              <p role="alert" className={styles.error} data-testid="contrasena-error">
                {formError}
              </p>
            )}
            <Button type="submit" block disabled={!ready || busy} data-testid="contrasena-actualizar">
              Actualizar contraseña
            </Button>
            <p role="status" className={styles.done} data-testid="contrasena-aviso">
              {done ? 'Contraseña actualizada.' : ''}
            </p>
            <Link to="/recuperar" data-testid="contrasena-olvidada">
              ¿Has olvidado tu contraseña?
            </Link>
          </div>
        </form>
      </Card>
    </AppShell>
  )
}

/** Requisitos de la contraseña, marcados según se cumplen. */
function Rules({ value, testId }: { value: string; testId: string }) {
  return (
    <ul className={styles.rules} data-testid={testId}>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value)
        return (
          <li key={rule.id} className={cx(ok && styles.ok)} data-cumple={ok}>
            {ok ? <CircleCheck aria-hidden="true" /> : <Circle aria-hidden="true" />}
            {rule.label}
            <span className="visually-hidden">{ok ? ': cumplido' : ': pendiente'}</span>
          </li>
        )
      })}
    </ul>
  )
}
