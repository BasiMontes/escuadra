import type { Competition, Difficulty, UserSettings } from '../data/types'
import { DIFFICULTY_LABEL } from '../lib/labels'
import { CheckSquare } from './Controls'
import { cx } from './cx'
import styles from './GamePickers.module.css'

/* Elecciones de juego compartidas por el registro y por Preferencias.
   El tamaño lo ajusta cada pantalla con las variables de GamePickers.module.css. */

const DIFFICULTIES: Difficulty[] = ['facil', 'medio', 'dificil']
const HINTS = [1, 2, 3] as const

/** Lista de competiciones con selección múltiple. */
export function CompetitionPicker({
  competitions,
  selected,
  onChange,
  testId,
}: {
  competitions: Competition[]
  selected: string[]
  onChange: (ids: string[]) => void
  /** Prefijo de los `data-testid` */
  testId: string
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id])

  return (
    <div className={styles.leagueList} role="group" aria-label="Competiciones">
      {competitions.map((c) => {
        const on = selected.includes(c.id)
        return (
          <button
            key={c.id}
            type="button"
            role="checkbox"
            aria-checked={on}
            className={styles.league}
            onClick={() => toggle(c.id)}
            data-testid={`${testId}-${c.id}`}
          >
            <span>{c.name}</span>
            <CheckSquare checked={on} />
          </button>
        )
      })}
    </div>
  )
}

export function DifficultyPicker({
  value,
  onChange,
  testId,
}: {
  value: Difficulty
  onChange: (value: Difficulty) => void
  testId: string
}) {
  return (
    <fieldset className={styles.group}>
      <legend>Nivel de dificultad</legend>
      <div className={styles.options} role="radiogroup" aria-label="Nivel de dificultad">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={value === d}
            className={styles.option}
            onClick={() => onChange(d)}
            data-testid={`${testId}-dificultad-${d}`}
          >
            {DIFFICULTY_LABEL[d]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function HintsPicker({
  value,
  onChange,
  testId,
}: {
  value: UserSettings['hintsPerDay']
  onChange: (value: UserSettings['hintsPerDay']) => void
  testId: string
}) {
  return (
    <fieldset className={styles.group}>
      <legend>Pistas disponibles al día</legend>
      <div className={styles.options} role="radiogroup" aria-label="Pistas disponibles al día">
        {HINTS.map((h) => (
          <button
            key={h}
            type="button"
            role="radio"
            aria-checked={value === h}
            className={cx(styles.option, styles.optionBig)}
            onClick={() => onChange(h)}
            data-testid={`${testId}-pistas-${h}`}
          >
            {h}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
