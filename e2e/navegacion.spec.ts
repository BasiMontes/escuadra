import { expect, test, type Page } from '@playwright/test'

const scrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY))

test.describe('Navegación', () => {
  test.beforeEach(async ({ page }) => {
    // Ventana baja para que haya scroll también en desktop
    await page.setViewportSize({ width: page.viewportSize()!.width, height: 500 })
  })

  test('cada pantalla nueva empieza arriba', async ({ page }) => {
    await page.goto('/crear/1')
    await page.getByTestId('crear-titulo').fill('Mundiales 90s')
    await page.getByTestId('crear-descripcion').fill('¿Qué selección ganó el Mundial de 1998?')
    await page.getByTestId('crear-siguiente').scrollIntoViewIfNeeded()
    expect(await scrollY(page)).toBeGreaterThan(0)

    await page.getByTestId('crear-siguiente').click()
    await expect(page.getByTestId('crear-paso')).toHaveText('Paso 2 de 4')
    await expect.poll(() => scrollY(page)).toBe(0)
  })
})
