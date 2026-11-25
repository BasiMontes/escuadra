import type { ReactNode } from 'react'
import { cx } from './cx'
import styles from './Controls.module.css'

/** Interruptor cuadrado del diseño (Notificaciones, Privacidad). */
export function Toggle({
  checked,
  onChange,
  label,
  'data-testid': testId,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  'data-testid'?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cx(styles.toggle, checked && styles.on)}
      onClick={() => onChange(!checked)}
      data-testid={testId}
    >
      <span className={styles.knob} />
    </button>
  )
}

/** Punto de radio con borde grueso. Solo visual: el control real lo pone quien lo usa. */
export function RadioDot({ checked, inverted = false }: { checked: boolean; inverted?: boolean }) {
  return <span className={cx(styles.radio, checked && styles.radioOn, inverted && styles.radioInverted)} aria-hidden="true" />
}

/** Casilla cuadrada (lista de competiciones). Solo visual. */
export function CheckSquare({ checked }: { checked: boolean }) {
  return <span className={cx(styles.check, checked && styles.checkOn)} aria-hidden="true" />
}

/** Barra de progreso con borde negro (temporizador, pasos de Crear reto, logros). */
export function ProgressBar({
  value,
  tone = 'yellow',
  height = 'md',
  label,
  divider = true,
}: {
  /** 0 a 1 */
  value: number
  tone?: 'yellow' | 'blue' | 'orange' | 'grey'
  height?: 'sm' | 'md' | 'lg'
  label: string
  /** Línea vertical negra al final del relleno */
  divider?: boolean
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      className={cx(styles.bar, styles[`h-${height}`])}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <span
        className={cx(styles.fill, styles[`fill-${tone}`], divider && pct > 0 && pct < 100 && styles.divider)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/** Barra de tres segmentos del onboarding: los completados en negro. */
export function StepBar({ total = 3, current }: { total?: number; current: number }) {
  return (
    <ol className={styles.steps} aria-label={`Paso ${current} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <li key={i} className={cx(styles.step, i < current && styles.stepDone)}>
          <span className="visually-hidden">{i < current ? 'Completado' : 'Pendiente'}</span>
        </li>
      ))}
    </ol>
  )
}

/** Recuadro cuadrado con icono (iconos de tarjeta, ajustes, notificaciones). */
export function IconBox({
  children,
  tone = 'yellow',
  size = 48,
  shadow = false,
}: {
  children: ReactNode
  tone?: 'yellow' | 'black' | 'orange' | 'blue' | 'white' | 'locked' | 'peach'
  size?: number
  shadow?: boolean
}) {
  return (
    <span className={cx(styles.iconBox, styles[`ib-${tone}`], shadow && styles.ibShadow)} style={{ width: size, height: size }} aria-hidden="true">
      {children}
    </span>
  )
}
