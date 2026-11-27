import { useEffect, useRef } from 'react'
import { Star, Sun } from 'lucide-react'
import { Button } from '../../components/Button'
import { IconBox } from '../../components/Controls'
import type { Achievement } from '../../data/types'
import { ACHIEVEMENT_ICONS } from './achievementStyle'
import styles from './LogroDesbloqueado.module.css'

/** Aviso a pantalla completa. El diálogo nativo atrapa el foco y bloquea el fondo. */
export function LogroDesbloqueado({ achievement, onClose }: { achievement: Achievement; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className={styles.overlay}
      aria-labelledby="logro-titulo"
      aria-describedby="logro-mensaje"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      data-testid="logro-aviso"
    >
      <Star className={styles.star1} aria-hidden="true" />
      <Sun className={styles.sun} aria-hidden="true" />
      <Star className={styles.star2} aria-hidden="true" />
      <Star className={styles.star3} aria-hidden="true" />
      <div className={styles.box}>
        <span className={styles.icon}>
          <IconBox size={96} shadow>
            {ACHIEVEMENT_ICONS[achievement.icon]}
          </IconBox>
        </span>
        <h2 id="logro-titulo">¡Logro desbloqueado!</h2>
        <p className={styles.name}>{achievement.name}</p>
        <p id="logro-mensaje" className={styles.message}>
          {achievement.unlockedMessage ?? achievement.description}
        </p>
        <Button block onClick={onClose} data-testid="logro-continuar">
          Continuar
        </Button>
      </div>
    </dialog>
  )
}
