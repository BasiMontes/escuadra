import { EmptyCard } from '../components/States'
import { AppShell } from '../layouts/AppShell'

export function NoEncontrada() {
  return (
    <AppShell tab={null} title="Página no encontrada">
      <EmptyCard message="No encontramos esta página." actionLabel="Ir al inicio" to="/inicio" />
    </AppShell>
  )
}
