import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { expectFullScreen } from './helpers'

test.describe('Home', () => {
  test('muestra saludo, reto oficial y accesos', async ({ page }) => {
    await page.goto('/inicio')
    await expect(page.getByTestId('home-saludo')).toContainText('BasiMontes')
    await expect(page.getByTestId('home-reto-oficial')).toContainText('Reto oficial del día')
    await expect(page.getByTestId('home-comenzar-reto')).toBeVisible()
    await expect(page.getByTestId('home-crear-reto')).toBeVisible()
  })

  test('navegación según el tamaño de pantalla', async ({ page }, info) => {
    await page.goto('/inicio')
    if (info.project.name === 'movil') {
      await expect(page.getByTestId('nav-inicio')).toHaveAttribute('aria-current', 'page')
      await expect(page.getByTestId('sidebar-inicio')).toBeHidden()
    } else {
      await expect(page.getByTestId('sidebar-inicio')).toHaveAttribute('aria-current', 'page')
      await expect(page.getByTestId('nav-inicio')).toBeHidden()
      await expect(page.getByTestId('topbar-racha')).toContainText('Racha 0')
    }
  })

  test('sin errores de accesibilidad graves', async ({ page }) => {
    await page.goto('/inicio')
    await page.getByTestId('home-saludo').waitFor()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })

  test('aspecto visual @visual', async ({ page }) => {
    await page.goto('/inicio')
    await page.getByTestId('home-saludo').waitFor()
    await expectFullScreen(page, 'home.png')
  })
})
