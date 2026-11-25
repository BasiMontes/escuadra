import { useNavigate } from 'react-router'
import { ArrowRight, BarChart3, Lightbulb, Trophy } from 'lucide-react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CheckSquare } from '../../components/Controls'
import { cx } from '../../components/cx'
import { Logo } from '../../components/Logo'
import { useLoad, useRepository } from '../../data/hooks'
import type { Difficulty } from '../../data/types'
import { DIFFICULTY_LABEL } from '../../lib/labels'
import { OnboardingShell, StickyAction } from '../../layouts/OnboardingShell'
import { useOnboarding } from './onboardingState'
import styles from './Onboarding.module.css'

export function Competiciones() {
  const navigate = useNavigate()
  const { draft, update } = useOnboarding()
  const { data: competitions } = useLoad((r) => r.getCompetitions())
  const canContinue = draft.competitions.length > 0

  const toggle = (id: string) =>
    update({
      competitions: draft.competitions.includes(id)
        ? draft.competitions.filter((c) => c !== id)
        : [...draft.competitions, id],
    })

  const continueButton = (
    <Button
      block
      variant={canContinue ? 'primary' : 'disabled'}
      className={styles.submit}
      onClick={() => navigate('/onboarding/configuracion')}
      data-testid="competiciones-continuar"
    >
      Continuar
    </Button>
  )

  return (
    <OnboardingShell step={2}>
      <div className={styles.leaguesLayout}>
        <div className={styles.stepCol}>
          <Card className={styles.stepCard} pad="none">
            <h1 className={styles.stepTitle}>
              Tu competición
              <br />
              favorita
            </h1>
            <p className={styles.stepSub}>Elige una o varias. Recibirás retos de estas ligas cada semana.</p>
          </Card>
          <div className={styles.desktopOnly}>{continueButton}</div>
        </div>
        <div className={styles.leagueList} role="group" aria-label="Competiciones">
          {competitions?.map((c) => {
            const on = draft.competitions.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                className={styles.league}
                onClick={() => toggle(c.id)}
                data-testid={`competicion-${c.id}`}
              >
                <span>{c.name}</span>
                <CheckSquare checked={on} />
              </button>
            )
          })}
        </div>
      </div>
      <StickyAction className={styles.mobileOnly}>{continueButton}</StickyAction>
    </OnboardingShell>
  )
}

const DIFFICULTIES: Difficulty[] = ['facil', 'medio', 'dificil']
const HINTS = [1, 2, 3] as const

export function Configuracion() {
  const navigate = useNavigate()
  const { draft, update } = useOnboarding()

  const next = (
    <Button block className={styles.submit} onClick={() => navigate('/onboarding/resumen')} data-testid="configuracion-ver-resumen">
      Ver resumen
    </Button>
  )

  return (
    <OnboardingShell step={3}>
      <div className={styles.configWrap}>
        <Card className={styles.configCard} pad="none">
          <h1 className={styles.configTitle}>Configuración</h1>
          <p className={styles.configSub}>Personaliza tu experiencia</p>

          <fieldset className={styles.group}>
            <legend>Nivel de dificultad</legend>
            <div className={styles.options} role="radiogroup" aria-label="Nivel de dificultad">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={draft.difficulty === d}
                  className={styles.option}
                  onClick={() => update({ difficulty: d })}
                  data-testid={`configuracion-dificultad-${d}`}
                >
                  {DIFFICULTY_LABEL[d]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.group}>
            <legend>Pistas disponibles al día</legend>
            <div className={styles.options} role="radiogroup" aria-label="Pistas disponibles al día">
              {HINTS.map((h) => (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={draft.hintsPerDay === h}
                  className={cx(styles.option, styles.optionBig)}
                  onClick={() => update({ hintsPerDay: h })}
                  data-testid={`configuracion-pistas-${h}`}
                >
                  {h}
                </button>
              ))}
            </div>
          </fieldset>
        </Card>
        <div className={styles.desktopOnly}>{next}</div>
      </div>
      <StickyAction className={styles.mobileOnly}>{next}</StickyAction>
    </OnboardingShell>
  )
}

export function Resumen() {
  const repo = useRepository()
  const navigate = useNavigate()
  const { draft } = useOnboarding()
  const { data: competitions } = useLoad((r) => r.getCompetitions())
  const chosen = competitions?.filter((c) => draft.competitions.includes(c.id)) ?? []

  async function start() {
    await repo.updateSettings({ competitions: draft.competitions, difficulty: draft.difficulty, hintsPerDay: draft.hintsPerDay })
    const daily = await repo.getDailyChallenge()
    navigate(`/retos/${daily.id}/intro`)
  }

  return (
    <OnboardingShell step={null}>
      <Card className={styles.summaryCard} pad="none">
        <Logo size={84} shadow bordered={false} />
        <h1 className={styles.summaryTitle}>¡Bienvenido!</h1>
        <p className={styles.summaryText}>Todo listo para demostrar cuánto sabes de fútbol.</p>
        <ul className={styles.chips} data-testid="resumen-elecciones">
          {chosen.map((c) => (
            <li key={c.id} className={styles.chip}>
              <Trophy aria-hidden="true" />
              <span>{c.name}</span>
            </li>
          ))}
          <li className={cx(styles.chip, styles.chipYellow)}>
            <BarChart3 aria-hidden="true" />
            <span>Nivel: {DIFFICULTY_LABEL[draft.difficulty]}</span>
          </li>
          <li className={styles.chip}>
            <Lightbulb aria-hidden="true" />
            <span>
              {draft.hintsPerDay} {draft.hintsPerDay === 1 ? 'pista disponible' : 'pistas disponibles'}
            </span>
          </li>
        </ul>
        <Button block className={styles.start} iconRight={<ArrowRight />} onClick={start} data-testid="resumen-empezar">
          Empezar primer reto
        </Button>
      </Card>
    </OnboardingShell>
  )
}
