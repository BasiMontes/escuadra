import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { DataProvider } from './data/DataProvider'
import { AppShell, type Tab } from './layouts/AppShell'
import { Card } from './components/Card'
import { Componentes } from './screens/Componentes'
import { Ajustes } from './screens/ajustes/Ajustes'
import { Contrasena } from './screens/ajustes/Contrasena'
import { Notificaciones } from './screens/ajustes/Notificaciones'
import { Privacidad } from './screens/ajustes/Privacidad'
import { Soporte } from './screens/ajustes/Soporte'
import { CrearProvider } from './screens/crear/CrearContext'
import { PasoInformacion } from './screens/crear/PasoInformacion'
import { PasoNivel } from './screens/crear/PasoNivel'
import { PasoPistas } from './screens/crear/PasoPistas'
import { PasoPublicado } from './screens/crear/PasoPublicado'
import { Home } from './screens/Home'
import { EnCurso } from './screens/retos/EnCurso'
import { RetoDetalle } from './screens/retos/RetoDetalle'
import { RetosDelDia } from './screens/retos/RetosDelDia'
import { RetoIntro } from './screens/juego/RetoIntro'
import { RetoJugar } from './screens/juego/RetoJugar'
import { RetoResultado } from './screens/juego/RetoResultado'
import { Entrar, Recuperar, Registro } from './screens/onboarding/Auth'
import { OnboardingProvider } from './screens/onboarding/OnboardingContext'
import { Splash } from './screens/onboarding/Splash'
import { Competiciones, Configuracion, Resumen } from './screens/onboarding/Steps'
import { EditarPerfil } from './screens/perfil/EditarPerfil'
import { Logros } from './screens/perfil/Logros'
import { Perfil } from './screens/perfil/Perfil'

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
          <Route path="/retos" element={<RetosDelDia />} />
          <Route path="/retos/en-curso" element={<EnCurso />} />
          <Route path="/retos/:id" element={<RetoDetalle />} />
          <Route path="/retos/:id/intro" element={<RetoIntro />} />
          <Route path="/retos/:id/jugar" element={<RetoJugar />} />
          <Route path="/retos/:id/resultado" element={<RetoResultado />} />
          <Route path="/retos/*" element={<Pendiente title="Retos" tab="retos" />} />
          <Route path="/ranking" element={<Pendiente title="Ranking" tab="ranking" />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/editar" element={<EditarPerfil />} />
          <Route path="/perfil/logros" element={<Logros />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="/ajustes/notificaciones" element={<Notificaciones />} />
          <Route path="/ajustes/privacidad" element={<Privacidad />} />
          <Route path="/ajustes/soporte" element={<Soporte />} />
          <Route path="/ajustes/contrasena" element={<Contrasena />} />
          <Route path="/crear" element={<CrearProvider />}>
            <Route index element={<Navigate to="1" replace />} />
            <Route path="1" element={<PasoInformacion />} />
            <Route path="2" element={<PasoNivel />} />
            <Route path="3" element={<PasoPistas />} />
            <Route path="4" element={<PasoPublicado />} />
            <Route path="*" element={<Navigate to="/crear/1" replace />} />
          </Route>
          <Route path="*" element={<Pendiente title="Página no encontrada" tab={null} />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}
