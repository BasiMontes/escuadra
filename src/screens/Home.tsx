import { ArrowRight, Clock, Compass, Flame, Lightbulb, Star } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Tag } from '../components/Tag'
import { useLoad } from '../data/hooks'
import { AppShell } from '../layouts/AppShell'
import styles from './Home.module.css'

export function Home() {
  const { data } = useLoad(async (r) => {
    const [me, stats, daily] = await Promise.all([r.getMe(), r.getStats(), r.getDailyChallenge()])
    return { me, stats, daily }
  })

  return (
    <AppShell tab="inicio" title="Inicio">
      {data && (
        <div className={styles.grid}>
          <Card className={styles.hello} data-testid="home-saludo">
            <h2 className={styles.helloTitle}>
              ¡Hola
              <br />
              {data.me.username}!
            </h2>
            <p className={styles.helloSub}>¿Listo para el reto de hoy?</p>
            <div className={styles.stats}>
              <Card tone="cream" shadow="sm" pad="sm" className={styles.stat} data-testid="home-racha">
                <Flame className={styles.flame} aria-hidden="true" />
                <strong>{data.stats.streak}</strong>
                <span>Racha</span>
              </Card>
              <Card tone="cream" shadow="sm" pad="sm" className={styles.stat} data-testid="home-pistas">
                <Lightbulb className={styles.bulb} aria-hidden="true" />
                <strong>{data.stats.hintsLeft}</strong>
                <span>Pistas</span>
              </Card>
            </div>
          </Card>

          <Card className={styles.daily} data-testid="home-reto-oficial">
            <Tag icon={<Clock />}>Reto oficial del día</Tag>
            <p className={styles.question}>{data.daily.question}</p>
            <p className={styles.points}>
              <Star className={styles.star} aria-hidden="true" />
              Puntos base: {data.daily.basePoints}
            </p>
            <Button to={`/retos/${data.daily.id}/intro`} block data-testid="home-comenzar-reto">
              Comenzar reto
            </Button>
          </Card>

          <Button
            to="/crear/1"
            variant="secondary"
            size="md"
            block
            iconRight={<ArrowRight />}
            className={styles.action}
            data-testid="home-crear-reto"
          >
            Crear reto personalizado
          </Button>
          <Button
            to="/retos?liga=todas"
            variant="secondary"
            size="md"
            block
            iconRight={<Compass />}
            className={styles.action}
            data-testid="home-explorar"
          >
            Explorar competiciones
          </Button>
        </div>
      )}
    </AppShell>
  )
}
