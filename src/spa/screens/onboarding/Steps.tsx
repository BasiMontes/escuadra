import { useNavigate } from 'react-router'
import { ArrowRight, BarChart3, Lightbulb, Trophy } from 'lucide-react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { cx } from '../../components/cx'
import { CompetitionPicker, DifficultyPicker, HintsPicker } from '../../components/GamePickers'
import { Logo } from '../../components/Logo'
import { useLoad, useRepository } from '../../data/hooks'
import { DIFFICULTY_LABEL } from '../../lib/labels'
import { OnboardingShell, StickyAction } from '../../layouts/OnboardingShell'
import { useOnboarding } from './onboardingState'
import styles from './Onboarding.module.css'

export function Competiciones() {
  const navigate = useNavigate()
  const { draft, update } = useOnboarding()
  const { data: competitions } = useLoad((r) => r.getCompetitions())
  const canContinue = draft.competitions.length > 0

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
        <CompetitionPicker
          competitions={competitions ?? []}
          selected={draft.competitions}
          onChange={(ids) => update({ competitions: ids })}
          testId="competicion"
        />
      </div>
      <StickyAction className={styles.mobileOnly}>{continueButton}</StickyAction>
    </OnboardingShell>
  )
}

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

          <DifficultyPicker value={draft.difficulty} onChange={(difficulty) => update({ difficulty })} testId="configuracion" />
          <HintsPicker value={draft.hintsPerDay} onChange={(hintsPerDay) => update({ hintsPerDay })} testId="configuracion" />
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
        <Logo size={84} shadow border="none" />
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
