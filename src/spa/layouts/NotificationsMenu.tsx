import { useEffect, useId, useRef, useState } from 'react'
import { Bell, Trophy, CalendarClock } from 'lucide-react'
import { Link, useLocation } from '../router'
import { useRepository } from '../data/hooks'
import type { NotificationItem } from '../data/types'
import styles from './NotificationsMenu.module.css'

type State = { items: NotificationItem[] } | 'cargando' | 'error'

/** Campana con la lista desplegable de avisos. */
export function NotificationsMenu({ buttonClass, testId }: { buttonClass: string; testId: string }) {
  const repo = useRepository()
  const panelId = useId()
  const location = useLocation()
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  // Se guarda la página donde se abrió: al navegar, el panel queda cerrado
  const [openAt, setOpenAt] = useState<string | null>(null)
  const [state, setState] = useState<State>('cargando')
  const open = openAt === location.key

  function load() {
    setState('cargando')
    repo
      .getNotifications()
      .then((items) => setState({ items }))
      .catch(() => setState('error'))
  }

  function toggle() {
    if (open) return setOpenAt(null)
    setOpenAt(location.key)
    load()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpenAt(null)
      button.current?.focus()
    }
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpenAt(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={root} className={styles.root}>
      <button
        ref={button}
        type="button"
        className={buttonClass}
        aria-label="Avisos"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
        data-testid={testId}
      >
        <Bell />
      </button>
      {open && (
        <div id={panelId} className={styles.panel} role="region" aria-label="Avisos" data-testid="avisos-panel">
          {state === 'cargando' && <p role="status">Cargando avisos…</p>}
          {state === 'error' && (
            <p role="alert">
              No se han podido cargar los avisos.{' '}
              <button type="button" className={styles.retry} onClick={load}>
                Reintentar
              </button>
            </p>
          )}
          {typeof state === 'object' &&
            (state.items.length === 0 ? (
              <p>No tienes avisos nuevos</p>
            ) : (
              <ul>
                {state.items.map((item) => (
                  <li key={item.id}>
                    <Link to={item.to} data-testid={`avisos-${item.id}`}>
                      <span className={styles.icon} aria-hidden="true">
                        {item.kind === 'reto' ? <CalendarClock /> : <Trophy />}
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <span>{item.text}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          <Link to="/ajustes/notificaciones" className={styles.settings} data-testid="avisos-ajustes">
            Ajustar notificaciones
          </Link>
        </div>
      )}
    </div>
  )
}
