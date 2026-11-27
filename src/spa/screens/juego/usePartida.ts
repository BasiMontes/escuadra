import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useRepository } from '../../data/hooks'
import type { OpenAttempt } from '../../data/types'
import { handOff } from '../../lib/entryState'
import { CHALLENGE_SECONDS } from '../../lib/game'
import type { ResultState } from './resultState'

/** Pausa para que se vea la opción elegida antes de pasar al resultado */
export const ANSWER_PAUSE_MS = 600
const TICK_MS = 200

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Lógica de una partida: cuenta atrás, pistas, respuesta y envío del intento. */
export function usePartida(attempt: OpenAttempt, initialHintsLeft: number) {
  const { challengeId, startedAt } = attempt
  const repo = useRepository()
  const navigate = useNavigate()

  const [now, setNow] = useState(() => Date.now())
  const [hints, setHints] = useState(attempt.revealedHints)
  const [hintsLeft, setHintsLeft] = useState(initialHintsLeft)
  const [revealing, setRevealing] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<'pista' | 'envio' | null>(null)

  const hintsRef = useRef(attempt.revealedHints)
  const pendingHint = useRef<Promise<void> | null>(null)
  const submission = useRef<{ answer: string | null; timeSeconds: number } | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  async function send(pauseMs: number) {
    const payload = submission.current
    if (!payload) return
    setError(null)
    try {
      // Si hay una pista en camino, se espera: ya está gastada y debe contar
      await pendingHint.current
      const [result] = await Promise.all([
        repo.submitAttempt({ challengeId, ...payload, hintsUsed: hintsRef.current.length }),
        wait(pauseMs),
      ])
      if (!mounted.current) return
      handOff('resultado', { result, hints: hintsRef.current } satisfies ResultState)
      navigate(`/retos/${challengeId}/resultado`, { replace: true })
    } catch {
      if (mounted.current) setError('envio')
    }
  }

  /** Cierra la partida. Solo cuenta la primera llamada. */
  function finish(answer: string | null) {
    if (submission.current) return
    const instant = Date.now()
    const elapsed = Math.floor(Math.min(CHALLENGE_SECONDS, (instant - startedAt) / 1000) * 10) / 10
    const given = elapsed >= CHALLENGE_SECONDS ? null : answer
    submission.current = { answer: given, timeSeconds: elapsed }
    setNow(instant)
    setSelected(given)
    setAnswered(true)
    void send(given === null ? 0 : ANSWER_PAUSE_MS)
  }

  // Se mide contra la hora de inicio, así el tiempo corre aunque la pestaña esté en segundo plano
  const tick = useEffectEvent(() => {
    const instant = Date.now()
    setNow(instant)
    if (instant - startedAt >= CHALLENGE_SECONDS * 1000) finish(null)
  })

  // En un layout effect: el intervalo ya está en marcha cuando la pantalla se ve
  useLayoutEffect(() => {
    if (answered) return
    const id = setInterval(() => tick(), TICK_MS)
    return () => clearInterval(id)
  }, [answered])

  function revealHint() {
    if (submission.current || pendingHint.current) return
    setRevealing(true)
    setError(null)
    pendingHint.current = repo
      .revealHint(challengeId, hintsRef.current.length)
      .then((revealed) => {
        if (!revealed) return
        hintsRef.current = [...hintsRef.current, revealed.hint]
        setHints(hintsRef.current)
        setHintsLeft(revealed.hintsLeft)
      })
      .catch(() => setError('pista'))
      .finally(() => {
        pendingHint.current = null
        setRevealing(false)
      })
  }

  const elapsedSeconds = Math.min(CHALLENGE_SECONDS, Math.max(0, (now - startedAt) / 1000))

  return {
    secondsLeft: Math.ceil(CHALLENGE_SECONDS - elapsedSeconds),
    hints,
    hintsLeft,
    revealing,
    revealHint,
    answered,
    selected,
    answer: finish,
    error,
    retry: () => (error === 'pista' ? revealHint() : void send(0)),
  }
}
