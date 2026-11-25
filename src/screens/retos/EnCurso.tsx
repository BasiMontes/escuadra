import type { ReactNode } from 'react'
import { History, Play, Shield, Trophy } from 'lucide-react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { IconBox } from '../../components/Controls'
import { EmptyCard, ErrorNotice, Skeleton } from '../../components/States'
import { DifficultyTag, Tag } from '../../components/Tag'
import { useLoad } from '../../data/hooks'
import type { CommunityChallenge, Competition } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { BallIcon } from './BallIcon'
import styles from './EnCurso.module.css'

const ICONS: Record<CommunityChallenge['icon'], ReactNode> = {
  trophy: <Trophy />,
  shield: <Shield />,
  ball: <BallIcon />,
}

const ACTIONS: Record<CommunityChallenge['action'], { label: string; icon?: ReactNode }> = {
  jugar: { label: 'Jugar', icon: <Play /> },
  seguir: { label: 'Seguir', icon: <History /> },
  empezar: { label: 'Empezar' },
}

export function EnCurso() {
  const { data, error, loading, reload } = useLoad(async (r) => {
    const [community, competitions] = await Promise.all([r.getCommunityChallenges(), r.getCompetitions()])
    return { ...community, competitions }
  })

  return (
    <AppShell tab="retos" title="En curso" mobileBg="game">
      {error && <ErrorNotice message="No se han podido cargar tus retos." onRetry={reload} />}
      {loading && <Skeleton height={360} />}
      {data && (
        <div className={styles.screen}>
          <section className={styles.section} aria-labelledby="en-curso-titulo">
            <h2 id="en-curso-titulo" className={styles.current}>
              En curso
            </h2>
            {data.inProgress.length > 0 ? (
              <CardList challenges={data.inProgress} competitions={data.competitions} />
            ) : (
              <EmptyCard message="No tienes retos en curso." actionLabel="Ver retos del día" to="/retos" />
            )}
          </section>

          {data.discover.length > 0 && (
            <section className={styles.section} aria-labelledby="descubrir-titulo">
              <h2 id="descubrir-titulo" className={styles.discover}>
                Descubrir
              </h2>
              <CardList challenges={data.discover} competitions={data.competitions} />
            </section>
          )}
        </div>
      )}
    </AppShell>
  )
}

function CardList({ challenges, competitions }: { challenges: CommunityChallenge[]; competitions: Competition[] }) {
  return (
    <ul className={styles.list}>
      {challenges.map((challenge) => {
        const action = ACTIONS[challenge.action]
        return (
          <li key={challenge.id}>
            <Card as="article" shadow="md" className={styles.card} data-testid={`en-curso-tarjeta-${challenge.id}`}>
              <div className={styles.top}>
                <div className={styles.names}>
                  <Tag tone="slate">{competitions.find((c) => c.id === challenge.competitionId)?.short}</Tag>
                  <h3>{challenge.title}</h3>
                </div>
                <IconBox size={42}>{ICONS[challenge.icon]}</IconBox>
              </div>
              <div className={styles.bottom}>
                <DifficultyTag level={challenge.difficulty} className={styles.difficulty} />
                <Button
                  to={`/retos/${challenge.id}`}
                  variant="dark"
                  size="sm"
                  iconRight={action.icon}
                  className={styles.action}
                  data-testid={`en-curso-accion-${challenge.id}`}
                >
                  {action.label}
                  <span className="visually-hidden"> {challenge.title}</span>
                </Button>
              </div>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
