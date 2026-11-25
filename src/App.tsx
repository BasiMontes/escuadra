import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { DataProvider } from './data/DataProvider'
import { AppShell, type Tab } from './layouts/AppShell'
import { Card } from './components/Card'
import { Componentes } from './screens/Componentes'
import { Home } from './screens/Home'
import { RetoIntro } from './screens/juego/RetoIntro'
import { RetoJugar } from './screens/juego/RetoJugar'
import { RetoResultado } from './screens/juego/RetoResultado'
import { Entrar, Recuperar, Registro } from './screens/onboarding/Auth'
import { OnboardingProvider } from './screens/onboarding/OnboardingContext'
import { Splash } from './screens/onboarding/Splash'
import { Competiciones, Configuracion, Resumen } from './screens/onboarding/Steps'

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
          <Route path="/" element={<Splash />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/recuperar" element={<Recuperar />} />
          <Route path="/onboarding" element={<OnboardingProvider />}>
            <Route index element={<Navigate to="competiciones" replace />} />
            <Route path="competiciones" element={<Competiciones />} />
            <Route path="configuracion" element={<Configuracion />} />
            <Route path="resumen" element={<Resumen />} />
          </Route>
          <Route path="/inicio" element={<Home />} />
          <Route path="/componentes" element={<Componentes />} />
          <Route path="/retos/:id/intro" element={<RetoIntro />} />
          <Route path="/retos/:id/jugar" element={<RetoJugar />} />
          <Route path="/retos/:id/resultado" element={<RetoResultado />} />
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
