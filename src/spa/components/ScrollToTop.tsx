import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from '../router'

/** Cada pantalla nueva empieza arriba. Al volver atrás, el scroll lo decide el navegador. */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const type = useNavigationType()

  useLayoutEffect(() => {
    if (type !== 'POP') window.scrollTo(0, 0)
  }, [pathname, type])

  return null
}
