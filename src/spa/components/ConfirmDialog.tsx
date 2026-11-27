import { useEffect, useRef } from 'react'
import { Button } from './Button'
import styles from './ConfirmDialog.module.css'

type Props = {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}

/** Confirmación de una acción sin vuelta atrás. El foco empieza en "Cancelar". */
export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, busy = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="confirmar-titulo"
      aria-describedby="confirmar-mensaje"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      data-testid="confirmar-dialogo"
    >
      <h2 id="confirmar-titulo">{title}</h2>
      <p id="confirmar-mensaje">{message}</p>
      <div className={styles.actions}>
        <Button variant="secondary" size="md" onClick={onCancel} data-testid="confirmar-cancelar">
          Cancelar
        </Button>
        <Button variant="danger" size="md" onClick={onConfirm} disabled={busy} data-testid="confirmar-aceptar">
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
