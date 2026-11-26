import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/** Navega sin recargar, para conservar los datos en memoria. */
const abrir = (page: Page, ruta: string) =>
  page.evaluate((r) => {
    history.pushState({}, '', r)
    dispatchEvent(new PopStateEvent('popstate'))
  }, ruta)

async function expectNoSeriousA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([])
}

const liga = (page: Page, id: string) => page.getByTestId(`preferencias-competicion-${id}`)
const dificultad = (page: Page, id: string) => page.getByTestId(`preferencias-dificultad-${id}`)
const pistas = (page: Page, n: number) => page.getByTestId(`preferencias-pistas-${n}`)
const guardar = (page: Page) => page.getByTestId('preferencias-guardar').click()

async function entrar(page: Page) {
  await page.goto('/ajustes/juego')
  await page.getByTestId('preferencias-guardar').waitFor()
}

/** Sale a Ajustes y vuelve, para leer lo que quedó guardado. */
async function volverAEntrar(page: Page) {
  await abrir(page, '/ajustes')
  await page.getByTestId('ajustes-juego').click()
  await page.getByTestId('preferencias-guardar').waitFor()
}

test.describe('Preferencias de juego', () => {
  test('muestra lo que hay guardado', async ({ page }) => {
    await entrar(page)
    await expect(liga(page, 'laliga')).toBeChecked()
    await expect(liga(page, 'uefa')).toBeChecked()
    await expect(liga(page, 'premier')).not.toBeChecked()
    await expect(dificultad(page, 'medio')).toBeChecked()
    await expect(pistas(page, 2)).toBeChecked()
  })

  test('guarda los cambios, lo confirma y los conserva', async ({ page }) => {
    await entrar(page)
    await liga(page, 'premier').click()
    await liga(page, 'uefa').click()
    await dificultad(page, 'dificil').click()
    await pistas(page, 3).click()
    await guardar(page)
    await expect(page.getByTestId('preferencias-aviso')).toHaveText('Preferencias guardadas.')

    await volverAEntrar(page)
    await expect(liga(page, 'premier')).toBeChecked()
    await expect(liga(page, 'uefa')).not.toBeChecked()
    await expect(dificultad(page, 'dificil')).toBeChecked()
    await expect(pistas(page, 3)).toBeChecked()
  })

  test('la confirmación desaparece al volver a cambiar algo', async ({ page }) => {
    await entrar(page)
    await guardar(page)
    await expect(page.getByTestId('preferencias-aviso')).toHaveText('Preferencias guardadas.')
    await dificultad(page, 'facil').click()
    await expect(page.getByTestId('preferencias-aviso')).toHaveText('')
  })

  test('sin competiciones avisa y no guarda', async ({ page }) => {
    await entrar(page)
    await liga(page, 'laliga').click()
    await liga(page, 'uefa').click()
    await dificultad(page, 'facil').click()
    await guardar(page)
    await expect(page.getByRole('alert')).toHaveText('Elige al menos una competición.')
    await expect(page.getByTestId('preferencias-aviso')).toHaveText('')

    await liga(page, 'seriea').click()
    await expect(page.getByRole('alert')).toHaveCount(0)

    await volverAEntrar(page)
    await expect(liga(page, 'laliga')).toBeChecked()
    await expect(dificultad(page, 'medio')).toBeChecked()
  })

  test('cambiar el límite no devuelve las pistas ya usadas', async ({ page }, info) => {
    test.skip(info.project.name === 'movil', 'El saldo de la cabecera solo está en desktop')
    await page.goto('/retos/balon-oro-2018/jugar')
    await page.getByTestId('pistas-revelar').click()
    await page.getByTestId('pistas-revelada-1').waitFor()

    await abrir(page, '/ajustes/juego')
    await expect(page.getByTestId('topbar-pistas')).toContainText('Pistas 1')

    await pistas(page, 3).click()
    await guardar(page)
    await expect(page.getByTestId('topbar-pistas')).toContainText('Pistas 2')

    await pistas(page, 1).click()
    await guardar(page)
    await expect(page.getByTestId('topbar-pistas')).toContainText('Pistas 0')
  })

  test('sin errores de accesibilidad graves, también con el aviso visible', async ({ page }) => {
    await entrar(page)
    await expectNoSeriousA11y(page)
    await liga(page, 'laliga').click()
    await liga(page, 'uefa').click()
    await guardar(page)
    await page.getByRole('alert').waitFor()
    await expectNoSeriousA11y(page)
  })
})
