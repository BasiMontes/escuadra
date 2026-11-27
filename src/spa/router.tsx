import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import NextLink from 'next/link'
import { useParams as useNextParams, usePathname, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'

/** Única puerta a la navegación de las pantallas, sobre las rutas de Next. */

const KEY = 'escuadraKey'
const newKey = () => Math.random().toString(36).slice(2, 10)

/** `key` identifica la entrada del historial; vale `default` en la primera que abre la app. */
const NavigationContext = createContext({ key: 'default', revisit: (_to: string) => {}, keepFirst: () => {} })

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const search = useNextSearchParams().toString()
  const [key, setKey] = useState('default')
  const started = useRef(false)
  const replacingFirst = useRef(false)

  useLayoutEffect(() => {
    let current = history.state?.[KEY] as string | undefined
    if (!current) {
      current = started.current && !replacingFirst.current ? newKey() : 'default'
      history.replaceState({ ...history.state, [KEY]: current }, '')
    }
    started.current = true
    replacingFirst.current = false
    setKey(current)
  }, [pathname, search])

  // Navegar a la dirección actual no cambia la ruta, pero la entrada empieza de cero
  const revisit = useCallback((to: string) => {
    if (to !== `${location.pathname}${location.search}`) return
    const next = newKey()
    history.replaceState({ ...history.state, escuadra: undefined, [KEY]: next }, '')
    setKey(next)
  }, [])

  // Sustituir la primera entrada deja otra primera entrada: detrás sigue sin haber nada de la app
  const keepFirst = useCallback(() => {
    replacingFirst.current = history.state?.[KEY] === 'default'
  }, [])

  return <NavigationContext.Provider value={{ key, revisit, keepFirst }}>{children}</NavigationContext.Provider>
}

export function Link({ to, onClick, ...props }: Omit<ComponentProps<typeof NextLink>, 'href'> & { to: string }) {
  const { revisit } = useContext(NavigationContext)
  return (
    <NextLink
      {...props}
      href={to}
      onClick={(e) => {
        onClick?.(e)
        const inThisTab = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
        if (!e.defaultPrevented && inThisTab) revisit(to)
      }}
    />
  )
}

/** Enlace que marca `aria-current` cuando la dirección actual es la suya o cuelga de ella. */
export function NavLink(props: ComponentProps<typeof Link>) {
  const pathname = usePathname()
  const active = pathname === props.to || pathname.startsWith(`${props.to}/`)
  return <Link {...props} aria-current={active ? (props['aria-current'] ?? 'page') : undefined} />
}

export function Navigate({ to }: { to: string; replace: true }) {
  const navigate = useNavigate()
  useEffect(() => navigate(to, { replace: true }), [navigate, to])
  return null
}

export function useNavigate() {
  const router = useRouter()
  const { revisit, keepFirst } = useContext(NavigationContext)
  return useCallback(
    (to: string | -1, options?: { replace?: boolean }) => {
      if (to === -1) return router.back()
      revisit(to)
      if (options?.replace) {
        keepFirst()
        router.replace(to)
      } else router.push(to)
    },
    [router, revisit, keepFirst],
  )
}

export const useParams = () => useNextParams<Record<string, string>>()

export function useLocation() {
  const pathname = usePathname()
  const { key } = useContext(NavigationContext)
  return { pathname, key }
}

export function useSearchParams() {
  const params = useNextSearchParams()
  const pathname = usePathname()
  const { keepFirst } = useContext(NavigationContext)
  // Con la API del historial Next actualiza los parámetros sin pedir la página al servidor
  const setParams = useCallback(
    (next: Record<string, string>, options: { replace: true }) => {
      const query = new URLSearchParams(next).toString()
      if (options.replace) keepFirst()
      history[options.replace ? 'replaceState' : 'pushState'](null, '', query ? `${pathname}?${query}` : pathname)
    },
    [pathname, keepFirst],
  )
  return [params, setParams] as const
}
