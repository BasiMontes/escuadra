import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectFullScreen } from './helpers'

/** Reto de las capturas del diseño: Balón de Oro 2018 (80 puntos base, fácil). */
const RETO = '/retos/balon-oro-2018'
const CORRECTA = 'reto-opcion-a'
const INCORRECTA = 'reto-opcion-c'

async function expectNoSeriousA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

/** Entra en el reto con el reloj controlado y detenido en el segundo 0. */
async function empezar(page: Page) {
  await page.clock.install({ time: new Date('2026-03-03T10:00:00Z') })
  await page.goto(`${RETO}/intro`)
  await page.getByTestId('reto-intro-comenzar').waitFor()
  await page.clock.pauseAt(new Date('2026-03-03T10:01:00Z'))
  await page.getByTestId('reto-intro-comenzar').click()
  await expect(page.getByTestId('reto-tiempo')).toHaveText('20s')
}

/** Pulsa una opción y deja pasar la pausa previa al resultado. */
async function responder(page: Page, opcion: string) {
  await page.getByTestId(opcion).click()
  await expect(page.getByTestId(opcion)).toHaveAttribute('aria-pressed', 'true')
  await page.clock.runFor(700)
  await expect(page).toHaveURL(/\/resultado$/)
}

test.describe('Reto del día', () => {
  test('presenta el reto y lleva a jugar', async ({ page }) => {
    await page.goto(`${RETO}/intro`)
    await expect(page.getByTestId('reto-intro-puntos')).toHaveText('80')
    await expect(page.getByTestId('reto-intro-dificultad')).toHaveText('Fácil')
    await expect(page.getByTestId('reto-intro-completado')).toContainText('1.240 usuarios')
    await page.getByTestId('reto-intro-comenzar').click()
    await expect(page).toHaveURL(/\/jugar$/)
    await expect(page.getByTestId('reto-pregunta')).toHaveText('¿Quién ganó el Balón de Oro en 2018?')
  })

  test('avisa si el reto no existe', async ({ page }) => {
    await page.goto('/retos/no-existe/intro')
    await expect(page.getByTestId('vacio-tarjeta')).toContainText('No encontramos este reto.')
    await page.goto('/retos/no-existe/jugar')
    await expect(page.getByTestId('vacio-tarjeta')).toContainText('Este reto no está disponible.')
  })
})

