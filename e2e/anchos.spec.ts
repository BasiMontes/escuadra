import { expect, test, type Page } from '@playwright/test'

/**
 * Anchos fuera del diseño: móvil pequeño (320 px, el mínimo que pide WCAG 1.4.10) y tablet,
 * en vertical (768) y apaisada (1024, donde empieza la disposición de desktop).
 */
const ANCHOS = [
  { width: 320, height: 568 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
]

const ir = (ruta: string) => async (page: Page) => {
  await page.goto(ruta)
}

async function hastaCrear(page: Page, paso: 2 | 3 | 4) {
  await page.goto('/crear/1')
  await page.getByTestId('crear-titulo').fill('Mundiales 90s')
  await page.getByTestId('crear-descripcion').fill('¿Qué selección ganó el Mundial de 1998?')
  await page.getByTestId('crear-siguiente').click()
  await page.getByTestId('crear-puntos').waitFor()
  if (paso === 2) return
  await page.getByTestId('crear-siguiente').click()
  await page.getByTestId('crear-pista-1').waitFor()
  if (paso === 3) return
  await page.getByTestId('crear-pista-1').fill('Jugaba en casa.')
  await page.getByTestId('crear-respuesta').fill('Francia')
  await page.getByTestId('crear-publicar').click()
  await page.getByTestId('crear-ir-inicio').waitFor()
}

async function responder(page: Page, opcion: 'a' | 'c') {
  await page.goto('/retos/balon-oro-2018/jugar')
  await page.getByTestId(`reto-opcion-${opcion}`).click()
  await page.getByTestId('resultado-titulo').waitFor()
}

const PANTALLAS: Array<[nombre: string, abrir: (page: Page) => Promise<void>]> = [
  ...[
    '/', '/registro', '/entrar', '/recuperar', '/nueva-contrasena', '/nueva-contrasena?enlace=caducado',
    '/onboarding/competiciones', '/onboarding/configuracion', '/onboarding/resumen', '/inicio', '/retos',
    '/retos?liga=todas', '/retos/en-curso', '/retos/balon-oro-2018', '/retos/propio-clasicos',
    '/retos/balon-oro-2018/intro', '/retos/balon-oro-2018/jugar', '/retos/mundiales-90s/jugar', '/crear/1',
    '/ranking', '/ranking?tipo=amigos', '/perfil', '/perfil/editar', '/perfil/logros',
    '/perfil/logros?nuevo=rey-del-gol', '/perfil/retos', '/ajustes', '/ajustes/juego',
    '/ajustes/notificaciones', '/ajustes/privacidad', '/ajustes/soporte', '/ajustes/contrasena',
    '/bienvenida', '/terminos', '/no-existe',
  ].map((ruta): [string, (page: Page) => Promise<void>] => [ruta, ir(ruta)]),
  ['crear paso 2', (page) => hastaCrear(page, 2)],
  ['crear paso 3', (page) => hastaCrear(page, 3)],
  ['crear paso 4', (page) => hastaCrear(page, 4)],
  ['resultado correcto', (page) => responder(page, 'a')],
  ['resultado incorrecto', (page) => responder(page, 'c')],
]

/** Problemas de maquetación visibles en la pantalla actual. */
function revisar(page: Page) {
  return page.evaluate(async () => {
    await document.fonts.ready
    const problemas = new Set<string>()
    const nombre = (el: Element) =>
      el.getAttribute('data-testid') ?? `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}"`
    const oculto = (el: Element) =>
      Boolean(el.closest('.visually-hidden, svg, [data-mobile-title]')) || getComputedStyle(el).visibility === 'hidden'

    const sobra = document.documentElement.scrollWidth - window.innerWidth
    if (sobra > 0) problemas.add(`scroll lateral de ${sobra} px`)

    const textos = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let nodo = textos.nextNode(); nodo; nodo = textos.nextNode()) {
      const el = nodo.parentElement!
      if (oculto(el)) continue
      // Una palabra repartida en dos líneas
      for (const palabra of nodo.textContent!.matchAll(/[\p{Letter}\p{Number}]{3,}/gu)) {
        const rango = document.createRange()
        rango.setStart(nodo, palabra.index)
        rango.setEnd(nodo, palabra.index + palabra[0].length)
        const lineas = new Set([...rango.getClientRects()].map((r) => Math.round(r.top)))
        if (lineas.size > 1) problemas.add(`palabra partida: ${palabra[0]}`)
      }
      // Texto más ancho que su caja (los recortados con puntos suspensivos son intencionados)
      const estilo = getComputedStyle(el)
      if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && estilo.textOverflow !== 'ellipsis') {
        problemas.add(`texto que no cabe: ${nombre(el)}`)
      }
    }

    // Controles y títulos que se salen de la tarjeta o columna que los contiene
    for (const el of document.querySelectorAll('main button, main a, main h2, main h3, main input')) {
      if (oculto(el)) continue
      const r = el.getBoundingClientRect()
      if (r.width < 2) continue
      for (let caja = el.parentElement; caja && caja.tagName !== 'MAIN'; caja = caja.parentElement) {
        const c = caja.getBoundingClientRect()
        if (r.right > c.right + 6 || r.left < c.left - 6) {
          problemas.add(`se sale de su contenedor: ${nombre(el)}`)
          break
        }
      }
    }
    return [...problemas]
  })
}

for (const ancho of ANCHOS) {
  test.describe(`Ancho ${ancho.width}`, () => {
    test.use({ viewport: ancho })

    for (const [nombre, abrir] of PANTALLAS) {
      test(`${nombre} no desborda`, async ({ page }, info) => {
        test.skip(info.project.name !== 'desktop', 'El tamaño lo fija este archivo: basta un proyecto')
        await abrir(page)
        await page.waitForLoadState('networkidle')
        await page.locator('h1, h2, [data-testid="splash"]').first().waitFor({ state: 'attached' })
        expect(await revisar(page)).toEqual([])
      })
    }
  })
}
