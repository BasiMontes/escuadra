import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectFullScreen } from './helpers'

async function expectNoSeriousA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

test.describe('Onboarding', () => {
  test('el splash lleva al registro', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('splash')).toBeVisible()
    await expect(page).toHaveURL(/\/registro$/, { timeout: 4000 })
  })

  test('el logo del splash tiene el tamaño del diseño', async ({ page }, info) => {
    await page.clock.install()
    await page.goto('/')
    const logo = page.getByTestId('splash').locator('[role="img"]')
    const lado = info.project.name === 'desktop' ? 405 : 300
    await expect.poll(async () => (await logo.boundingBox())?.width).toBe(lado)
  })

  test('registro valida los campos', async ({ page }) => {
    await page.goto('/registro')
    await page.getByTestId('registro-continuar').click()
    await expect(page.getByText('Escribe un nombre de usuario.')).toBeVisible()
    await expect(page.getByText('Escribe tu correo electrónico.')).toBeVisible()
    await expect(page.getByText('Escribe una contraseña.')).toBeVisible()

    await page.getByTestId('registro-usuario').fill('ab')
    await page.getByTestId('registro-email').fill('no-es-un-correo')
    await page.getByTestId('registro-contrasena').fill('corta')
    await page.getByTestId('registro-continuar').click()
    await expect(page.getByText('Mínimo 3 caracteres.')).toBeVisible()
    await expect(page.getByText('Ese correo no parece válido.')).toBeVisible()
    await expect(page.getByText('Al menos 8 caracteres.')).toBeVisible()
  })

  test('registro muestra el error del servidor', async ({ page }) => {
    await page.goto('/registro')
    await page.getByTestId('registro-usuario').fill('ocupado')
    await page.getByTestId('registro-email').fill('a@b.com')
    await page.getByTestId('registro-contrasena').fill('Valida123!')
    await page.getByTestId('registro-continuar').click()
    await expect(page.getByTestId('registro-error')).toHaveText('Ese nombre de usuario ya existe.')
  })

  test('flujo completo: registro → competiciones → configuración → resumen → reto', async ({ page }) => {
    await page.goto('/registro')
    await page.getByTestId('registro-usuario').fill('SQUAD_LEADER')
    await page.getByTestId('registro-email').fill('squad@escuadra.app')
    await page.getByTestId('registro-contrasena').fill('Valida123!')
    await page.getByTestId('registro-continuar').click()

    await expect(page).toHaveURL(/\/onboarding\/competiciones$/)
    const continuar = page.locator('[data-testid="competiciones-continuar"]:visible')
    await expect(continuar).toBeDisabled()
    await page.getByTestId('competicion-laliga').click()
    await page.getByTestId('competicion-uefa').click()
    await expect(page.getByTestId('competicion-laliga')).toHaveAttribute('aria-checked', 'true')
    await expect(continuar).toBeEnabled()
    await continuar.click()

    await expect(page).toHaveURL(/\/onboarding\/configuracion$/)
    await expect(page.getByTestId('configuracion-dificultad-medio')).toHaveAttribute('aria-checked', 'true')
    await page.getByTestId('configuracion-dificultad-dificil').click()
    await page.getByTestId('configuracion-pistas-3').click()
    await expect(page.getByTestId('configuracion-dificultad-dificil')).toHaveAttribute('aria-checked', 'true')
    await page.locator('[data-testid="configuracion-ver-resumen"]:visible').click()

    await expect(page).toHaveURL(/\/onboarding\/resumen$/)
    const elecciones = page.getByTestId('resumen-elecciones')
    await expect(elecciones).toContainText('LaLiga')
    await expect(elecciones).toContainText('Champions, UEFA, Conference')
    await expect(elecciones).toContainText('Nivel: Difícil')
    await expect(elecciones).toContainText('3 pistas disponibles')
    await page.getByTestId('resumen-empezar').click()
    await expect(page).toHaveURL(/\/retos\/.+\/intro$/)
  })

  test('login y recuperación de contraseña', async ({ page }) => {
    await page.goto('/registro')
    await page.getByTestId('registro-ir-a-entrar').click()
    await page.getByTestId('entrar-email').fill('contacto@escuadra.app')
    await page.getByTestId('entrar-contrasena').fill('incorrecta')
    await page.getByTestId('entrar-continuar').click()
    await expect(page.getByTestId('entrar-error')).toHaveText('Email o contraseña incorrectos.')

    await page.getByTestId('entrar-olvide').click()
    await page.getByTestId('recuperar-email').fill('contacto@escuadra.app')
    await page.getByTestId('recuperar-enviar').click()
    await expect(page.getByTestId('recuperar-enviado')).toBeVisible()
  })

  test('mostrar y ocultar la contraseña', async ({ page }) => {
    await page.goto('/registro')
    const input = page.getByTestId('registro-contrasena')
    await input.fill('Valida123!')
    await expect(input).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Mostrar contraseña' }).click()
    await expect(input).toHaveAttribute('type', 'text')
  })

  for (const ruta of ['/registro', '/entrar', '/onboarding/competiciones', '/onboarding/configuracion', '/onboarding/resumen']) {
    test(`accesibilidad ${ruta}`, async ({ page }) => {
      await page.goto(ruta)
      await page.locator('h1').first().waitFor()
      await expectNoSeriousA11y(page)
    })
  }
})

test.describe('Onboarding · visual @visual', () => {
  test('splash', async ({ page }) => {
    await page.clock.install()
    await page.goto('/')
    await page.getByTestId('splash').waitFor()
    await expectFullScreen(page, 'splash.png')
  })

  test('registro', async ({ page }) => {
    await page.goto('/registro')
    await expectFullScreen(page, 'registro.png')
  })

  test('competiciones vacía y con selección', async ({ page }) => {
    await page.goto('/onboarding/competiciones')
    await page.getByTestId('competicion-laliga').waitFor()
    await expectFullScreen(page, 'competiciones.png')
    await page.getByTestId('competicion-laliga').click()
    await page.getByTestId('competicion-uefa').click()
    await expectFullScreen(page, 'competiciones-seleccion.png')
  })

  test('configuración', async ({ page }) => {
    await page.goto('/onboarding/configuracion')
    await expectFullScreen(page, 'configuracion.png')
  })

  test('resumen', async ({ page }) => {
    await page.goto('/onboarding/competiciones')
    await page.getByTestId('competicion-laliga').click()
    await page.getByTestId('competicion-uefa').click()
    await page.locator('[data-testid="competiciones-continuar"]:visible').click()
    await page.locator('[data-testid="configuracion-ver-resumen"]:visible').click()
    await page.getByTestId('resumen-elecciones').waitFor()
    await expectFullScreen(page, 'resumen.png')
  })
})

test.describe('Onboarding en portátil @portatil', () => {
  const pantallas: Array<[string, string]> = [
    ['/registro', 'registro-continuar'],
    ['/entrar', 'entrar-continuar'],
    ['/onboarding/competiciones', 'competiciones-continuar'],
    ['/onboarding/configuracion', 'configuracion-ver-resumen'],
    ['/onboarding/resumen', 'resumen-empezar'],
  ]
  for (const [ruta, boton] of pantallas) {
    test(`${ruta}: todo cabe sin scroll y el botón principal se ve`, async ({ page }) => {
      await page.goto(ruta)
      const btn = page.locator(`[data-testid="${boton}"]:visible`)
      await expect(btn).toBeInViewport({ ratio: 1 })
      const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
})
