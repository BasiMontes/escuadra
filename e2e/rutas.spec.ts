import { expect, test } from '@playwright/test'
import { abrir } from './helpers'

const RETO = '/retos/balon-oro-2018'

const RUTAS = [
  '/', '/registro', '/entrar', '/recuperar', '/nueva-contrasena',
  '/onboarding/competiciones', '/onboarding/configuracion', '/onboarding/resumen',
  '/inicio', '/componentes', '/retos', '/retos/en-curso', RETO, `${RETO}/intro`, `${RETO}/jugar`,
  '/ranking', '/ranking?tipo=global', '/perfil', '/perfil/editar', '/perfil/logros', '/perfil/retos',
  '/ajustes', '/ajustes/juego', '/ajustes/notificaciones', '/ajustes/privacidad', '/ajustes/soporte', '/ajustes/contrasena',
  '/bienvenida', '/privacidad', '/terminos', '/crear/1', '/no-existe',
]

test.describe('Rutas', () => {
  for (const ruta of RUTAS) {
    test(`${ruta} carga sin errores de consola`, async ({ page }) => {
      const errores: string[] = []
      page.on('pageerror', (e) => errores.push(e.message))
      page.on('console', (m) => {
        // El navegador anota el 404 de la propia página, que es la respuesta correcta
        if (m.type() === 'error' && !(ruta === '/no-existe' && m.text().includes('404'))) errores.push(m.text())
      })
      await page.goto(ruta)
      await page.locator('#root > :not(template)').first().waitFor()
      await page.waitForLoadState('networkidle')
      expect(errores).toEqual([])
    })
  }

  for (const [entrada, destino] of [
    ['/onboarding', '/onboarding/competiciones'],
    ['/crear', '/crear/1'],
    ['/crear/9', '/crear/1'],
  ]) {
    test(`${entrada} lleva a ${destino} y atrás no vuelve a pasar por ella`, async ({ page }) => {
      await page.goto('/inicio')
      await page.getByTestId('home-saludo').waitFor()
      await abrir(page, entrada)
      await expect(page).toHaveURL(new RegExp(`${destino}$`))
      await page.goBack()
      await expect(page).toHaveURL(/\/inicio$/)
    })
  }

  test('una dirección desconocida muestra la pantalla de no encontrada', async ({ page }) => {
    await page.goto('/no-existe')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página no encontrada')
  })

  test('el borrador de crear reto se descarta al salir', async ({ page }) => {
    await page.goto('/crear/1')
    await page.getByTestId('crear-titulo').fill('Mundiales 90s')
    await abrir(page, '/inicio')
    await page.getByTestId('home-saludo').waitFor()
    await abrir(page, '/crear/1')
    await expect(page.getByTestId('crear-titulo')).toHaveValue('')
  })

  test('al volver atrás se recupera la posición', async ({ page }) => {
    await page.setViewportSize({ width: page.viewportSize()!.width, height: 500 })
    await page.goto('/bienvenida')
    const enlace = page.getByTestId('landing-privacidad')
    await enlace.waitFor()
    await page.evaluate(() => document.fonts.ready)
    // La posición se anota al pulsar: el propio clic puede desplazar la página para llegar al enlace
    await enlace.evaluate((e) => e.addEventListener('click', () => (document.documentElement.dataset.antes = String(window.scrollY)), { capture: true, once: true }))
    await enlace.click()
    await expect(page).toHaveURL(/\/privacidad$/)
    const antes = Number(await page.locator('html').getAttribute('data-antes'))
    expect(antes).toBeGreaterThan(0)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await page.goBack()
    // El navegador redondea la posición al restaurarla
    await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - antes)).toBeLessThanOrEqual(1)
  })
})
