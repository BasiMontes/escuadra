import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Logo } from '../../components/Logo'
import styles from './Onboarding.module.css'

/** Pantalla de carga. Pasa sola al registro a los 1,5 s, o al tocarla. */
export function Splash({ next = '/registro', delay = 1500 }: { next?: string; delay?: number }) {
  const navigate = useNavigate()
  useEffect(() => {
    const t = window.setTimeout(() => navigate(next, { replace: true }), delay)
    return () => window.clearTimeout(t)
  }, [navigate, next, delay])

  return (
    <button
      type="button"
      className={`bg-pattern ${styles.splash}`}
      onClick={() => navigate(next, { replace: true })}
      aria-label="Escuadra. Toca para empezar"
      data-testid="splash"
    >
      <Logo size={300} shadow border="inner" className={styles.splashLogo} />
      <span className={styles.splashWord} aria-hidden="true">
        Escuadra
      </span>
    </button>
  )
}
