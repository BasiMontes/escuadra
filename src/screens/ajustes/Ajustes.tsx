import { useState, type ReactNode } from 'react'
import { Bell, ChevronRight, CircleHelp, KeyRound, Lock, Target } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { ErrorNotice } from '../../components/States'
import { useSignOut } from '../../data/useSignOut'
import { AppShell } from '../../layouts/AppShell'
import { BlockTitle } from './BlockTitle'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import styles from './Ajustes.module.css'

const SECTIONS: Array<{ id: string; label: string; icon: ReactNode }> = [
  // "Preferencias de juego" no cabe en una línea a 390 px
  { id: 'juego', label: 'Preferencias', icon: <Target /> },
  { id: 'notificaciones', label: 'Notificaciones', icon: <Bell /> },
  { id: 'privacidad', label: 'Privacidad', icon: <Lock /> },
  { id: 'soporte', label: 'Soporte', icon: <CircleHelp /> },
  { id: 'contrasena', label: 'Cambiar contraseña', icon: <KeyRound /> },
]

export function Ajustes() {
  const { signOut, failed } = useSignOut()
  const [deleting, setDeleting] = useState(false)

  return (
    <AppShell tab="perfil" title="Ajustes">
      {failed && <ErrorNotice message="No se ha podido cerrar la sesión." onRetry={signOut} />}
      <div className={styles.screen}>
        <BlockTitle>Ajustes</BlockTitle>
        <nav aria-label="Ajustes">
          <ul className={styles.list}>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <Link to={`/ajustes/${s.id}`} className={styles.item} data-testid={`ajustes-${s.id}`}>
                  <span aria-hidden="true">{s.icon}</span>
                  {s.label}
                  <ChevronRight aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.actions}>
          <Button variant="danger" block onClick={signOut} data-testid="ajustes-cerrar-sesion">
            Cerrar sesión
          </Button>
          <Button variant="dark" block onClick={() => setDeleting(true)} data-testid="ajustes-eliminar-cuenta">
            Eliminar cuenta
          </Button>
        </div>
      </div>
      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
    </AppShell>
  )
}
