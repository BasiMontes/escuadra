import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from './cx'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'danger' | 'disabled'
export type ButtonSize = 'lg' | 'md' | 'sm'

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Ocupa todo el ancho disponible (por defecto en móvil) */
  block?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  /** Texto en mayúsculas con Archivo Black (por defecto) o en Public Sans */
  plain?: boolean
  children: ReactNode
  className?: string
  'data-testid'?: string
}

type AsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined }
type AsLink = CommonProps & { to: string; onClick?: () => void }

export function Button(props: AsButton | AsLink) {
  const {
    variant = 'primary',
    size = 'lg',
    block = false,
    iconLeft,
    iconRight,
    plain = false,
    children,
    className,
  } = props
  const classes = cx(
    styles.button,
    styles[variant],
    styles[size],
    block && styles.block,
    plain && styles.plain,
    className,
  )
  const content = (
    <>
      {iconLeft && <span className={styles.icon} aria-hidden="true">{iconLeft}</span>}
      <span className={styles.label}>{children}</span>
      {iconRight && <span className={styles.icon} aria-hidden="true">{iconRight}</span>}
    </>
  )

  if (props.to !== undefined) {
    return (
      <Link to={props.to} onClick={props.onClick} className={classes} data-testid={props['data-testid']}>
        {content}
      </Link>
    )
  }

  const { variant: _v, size: _s, block: _b, iconLeft: _l, iconRight: _r, plain: _p, ...rest } = props as AsButton
  return (
    <button
      type="button"
      {...rest}
      className={classes}
      disabled={variant === 'disabled' || rest.disabled}
    >
      {content}
    </button>
  )
}
