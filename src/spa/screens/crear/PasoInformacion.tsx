import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { SelectField, TextArea, TextField } from '../../components/Field'
import { useLoad } from '../../data/hooks'
import { CHALLENGE_LIMITS, validateChallengeQuestion, validateChallengeTitle } from '../../lib/validation'
import { CrearLayout } from './CrearLayout'
import { useCrear } from './crearState'
import { focusFirstError } from './focusFirstError'
import styles from './PasoInformacion.module.css'

/** Paso 1: título, pregunta, tipo y liga. */
export function PasoInformacion() {
  const { draft, update } = useCrear()
  const navigate = useNavigate()
  // La primera entrada del historial de la app tiene la clave "default"
  const hasHistory = useLocation().key !== 'default'
  const { data: competitions } = useLoad((r) => r.getCompetitions())
  const [errors, setErrors] = useState<{ title?: string; question?: string }>({})

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const next = {
      title: validateChallengeTitle(draft.title) ?? undefined,
      question: validateChallengeQuestion(draft.question) ?? undefined,
    }
    setErrors(next)
    if (next.title || next.question) return focusFirstError(e.currentTarget)
    navigate('/crear/2')
  }

  return (
    <CrearLayout
      step={1}
      title="Información básica"
      onBack={() => (hasHistory ? navigate(-1) : navigate('/inicio'))}
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField
          label="Título del reto"
          look="flat"
          placeholder="Ej. Finales de Champions"
          value={draft.title}
          onChange={(e) => {
            update({ title: e.target.value })
            setErrors((x) => ({ ...x, title: undefined }))
          }}
          error={errors.title}
          maxLength={CHALLENGE_LIMITS.titleMax}
          data-testid="crear-titulo"
        />
        <TextArea
          label="Descripción"
          placeholder="Describe de qué trata tu reto..."
          hint="Escribe la pregunta que verán los jugadores."
          value={draft.question}
          onChange={(e) => {
            update({ question: e.target.value })
            setErrors((x) => ({ ...x, question: undefined }))
          }}
          error={errors.question}
          maxLength={CHALLENGE_LIMITS.questionMax}
          className={styles.question}
          data-testid="crear-descripcion"
        />
        <div className={styles.selects}>
          {/* En la primera versión solo existe este tipo de reto */}
          <SelectField
            label="Tipo de reto"
            options={[{ value: 'libre', label: 'Pregunta de respuesta libre' }]}
            defaultValue="libre"
            data-testid="crear-tipo"
          />
          <SelectField
            label="Liga"
            options={(competitions ?? []).map((c) => ({ value: c.id, label: c.name }))}
            value={draft.competitionId}
            onValueChange={(competitionId) => update({ competitionId })}
            data-testid="crear-liga"
          />
        </div>
        <Button type="submit" block data-testid="crear-siguiente">
          Siguiente paso
        </Button>
      </form>
    </CrearLayout>
  )
}
