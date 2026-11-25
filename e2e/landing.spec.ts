import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectFullScreen } from './helpers'

async function expectNoSeriousA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

test.describe('Landing', () => {
  test('presenta el producto', async ({ page }) => {
    await page.goto('/bienvenida')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Un reto al día. ¿Cuánto sabes de fútbol?')
    for (const titulo of ['Tres pasos y a jugar', 'Más que una trivia', 'Tu liga, tus retos', 'Escala hasta el top']) {
      await expect(page.getByRole('heading', { name: titulo })).toBeVisible()
    }
    await expect(page.getByTestId('landing-faq-1')).toContainText('Sí, puedes empezar a jugar gratis')
  })

  test('el ejemplo muestra tres opciones en móvil y cuatro en desktop', async ({ page }, info) => {
    await page.goto('/bienvenida')
    const ejemplo = page.getByRole('figure', { name: 'Ejemplo de pregunta' })
    await expect(ejemplo.getByRole('listitem')).toHaveCount(info.project.name === 'movil' ? 3 : 4)
  })

  for (const [boton, destino] of [
    ['landing-registro', /\/registro$/],
    ['landing-final-registro', /\/registro$/],
    ['landing-entrar', /\/entrar$/],
    ['landing-privacidad', /\/privacidad$/],
    ['landing-terminos', /\/terminos$/],
    ['landing-contacto', /\/ajustes\/soporte$/],
  ] as const) {
    test(`${boton} lleva a su destino`, async ({ page }) => {
      await page.goto('/bienvenida')
      await page.getByTestId(boton).click()
      await expect(page).toHaveURL(destino)
    })
  }

  test('"Cómo funciona" baja a su sección', async ({ page }) => {
    await page.goto('/bienvenida')
    await page.getByTestId('landing-como-funciona').click()
    await expect(page.getByRole('heading', { name: 'Tres pasos y a jugar' })).toBeInViewport()
  })

  test('la navegación y los botones propios de desktop', async ({ page }, info) => {
    await page.goto('/bienvenida')
    if (info.project.name === 'movil') {
      await expect(page.getByTestId('landing-nav-faq')).toBeHidden()
      await expect(page.getByTestId('landing-ver-ranking')).toBeHidden()
      return
    }
    await page.getByTestId('landing-nav-faq').click()
    await expect(page.getByRole('heading', { name: 'Preguntas frecuentes' })).toBeInViewport()
    await page.getByTestId('landing-ver-ranking').click()
    await expect(page).toHaveURL(/\/ranking$/)
  })

  test('las páginas legales avisan de que están en preparación', async ({ page }) => {
    await page.goto('/terminos')
    await expect(page.getByTestId('legal-pendiente')).toBeVisible()
    await expectNoSeriousA11y(page)
    await page.getByTestId('legal-volver').click()
    await expect(page).toHaveURL(/\/bienvenida$/)
  })

  test('accesibilidad', async ({ page }) => {
    await page.goto('/bienvenida')
    await expectNoSeriousA11y(page)
  })

  test('no hay scroll horizontal', async ({ page }) => {
    await page.goto('/bienvenida')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  })
})

test.describe('Página no encontrada', () => {
  for (const ruta of ['/no-existe', '/retos/x/y/z', '/ajustes/nada']) {
    test(ruta, async ({ page }) => {
      await page.goto(ruta)
      await expect(page.getByTestId('vacio-tarjeta')).toContainText('No encontramos esta página.')
      await page.getByTestId('vacio-accion').click()
      await expect(page).toHaveURL(/\/inicio$/)
    })
  }
})

test.describe('Landing en portátil @portatil', () => {
  test('el botón principal se ve sin scroll', async ({ page }) => {
    await page.goto('/bienvenida')
    await expect(page.getByTestId('landing-registro')).toBeInViewport({ ratio: 1 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  })
})

test.describe('Landing · visual @visual', () => {
  test('portada', async ({ page }) => {
    await page.goto('/bienvenida')
    await expectFullScreen(page, 'landing.png')
  })
})
