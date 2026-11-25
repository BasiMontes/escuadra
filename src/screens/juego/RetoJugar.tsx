import { useParams } from 'react-router'
import { Card } from '../../components/Card'
import { ProgressBar } from '../../components/Controls'
import { EmptyCard, ErrorNotice, Skeleton } from '../../components/States'
import { Tag } from '../../components/Tag'
import { cx } from '../../components/cx'
import { useLoad } from '../../data/hooks'
import type { Challenge, OpenAttempt } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { CHALLENGE_SECONDS, formatChallengeDate, hintSlots } from '../../lib/game'
import { HintsPanel } from './HintsPanel'
import { usePartida } from './usePartida'
import styles from './RetoJugar.module.css'

export function RetoJugar() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useLoad(
    async (r) => {
      const challenge = await r.getChallenge(id)
      // Los retos de respuesta libre aún no se juegan: no se abre intento ni corre el reloj
      if (!challenge || challenge.answerType !== 'opciones') return null
      const attempt = await r.startAttempt(id)
      const { hintsLeft } = await r.getStats()
      return { challenge, attempt, hintsLeft }
    },
    [id],
  )

  if (data) return <Partida key={id} {...data} />

  return (
    <AppShell tab="inicio" title="Reto" mobileBg="game" narrow>
      {error && <ErrorNotice message="No se ha podido cargar el reto." onRetry={reload} />}
      {loading && <Skeleton height={520} />}
      {!loading && !error && (
        <EmptyCard message="Este reto no está disponible." actionLabel="Ver otros retos" to="/retos" />
      )}
    </AppShell>
  )
}

function Partida({ challenge, attempt, hintsLeft }: { challenge: Challenge; attempt: OpenAttempt; hintsLeft: number }) {
  const game = usePartida(attempt, hintsLeft)
  const seconds = game.secondsLeft
  const warning = seconds <= 5 ? 'Quedan 5 segundos' : seconds <= 10 ? 'Quedan 10 segundos' : ''

  return (
    <AppShell tab="inicio" title="Reto" mobileBg="game" narrow hintsLeft={game.hintsLeft}>
      {game.error && (
        <ErrorNotice
          message={game.error === 'pista' ? 'No se ha podido revelar la pista.' : 'No se ha podido enviar tu respuesta.'}
          onRetry={game.retry}
        />
      )}
      <div className={styles.screen}>
        <div className={styles.play}>
          <div className={styles.timer}>
            <span>Tiempo restante</span>
            <strong role="timer" data-testid="reto-tiempo">
              {String(seconds).padStart(2, '0')}s
            </strong>
          </div>
          <div className={styles.bar}>
            <ProgressBar value={seconds / CHALLENGE_SECONDS} label="Tiempo restante" height="lg" />
          </div>
          <p className="visually-hidden" aria-live="assertive">
            {warning}
          </p>

          <Card className={styles.questionCard}>
            <Tag tone="yellow" size="md" className={styles.date}>
              <span>
                Pregunta <span className={styles.day}>{formatChallengeDate(challenge.unlockDate)}</span>
              </span>
            </Tag>
            <h2 className={styles.question} data-testid="reto-pregunta">
              {challenge.question}
            </h2>
          </Card>

          <ul className={styles.options}>
            {challenge.options.map((option) => (
              <li key={option.label}>
                <button
                  type="button"
                  className={cx(styles.option, game.selected === option.text && styles.selected)}
                  aria-pressed={game.selected === option.text}
                  disabled={game.answered}
                  onClick={() => game.answer(option.text)}
                  data-testid={`reto-opcion-${option.label.toLowerCase()}`}
                >
                  <span className={styles.letter}>{option.label}</span>
                  <span>{option.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.hints}>
          <HintsPanel
            revealed={game.hints}
            slots={hintSlots(challenge.hints.length, game.hints.length, game.hintsLeft)}
            onReveal={game.answered ? undefined : game.revealHint}
            busy={game.revealing}
          />
        </div>
      </div>
    </AppShell>
  )
}
