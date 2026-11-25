import styles from './Logo.module.css'

type Props = {
  /** Lado del cuadrado en píxeles */
  size?: number
  /** Sombra dura desplazada, como en la cabecera y el splash */
  shadow?: boolean
  /** Borde negro alrededor del cuadrado (cabecera, splash). Sin él, como en el resumen del onboarding */
  bordered?: boolean
  className?: string
}

/** Logo de Escuadra: cuadrado amarillo con cuatro triángulos negros. */
export function Logo({ size = 48, shadow = false, bordered = true, className }: Props) {
  return (
    <span
      className={[styles.logo, shadow && styles.shadow, className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, ['--logo-shadow' as string]: `${Math.max(2, Math.round(size / 16))}px` }}
      role="img"
      aria-label="Escuadra"
    >
      <svg viewBox={bordered ? '-10 -10 320 320' : '0 0 300 300'} width={size} height={size} aria-hidden="true">
        <rect x="0" y="0" width="300" height="300" fill="#F5F37D" stroke={bordered ? '#000' : 'none'} strokeWidth="20" />
        <g fill="#100E0E" stroke="#000" strokeWidth="10">
          <path d="M36.39 263.61V150H150Z" />
          <path d="M150 263.61V150h113.61Z" />
          <path d="M36.39 150V36.39H150Z" />
          <path d="M150 150V36.39h113.61Z" />
        </g>
      </svg>
    </span>
  )
}