test.describe('Reto en juego', () => {
  test('muestra el tiempo real aunque el temporizador arranque tarde', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Retrasar MessageChannel bloquea el control de Playwright en WebKit')
    // React ejecuta sus efectos en una tarea de MessageChannel: se retrasa para provocar la carrera
    await page.addInitScript(() => {
      const later = window.setTimeout.bind(window)
      const original = MessagePort.prototype.postMessage as (this: MessagePort, ...args: unknown[]) => void
      MessagePort.prototype.postMessage = function (this: MessagePort, ...args: unknown[]) {
        later(() => original.apply(this, args), 400)
      } as MessagePort['postMessage']
    })
    await page.clock.install({ time: new Date('2026-03-03T10:00:00Z') })
    await page.goto(`${RETO}/intro`)
    await page.getByTestId('reto-intro-comenzar').waitFor()
    await page.clock.pauseAt(new Date('2026-03-03T10:01:00Z'))
    await page.getByTestId('reto-intro-comenzar').click()
    await page.clock.runFor(500)
    await page.getByTestId('reto-tiempo').waitFor()
    await page.clock.runFor(8000)
    // El intento empezó en uno de los dos primeros segundos del reloj simulado
    await expect(page.getByTestId('reto-tiempo')).toHaveText(/^(11|12)s$/)
  })

  test('cuenta atrás desde 20 segundos', async ({ page }) => {
    await empezar(page)
    await page.clock.runFor(8000)
    await expect(page.getByTestId('reto-tiempo')).toHaveText('12s')
    await expect(page.getByRole('progressbar', { name: 'Tiempo restante' })).toHaveAttribute('aria-valuenow', '60')
  })

  test('acierto con una pista: el ejemplo del diseño suma 30 puntos', async ({ page }) => {
    await empezar(page)
    await page.getByTestId('pistas-revelar').click()
    await expect(page.getByTestId('pistas-revelada-1')).toHaveText('Ha jugado en el Real Madrid.')
    await page.clock.runFor(5000)
    await responder(page, CORRECTA)

    await expect(page.getByTestId('resultado-titulo')).toHaveText('¡Correcto!')
    await expect(page.getByTestId('resultado-titulo')).toBeFocused()
    await expect(page.getByTestId('resultado-respuesta')).toHaveText('Luka Modrić')
    await expect(page.getByTestId('resultado-puntos')).toHaveText('+30')
    await expect(page.getByTestId('resultado-pistas')).toHaveText('1')
    await expect(page.getByTestId('resultado-tiempo')).toHaveText('5s')
    await expect(page.getByTestId('pistas-revelada-1')).toBeVisible()
    await expect(page.getByTestId('pistas-revelar')).toHaveCount(0)
  })

  test('siguiente reto lleva a otro reto sin jugar', async ({ page }) => {
    await empezar(page)
    await responder(page, CORRECTA)
    await page.getByTestId('resultado-siguiente').click()
    await expect(page).toHaveURL(/\/retos\/champions-2005\/intro$/)
  })

  test('fallo: 0 puntos, respuesta correcta y reintento sin puntuar', async ({ page }) => {
    await empezar(page)
    await page.clock.runFor(10400)
    await responder(page, INCORRECTA)

    await expect(page.getByTestId('resultado-titulo')).toHaveText('¡Incorrecto!')
    await expect(page.getByTestId('resultado-respuesta')).toContainText('Luka Modrić')
    await expect(page.getByTestId('resultado-puntos')).toHaveText('0 pts')
    await expect(page.getByTestId('resultado-tiempo')).toHaveText('10,4s')
    // El aviso de "no suma al ranking" es solo de los retos de la comunidad
    await expect(page.getByTestId('resultado-sin-ranking')).toHaveCount(0)

    await page.getByTestId('resultado-reintentar').click()
    await expect(page.getByTestId('reto-tiempo')).toHaveText('20s')
    await responder(page, CORRECTA)
    await expect(page.getByTestId('resultado-puntos')).toHaveText('+0')
    await expect(page.getByTestId('resultado-reintento')).toBeVisible()
  })

  test('tiempo agotado', async ({ page }) => {
    await empezar(page)
    await page.clock.runFor(20_500)
    await expect(page).toHaveURL(/\/resultado$/)
    await expect(page.getByTestId('resultado-titulo')).toHaveText('¡Se acabó el tiempo!')
    await expect(page.getByTestId('resultado-puntos')).toHaveText('0 pts')
    await expect(page.getByTestId('resultado-tiempo')).toHaveText('20s')
  })

  test('el saldo de pistas baja y limita los huecos', async ({ page }, info) => {
    await empezar(page)
    await page.getByTestId('pistas-revelar').click()
    if (info.project.name !== 'movil') await expect(page.getByTestId('topbar-pistas')).toContainText('Pistas 1')
    await page.getByTestId('pistas-revelar').click()
    await expect(page.getByTestId('pistas-revelada-2')).toBeVisible()
    await expect(page.getByTestId('pistas-revelar')).toHaveCount(0)
  })

  test('salir y volver no reinicia el reloj ni las pistas', async ({ page }) => {
    await empezar(page)
    await page.getByTestId('pistas-revelar').click()
    await expect(page.getByTestId('pistas-revelada-1')).toBeVisible()
    await page.clock.runFor(6000)
    await page.goBack()
    await page.getByTestId('reto-intro-comenzar').click()
    await expect(page.getByTestId('reto-tiempo')).toHaveText('14s')
    await expect(page.getByTestId('pistas-revelada-1')).toBeVisible()
  })

  test('volver atrás desde el resultado no repite la partida', async ({ page }) => {
    await empezar(page)
    await responder(page, CORRECTA)
    await page.goBack()
    await expect(page).toHaveURL(/\/intro$/)
  })

  test('se puede jugar con el teclado', async ({ page }) => {
    await empezar(page)
    await page.getByTestId(CORRECTA).focus()
    await page.keyboard.press('Enter')
    await page.clock.runFor(700)
    await expect(page.getByTestId('resultado-titulo')).toHaveText('¡Correcto!')
  })

  test('el resultado sin partida vuelve a la presentación', async ({ page }) => {
    await page.goto(`${RETO}/resultado`)
    await expect(page).toHaveURL(/\/intro$/)
  })
})

