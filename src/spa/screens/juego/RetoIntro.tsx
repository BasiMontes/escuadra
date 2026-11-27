import { Play, Timer } from 'lucide-react'
import { useParams } from '../../router'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyCard, ErrorNotice, Skeleton } from '../../components/States'
import { IconBox } from '../../components/Controls'
import { Tag } from '../../components/Tag'
import { useLoad } from '../../data/hooks'
import type { Challenge } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { CHALLENGE_SECONDS, HINT_PENALTY, formatNumber } from '../../lib/game'
import { DIFFICULTY_LABEL } from '../../lib/labels'
import styles from './RetoIntro.module.css'

export function RetoIntro() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useLoad(async (r) => ({ challenge: await r.getChallenge(id) }), [id])

  return (
    <AppShell tab="inicio" title="Reto del día" mobileBg="game" narrow>
      {error && <ErrorNotice message="No se ha podido cargar el reto." onRetry={reload} />}
      {loading && <Skeleton height={520} />}
      {data &&
        (data.challenge ? (
          <Intro challenge={data.challenge} />
        ) : (
          <EmptyCard message="No encontramos este reto." actionLabel="Ver otros retos" to="/retos" />
        ))}
    </AppShell>
  )
}

function Intro({ challenge }: { challenge: Challenge }) {
  return (
    <div className={styles.screen}>
      <Card className={styles.card} pad="none" data-testid="reto-intro-tarjeta">
        <div className={styles.media}>
          {challenge.imageUrl && <img src={challenge.imageUrl} alt="" className={styles.image} />}
          <Tag tone="yellow" size="sm" className={styles.badge}>
            Nuevo reto
          </Tag>
        </div>
        <div className={styles.body}>
          <h2 className={styles.title}>¡Listo para el reto?</h2>
          <p className={styles.text}>
            Tienes <strong>{CHALLENGE_SECONDS} segundos</strong> para resolverlo. Demuestra cuánto sabes de fútbol y
            escala en el ranking global.
          </p>
          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>Puntos base</dt>
              <dd data-testid="reto-intro-puntos">{formatNumber(challenge.basePoints)}</dd>
            </div>
            <div className={styles.factAlt}>
              <dt>Dificultad</dt>
              <dd data-testid="reto-intro-dificultad">{DIFFICULTY_LABEL[challenge.difficulty]}</dd>
            </div>
          </dl>
          <div className={styles.completed}>
            <span className={styles.avatars} aria-hidden="true">
              <span />
              <span />
              <span>{challenge.completedBy > 99 ? '99+' : challenge.completedBy}</span>
            </span>
            <p data-testid="reto-intro-completado">
              Completado por: <span>{formatNumber(challenge.completedBy)} usuarios</span>
            </p>
          </div>
        </div>
      </Card>

      <div className={styles.side}>
        <Card className={styles.rules} shadow="sm" pad="sm">
          <IconBox size={48}>
            <Timer />
          </IconBox>
          <div>
            <h3>Reglas rápidas</h3>
            <p>Cuanto antes aciertes, más puntos sumas. Cada pista resta {HINT_PENALTY} puntos.</p>
          </div>
        </Card>
        <Button
          to={`/retos/${challenge.id}/jugar`}
          block
          iconRight={<Play />}
          className={styles.start}
          data-testid="reto-intro-comenzar"
        >
          Comenzar reto
        </Button>
      </div>
    </div>
  )
}
