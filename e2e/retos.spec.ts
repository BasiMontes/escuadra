import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectFullScreen } from './helpers'

const OFICIALES = ['balon-oro-2018', 'champions-2005', 'goleador-laliga']

async function expectNoSeriousA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

/** Vuelve a la lista sin recargar, para conservar los datos en memoria. */
async function irARetos(page: Page, proyecto: string) {
  await page.getByTestId(proyecto === 'movil' ? 'nav-retos' : 'sidebar-retos').click()
  await expect(page).toHaveURL(/\/retos$/)
}

/** Juega un reto desde la lista y acaba en el resultado. */
async function jugar(page: Page, id: string, pistas = 0) {
  await page.getByTestId(`retos-unirse-${id}`).click()
  await page.getByTestId('detalle-comenzar').click()
  for (let i = 1; i <= pistas; i++) {
    await page.getByTestId('pistas-revelar').click()
    await page.getByTestId(`pistas-revelada-${i}`).waitFor()
  }
  await page.getByTestId('reto-opcion-b').click()
  await page.getByTestId('resultado-titulo').waitFor()
}

test.describe('Retos del día', () => {
  test('muestra los retos oficiales sin filtro', async ({ page }) => {
    await page.goto('/retos')
    await expect(page.getByRole('article')).toHaveCount(3)
    await expect(page.getByTestId('retos-tarjeta-balon-oro-2018')).toContainText('Internacional')
    await expect(page.getByTestId('retos-tarjeta-goleador-laliga')).toContainText('LaLiga')
    await expect(page.getByTestId('retos-tarjeta-champions-2005')).toContainText('100 pts')
    for (const id of OFICIALES) await expect(page.getByTestId(`retos-unirse-${id}`)).toContainText('Unirse')
    await expect(page.getByRole('group', { name: 'Filtrar por liga' })).toHaveCount(0)
  })

  test('marca la pestaña Retos', async ({ page }, info) => {
    await page.goto('/retos')
    const pestana = page.getByTestId(info.project.name === 'movil' ? 'nav-retos' : 'sidebar-retos')
    await expect(pestana).toHaveAttribute('aria-current', 'page')
  })

  test('Explorar competiciones abre el filtro por liga', async ({ page }) => {
    await page.goto('/inicio')
    await page.getByTestId('home-explorar').click()
    await expect(page.getByTestId('retos-filtro-todas')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('article')).toHaveCount(3)

    await page.getByTestId('retos-filtro-laliga').click()
    await expect(page).toHaveURL(/liga=laliga$/)
    await expect(page.getByRole('article')).toHaveCount(1)
    await expect(page.getByTestId('retos-tarjeta-goleador-laliga')).toBeVisible()
  })

  test('avisa cuando la liga no tiene retos', async ({ page }) => {
    await page.goto('/retos?liga=bundesliga')
    await expect(page.getByTestId('vacio-tarjeta')).toContainText('No hay retos de esta liga hoy.')
    await page.getByTestId('vacio-accion').click()
    await expect(page.getByRole('article')).toHaveCount(3)
  })

  test('un reto completado queda como Hecho con sus pistas', async ({ page }, info) => {
    await page.goto('/retos')
    await jugar(page, 'champions-2005', 2)
    await irARetos(page, info.project.name)
    await expect(page.getByTestId('retos-hecho-champions-2005')).toBeDisabled()
    await expect(page.getByTestId('retos-pistas-champions-2005')).toContainText('2')
    await expect(page.getByTestId('retos-unirse-balon-oro-2018')).toContainText('Unirse')
  })

  test('un reto a medias se puede seguir', async ({ page }, info) => {
    await page.goto('/retos')
    await page.getByTestId('retos-unirse-balon-oro-2018').click()
    await page.getByTestId('detalle-comenzar').click()
    await page.getByTestId('pistas-revelar').click()
    await page.getByTestId('pistas-revelada-1').waitFor()
    await irARetos(page, info.project.name)

    await expect(page.getByTestId('retos-unirse-balon-oro-2018')).toContainText('Seguir')
    await page.getByTestId('retos-unirse-balon-oro-2018').click()
    await expect(page.getByTestId('detalle-comenzar')).toHaveText('Seguir reto')
    await expect(page.getByTestId('detalle-pistas')).toContainText('1/3')
  })
})

