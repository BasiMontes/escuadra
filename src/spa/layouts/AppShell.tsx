import type { ReactNode } from 'react'
import { NavLink, Link } from 'react-router'
import { BarChart3, Flame, House, Lightbulb, Plus, Trophy, User } from 'lucide-react'
import { Logo } from '../components/Logo'
import { cx } from '../components/cx'
import { useLoad } from '../data/hooks'
import { NotificationsMenu } from './NotificationsMenu'
import styles from './AppShell.module.css'

export type Tab = 'inicio' | 'retos' | 'ranking' | 'perfil'

const TABS: Array<{ id: Tab; label: string; to: string; icon: ReactNode }> = [
  { id: 'inicio', label: 'Inicio', to: '/inicio', icon: <House /> },
  { id: 'retos', label: 'Retos', to: '/retos', icon: <Trophy /> },
  { id: 'ranking', label: 'Ranking', to: '/ranking', icon: <BarChart3 /> },
  { id: 'perfil', label: 'Perfil', to: '/perfil', icon: <User /> },
]

type Props = {
  /** Pestaña marcada como activa */
  tab: Tab | null
  /** Título de la cabecera en desktop */
  title: string
  /** Fondo de la zona de contenido en móvil; en desktop siempre es amarillo con patrón */
  mobileBg?: 'yellow' | 'game' | 'white'
  /** Margen lateral de 16 px en móvil (Reto del día y Reto) en lugar de 24 */
  narrow?: boolean
  /** Saldo de pistas al día cuando la pantalla lo cambia */
  hintsLeft?: number
  children: ReactNode
}

/** Estructura común de las pantallas con sesión iniciada. */
export function AppShell({ tab, title, mobileBg = 'yellow', narrow = false, hintsLeft, children }: Props) {
  const { data: stats } = useLoad((r) => r.getStats())
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Navegación principal">
        <Link to="/inicio" className={styles.sideBrand} data-testid="sidebar-logo">
          <Logo size={40} border="none" />
          <span>Escuadra</span>
        </Link>
        <nav className={styles.sideNav}>
          {TABS.map((t) => (
            <NavLink
              key={t.id}
              to={t.to}
              className={cx(styles.sideItem, tab === t.id && styles.sideItemActive)}
              aria-current={tab === t.id ? 'page' : undefined}
              data-testid={`sidebar-${t.id}`}
            >
              {t.icon}
              <span>{t.label}</span>
            </NavLink>
          ))}
        </nav>
        <Link to="/crear/1" className={styles.sideCreate} data-testid="sidebar-crear-reto">
          <Plus aria-hidden="true" />
          <span>Crear reto</span>
        </Link>
      </aside>

      <div className={styles.main}>
        {/* Cabecera móvil */}
        <header className={styles.mobileHeader}>
          <Link to="/inicio" className={styles.mobileBrand} data-testid="header-logo">
            <Logo size={48} shadow />
            <span>Escuadra</span>
          </Link>
          <NotificationsMenu buttonClass={styles.bell} testId="header-avisos" />
        </header>

        {/* Cabecera desktop */}
        <header className={styles.topbar}>
          <h1 className={styles.topTitle}>{title}</h1>
          <div className={styles.topRight}>
            <span className={styles.pill} data-testid="topbar-racha">
              <Flame aria-hidden="true" /> Racha {stats?.streak ?? 0}
            </span>
            <span className={styles.pill} data-testid="topbar-pistas">
              <Lightbulb aria-hidden="true" /> Pistas {hintsLeft ?? stats?.hintsLeft ?? 0}
            </span>
            <NotificationsMenu buttonClass={styles.topBell} testId="topbar-avisos" />
          </div>
        </header>

        <main className={cx(styles.content, styles[`bg-${mobileBg}`], narrow && styles.narrow)} id="contenido">
          <h1 className="visually-hidden" data-mobile-title>
            {title}
          </h1>
          {children}
        </main>

        {/* Barra inferior móvil */}
        <nav className={styles.bottomNav} aria-label="Navegación principal">
          {TABS.slice(0, 2).map((t) => (
            <BottomItem key={t.id} {...t} active={tab === t.id} />
          ))}
          <Link to="/crear/1" className={styles.plus} aria-label="Crear reto" data-testid="nav-crear-reto">
            <Plus />
          </Link>
          {TABS.slice(2).map((t) => (
            <BottomItem key={t.id} {...t} active={tab === t.id} />
          ))}
        </nav>
      </div>
    </div>
  )
}

function BottomItem({ id, label, to, icon, active }: { id: Tab; label: string; to: string; icon: ReactNode; active: boolean }) {
  return (
    <Link
      to={to}
      className={cx(styles.bottomItem, active && styles.bottomItemActive)}
      aria-current={active ? 'page' : undefined}
      data-testid={`nav-${id}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
