import { cx } from './cx'
import styles from './Avatar.module.css'

const TONES = 3

/** Avatar genérico: la foto del usuario o sus iniciales sobre un color. */
export function Avatar({ name, src, className }: { name: string; src: string | null; className?: string }) {
  if (src) return <img src={src} alt="" className={cx(styles.avatar, className)} />
  const initials = name.replace(/[^\p{Letter}\p{Number}]/gu, '').slice(0, 2)
  const tone = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % TONES
  return (
    <span className={cx(styles.avatar, styles[`tone-${tone}`], className)} aria-hidden="true">
      {initials}
    </span>
  )
}
