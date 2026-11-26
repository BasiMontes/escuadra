import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../components/Logo'
import { StepBar } from '../components/Controls'
import { cx } from '../components/cx'
import styles from './OnboardingShell.module.css'

type Props = {
  /** Segmentos completados de la barra de pasos (1 a 3), o null para ocultarla */
  step: number | null
  /** Mostrar botón de volver */
  back?: boolean
  /** Distribución del contenido en desktop */
  layout?: 'center' | 'split'
  children: ReactNode
}

/** Pantallas de acceso y primeros pasos: fondo amarillo con patrón, sin navegación principal. */
export function OnboardingShell({ step, back = true, layout = 'center', children }: Props) {
  const navigate = useNavigate()
  return (
    <div className={cx('bg-pattern', styles.page, !back && styles.noBack)}>
      <header className={styles.top}>
        <div className={styles.left}>
          {back && (
            <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="Volver" data-testid="onboarding-volver">
              <ArrowLeft />
            </button>
          )}
          <span className={styles.brand}>
            <Logo size={40} shadow border="none" />
            <span>Escuadra</span>
          </span>
        </div>
        {step !== null && (
          <div className={styles.steps}>
            <StepBar current={step} />
          </div>
        )}
      </header>
      <main className={cx(styles.body, styles[layout])}>{children}</main>
    </div>
  )
}

/** Botón principal que en móvil queda fijo abajo sobre una franja amarilla; en desktop va en su sitio. */
export function StickyAction({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(styles.sticky, className)}>{children}</div>
}
