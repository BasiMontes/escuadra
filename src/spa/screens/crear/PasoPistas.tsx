import { useRef, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { TextField } from '../../components/Field'
import { ErrorNotice } from '../../components/States'
import { cx } from '../../components/cx'
import { useRepository } from '../../data/hooks'
import type { NewChallengeDraft } from '../../data/types'
import { CHALLENGE_LIMITS, validateAnswer, validateHint } from '../../lib/validation'
import { CrearLayout } from './CrearLayout'
import { isStep2Done, useCrear } from './crearState'
import { focusFirstError } from './focusFirstError'
import styles from './PasoPistas.module.css'

type Errors = { hints: Record<number, string>; answer?: string }

const NO_ERRORS: Errors = { hints: {} }

/** Paso 3: pistas, respuesta correcta y publicación. */
export function PasoPistas() {
  const { draft, update, publish, published } = useCrear()
  const repo = useRepository()
  const navigate = useNavigate()
  const [errors, setErrors] = useState<Errors>(NO_ERRORS)
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  const sendingRef = useRef(false)

  // Al publicar, el borrador se vacía: no hay que volver al paso 1 mientras se navega al resumen
  if (!isStep2Done(draft)) return <Navigate to={published ? '/crear/4' : '/crear/1'} replace />

  const canAdd = draft.hints.length < CHALLENGE_LIMITS.hintsMax

  function setHint(key: number, text: string) {
    update({ hints: draft.hints.map((h) => (h.key === key ? { ...h, text } : h)) })
    setErrors((x) => ({ ...x, hints: { ...x.hints, [key]: '' } }))
  }

  async function send() {
    if (sendingRef.current) return
    sendingRef.current = true
    setSending(true)
    setFailed(false)
    const challenge: NewChallengeDraft = {
      title: draft.title.trim(),
      description: draft.question.trim(),
      type: 'libre',
      competitionId: draft.competitionId,
      difficulty: draft.difficulty,
      basePoints: Number(draft.basePoints),
      hints: draft.hints.map((h) => h.text.trim()),
      answer: draft.answer.trim(),
    }
    try {
      const { id } = await repo.createChallenge(challenge)
      publish({ id, challenge })
      navigate('/crear/4', { replace: true })
    } catch {
      setFailed(true)
      setSending(false)
      sendingRef.current = false
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const hintErrors: Record<number, string> = {}
    for (const h of draft.hints) {
      const problem = validateHint(h.text)
      if (problem) hintErrors[h.key] = problem
    }
    const answer = validateAnswer(draft.answer) ?? undefined
    setErrors({ hints: hintErrors, answer })
    if (answer || Object.keys(hintErrors).length > 0) return focusFirstError(e.currentTarget)
    void send()
  }

  return (
    <CrearLayout
      step={3}
      title="Pistas y respuesta"
      subtitle="Añade pistas a tu reto para que no sea imposible de resolver."
      onBack={() => navigate('/crear/2')}
    >
      {failed && <ErrorNotice message="No se ha podido publicar el reto." onRetry={() => void send()} />}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <section className={styles.hints} aria-labelledby="crear-pistas-titulo">
          <div className={styles.hintsHead}>
            <h3 id="crear-pistas-titulo">Pistas (mínimo 1)</h3>
            <Button
              size="sm"
              iconLeft={<Plus />}
              disabled={!canAdd}
              onClick={() =>
                update({ hints: [...draft.hints, { key: Math.max(...draft.hints.map((h) => h.key)) + 1, text: '' }] })
              }
              data-testid="crear-agregar-pista"
            >
              Agregar
            </Button>
          </div>
          <ol className={styles.list}>
            {draft.hints.map((hint, i) => {
              const error = errors.hints[hint.key]
              const errorId = `crear-pista-error-${hint.key}`
              return (
                <li key={hint.key}>
                  <div className={styles.row}>
                    <div className={cx(styles.box, error && styles.invalid)}>
                      <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                      {/* El texto duplicado hace que la caja crezca con las líneas */}
                      <div className={styles.grow} data-value={hint.text}>
                        <textarea
                          rows={1}
                          aria-label={`Pista ${i + 1}`}
                          aria-invalid={error ? true : undefined}
                          aria-describedby={error ? errorId : undefined}
                          placeholder="Ej. El equipo juega en Londres."
                          maxLength={CHALLENGE_LIMITS.hintMax}
                          value={hint.text}
                          onChange={(e) => setHint(hint.key, e.target.value)}
                          data-testid={`crear-pista-${i + 1}`}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={`Eliminar pista ${i + 1}`}
                      disabled={draft.hints.length === 1}
                      onClick={() => update({ hints: draft.hints.filter((h) => h.key !== hint.key) })}
                      data-testid={`crear-eliminar-pista-${i + 1}`}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                  {error && (
                    <p id={errorId} className={styles.error} role="alert">
                      {error}
                    </p>
                  )}
                </li>
              )
            })}
          </ol>
        </section>

        <TextField
          label="Respuesta correcta"
          placeholder="Ej: Arsenal FC"
          hint="* La respuesta no distingue entre mayúsculas y minúsculas."
          value={draft.answer}
          onChange={(e) => {
            update({ answer: e.target.value })
            setErrors((x) => ({ ...x, answer: undefined }))
          }}
          error={errors.answer}
          maxLength={CHALLENGE_LIMITS.answerMax}
          autoComplete="off"
          className={styles.answer}
          data-testid="crear-respuesta"
        />

        <Button type="submit" block disabled={sending} data-testid="crear-publicar">
          Publicar reto
        </Button>
      </form>
    </CrearLayout>
  )
}
