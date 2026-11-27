import { expect, test, type Page } from '@playwright/test'
import { abrir } from './helpers'

const RETO = '/retos/champions-2005'

/** Pantalla con flecha y la pantalla a la que sube si se ha entrado directamente en ella. */
const PANTALLAS: Array<[ruta: string, madre: string]> = [
  [RETO, '/retos'],
  [`${RETO}/intro`, RETO],
  ['/retos/en-curso', '/retos'],
  ['/perfil/editar', '/perfil'],
  ['/perfil/logros', '/perfil'],
  ['/perfil/retos', '/perfil'],
  ['/ajustes', '/perfil'],
  ['/ajustes/juego', '/ajustes'],
  ['/ajustes/notificaciones', '/ajustes'],
  ['/ajustes/privacidad', '/ajustes'],
  ['/ajustes/soporte', '/ajustes'],
  ['/ajustes/contrasena', '/ajustes'],
]

const flecha = (page: Page) => page.getByRole('button', { name: 'Volver' })

test.describe('Botón de volver', () => {
  for (const [ruta, madre] of PANTALLAS) {
    test(`${ruta} sube a ${madre} si se entra directamente`, async ({ page }) => {
      await page.goto(ruta)
      await flecha(page).click()
      await expect(page).toHaveURL(new RegExp(`${madre}$`))
    })

    test(`${ruta} vuelve a la pantalla anterior`, async ({ page }) => {
      await page.goto('/ranking')
      await page.getByRole('button', { name: 'Semanal' }).waitFor()
      await abrir(page, ruta)
      await flecha(page).click()
      await expect(page).toHaveURL(/\/ranking$/)
    })
  }

  test('subiendo desde una entrada directa no regresa a la pantalla de la que viene', async ({ page }) => {
    await page.goto('/ajustes/juego')
    await flecha(page).click()
    await expect(page).toHaveURL(/\/ajustes$/)
    await flecha(page).click()
    await expect(page).toHaveURL(/\/perfil$/)
  })

  test('sigue sin salirse de la app si la entrada directa redirige', async ({ page }) => {
    await page.goto(`${RETO}/resultado`)
    await expect(page).toHaveURL(/\/intro$/)
    await flecha(page).click()
    await expect(page).toHaveURL(new RegExp(`${RETO}$`))
  })

  test('sigue sin salirse de la app si cambian los parámetros de una entrada directa', async ({ page }) => {
    await page.goto('/perfil/logros?nuevo=rey-del-gol')
    await page.getByTestId('logro-continuar').click()
    await expect(page).toHaveURL(/\/perfil\/logros$/)
    await flecha(page).click()
    await expect(page).toHaveURL(/\/perfil$/)
  })

  test('sigue sabiendo volver después de recargar', async ({ page }) => {
    await page.goto('/perfil')
    await page.getByTestId('perfil-menu-logros').click()
    await expect(page).toHaveURL(/\/perfil\/logros$/)
    await page.reload()
    await flecha(page).click()
    await expect(page).toHaveURL(/\/perfil$/)
  })

  test('se usa con el teclado', async ({ page }) => {
    await page.goto('/ajustes')
    await flecha(page).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/perfil$/)
  })

  for (const ruta of ['/inicio', '/retos', '/ranking', '/perfil', `${RETO}/jugar`]) {
    test(`${ruta} no lleva flecha`, async ({ page }) => {
      await page.goto(ruta)
      await page.locator('#root > :not(template)').first().waitFor()
      await page.waitForLoadState('networkidle')
      await expect(flecha(page)).toHaveCount(0)
    })
  }
})
