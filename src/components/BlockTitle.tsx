import type { ReactNode } from 'react'
import { cx } from './cx'
import styles from './BlockTitle.module.css'

/** Rótulo negro con texto amarillo que encabeza las pantallas de Ajustes y Mis retos. */
export function BlockTitle({ children, size = 'lg', id }: { children: ReactNode; size?: 'lg' | 'sm'; id?: string }) {
  return (
    <h2 id={id} className={cx(styles.title, styles[size])}>
      {children}
    </h2>
  )
}