test.describe('Juego · accesibilidad', () => {
  test('presentación', async ({ page }) => {
    await page.goto(`${RETO}/intro`)
    await page.getByTestId('reto-intro-comenzar').waitFor()
    await expectNoSeriousA11y(page)
  })

  // axe usa temporizadores, así que estas pruebas van con el reloj real
  test('reto en juego', async ({ page }) => {
    await page.goto(`${RETO}/jugar`)
    await page.getByTestId('pistas-revelar').click()
    await page.getByTestId('pistas-revelada-1').waitFor()
    await expectNoSeriousA11y(page)
  })

  for (const [nombre, opcion] of [
    ['correcto', CORRECTA],
    ['incorrecto', INCORRECTA],
  ]) {
    test(`resultado ${nombre}`, async ({ page }) => {
      await page.goto(`${RETO}/jugar`)
      await page.getByTestId(opcion).click()
      await page.getByTestId('resultado-titulo').waitFor()
      await expectNoSeriousA11y(page)
    })
  }
})

test.describe('Juego en portátil @portatil', () => {
  async function expectSinScroll(page: Page, testIds: string[]) {
    for (const id of testIds) await expect(page.getByTestId(id)).toBeInViewport({ ratio: 1 })
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
    expect(overflow).toBeLessThanOrEqual(0)
  }

  test('presentación: todo cabe sin scroll', async ({ page }) => {
    await page.goto(`${RETO}/intro`)
    await expectSinScroll(page, ['reto-intro-comenzar'])
  })

  test('reto: pregunta, opciones y pistas caben sin scroll', async ({ page }) => {
    await empezar(page)
    await page.getByTestId('pistas-revelar').click()
    await page.getByTestId('pistas-revelada-1').waitFor()
    await expectSinScroll(page, ['reto-tiempo', 'reto-pregunta', 'reto-opcion-a', 'reto-opcion-d', 'pistas-panel'])
  })

  test('correcto: los botones se ven sin scroll', async ({ page }) => {
    await empezar(page)
    await responder(page, CORRECTA)
    await expectSinScroll(page, ['resultado-siguiente', 'resultado-otros-retos'])
  })

  test('incorrecto: los botones se ven sin scroll', async ({ page }) => {
    await empezar(page)
    await responder(page, INCORRECTA)
    await expectSinScroll(page, ['resultado-otros-retos', 'resultado-reintentar'])
  })
})

test.describe('Juego · visual @visual', () => {
  test('presentación', async ({ page }) => {
    await page.goto(`${RETO}/intro`)
    await page.getByTestId('reto-intro-comenzar').waitFor()
    await expectFullScreen(page, 'reto-intro.png')
  })

  test('reto a 12 segundos y opción elegida a 5', async ({ page }) => {
    await empezar(page)
    await page.getByTestId('pistas-revelar').click()
    await page.getByTestId('pistas-revelada-1').waitFor()
    await page.clock.runFor(8000)
    await expect(page.getByTestId('reto-tiempo')).toHaveText('12s')
    // El ratón se aparta para que ninguna opción salga resaltada
    await page.mouse.move(0, 0)
    await expectFullScreen(page, 'reto-jugar.png')
    await page.clock.runFor(7000)
    await page.getByTestId(CORRECTA).click()
    await expectFullScreen(page, 'reto-jugar-elegida.png')
  })

  test('correcto', async ({ page }) => {
    await empezar(page)
    await page.getByTestId('pistas-revelar').click()
    await page.getByTestId('pistas-revelada-1').waitFor()
    await page.clock.runFor(5000)
    await responder(page, CORRECTA)
    await page.getByTestId('resultado-titulo').waitFor()
    await expectFullScreen(page, 'resultado-correcto.png')
  })

  test('incorrecto', async ({ page }) => {
    await empezar(page)
    await page.clock.runFor(10400)
    await responder(page, INCORRECTA)
    await page.getByTestId('resultado-titulo').waitFor()
    await expectFullScreen(page, 'resultado-incorrecto.png')
  })

  test('tiempo agotado', async ({ page }) => {
    await empezar(page)
    await page.clock.runFor(20_500)
    await page.getByTestId('resultado-titulo').waitFor()
    await expectFullScreen(page, 'resultado-tiempo-agotado.png')
  })
})
