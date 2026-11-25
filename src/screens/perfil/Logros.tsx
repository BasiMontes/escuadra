import { useSearchParams } from 'react-router'
import { Card } from '../../components/Card'
import { IconBox, ProgressBar } from '../../components/Controls'
import { EmptyCard, ErrorNotice, Skeleton } from '../../components/States'
import { Tag } from '../../components/Tag'
import { useLoad } from '../../data/hooks'
import type { Achievement } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { formatNumber } from '../../lib/game'
import { LogroDesbloqueado } from './LogroDesbloqueado'
import { ACHIEVEMENT_ICONS, achievementLabel, achievementTones } from './achievementStyle'
import styles from './Logros.module.css'

export function Logros() {
  // "?nuevo=codigo" enseña el aviso de un logro recién desbloqueado
  const [params, setParams] = useSearchParams()
  const { data, error, loading, reload } = useLoad(async (r) => {
    const [achievements, stats] = await Promise.all([r.getAchievements(), r.getStats()])
    return { achievements, stats }
  })
  const fresh = data?.achievements.find((a) => a.code === params.get('nuevo') && a.state === 'desbloqueado')

  return (
    <AppShell tab="perfil" title="Mis logros" narrow>
      {error && <ErrorNotice message="No se han podido cargar tus logros." onRetry={reload} />}
      {loading && <Skeleton height={480} />}
      {data && (
        <div className={styles.screen}>
          <dl className={styles.totals}>
            <div>
              <dt>Puntos totales</dt>
              <dd data-testid="logros-puntos">{formatNumber(data.stats.totalPoints)}</dd>
            </div>
            <div>
              <dt>Rango global</dt>
              <dd data-testid="logros-rango">#{formatNumber(data.stats.globalRank)}</dd>
            </div>
          </dl>

          {data.achievements.length > 0 ? (
            <ul className={styles.list}>
              {data.achievements.map((achievement) => (
                <li key={achievement.code}>
                  <AchievementCard achievement={achievement} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyCard message="Todavía no tienes logros." actionLabel="Ir al inicio" to="/inicio" />
          )}
        </div>
      )}
      {fresh && <LogroDesbloqueado achievement={fresh} onClose={() => setParams({}, { replace: true })} />}
    </AppShell>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const tones = achievementTones(achievement)
  const locked = achievement.state === 'bloqueado'

  return (
    <Card
      as="article"
      tone={locked ? 'locked' : 'white'}
      shadow="sm"
      className={styles.card}
      data-testid={`logros-tarjeta-${achievement.code}`}
    >
      <div className={styles.head}>
        <IconBox tone={tones.box} size={56} shadow>
          {ACHIEVEMENT_ICONS[achievement.icon]}
        </IconBox>
        <Tag tone={tones.tag}>{achievementLabel(achievement)}</Tag>
      </div>
      <h2>{achievement.name}</h2>
      <p className={locked ? styles.lockedText : undefined}>{achievement.description}</p>
      <div className={styles.bar}>
        <ProgressBar
          value={achievement.progress}
          tone={tones.bar}
          height="sm"
          label={`Progreso de ${achievement.name}`}
          divider={false}
        />
      </div>
    </Card>
  )
}
