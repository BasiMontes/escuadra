import type { ReactNode } from 'react'
import { BackButton } from '../../components/BackButton'
import { Card } from '../../components/Card'
import { ProgressBar } from '../../components/Controls'
import { cx } from '../../components/cx'
import { AppShell } from '../../layouts/AppShell'
import styles from './CrearLayout.module.css'

const TOTAL_STEPS = 4

type Props = {
  step: number
  title: string
  subtitle?: string
  /** Sin él no se muestra el botón de volver */
  onBack?: () => void
  children: ReactNode
}

/** Estructura común de los pasos: cabecera y progreso a la izquierda, contenido en panel. */
export function CrearLayout({ step, title, subtitle, onBack, children }: Props) {
  const progress = step / TOTAL_STEPS
  return (
    <AppShell tab="retos" title="Crear reto" mobileBg="game" narrow>
      <div className={styles.screen}>
        <div className={styles.aside}>
          <header className={cx(styles.head, !subtitle && styles.inline)}>
            {onBack && (
              <BackButton onClick={onBack} data-testid="crear-volver" />
            )}
            <div>
              <h2 className={styles.title}>{title}</h2>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </header>
          <Card className={styles.progress} shadow="md" pad="sm">
            <p>
              <span data-testid="crear-paso">
                Paso {step} de {TOTAL_STEPS}
              </span>
              <strong>{progress * 100}%</strong>
            </p>
            <ProgressBar value={progress} label="Progreso del reto" />
          </Card>
        </div>
        <div className={styles.panel}>{children}</div>
      </div>
    </AppShell>
  )
}
