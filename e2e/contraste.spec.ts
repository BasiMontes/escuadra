import { expect, test, type Page } from '@playwright/test'

/** `axe` no revisa el texto de ejemplo de los campos, así que se mide aquí (WCAG 1.4.3). */
async function ejemplosIlegibles(page: Page) {
  const campos = page.locator('input[placeholder], textarea[placeholder]')
  await campos.first().waitFor()
  return campos.evaluateAll((elements) => {
    const canales = (color: string) => color.match(/[\d.]+/g)!.map(Number)
    const luminancia = ([r, g, b]: number[]) =>
      [r, g, b]
        .map((v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4))
        .reduce((total, v, i) => total + v * [0.2126, 0.7152, 0.0722][i], 0)
    const fondo = (element: Element) => {
      for (let node: Element | null = element; node; node = node.parentElement) {
        const color = canales(getComputedStyle(node).backgroundColor)
        if ((color[3] ?? 1) === 1) return color
      }
      return [255, 255, 255]
    }
    return elements.flatMap((element) => {
      const texto = luminancia(canales(getComputedStyle(element, '::placeholder').color))
      const base = luminancia(fondo(element))
      const contraste = (Math.max(texto, base) + 0.05) / (Math.min(texto, base) + 0.05)
      return contraste < 4.5 ? [`${element.getAttribute('placeholder')}: ${contraste.toFixed(2)}`] : []
    })
  })
}

test.describe('Texto de ejemplo de los campos', () => {
  for (const ruta of ['/registro', '/entrar', '/recuperar', '/nueva-contrasena', '/crear/1', '/ajustes/contrasena', '/ajustes/soporte']) {
    test(`se lee en ${ruta}`, async ({ page }) => {
      await page.goto(ruta)
      expect(await ejemplosIlegibles(page)).toEqual([])
    })
  }

  test('se lee en el paso de pistas de crear reto', async ({ page }) => {
    await page.goto('/crear/1')
    await page.getByTestId('crear-titulo').fill('Mundiales 90s')
    await page.getByTestId('crear-descripcion').fill('¿Qué selección ganó el Mundial de 1998?')
    await page.getByTestId('crear-siguiente').click()
    await expect(page.getByTestId('crear-paso')).toHaveText('Paso 2 de 4')
    await page.getByTestId('crear-siguiente').click()
    await expect(page.getByTestId('crear-paso')).toHaveText('Paso 3 de 4')
    expect(await ejemplosIlegibles(page)).toEqual([])
  })
})
