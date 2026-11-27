import { BlockTitle } from '../../components/BlockTitle'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyCard, ErrorNotice, Skeleton } from '../../components/States'
import { DifficultyTag, Tag, type TagTone } from '../../components/Tag'
import { useLoad } from '../../data/hooks'
import type { Challenge, ChallengeStatus, Competition } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { formatNumber } from '../../lib/game'
import { STATUS_LABEL } from '../../lib/labels'
import styles from './MisRetos.module.css'

const STATUS_TONE: Record<ChallengeStatus, TagTone> = { pendiente: 'yellow', aprobado: 'green', rechazado: 'red' }

/** Retos creados por el usuario y su estado de revisión. */
export function MisRetos() {
  const { data, error, loading, reload } = useLoad(async (r) => {
    const [challenges, competitions] = await Promise.all([r.getMyChallenges(), r.getCompetitions()])
    return { challenges, competitions }
  })

  return (
    <AppShell tab="perfil" title="Mis retos" parent="/perfil">
      {error && <ErrorNotice message="No se han podido cargar tus retos." onRetry={reload} />}
      {loading && <Skeleton height={420} />}
      {data && (
        <div className={styles.screen}>
          <BlockTitle>Mis retos</BlockTitle>
          {data.challenges.length > 0 ? (
            <CardList {...data} />
          ) : (
            <EmptyCard message="Todavía no has creado retos." actionLabel="Crear reto" to="/crear/1" />
          )}
          <Button to="/retos/en-curso" variant="secondary" block className={styles.current} data-testid="mis-retos-en-curso">
            Ver retos en curso
          </Button>
        </div>
      )}
    </AppShell>
  )
}

function CardList({ challenges, competitions }: { challenges: Challenge[]; competitions: Competition[] }) {
  return (
    <ul className={styles.list}>
      {challenges.map((challenge) => (
        <li key={challenge.id}>
          <Card as="article" shadow="md" className={styles.card} data-testid={`mis-retos-tarjeta-${challenge.id}`}>
            <div className={styles.tags}>
              <Tag tone="slate">{competitions.find((c) => c.id === challenge.competitionId)?.short}</Tag>
              <Tag tone={STATUS_TONE[challenge.status]}>{STATUS_LABEL[challenge.status]}</Tag>
            </div>
            <h3>{challenge.title}</h3>
            <p className={styles.question}>{challenge.question}</p>
            {challenge.status === 'rechazado' && challenge.rejectionReason && (
              <p className={styles.reason}>
                <strong>Motivo:</strong> {challenge.rejectionReason}
              </p>
            )}
            <div className={styles.bottom}>
              <DifficultyTag level={challenge.difficulty} />
              <span className={styles.points}>{formatNumber(challenge.basePoints)} pts</span>
              <Button
                to={`/retos/${challenge.id}`}
                variant="dark"
                size="sm"
                className={styles.action}
                data-testid={`mis-retos-ver-${challenge.id}`}
              >
                Ver reto
                <span className="visually-hidden"> {challenge.title}</span>
              </Button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  )
}
