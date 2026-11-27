import { useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { BlockTitle } from '../../components/BlockTitle'
import { Card } from '../../components/Card'
import { RadioDot, Toggle } from '../../components/Controls'
import { ErrorNotice, Skeleton } from '../../components/States'
import { useLoad, useRepository } from '../../data/hooks'
import type { Profile } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { formatNumber } from '../../lib/game'
import { buildTextPdf } from '../../lib/pdf'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import styles from './Privacidad.module.css'

export function Privacidad() {
  const { data, error, loading, reload } = useLoad((r) => r.getMe())

  return (
    <AppShell tab="perfil" title="Privacidad" parent="/ajustes" narrow>
      {error && <ErrorNotice message="No se han podido cargar tus datos." onRetry={reload} />}
      {loading && <Skeleton height={420} />}
      {data && <Opciones profile={data} />}
    </AppShell>
  )
}

type Patch = Partial<Pick<Profile, 'isPublic' | 'showInRanking'>>

const VISIBILITY = [
  { id: 'publico', value: true, title: 'Perfil público', text: 'Todos pueden ver tus trofeos y estadísticas.' },
  { id: 'privado', value: false, title: 'Perfil privado', text: 'Solo tú puedes ver tu progreso actual.' },
]

function Opciones({ profile }: { profile: Profile }) {
  const repo = useRepository()
  const [values, setValues] = useState(profile)
  const [failed, setFailed] = useState<{ message: string; retry: () => void } | null>(null)
  const [status, setStatus] = useState('')
  const [deleting, setDeleting] = useState(false)

  /** Cambia al momento y vuelve atrás si no se puede guardar. */
  async function save(patch: Patch) {
    const previous = values
    setFailed(null)
    setValues((v) => ({ ...v, ...patch }))
    try {
      await repo.updateMe(patch)
    } catch {
      setValues(previous)
      setFailed({ message: 'No se ha podido guardar el cambio.', retry: () => void save(patch) })
    }
  }

  async function download() {
    setFailed(null)
    try {
      const [me, stats] = await Promise.all([repo.getMe(), repo.getStats()])
      const pdf = buildTextPdf('Escuadra - Mis datos', [
        `Usuario: ${me.username}`,
        `Correo: ${me.email}`,
        `Biografía: ${me.bio}`,
        `Perfil público: ${me.isPublic ? 'sí' : 'no'}`,
        `Aparece en el ranking: ${me.showInRanking ? 'sí' : 'no'}`,
        '',
        `Partidos jugados: ${formatNumber(stats.matchesPlayed)}`,
        `Retos creados: ${formatNumber(stats.challengesCreated)}`,
        `Puntos totales: ${formatNumber(stats.totalPoints)}`,
        `Posición global: ${formatNumber(stats.globalRank)}`,
        `Racha actual: ${formatNumber(stats.streak)}`,
      ])
      const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'escuadra-mis-datos.pdf'
      link.click()
      // El navegador necesita un instante para empezar la descarga
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setStatus('Informe descargado.')
    } catch {
      setFailed({ message: 'No se ha podido generar el informe.', retry: () => void download() })
    }
  }

  return (
    <div className={styles.screen}>
      {failed && <ErrorNotice message={failed.message} onRetry={failed.retry} />}
      <Card className={styles.intro}>
        <h2>Privacidad</h2>
        <p>Gestiona tu seguridad en el campo.</p>
      </Card>

      <div className={styles.options}>
        <fieldset className={styles.group}>
          <legend>
            <BlockTitle size="sm">Visibilidad de perfil</BlockTitle>
          </legend>
          {VISIBILITY.map((option) => (
            <label key={option.id} className={styles.row}>
              <input
                type="radio"
                name="visibilidad"
                checked={values.isPublic === option.value}
                onChange={() => void save({ isPublic: option.value })}
                aria-label={option.title}
                aria-describedby={`privacidad-${option.id}-texto`}
                data-testid={`privacidad-${option.id}`}
              />
              <span className={styles.copy}>
                <strong>{option.title}</strong>
                <span id={`privacidad-${option.id}-texto`}>{option.text}</span>
              </span>
              <RadioDot checked={values.isPublic === option.value} />
            </label>
          ))}
        </fieldset>

        <section className={styles.group} aria-labelledby="privacidad-ranking-titulo">
          <BlockTitle size="sm" id="privacidad-ranking-titulo">
            Ranking global
          </BlockTitle>
          <div className={styles.row}>
            <span className={styles.copy}>
              <strong>Aparecer en ranking</strong>
              <span>Permite que otros compitan contigo.</span>
            </span>
            <Toggle
              checked={values.showInRanking}
              onChange={(v) => void save({ showInRanking: v })}
              label="Aparecer en ranking"
              data-testid="privacidad-aparecer"
            />
          </div>
        </section>
      </div>

      <section className={styles.data} aria-labelledby="privacidad-datos-titulo">
        <BlockTitle size="sm" id="privacidad-datos-titulo">
          Gestión de datos
        </BlockTitle>
        <button type="button" className={styles.action} onClick={() => void download()} data-testid="privacidad-descargar">
          <Download aria-hidden="true" />
          <span className={styles.copy}>
            <strong>Descargar mis datos</strong>
            <span>Recibe un reporte de tu actividad en PDF.</span>
          </span>
        </button>
        <button
          type="button"
          className={styles.danger}
          onClick={() => setDeleting(true)}
          data-testid="privacidad-eliminar"
        >
          <Trash2 aria-hidden="true" />
          <span className={styles.copy}>
            <strong>Eliminar cuenta</strong>
            <span>Esta acción es permanente e irreversible.</span>
          </span>
        </button>
        <p role="status" className={styles.status} data-testid="privacidad-aviso">
          {status}
        </p>
      </section>
      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
    </div>
  )
}
