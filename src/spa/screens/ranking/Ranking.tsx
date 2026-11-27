import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { Avatar } from '../../components/Avatar'
import { Card } from '../../components/Card'
import { EmptyCard, ErrorNotice, Skeleton } from '../../components/States'
import { Tag } from '../../components/Tag'
import { cx } from '../../components/cx'
import { useLoad } from '../../data/hooks'
import type { RankingScope } from '../../data/repository'
import type { Profile, RankingRow, UserStats } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { formatNumber, untilWeeklyReset } from '../../lib/game'
import styles from './Ranking.module.css'

const SCOPES: Array<{ id: RankingScope; label: string }> = [
  { id: 'semanal', label: 'Semanal' },
  { id: 'global', label: 'Global' },
  { id: 'amigos', label: 'Amigos' },
]

export function Ranking() {
  // La pestaña vive en la URL para poder enlazarla
  const [params, setParams] = useSearchParams()
  const scope = SCOPES.find((s) => s.id === params.get('tipo'))?.id ?? 'semanal'
  const { data, error, loading, reload } = useLoad(
    async (r) => {
      const [rows, me, stats] = await Promise.all([r.getRanking(scope), r.getMe(), r.getStats()])
      return { scope, rows, me, stats }
    },
    [scope],
  )
  // Mientras llega la pestaña nueva no se enseñan los datos de la anterior
  const current = data?.scope === scope ? data : null

  return (
    <AppShell tab="ranking" title="Ranking" mobileBg="game" narrow>
      {error && <ErrorNotice message="No se ha podido cargar el ranking." onRetry={reload} />}
      <div className={styles.screen}>
        <div className={styles.tabs} role="group" aria-label="Tipo de ranking">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={cx(styles.tab, scope === s.id && styles.tabOn)}
              aria-pressed={scope === s.id}
              onClick={() => setParams({ tipo: s.id }, { replace: true })}
              data-testid={`ranking-pestana-${s.id}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {!current && (loading || !error) && <Skeleton height={420} />}
        {current &&
          (scope === 'amigos' ? (
            <div className={styles.friends}>
              <EmptyCard
                message="Pronto podrás competir con tus amigos"
                actionLabel="Ver ranking semanal"
                to="/ranking?tipo=semanal"
              />
            </div>
          ) : (
            <div className={styles.columns}>
              <div className={styles.side}>
                {scope === 'semanal' ? <SeasonCard /> : <GlobalCard />}
                <MyPosition scope={scope} me={current.me} stats={current.stats} />
              </div>
              <TopPlayers rows={current.rows} />
            </div>
          ))}
      </div>
    </AppShell>
  )
}

/** Cuenta atrás hasta el lunes 00:00 de Madrid. */
function SeasonCard() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const left = untilWeeklyReset(now)
  const units = [
    { id: 'horas', label: 'Horas', value: left.hours },
    { id: 'minutos', label: 'Minutos', value: left.minutes },
    { id: 'segundos', label: 'Segundos', value: left.seconds },
  ]

  return (
    <Card className={styles.season} pad="none" shadow="sm" data-testid="ranking-temporada">
      <p className={styles.seasonBar}>Temporada actual</p>
      <div className={styles.seasonBody}>
        <div className={styles.seasonHead}>
          <h2>Ranking semanal</h2>
          <Tag tone="yellow">En vivo</Tag>
        </div>
        <dl className={styles.countdown} aria-label="Tiempo hasta el reinicio">
          {units.map((u) => (
            <div key={u.id}>
              <dd data-testid={`ranking-${u.id}`}>{String(u.value).padStart(2, '0')}</dd>
              <dt>{u.label}</dt>
            </div>
          ))}
        </dl>
        <p className={styles.reset}>El ranking se reinicia todos los lunes a las 00:00</p>
      </div>
    </Card>
  )
}

function GlobalCard() {
  return (
    <Card className={styles.season} pad="none" shadow="sm" data-testid="ranking-temporada">
      <p className={styles.seasonBar}>Desde el principio</p>
      <div className={styles.seasonBody}>
        <div className={styles.seasonHead}>
          <h2>Ranking global</h2>
        </div>
        <p className={styles.reset}>Suma todos los puntos de la historia: no se reinicia.</p>
      </div>
    </Card>
  )
}

function MyPosition({ scope, me, stats }: { scope: RankingScope; me: Profile; stats: UserStats }) {
  if (!me.showInRanking) {
    return (
      <Card tone="yellow" shadow="sm" pad="sm" className={styles.hidden} data-testid="ranking-oculto">
        <p>No apareces en el ranking.</p>
        <Link to="/ajustes/privacidad">Cambiar en Privacidad</Link>
      </Card>
    )
  }
  const rank = scope === 'global' ? stats.globalRank : stats.weeklyRank
  const points = scope === 'global' ? stats.totalPoints : stats.weeklyPoints
  return (
    <Card tone="yellow" shadow="sm" pad="sm" className={styles.me} data-testid="ranking-mi-posicion">
      <Avatar name={me.username} src={me.avatarUrl} className={styles.meAvatar} />
      <p>
        <span>Tu posición</span>
        <strong>#{formatNumber(rank)}</strong>
      </p>
      <p className={styles.mePoints}>
        <span>Puntos</span>
        <strong>{formatNumber(points)} pts</strong>
      </p>
    </Card>
  )
}

function TopPlayers({ rows }: { rows: RankingRow[] }) {
  return (
    <section className={styles.top} aria-labelledby="ranking-top">
      <h2 id="ranking-top">Top jugadores</h2>
      {rows.length === 0 ? (
        <EmptyCard message="Todavía no hay ranking." actionLabel="Jugar un reto" to="/retos" />
      ) : (
        <ol>
          {rows.map((row) => (
            <li key={row.userId} data-testid={`ranking-fila-${row.rank}`}>
              <span className={cx(styles.rank, styles[`rank-${row.rank}`])}>{row.rank}</span>
              <Avatar name={row.username} src={row.avatarUrl} />
              <p className={styles.player}>
                <strong>{row.username}</strong>
                <span>
                  <Trophy aria-hidden="true" />
                  {row.titles} títulos
                </span>
              </p>
              <p className={styles.score}>
                <strong>{formatNumber(row.points)}</strong>
                <span>pts</span>
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
