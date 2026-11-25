import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectFullScreen } from './helpers'

/** Reto de la comunidad: base 80, fácil, respuesta "Francia". */
const RETO = '/retos/mundiales-90s'

/** Entra desde el detalle con el reloj controlado y detenido en el segundo 0. */
async function empezar(page: Page) {
  await page.clock.install({ time: new Date('2026-03-03T10:00:00Z') })
  await page.goto(RETO)
  await page.getByTestId('detalle-comenzar').waitFor()
  await page.clock.pauseAt(new Date('2026-03-03T10:01:00Z'))
  await page.getByTestId('detalle-comenzar').click()
  await expect(page.getByTestId('reto-tiempo')).toHaveText('20s')
}

async function responder(page: Page, texto: string) {
  await page.getByTestId('reto-respuesta').fill(texto)
  await page.getByTestId('reto-responder').click()
  await page.clock.runFor(700)
  await expect(page).toHaveURL(/\/resultado$/)
}

test.describe('Respuesta libre', () => {
  test('muestra un campo en lugar de opciones', async ({ page }) => {
    await empezar(page)
    await expect(page.getByLabel('Tu respuesta')).toBeVisible()
    await expect(page.getByTestId('reto-opcion-a')).toHaveCount(0)
  })

  test('acierta sin importar mayúsculas ni espacios', async ({ page }) => {
    await empezar(page)
    await page.clock.runFor(5000)
    await responder(page, '  FRANCIA ')
    await expect(page.getByTestId('resultado-titulo')).toHaveText('¡Correcto!')
    await expect(page.getByTestId('resultado-respuesta')).toHaveText('Francia')
    await expect(page.getByTestId('resultado-puntos')).toHaveText('+60')
  })

  test('un reto de la comunidad no suma racha', async ({ page }, info) => {
    test.skip(info.project.name === 'movil', 'La racha de la cabecera solo está en desktop')
    await empezar(page)
    await responder(page, 'Francia')
    await expect(page.getByTestId('topbar-racha')).toContainText('Racha 0')
  })

  test('se envía con Enter y puede fallar', async ({ page }) => {
    await empezar(page)
    await page.getByTestId('reto-respuesta').fill('Brasil')
    await page.keyboard.press('Enter')
    await page.clock.runFor(700)
    await expect(page.getByTestId('resultado-titulo')).toHaveText('¡Incorrecto!')
    await expect(page.getByTestId('resultado-respuesta')).toContainText('Francia')
  })

  test('no envía una respuesta vacía', async ({ page }) => {
    await empezar(page)
    await page.getByTestId('reto-responder').click()
    await expect(page.getByText('Escribe una respuesta con letras o números.')).toBeVisible()
    await expect(page).toHaveURL(/\/jugar$/)
  })

  test('lo escrito sin enviar no cuenta al agotarse el tiempo', async ({ page }) => {
    await empezar(page)
    await page.getByTestId('reto-respuesta').fill('Francia')
    await page.clock.runFor(20_500)
    await expect(page.getByTestId('resultado-titulo')).toHaveText('¡Se acabó el tiempo!')
  })

  test('sin errores de accesibilidad graves, también con el error visible', async ({ page }) => {
    await page.goto(`${RETO}/jugar`)
    await page.getByTestId('reto-responder').click()
    await page.getByRole('alert').waitFor()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([])
  })
})

test.describe('Respuesta libre en portátil @portatil', () => {
  test('el campo y el botón se ven sin scroll', async ({ page }) => {
    await page.goto(`${RETO}/jugar`)
    for (const id of ['reto-pregunta', 'reto-respuesta', 'reto-responder']) {
      await expect(page.getByTestId(id)).toBeInViewport({ ratio: 1 })
    }
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0)
  })
})

test.describe('Respuesta libre · visual @visual', () => {
  test('reto en juego', async ({ page }) => {
    await empezar(page)
    await expectFullScreen(page, 'reto-libre.png')
  })
})
