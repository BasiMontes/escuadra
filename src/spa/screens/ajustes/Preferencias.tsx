import { useRef, useState, type FormEvent } from 'react'
import { BlockTitle } from '../../components/BlockTitle'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CompetitionPicker, DifficultyPicker, HintsPicker } from '../../components/GamePickers'
import { ErrorNotice, Skeleton } from '../../components/States'
import { useLoad, useRepository } from '../../data/hooks'
import type { Competition, UserSettings } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import styles from './Preferencias.module.css'

export function Preferencias() {
  const { data, error, loading, reload } = useLoad(async (r) => {
    const [settings, competitions] = await Promise.all([r.getSettings(), r.getCompetitions()])
    return { settings, competitions }
  })
  const [hintsLeft, setHintsLeft] = useState<number>()

  return (
    <AppShell tab="perfil" title="Preferencias de juego" parent="/ajustes" hintsLeft={hintsLeft}>
      {error && <ErrorNotice message="No se han podido cargar tus preferencias." onRetry={reload} />}
      {loading && <Skeleton height={520} />}
      {data && <Formulario {...data} onSaved={setHintsLeft} />}
    </AppShell>
  )
}

function Formulario({
  settings,
  competitions,
  onSaved,
}: {
  settings: UserSettings
  competitions: Competition[]
  /** Recibe el saldo de pistas que queda tras guardar */
  onSaved: (hintsLeft: number) => void
}) {
  const repo = useRepository()
  const saving = useRef(false)
  const [values, setValues] = useState({
    competitions: settings.competitions,
    difficulty: settings.difficulty,
    hintsPerDay: settings.hintsPerDay,
  })
  const [busy, setBusy] = useState(false)
  const [missing, setMissing] = useState(false)
  const [failed, setFailed] = useState(false)
  const [saved, setSaved] = useState(false)

  function change(patch: Partial<typeof values>) {
    setValues((v) => ({ ...v, ...patch }))
    setSaved(false)
    setFailed(false)
    if (patch.competitions?.length) setMissing(false)
  }

  async function save() {
    if (saving.current) return
    if (values.competitions.length === 0) return setMissing(true)
    saving.current = true
    setBusy(true)
    setSaved(false)
    setFailed(false)
    try {
      await repo.updateSettings(values)
      onSaved((await repo.getStats()).hintsLeft)
      setSaved(true)
    } catch {
      setFailed(true)
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void save()
  }

  return (
    <>
      {failed && <ErrorNotice message="No se han podido guardar tus preferencias." onRetry={() => void save()} />}
      <form className={styles.screen} onSubmit={onSubmit} noValidate>
        <div className={styles.head}>
          <BlockTitle>Preferencias de juego</BlockTitle>
        </div>
        <section className={styles.leagues} aria-labelledby="preferencias-competiciones">
          <BlockTitle size="sm" id="preferencias-competiciones">
            Competiciones
          </BlockTitle>
          <CompetitionPicker
            competitions={competitions}
            selected={values.competitions}
            onChange={(ids) => change({ competitions: ids })}
            testId="preferencias-competicion"
          />
        </section>
        <div className={styles.side}>
          <Card className={styles.card}>
            <DifficultyPicker value={values.difficulty} onChange={(difficulty) => change({ difficulty })} testId="preferencias" />
            <HintsPicker value={values.hintsPerDay} onChange={(hintsPerDay) => change({ hintsPerDay })} testId="preferencias" />
          </Card>
          {missing && (
            <p role="alert" className={styles.error} data-testid="preferencias-error">
              Elige al menos una competición.
            </p>
          )}
          <Button type="submit" block disabled={busy} data-testid="preferencias-guardar">
            Guardar cambios
          </Button>
          <p role="status" className={styles.done} data-testid="preferencias-aviso">
            {saved ? 'Preferencias guardadas.' : ''}
          </p>
        </div>
      </form>
    </>
  )
}
