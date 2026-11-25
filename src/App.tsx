import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { DataProvider } from './data/DataProvider'
import { AppShell, type Tab } from './layouts/AppShell'
import { Card } from './components/Card'
import { Componentes } from './screens/Componentes'
import { Home } from './screens/Home'

/** Marcador para las pantallas que aún no están construidas. */
function Pendiente({ title, tab }: { title: string; tab: Tab | null }) {
  return (
    <AppShell tab={tab} title={title}>
      <Card>
        <h2>{title}</h2>
        <p style={{ marginTop: 12 }}>Pantalla en construcción.</p>
      </Card>
    </AppShell>
  )
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<Home />} />
          <Route path="/componentes" element={<Componentes />} />
          <Route path="/retos/*" element={<Pendiente title="Retos" tab="retos" />} />
          <Route path="/ranking" element={<Pendiente title="Ranking" tab="ranking" />} />
          <Route path="/perfil/*" element={<Pendiente title="Perfil" tab="perfil" />} />
          <Route path="/crear/*" element={<Pendiente title="Crear reto" tab="retos" />} />
          <Route path="*" element={<Pendiente title="Página no encontrada" tab={null} />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}
