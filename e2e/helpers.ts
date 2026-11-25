import { expect, type Page } from '@playwright/test'

/**
 * Captura la pantalla completa como la verá el usuario al hacer scroll:
 * amplía la ventana a la altura del documento para que la navegación fija
 * quede al final, igual que en el PDF del diseño.
 */
export async function expectFullScreen(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready)
  const viewport = page.viewportSize()!
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.setViewportSize({ width: viewport.width, height: Math.max(height, viewport.height) })
  await expect(page).toHaveScreenshot(name)
  await page.setViewportSize(viewport)
}
