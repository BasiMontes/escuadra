import type { ReactNode } from 'react'
import type { Difficulty } from '../data/types'
import { DIFFICULTY_LABEL } from '../lib/labels'
import { cx } from './cx'
import styles from './Tag.module.css'

export type TagTone = 'black' | 'yellow' | 'mint' | 'red' | 'slate' | 'white' | 'blue' | 'peach' | 'green' | 'locked'

type Props = {
  tone?: TagTone
  size?: 'sm' | 'md'
  icon?: ReactNode
  children: ReactNode
  className?: string
  'data-testid'?: string
}

/** Etiqueta rectangular con borde (dificultad, "Nuevo reto", "En vivo"…). */
export function Tag({ tone = 'black', size = 'sm', icon, children, className, ...rest }: Props) {
  return (
    <span className={cx(styles.tag, styles[tone], styles[size], className)} data-testid={rest['data-testid']}>
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      {children}
    </span>
  )
}

const DIFFICULTY_TONE: Record<Difficulty, TagTone> = { facil: 'mint', medio: 'yellow', dificil: 'red' }

export function DifficultyTag({
  level,
  size = 'sm',
  className,
}: {
  level: Difficulty
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <Tag tone={DIFFICULTY_TONE[level]} size={size} className={className} data-testid={`tag-dificultad-${level}`}>
      {DIFFICULTY_LABEL[level]}
    </Tag>
  )
}
