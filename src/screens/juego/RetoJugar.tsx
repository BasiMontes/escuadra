import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ProgressBar } from '../../components/Controls'
import { TextField } from '../../components/Field'
import { EmptyCard, ErrorNotice, Skeleton } from '../../components/States'
import { Tag } from '../../components/Tag'
import { cx } from '../../components/cx'
import { useLoad } from '../../data/hooks'
import type { Challenge, OpenAttempt } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { CHALLENGE_SECONDS, formatChallengeDate, hintSlots } from '../../lib/game'
import { CHALLENGE_LIMITS, validateAnswer } from '../../lib/validation'
import { HintsPanel } from './HintsPanel'
import { usePartida } from './usePartida'
import styles from './RetoJugar.module.css'

export function RetoJugar() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useLoad(
    async (r) => {
      const [challenge, me] = await Promise.all([r.getChallenge(id), r.getMe()])
      // El reto propio no se juega: no se abre intento ni corre el reloj
      if (!challenge || challenge.createdBy === me.id) return null
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

          {challenge.answerType === 'libre' ? (
            <FreeAnswer disabled={game.answered} onAnswer={game.answer} />
          ) : (
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
          )}
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

/** Respuesta escrita de los retos creados por usuarios. */
function FreeAnswer({ disabled, onAnswer }: { disabled: boolean; onAnswer: (answer: string) => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = validateAnswer(value)
    setError(problem)
    if (!problem) onAnswer(value.trim())
  }

  return (
    <form className={styles.free} onSubmit={onSubmit} noValidate>
      <TextField
        label="Tu respuesta"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setError(null)
        }}
        error={error ?? undefined}
        maxLength={CHALLENGE_LIMITS.answerMax}
        autoComplete="off"
        disabled={disabled}
        data-testid="reto-respuesta"
      />
      <Button type="submit" block disabled={disabled} data-testid="reto-responder">
        Responder
      </Button>
    </form>
  )
}
