import { Circle, CircleCheck } from 'lucide-react'
import { PASSWORD_RULES } from '../lib/validation'
import { cx } from './cx'
import styles from './PasswordRules.module.css'

/** Requisitos de la contraseña, marcados según se cumplen. */
export function PasswordRules({ value, testId }: { value: string; testId: string }) {
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
