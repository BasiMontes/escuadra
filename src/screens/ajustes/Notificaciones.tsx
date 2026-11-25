import { useState, type ReactNode } from 'react'
import { CalendarClock, ChartColumn, Trophy, Users } from 'lucide-react'
import { Card } from '../../components/Card'
import { IconBox, ProgressBar, Toggle } from '../../components/Controls'
import { ErrorNotice, Skeleton } from '../../components/States'
import { useLoad, useRepository } from '../../data/hooks'
import type { UserSettings } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { BlockTitle } from './BlockTitle'
import styles from './Notificaciones.module.css'

type Key = 'notifDaily' | 'notifAchievements' | 'notifFriends'

const OPTIONS: Array<{ key: Key; id: string; title: string; text: string; icon: ReactNode }> = [
  { key: 'notifDaily', id: 'diarios', title: 'Retos diarios', text: '¡No te pierdas la trivia de hoy!', icon: <CalendarClock /> },
  { key: 'notifAchievements', id: 'logros', title: 'Nuevos logros', text: 'Avisos de copas y medallas ganadas.', icon: <Trophy /> },
  { key: 'notifFriends', id: 'amigos', title: 'Mensajes de amigos', text: 'Chatea con tu escuadra y rivales.', icon: <Users /> },
]

export function Notificaciones() {
  const { data, error, loading, reload } = useLoad(async (r) => {
    const [settings, stats] = await Promise.all([r.getSettings(), r.getStats()])
    return { settings, rate: stats.notificationResponseRate }
  })

  return (
    <AppShell tab="perfil" title="Notificaciones">
      {error && <ErrorNotice message="No se han podido cargar tus notificaciones." onRetry={reload} />}
      {loading && <Skeleton height={420} />}
      {data && <Preferencias {...data} />}
    </AppShell>
  )
}

function Preferencias({ settings, rate }: { settings: UserSettings; rate: number }) {
  const repo = useRepository()
  const [values, setValues] = useState(settings)
  const [failed, setFailed] = useState<{ key: Key; value: boolean } | null>(null)
  const percent = Math.round(rate * 100)

  /** Cambia al momento y vuelve atrás si no se puede guardar. */
  async function change(key: Key, value: boolean) {
    setFailed(null)
    setValues((v) => ({ ...v, [key]: value }))
    try {
      await repo.updateSettings({ [key]: value })
    } catch {
      setValues((v) => ({ ...v, [key]: !value }))
      setFailed({ key, value })
    }
  }

  return (
    <div className={styles.screen}>
      {failed && (
        <ErrorNotice message="No se ha podido guardar el cambio." onRetry={() => void change(failed.key, failed.value)} />
      )}
      <BlockTitle>Notificaciones</BlockTitle>
      <ul className={styles.list}>
        {OPTIONS.map((option) => (
          <li key={option.key}>
            <Card className={styles.card}>
              <IconBox size={58}>{option.icon}</IconBox>
              <div>
                <h3>{option.title}</h3>
                <p>{option.text}</p>
              </div>
              <Toggle
                checked={values[option.key]}
                onChange={(v) => void change(option.key, v)}
                label={option.title}
                data-testid={`notificaciones-${option.id}`}
              />
            </Card>
          </li>
        ))}
      </ul>
      <Card tone="black" tilt={-1} shadow="sm" className={styles.stats} data-testid="notificaciones-estadisticas">
        <div className={styles.statsHead}>
          <h3>Estadísticas de alerta</h3>
          <ChartColumn aria-hidden="true" />
        </div>
        <ProgressBar value={rate} label="Notificaciones respondidas" height="sm" divider={false} />
        <p>Has respondido al {percent} % de las notificaciones esta semana.</p>
      </Card>
    </div>
  )
}
