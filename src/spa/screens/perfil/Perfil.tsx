import type { ReactNode } from 'react'
import { BadgeCheck, ChevronRight, LogOut, SlidersHorizontal, SquarePen, Trophy } from 'lucide-react'
import { Link } from '../../router'
import { BallIcon } from '../../components/BallIcon'
import { Card } from '../../components/Card'
import { ErrorNotice, Skeleton } from '../../components/States'
import { useLoad } from '../../data/hooks'
import { useSignOut } from '../../data/useSignOut'
import { AppShell } from '../../layouts/AppShell'
import { useEntryState } from '../../lib/entryState'
import { formatNumber } from '../../lib/game'
import styles from './Perfil.module.css'

const MENU: Array<{ id: string; label: string; to: string; icon: ReactNode }> = [
  { id: 'editar', label: 'Editar perfil', to: '/perfil/editar', icon: <SquarePen /> },
  { id: 'logros', label: 'Mis logros', to: '/perfil/logros', icon: <Trophy /> },
  { id: 'retos', label: 'Mis retos', to: '/perfil/retos', icon: <BallIcon /> },
  { id: 'ajustes', label: 'Ajustes', to: '/ajustes', icon: <SlidersHorizontal /> },
]

export function Perfil() {
  const saved = useEntryState<boolean>('perfil-guardado')
  const { data, error, loading, reload } = useLoad(async (r) => {
    const [me, stats] = await Promise.all([r.getMe(), r.getStats()])
    return { me, stats }
  })
  const { signOut, failed: signOutFailed } = useSignOut()

  return (
    <AppShell tab="perfil" title="Perfil">
      {error && <ErrorNotice message="No se ha podido cargar tu perfil." onRetry={reload} />}
      {signOutFailed && <ErrorNotice message="No se ha podido cerrar la sesión." onRetry={() => void signOut()} />}
      <p role="status" className="visually-hidden">
        {saved ? 'Cambios guardados.' : ''}
      </p>
      {loading && <Skeleton height={300} />}
      {data && (
        <div className={styles.screen}>
          <Card className={styles.identity} data-testid="perfil-identidad">
            <div className={styles.avatar}>
              <img src={data.me.avatarUrl ?? '/img/avatar-generico.jpg'} alt="" data-testid="perfil-foto" />
              <span aria-hidden="true">
                <BadgeCheck />
              </span>
            </div>
            <h2 data-testid="perfil-usuario">{data.me.username}</h2>
            <p className={styles.badge}>{data.me.title}</p>
          </Card>

          <dl className={styles.stats}>
            <div>
              <dd data-testid="perfil-partidos">{formatNumber(data.stats.matchesPlayed)}</dd>
              <dt>Partidos jugados</dt>
            </div>
            <div>
              <dd data-testid="perfil-retos-creados">{formatNumber(data.stats.challengesCreated)}</dd>
              <dt>Retos creados</dt>
            </div>
            <div className={styles.top}>
              <dd data-testid="perfil-top">Top {data.stats.topPercent} %</dd>
              <dt>Rango global</dt>
            </div>
          </dl>

          <nav className={styles.menu} aria-labelledby="perfil-menu-titulo">
            <h2 id="perfil-menu-titulo">Menú de jugador</h2>
            <ul>
              {MENU.map((item) => (
                <li key={item.id}>
                  <Link to={item.to} className={styles.item} data-testid={`perfil-menu-${item.id}`}>
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                    <ChevronRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className={styles.signOut}
                  onClick={() => void signOut()}
                  data-testid="perfil-cerrar-sesion"
                >
                  <span aria-hidden="true">
                    <LogOut />
                  </span>
                  Cerrar sesión
                  <ChevronRight aria-hidden="true" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </AppShell>
  )
}
