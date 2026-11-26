import { cx } from './cx'
import styles from './Logo.module.css'

type Props = {
  /** Lado del cuadrado en píxeles */
  size?: number
  /** Sombra dura desplazada, como en la cabecera y el splash */
  shadow?: boolean
  /**
   * Marco negro del diseño: `outer` rodea el dibujo (cabecera móvil), `inner` va por dentro
   * del cuadrado (splash) y `none` lo quita (barra lateral y onboarding).
   */
  border?: 'outer' | 'inner' | 'none'
  className?: string
}

// El dibujo mide 300; el marco exterior equivale a 3 px en un logo de 48
const OUTER_VIEW_BOX = '-21.43 -21.43 342.86 342.86'

// Cada triángulo es un contorno negro con el relleno 10 unidades hacia dentro:
// un `stroke` sobresale y ensucia las diagonales amarillas
const TRIANGLE = 'M36.39 263.61V150H150Z'
const TRIANGLE_FILL = 'M46.39 239.47V160h79.47Z'
const OFFSETS = [
  [0, 0],
  [113.61, 0],
  [0, -113.61],
  [113.61, -113.61],
]

/** Logo de Escuadra: cuadrado amarillo con cuatro triángulos negros. */
export function Logo({ size = 48, shadow = false, border = 'outer', className }: Props) {
  return (
    <span
      className={cx(styles.logo, shadow && styles.shadow, border === 'outer' && styles.outer, className)}
      style={{ ['--logo-size' as string]: `${size}px` }}
      role="img"
      aria-label="Escuadra"
    >
      <svg viewBox={border === 'outer' ? OUTER_VIEW_BOX : '0 0 300 300'} aria-hidden="true">
        {border === 'outer' && <rect x="-21.43" y="-21.43" width="342.86" height="342.86" fill="#000" />}
        <rect width="300" height="300" fill="#F5F37D" />
        {border === 'inner' && <rect x="5" y="5" width="290" height="290" fill="none" stroke="#000" strokeWidth="10" />}
        {OFFSETS.map(([x, y]) => (
          <g key={`${x} ${y}`} transform={`translate(${x} ${y})`}>
            <path d={TRIANGLE} fill="#000" />
            <path d={TRIANGLE_FILL} fill="#100E0E" />
          </g>
        ))}
      </svg>
    </span>
  )
}
