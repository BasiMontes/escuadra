import { useState } from 'react'
import { LayoutDashboard, Share2, Trophy } from 'lucide-react'
import { Navigate } from '../../router'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { IconBox } from '../../components/Controls'
import { Tag } from '../../components/Tag'
import { useLoad } from '../../data/hooks'
import { formatNumber } from '../../lib/game'
import { DIFFICULTY_LABEL } from '../../lib/labels'
import { CHALLENGE_LIMITS } from '../../lib/validation'
import { CrearLayout } from './CrearLayout'
import { useCrear, type PublishedChallenge } from './crearState'
import styles from './PasoPublicado.module.css'

/** Paso 4: resumen del reto enviado a revisión. */
export function PasoPublicado() {
  const { published } = useCrear()
  if (!published) return <Navigate to="/crear/1" replace />
  return <Resumen {...published} />
}

function Resumen({ id, challenge }: PublishedChallenge) {
  const { data: competitions } = useLoad((r) => r.getCompetitions())
  const [shareMessage, setShareMessage] = useState('')
  const league = competitions?.find((c) => c.id === challenge.competitionId)?.name

  /** Hoja de compartir del sistema y, si no existe, copia el enlace. */
  async function share() {
    const url = `${window.location.origin}/retos/${id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Escuadra', text: `Juega mi reto "${challenge.title}"`, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareMessage('Enlace copiado.')
    } catch (error) {
      // Cerrar la hoja de compartir no es un fallo
      if ((error as Error).name === 'AbortError') return
      setShareMessage(`No se ha podido compartir. Copia este enlace: ${url}`)
    }
  }

  const rows: Array<[string, string]> = [
    ['Liga', league ?? ''],
    ['Dificultad', DIFFICULTY_LABEL[challenge.difficulty]],
    ['Puntos', formatNumber(challenge.basePoints)],
    ['Pistas', `${challenge.hints.length}/${CHALLENGE_LIMITS.hintsMax}`],
    ['Estado', 'Pendiente de revisión'],
  ]

  return (
    <CrearLayout step={4} title="Reto publicado" subtitle="Aquí tienes un resumen del reto que has creado.">
      <div className={styles.done}>
        <Card className={styles.summary} data-testid="crear-resumen">
          <div className={styles.head}>
            <IconBox tone="orange" size={64}>
              <Trophy />
            </IconBox>
            <div>
              <p>Nuevo desafío</p>
              <h3>{challenge.title}</h3>
            </div>
          </div>
          <dl className={styles.rows}>
            <div>
              <dt>Categoría</dt>
              <dd>
                <Tag>Respuesta libre</Tag>
              </dd>
            </div>
            {rows.map(([term, value]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd data-testid={`crear-resumen-${term.toLowerCase()}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className={styles.actions}>
          <Button block iconLeft={<Share2 />} onClick={() => void share()} data-testid="crear-compartir">
            Compartir reto
          </Button>
          <Button
            to="/inicio"
            variant="secondary"
            block
            iconLeft={<LayoutDashboard />}
            data-testid="crear-ir-inicio"
          >
            Ir al dashboard
          </Button>
          <p role="status" className={styles.share} data-testid="crear-compartir-aviso">
            {shareMessage}
          </p>
        </div>

        <p className={styles.note}>
          * Para que sea válido en nuestro sistema primero tiene que pasar por nuestro tribunal de expertos en el deporte
          rey. Así evitamos preguntas fraudulentas o datos erróneos.
        </p>
      </div>
    </CrearLayout>
  )
}
