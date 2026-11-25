import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../components/Logo'
import { StepBar } from '../components/Controls'
import { cx } from '../components/cx'
import styles from './OnboardingShell.module.css'

type Props = {
  /** Paso actual (1 a 3) o null si no se muestra la barra de pasos */
  step: number | null
  /** Mostrar botón de volver */
  back?: boolean
  /** En desktop, alineación del contenido */
  align?: 'center' | 'split'
  children: ReactNode
}

/** Pantallas sin sesión y de primeros pasos: fondo amarillo con patrón, sin navegación. */
export function OnboardingShell({ step, back = true, align = 'center', children }: Props) {
  const navigate = useNavigate()
  return (
    <div className={cx('bg-pattern', styles.page)}>
      <header className={styles.top}>
        <div className={styles.left}>
          {back && (
            <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="Volver" data-testid="onboarding-volver">
              <ArrowLeft />
            </button>
          )}
          <span className={styles.brand}>
            <Logo size={36} />
            <span className={styles.divider} aria-hidden="true" />
            <span>Escuadra</span>
          </span>
        </div>
        {step !== null && (
          <div className={styles.steps}>
            <StepBar current={step} />
          </div>
        )}
      </header>
      <main className={cx(styles.body, styles[align])}>{children}</main>
    </div>
  )
}
