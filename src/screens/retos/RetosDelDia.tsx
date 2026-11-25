import { Lightbulb, Trophy } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyCard, ErrorNotice, Skeleton } from '../../components/States'
import { DifficultyTag } from '../../components/Tag'
import { cx } from '../../components/cx'
import { useLoad } from '../../data/hooks'
import type { Challenge, ChallengeState, Competition } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { formatNumber } from '../../lib/game'
import styles from './RetosDelDia.module.css'

const ALL = 'todas'
const NEW_CHALLENGE: ChallengeState = { progress: 'nuevo', hintsUsed: 0 }

export function RetosDelDia() {
  // El filtro vive en la URL: aparece al llegar desde "Explorar competiciones"
  const [params, setParams] = useSearchParams()
  const league = params.get('liga')
  const { data, error, loading, reload } = useLoad(async (r) => {
    const [challenges, competitions, states] = await Promise.all([
      r.getTodayChallenges(),
      r.getCompetitions(),
      r.getChallengeStates(),
    ])
    return { challenges, competitions, states }
  })

  const visible = data?.challenges.filter((c) => !league || league === ALL || c.competitionId === league) ?? []

  return (
    <AppShell tab="retos" title="Retos" narrow>
      {error && <ErrorNotice message="No se han podido cargar los retos." onRetry={reload} />}
      <div className={styles.screen}>
        <Card className={styles.intro}>
          <h2>Retos del día</h2>
          <p className={styles.lead}>Estos son todos los retos oficiales desbloqueados de la semana.</p>
          <p className={styles.note}>*Solo cuentan para el ranking si se completan el día de desbloqueo.</p>
        </Card>

        {loading && <Skeleton height={236} />}

        {data && league && (
          <LeagueFilter
            competitions={data.competitions}
            selected={league}
            onSelect={(id) => setParams({ liga: id }, { replace: true })}
          />
        )}

        {data && visible.length > 0 && (
          <ul className={styles.list}>
            {visible.map((challenge) => (
              <li key={challenge.id}>
                <ChallengeCard
                  challenge={challenge}
                  competition={data.competitions.find((c) => c.id === challenge.competitionId)?.short ?? ''}
                  state={data.states[challenge.id] ?? NEW_CHALLENGE}
                />
              </li>
            ))}
          </ul>
        )}

        {data &&
          visible.length === 0 &&
          (data.challenges.length === 0 ? (
            <EmptyCard message="No hay retos hoy." actionLabel="Volver al inicio" to="/inicio" />
          ) : (
            <EmptyCard
              message="No hay retos de esta liga hoy."
              actionLabel="Ver todas las ligas"
              to={`/retos?liga=${ALL}`}
            />
          ))}
      </div>
    </AppShell>
  )
}

function LeagueFilter({
  competitions,
  selected,
  onSelect,
}: {
  competitions: Competition[]
  selected: string
  onSelect: (id: string) => void
}) {
  const chips = [{ id: ALL, name: 'Todas' }, ...competitions]
  return (
    <div className={styles.chips} role="group" aria-label="Filtrar por liga">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={cx(styles.chip, selected === chip.id && styles.chipOn)}
          aria-pressed={selected === chip.id}
          onClick={() => onSelect(chip.id)}
          data-testid={`retos-filtro-${chip.id}`}
        >
          {chip.name}
        </button>
      ))}
    </div>
  )
}

function ChallengeCard({
  challenge,
  competition,
  state,
}: {
  challenge: Challenge
  competition: string
  state: ChallengeState
}) {
  return (
    <Card as="article" className={styles.card} data-testid={`retos-tarjeta-${challenge.id}`}>
      <div className={styles.cardHead}>
        <h3>{competition}</h3>
        <DifficultyTag level={challenge.difficulty} className={styles.difficulty} />
      </div>
      <p className={styles.question}>{challenge.question}</p>
      <div className={styles.cardFoot}>
        <p className={styles.fact}>
          <Trophy aria-hidden="true" />
          {formatNumber(challenge.basePoints)} pts
        </p>
        <p className={styles.fact} data-testid={`retos-pistas-${challenge.id}`}>
          <Lightbulb aria-hidden="true" />
          <span className="visually-hidden">Pistas usadas: </span>
          {state.hintsUsed}
        </p>
        {state.progress === 'hecho' ? (
          <Button variant="disabled" size="md" className={styles.action} data-testid={`retos-hecho-${challenge.id}`}>
            Hecho
          </Button>
        ) : (
          <Button
            to={`/retos/${challenge.id}`}
            size="md"
            className={styles.action}
            data-testid={`retos-unirse-${challenge.id}`}
          >
            {state.progress === 'en-curso' ? 'Seguir' : 'Unirse'}
            <span className="visually-hidden"> al reto de {competition}</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
