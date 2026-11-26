import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectFullScreen } from './helpers'

const nueva = (page: Page) => page.getByTestId('nueva-contrasena')
const confirmar = (page: Page) => page.getByTestId('nueva-confirmar')
const guardar = (page: Page) => page.getByTestId('nueva-guardar')

async function entrar(page: Page) {
  await page.goto('/nueva-contrasena')
  await nueva(page).waitFor()
}

async function expectNoSeriousA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([])
}

test.describe('Contraseña nueva', () => {
  test('el botón se activa cuando se cumplen los requisitos y coinciden', async ({ page }) => {
    await entrar(page)
    const cumplidos = page.getByTestId('nueva-reglas').locator('[data-cumple="true"]')
    await expect(guardar(page)).toBeDisabled()

    await nueva(page).fill('corta1')
    await expect(cumplidos).toHaveCount(1)
    await nueva(page).fill('Valida123!')
    await expect(cumplidos).toHaveCount(3)
    await expect(guardar(page)).toBeDisabled()

    await confirmar(page).fill('Valida123!')
    await expect(guardar(page)).toBeEnabled()
  })

  test('avisa si no coinciden', async ({ page }) => {
    await entrar(page)
    await nueva(page).fill('Valida123!')
    await confirmar(page).fill('Valida124!')
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible()
    await expect(guardar(page)).toBeDisabled()
  })

  test('al guardar lo confirma y lleva a Entrar', async ({ page }) => {
    await entrar(page)
    await nueva(page).fill('Valida123!')
    await confirmar(page).fill('Valida123!')
    await guardar(page).click()
    await expect(page.getByTestId('nueva-aviso')).toHaveText('Contraseña actualizada.')
    await expect(nueva(page)).toHaveCount(0)

    await page.getByTestId('nueva-entrar').click()
    await expect(page).toHaveURL(/\/entrar$/)
  })

  test('con el enlace caducado ofrece pedir otro', async ({ page }) => {
    await page.goto('/nueva-contrasena?enlace=caducado')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Enlace caducado')
    await expect(nueva(page)).toHaveCount(0)
    await page.getByTestId('nueva-pedir-otro').click()
    await expect(page).toHaveURL(/\/recuperar$/)
  })

  test('sin errores de accesibilidad graves en el formulario', async ({ page }) => {
    await entrar(page)
    await nueva(page).fill('Valida123!')
    await confirmar(page).fill('otra')
    await page.getByTestId('nueva-confirmar').blur()
    await expectNoSeriousA11y(page)
  })

  test('sin errores de accesibilidad graves con el enlace caducado', async ({ page }) => {
    await page.goto('/nueva-contrasena?enlace=caducado')
    await page.getByTestId('nueva-pedir-otro').waitFor()
    await expectNoSeriousA11y(page)
  })
})

test.describe('Contraseña nueva en portátil @portatil', () => {
  test('el formulario y el botón se ven sin scroll', async ({ page }) => {
    await entrar(page)
    for (const campo of [nueva(page), confirmar(page), guardar(page)]) await expect(campo).toBeInViewport({ ratio: 1 })
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0)
  })
})

test.describe('Contraseña nueva · visual @visual', () => {
  test('formulario', async ({ page }) => {
    await entrar(page)
    await expectFullScreen(page, 'nueva-contrasena.png')
  })

  test('enlace caducado', async ({ page }) => {
    await page.goto('/nueva-contrasena?enlace=caducado')
    await page.getByTestId('nueva-pedir-otro').waitFor()
    await expectFullScreen(page, 'nueva-contrasena-caducada.png')
  })
})
