import { useRef, useState } from 'react'
import { useNavigate } from '../../router'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorNotice } from '../../components/States'
import { useRepository } from '../../data/hooks'

/** Pide confirmación, borra la cuenta y lleva al registro. */
export function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const repo = useRepository()
  const navigate = useNavigate()
  const sending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function remove() {
    if (sending.current) return
    sending.current = true
    setBusy(true)
    setFailed(false)
    try {
      await repo.deleteAccount()
      navigate('/registro', { replace: true })
    } catch {
      sending.current = false
      setBusy(false)
      setFailed(true)
    }
  }

  if (failed) {
    return <ErrorNotice message="No se ha podido eliminar la cuenta." onRetry={() => void remove()} />
  }

  return (
    <ConfirmDialog
      title="¿Eliminar tu cuenta?"
      message="Esta acción es permanente e irreversible. Perderás tus puntos, retos y logros."
      confirmLabel="Eliminar"
      onConfirm={() => void remove()}
      onCancel={onClose}
      busy={busy}
    />
  )
}
