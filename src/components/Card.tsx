import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import styles from './Card.module.css'

export type CardTone = 'white' | 'cream' | 'black' | 'yellow' | 'green' | 'coral' | 'orange' | 'locked'

type Props = HTMLAttributes<HTMLElement> & {
  tone?: CardTone
  /** Tamaño de la sombra dura */
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  /** Grosor de borde: 3 px por defecto */
  border?: 'thin' | 'normal'
  /** Ligero giro (en grados) de las tarjetas "pegadas" del diseño */
  tilt?: number
  pad?: 'none' | 'sm' | 'md' | 'lg'
  as?: 'section' | 'article' | 'div' | 'header' | 'aside'
  children: ReactNode
}

export function Card({
  tone = 'white',
  shadow = 'lg',
  border = 'normal',
  tilt,
  pad = 'md',
  as: Tag = 'section',
  className,
  style,
  children,
  ...rest
}: Props) {
  return (
    <Tag
      {...rest}
      className={cx(
        styles.card,
        styles[tone],
        styles[`shadow-${shadow}`],
        styles[`pad-${pad}`],
        border === 'thin' && styles.thin,
        className,
      )}
      style={tilt ? { ...style, transform: `rotate(${tilt}deg)` } : style}
    >
      {children}
    </Tag>
  )
}