test.describe('Detalle del reto', () => {
  test('muestra los datos y lleva a jugar', async ({ page }) => {
    await page.goto('/retos')
    await page.getByTestId('retos-unirse-balon-oro-2018').click()
    await expect(page).toHaveURL(/\/retos\/balon-oro-2018$/)
    await expect(page.getByTestId('detalle-competicion')).toHaveText('Internacional')
    await expect(page.getByTestId('detalle-pregunta')).toHaveText('¿Quién ganó el Balón de Oro en 2018?')
    await expect(page.getByTestId('detalle-puntos')).toContainText('80 pts')
    await expect(page.getByTestId('detalle-pistas')).toContainText('0/3')
    await expect(page.getByTestId('detalle-tiempo')).toContainText('20s')
    await expect(page.getByTestId('detalle-completado')).toContainText('1.240 usuarios')
    await page.getByTestId('detalle-comenzar').click()
    await expect(page).toHaveURL(/\/jugar$/)
  })

  test('un reto ya hecho avisa de que el reintento no puntúa', async ({ page }, info) => {
    await page.goto('/retos')
    await jugar(page, 'balon-oro-2018')
    // "Atrás" desde el resultado vuelve al detalle del reto
    await page.goBack()
    await expect(page.getByTestId('detalle-comenzar')).toHaveText('Reintentar jugada')
    await expect(page.getByTestId('detalle-aviso')).toContainText('no suma puntos')
    await irARetos(page, info.project.name)
  })

  test('un reto de respuesta libre todavía no se puede jugar', async ({ page }) => {
    await page.goto('/retos/mundiales-90s')
    await expect(page.getByTestId('detalle-comenzar')).toBeDisabled()
    await expect(page.getByTestId('detalle-aviso')).toContainText('disponibles pronto')
  })

  test('avisa si el reto no existe', async ({ page }) => {
    await page.goto('/retos/no-existe')
    await expect(page.getByTestId('vacio-tarjeta')).toContainText('No encontramos este reto.')
    await page.getByTestId('vacio-accion').click()
    await expect(page).toHaveURL(/\/retos$/)
  })
})

test.describe('En curso', () => {
  test('separa los retos en curso de los que se pueden descubrir', async ({ page }) => {
    await page.goto('/retos/en-curso')
    const enCurso = page.getByRole('region', { name: 'En curso' })
    await expect(enCurso.getByRole('article')).toHaveCount(2)
    await expect(enCurso).toContainText('Mundiales 90s')
    await expect(page.getByTestId('en-curso-accion-mundiales-90s')).toContainText('Jugar')
    await expect(page.getByTestId('en-curso-accion-leyendas-madrid')).toContainText('Seguir')
    await expect(page.getByRole('region', { name: 'Descubrir' }).getByRole('article')).toHaveCount(1)
    await expect(page.getByTestId('en-curso-accion-estrellas-italianas')).toContainText('Empezar')
  })

  test('cada acción abre el detalle del reto', async ({ page }) => {
    await page.goto('/retos/en-curso')
    await page.getByTestId('en-curso-accion-leyendas-madrid').click()
    await expect(page).toHaveURL(/\/retos\/leyendas-madrid$/)
    await expect(page.getByTestId('detalle-competicion')).toHaveText('LaLiga')
  })
})

const PANTALLAS: Array<[nombre: string, ruta: string, listo: string]> = [
  ['retos', '/retos', 'retos-unirse-balon-oro-2018'],
  ['retos-filtro', '/retos?liga=todas', 'retos-filtro-todas'],
  ['reto-detalle', '/retos/balon-oro-2018', 'detalle-comenzar'],
  ['en-curso', '/retos/en-curso', 'en-curso-accion-estrellas-italianas'],
]

test.describe('Retos · accesibilidad', () => {
  for (const [nombre, ruta, listo] of PANTALLAS) {
    test(nombre, async ({ page }) => {
      await page.goto(ruta)
      await page.getByTestId(listo).waitFor()
      await expectNoSeriousA11y(page)
    })
  }
})

test.describe('Retos en portátil @portatil', () => {
  const botones: Array<[string, string[]]> = [
    ['/retos', OFICIALES.map((id) => `retos-unirse-${id}`)],
    ['/retos/balon-oro-2018', ['detalle-comenzar']],
    ['/retos/en-curso', ['en-curso-accion-mundiales-90s', 'en-curso-accion-estrellas-italianas']],
  ]
  for (const [ruta, ids] of botones) {
    test(`${ruta}: todo cabe sin scroll y los botones se ven`, async ({ page }) => {
      await page.goto(ruta)
      for (const id of ids) await expect(page.getByTestId(id)).toBeInViewport({ ratio: 1 })
      const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
})

test.describe('Retos en portátil @portatil · tarjetas', () => {
  test('ningún contenido se sale de su tarjeta', async ({ page }) => {
    await page.goto('/retos')
    await page.getByTestId('retos-unirse-balon-oro-2018').waitFor()
    await page.evaluate(() => document.fonts.ready)
    for (const id of OFICIALES) {
      const tarjeta = (await page.getByTestId(`retos-tarjeta-${id}`).boundingBox())!
      const etiqueta = (await page.getByTestId(`retos-tarjeta-${id}`).getByTestId(/tag-dificultad/).boundingBox())!
      expect(etiqueta.x + etiqueta.width).toBeLessThanOrEqual(tarjeta.x + tarjeta.width - 12)
    }
  })
})

test.describe('Retos · visual @visual', () => {
  for (const [nombre, ruta, listo] of PANTALLAS) {
    test(nombre, async ({ page }) => {
      await page.goto(ruta)
      await page.getByTestId(listo).waitFor()
      await expectFullScreen(page, `${nombre}.png`)
    })
  }

  test('retos con uno hecho', async ({ page }, info) => {
    await page.goto('/retos')
    await jugar(page, 'champions-2005', 2)
    await irARetos(page, info.project.name)
    await page.getByTestId('retos-hecho-champions-2005').waitFor()
    await page.mouse.move(0, 0)
    await expectFullScreen(page, 'retos-hecho.png')
  })
})
