import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import { cx } from './cx'
import styles from './Field.module.css'

type Wrap = {
  label: string
  /** Mensaje de error bajo el campo */
  error?: string
  hint?: ReactNode
  className?: string
  /** Estilo del campo: con sombra dura (por defecto) o plano con borde fino */
  look?: 'shadow' | 'flat' | 'dark'
}

function FieldWrap({ id, label, error, hint, className, children }: Wrap & { id: string; children: ReactNode }) {
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      ) : (
        hint && <div className={styles.hint}>{hint}</div>
      )}
    </div>
  )
}

export function TextField({
  label,
  error,
  hint,
  className,
  look = 'shadow',
  type = 'text',
  ...input
}: Wrap & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <FieldWrap id={id} label={label} error={error} hint={hint} className={className}>
      <div className={cx(styles.control, styles[look], error && styles.invalid)}>
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...input}
          className={styles.input}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.eye}
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            data-testid={input['data-testid' as keyof typeof input] ? `${String(input['data-testid' as keyof typeof input])}-ver` : undefined}
          >
            {show ? <EyeOff /> : <Eye />}
          </button>
        )}
      </div>
    </FieldWrap>
  )
}

export function TextArea({
  label,
  error,
  hint,
  className,
  look = 'shadow',
  ...input
}: Wrap & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <FieldWrap id={id} label={label} error={error} hint={hint} className={className}>
      <div className={cx(styles.control, styles[look], error && styles.invalid)}>
        <textarea
          id={id}
          rows={4}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...input}
          className={styles.input}
        />
      </div>
    </FieldWrap>
  )
}

export function SelectField({
  label,
  error,
  hint,
  className,
  look = 'shadow',
  options,
  ...select
}: Wrap & SelectHTMLAttributes<HTMLSelectElement> & { options: Array<{ value: string; label: string }> }) {
  const id = useId()
  return (
    <FieldWrap id={id} label={label} error={error} hint={hint} className={className}>
      <div className={cx(styles.control, styles[look], styles.select, error && styles.invalid)}>
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...select}
          className={styles.input}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className={styles.chevron} aria-hidden="true" />
      </div>
    </FieldWrap>
  )
}
