import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import styles from './Legal.module.css'

/** Hueco de los textos legales: todavía no están redactados. */
export function Legal({ title }: { title: string }) {
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <h1>{title}</h1>
        <p data-testid="legal-pendiente">Estamos preparando este texto.</p>
        <Button to="/bienvenida" size="md" block data-testid="legal-volver">
          Volver a la portada
        </Button>
      </Card>
    </main>
  )
}
