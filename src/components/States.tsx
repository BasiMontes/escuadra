import { Button } from './Button'
import { Card } from './Card'
import styles from './States.module.css'

/** Bloque gris con el borde y la sombra de la tarjeta a la que sustituye mientras carga. */
export function Skeleton({ height }: { height: number }) {
  return <div className={styles.skeleton} style={{ height }} role="status" aria-label="Cargando" />
}

/** Aviso fijo arriba cuando falla la red. */
export function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.notice} role="alert" data-testid="error-aviso">
      <span>{message}</span>
      <Button size="sm" onClick={onRetry} data-testid="error-reintentar">
        Reintentar
      </Button>
    </div>
  )
}

/** Tarjeta blanca con una frase y un botón para los estados vacíos. */
export function EmptyCard({ message, actionLabel, to }: { message: string; actionLabel: string; to: string }) {
  return (
    <Card className={styles.empty} data-testid="vacio-tarjeta">
      <p>{message}</p>
      <Button to={to} size="md" block data-testid="vacio-accion">
        {actionLabel}
      </Button>
    </Card>
  )
}
