import { Lightbulb, Lock, LockOpen } from 'lucide-react'
import { Card } from '../../components/Card'
import { HINT_PENALTY } from '../../lib/game'
import styles from './HintsPanel.module.css'

const ORDINALS = ['Primera', 'Segunda', 'Tercera']

type Props = {
  /** Textos de las pistas ya reveladas */
  revealed: string[]
  /** Total de huecos a mostrar (revelados y sin usar) */
  slots: number
  /** Si se indica, el primer hueco sin usar es un botón para revelar la pista */
  onReveal?: () => void
  busy?: boolean
}

export function HintsPanel({ revealed, slots, onReveal, busy = false }: Props) {
  const unused = Array.from({ length: Math.max(0, slots - revealed.length) }, (_, i) => revealed.length + i)

  return (
    <Card className={styles.panel} tilt={1} shadow="sm" data-testid="pistas-panel">
      <h3 className={styles.title}>
        <Lightbulb aria-hidden="true" />
        Pistas reveladas
      </h3>
      <ul className={styles.list} aria-live="polite">
        {revealed.map((hint, i) => (
          <li key={hint} className={styles.revealed} data-testid={`pistas-revelada-${i + 1}`}>
            <LockOpen aria-hidden="true" />
            <span>{hint}</span>
          </li>
        ))}
        {unused.map((position) => {
          const ordinal = ORDINALS[position] ?? 'Otra'
          const label = `${ordinal} pista no utilizada.`
          return (
            <li key={position}>
              {onReveal && position === revealed.length ? (
                <button
                  type="button"
                  className={styles.reveal}
                  onClick={onReveal}
                  disabled={busy}
                  data-testid="pistas-revelar"
                >
                  <Lock aria-hidden="true" />
                  <span>Revelar {ordinal.toLowerCase()} pista</span>
                  <span className={styles.cost}>−{HINT_PENALTY}</span>
                </button>
              ) : (
                <div className={styles.locked}>
                  <Lock aria-hidden="true" />
                  <span>{label}</span>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {slots === 0 && (
        <p className={styles.empty} data-testid="pistas-sin-saldo">
          No te quedan pistas por hoy.
        </p>
      )}
    </Card>
  )
}
