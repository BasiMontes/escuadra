import { Clock, Lightbulb, Play, Trophy, Users } from 'lucide-react'
import { useParams } from 'react-router'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyCard, ErrorNotice, Skeleton } from '../../components/States'
import { DifficultyTag } from '../../components/Tag'
import { useLoad } from '../../data/hooks'
import type { Challenge, ChallengeState } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { CHALLENGE_SECONDS, formatNumber } from '../../lib/game'
import styles from './RetoDetalle.module.css'

export function RetoDetalle() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useLoad(
    async (r) => {
      const [challenge, competitions, states, me] = await Promise.all([
        r.getChallenge(id),
        r.getCompetitions(),
        r.getChallengeStates(),
        r.getMe(),
      ])
      if (!challenge) return { found: null }
      const competition = competitions.find((c) => c.id === challenge.competitionId)?.short ?? ''
      const state: ChallengeState = states[id] ?? { progress: 'nuevo', hintsUsed: 0 }
      return { found: { challenge, competition, state, own: challenge.createdBy === me.id } }
    },
    [id],
  )

  return (
    <AppShell tab="retos" title="Detalle del reto" mobileBg="white">
      {error && <ErrorNotice message="No se ha podido cargar el reto." onRetry={reload} />}
      {loading && <Skeleton height={460} />}
      {data &&
        (data.found ? (
          <Detalle {...data.found} />
        ) : (
          <EmptyCard message="No encontramos este reto." actionLabel="Ver otros retos" to="/retos" />
        ))}
    </AppShell>
  )
}

const ACTION_LABEL = { nuevo: 'Comenzar reto', 'en-curso': 'Seguir reto', hecho: 'Reintentar jugada' }

/** Estado de moderación que ve quien creó el reto */
const OWN_NOTE = {
  pendiente: 'Es tu reto y está pendiente de revisión.',
  aprobado: 'Es tu reto: ya está aprobado, pero no puedes jugarlo.',
  rechazado: 'Es tu reto y ha sido rechazado.',
}

function Detalle({
  challenge,
  competition,
  state,
  own,
}: {
  challenge: Challenge
  competition: string
  state: ChallengeState
  own: boolean
}) {
  const note = own
    ? OWN_NOTE[challenge.status]
    : state.progress === 'hecho'
      ? 'Ya has completado este reto: el reintento no suma puntos.'
      : null

  return (
    <div className={styles.screen}>
      <div className={styles.head}>
        <h2 data-testid="detalle-competicion">{competition}</h2>
        <DifficultyTag level={challenge.difficulty} />
      </div>

      <Card className={styles.card} data-testid="detalle-tarjeta">
        {challenge.imageUrl && <img src={challenge.imageUrl} alt="" className={styles.image} />}
        <h3 className={styles.question} data-testid="detalle-pregunta">
          {challenge.question}
        </h3>
        <ul className={styles.facts}>
          <li data-testid="detalle-puntos">
            <Trophy aria-hidden="true" />
            {formatNumber(challenge.basePoints)} pts
          </li>
          <li data-testid="detalle-pistas">
            <Lightbulb aria-hidden="true" className={styles.bulb} />
            <span className="visually-hidden">Pistas usadas: </span>
            {state.hintsUsed}/{challenge.hints.length}
          </li>
          <li data-testid="detalle-tiempo">
            <Clock aria-hidden="true" />
            <span className="visually-hidden">Tiempo: </span>
            {CHALLENGE_SECONDS}s
          </li>
        </ul>
        <p className={styles.completed} data-testid="detalle-completado">
          <Users aria-hidden="true" />
          Completado por: {formatNumber(challenge.completedBy)} usuarios
        </p>
      </Card>

      <div className={styles.side}>
        {!own ? (
          <Button
            to={`/retos/${challenge.id}/jugar`}
            block
            iconLeft={<Play />}
            className={styles.start}
            data-testid="detalle-comenzar"
          >
            {ACTION_LABEL[state.progress]}
          </Button>
        ) : (
          <Button variant="disabled" block className={styles.start} data-testid="detalle-comenzar">
            {ACTION_LABEL.nuevo}
          </Button>
        )}
        {note && (
          <p className={styles.note} data-testid="detalle-aviso">
            {note}
          </p>
        )}
      </div>
    </div>
  )
}
