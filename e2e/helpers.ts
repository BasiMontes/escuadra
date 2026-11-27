import { expect, type Page } from '@playwright/test'

/** Alertas de la pantalla, sin el anunciador de rutas de Next, que también tiene `role="alert"`. */
export function alerta(page: Page) {
  return page.getByRole('alert').and(page.locator(':not(#__next-route-announcer__)'))
}

/** Navega sin recargar, para conservar los datos en memoria. */
export function abrir(page: Page, ruta: string) {
  return page.evaluate((r) => (window as unknown as { next: { router: { push: (url: string) => void } } }).next.router.push(r), ruta)
}

/** Abre un desplegable y elige la opción por su texto. */
export async function elegir(page: Page, testId: string, opcion: string) {
  await page.getByTestId(testId).click()
  await page.getByRole('option', { name: opcion, exact: true }).click()
  await expect(page.getByTestId(testId)).toHaveText(opcion)
}

/**
 * Captura la pantalla completa como la verá el usuario al hacer scroll:
 * amplía la ventana a la altura del documento para que la navegación fija
 * quede al final, igual que en el PDF del diseño.
 */
export async function expectFullScreen(page: Page, name: string) {
  // La app se monta solo en cliente: antes de montar, `#root` solo tiene el `<template>` de Next
  await page.locator('#root > :not(template)').first().waitFor()
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  const viewport = page.viewportSize()!
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.setViewportSize({ width: viewport.width, height: Math.max(height, viewport.height) })
  await expect(page).toHaveScreenshot(name)
  await page.setViewportSize(viewport)
}
