import { useEffect, useRef, type ReactNode } from 'react'
import { CircleCheck, CircleStar, Timer } from 'lucide-react'
import { Navigate, useLocation, useParams } from 'react-router'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorNotice, Skeleton } from '../../components/States'
import { useLoad } from '../../data/hooks'
import type { AttemptResult, Challenge } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { formatNumber, formatSeconds, hintSlots } from '../../lib/game'
import { HintsPanel } from './HintsPanel'
import type { ResultState } from './resultState'
import styles from './RetoResultado.module.css'

export function RetoResultado() {
  const { id = '' } = useParams()
  const state = useLocation().state as ResultState | null
  // Sin un intento recién terminado no hay resultado que enseñar
  if (state?.result.challengeId !== id) return <Navigate to={`/retos/${id}/intro`} replace />
  return <Resultado {...state} />
}

function Resultado({ result, hints }: ResultState) {
  const { data, error, loading, reload } = useLoad(
    async (r) => {
      const [challenge, stats, nextId] = await Promise.all([
        r.getChallenge(result.challengeId),
        r.getStats(),
        r.getNextChallengeId(result.challengeId),
      ])
      return challenge ? { challenge, hintsLeft: stats.hintsLeft, nextId } : null
    },
    [result.challengeId],
  )

  return (
    <AppShell tab="inicio" title="Resultado" mobileBg="game">
      {error && <ErrorNotice message="No se ha podido cargar el resultado." onRetry={reload} />}
      {loading && <Skeleton height={480} />}
      {data &&
        (result.isCorrect ? (
          <Correcto result={result} hints={hints} {...data} />
        ) : (
          <Incorrecto result={result} challenge={data.challenge} />
        ))}
    </AppShell>
  )
}

/** Título del resultado: recibe el foco al entrar para que el lector de pantalla lo anuncie. */
function Heading({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => ref.current?.focus({ preventScroll: true }), [])
  return (
    <h2 ref={ref} tabIndex={-1} className={styles.heading} data-testid="resultado-titulo">
      {children}
    </h2>
  )
}

function RetryNote({ result }: { result: AttemptResult }) {
  if (result.isFirst) return null
  return (
    <p className={styles.retryNote} data-testid="resultado-reintento">
      Reintento: solo el primer intento suma puntos.
    </p>
  )
}

function Correcto({
  result,
  hints,
  challenge,
  hintsLeft,
  nextId,
}: ResultState & { challenge: Challenge; hintsLeft: number; nextId: string | null }) {
  return (
    <div className={styles.correct}>
      <Card className={styles.winCard} tone="green" tilt={-1}>
        <span className={styles.check} aria-hidden="true">
          <CircleCheck />
        </span>
        <Heading>¡Correcto!</Heading>
        <p className={styles.answer} data-testid="resultado-respuesta">
          {result.correctAnswer}
        </p>
        <dl className={styles.scores}>
          <div>
            <dt>Puntos</dt>
            <dd data-testid="resultado-puntos">+{formatNumber(result.points)}</dd>
          </div>
          <div>
            <dt>Pistas</dt>
            <dd data-testid="resultado-pistas">{result.hintsUsed}</dd>
          </div>
          <div>
            <dt>Tiempo</dt>
            <dd data-testid="resultado-tiempo">{formatSeconds(result.timeSeconds)}s</dd>
          </div>
        </dl>
        <RetryNote result={result} />
      </Card>

      <div className={styles.side}>
        <HintsPanel revealed={hints} slots={hintSlots(challenge.hints.length, hints.length, hintsLeft)} />
        <div className={styles.actions}>
          {nextId && (
            <Button to={`/retos/${nextId}/intro`} block className={styles.next} data-testid="resultado-siguiente">
              Siguiente reto
            </Button>
          )}
          <Button
            to="/retos"
            variant={nextId ? 'secondary' : 'primary'}
            size="md"
            block
            plain={Boolean(nextId)}
            className={styles.others}
            data-testid="resultado-otros-retos"
          >
            Ver otros retos
          </Button>
        </div>
      </div>
    </div>
  )
}

function Incorrecto({ result, challenge }: { result: AttemptResult; challenge: Challenge }) {
  return (
    <div className={styles.wrong}>
      <Card className={styles.loseCard} tone="coral" tilt={-1}>
        <Heading>{result.timedOut ? '¡Se acabó el tiempo!' : '¡Incorrecto!'}</Heading>
        {challenge.imageUrl && <img src={challenge.imageUrl} alt="" className={styles.image} />}
        <p className={styles.missed}>
          <span>Crack fallado</span>
          <strong>{result.correctAnswer}</strong>
        </p>
      </Card>

      <div className={styles.side}>
        <Card className={styles.summary} shadow="sm" pad="sm">
          <span>Resultado</span>
          <p data-testid="resultado-respuesta">
            La respuesta correcta era: <strong>{result.correctAnswer}</strong>
          </p>
        </Card>
        <dl className={styles.tiles}>
          <div className={styles.pointsTile}>
            <CircleStar aria-hidden="true" />
            <dt>Puntos</dt>
            <dd data-testid="resultado-puntos">{formatNumber(result.points)} pts</dd>
          </div>
          <div>
            <Timer aria-hidden="true" />
            <dt>Tiempo</dt>
            <dd data-testid="resultado-tiempo">{formatSeconds(result.timeSeconds)}s</dd>
          </div>
        </dl>
        <RetryNote result={result} />
        <div className={styles.actions}>
          <Button to="/retos" block data-testid="resultado-otros-retos">
            Ver otros retos
          </Button>
          <Button to={`/retos/${challenge.id}/jugar`} variant="secondary" block data-testid="resultado-reintentar">
            Reintentar jugada
          </Button>
        </div>
      </div>
    </div>
  )
}
