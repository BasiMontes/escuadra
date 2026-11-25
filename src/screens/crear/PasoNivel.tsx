import { useState, type FormEvent, type ReactNode } from 'react'
import { Flame, Laugh, Smile } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { RadioDot } from '../../components/Controls'
import { cx } from '../../components/cx'
import type { Difficulty } from '../../data/types'
import { DIFFICULTY_LABEL } from '../../lib/labels'
import { CHALLENGE_LIMITS, validateBasePoints } from '../../lib/validation'
import { CrearLayout } from './CrearLayout'
import { isStep1Done, useCrear } from './crearState'
import { focusFirstError } from './focusFirstError'
import styles from './PasoNivel.module.css'

const LEVELS: Array<{ id: Difficulty; icon: ReactNode }> = [
  { id: 'facil', icon: <Laugh /> },
  { id: 'medio', icon: <Smile /> },
  { id: 'dificil', icon: <Flame /> },
]

/** Paso 2: dificultad y puntos base. */
export function PasoNivel() {
  const { draft, update } = useCrear()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  if (!isStep1Done(draft)) return <Navigate to="/crear/1" replace />

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const problem = validateBasePoints(draft.basePoints)
    setError(problem)
    if (problem) return focusFirstError(e.currentTarget)
    navigate('/crear/3')
  }

  return (
    <CrearLayout
      step={2}
      title="Dificultad y puntuación"
      subtitle="Define el nivel de exigencia para los participantes."
      onBack={() => navigate('/crear/1')}
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <fieldset className={styles.levels}>
          <legend>Selecciona nivel</legend>
          {LEVELS.map((level) => (
            <label key={level.id} className={cx(styles.level, styles[level.id])}>
              <input
                type="radio"
                name="dificultad"
                value={level.id}
                checked={draft.difficulty === level.id}
                onChange={() => update({ difficulty: level.id })}
                data-testid={`crear-dificultad-${level.id}`}
              />
              <span className={styles.icon} aria-hidden="true">
                {level.icon}
              </span>
              <span className={styles.name}>{DIFFICULTY_LABEL[level.id]}</span>
              <RadioDot checked={draft.difficulty === level.id} />
            </label>
          ))}
        </fieldset>

        <Card className={styles.points} shadow="sm">
          <label htmlFor="crear-puntos">Puntos base por desafío</label>
          <div className={cx(styles.pointsBox, error && styles.invalid)}>
            <span aria-hidden="true">PTS</span>
            <input
              id="crear-puntos"
              type="number"
              inputMode="numeric"
              min={CHALLENGE_LIMITS.pointsMin}
              max={CHALLENGE_LIMITS.pointsMax}
              step={10}
              value={draft.basePoints}
              onChange={(e) => {
                update({ basePoints: e.target.value })
                setError(null)
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby="crear-puntos-nota"
              data-testid="crear-puntos"
            />
          </div>
          <p id="crear-puntos-nota" className={cx(styles.note, error && styles.error)} role={error ? 'alert' : undefined}>
            {error ?? '* Los puntos se multiplicarán según la dificultad seleccionada.'}
          </p>
        </Card>

        <Button type="submit" block data-testid="crear-siguiente">
          Siguiente paso
        </Button>
      </form>
    </CrearLayout>
  )
}
