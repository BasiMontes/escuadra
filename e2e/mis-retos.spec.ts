import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { abrir, expectFullScreen } from './helpers'

const tarjeta = (page: Page, id: string) => page.getByTestId(`mis-retos-tarjeta-${id}`)
const MOTIVO = 'La pregunta admite más de una respuesta correcta.'

async function entrar(page: Page) {
  await page.goto('/perfil/retos')
  await page.getByTestId('mis-retos-en-curso').waitFor()
}

async function publicarReto(page: Page) {
  await page.goto('/crear/1')
  await page.getByTestId('crear-titulo').fill('Mundiales 90s')
  await page.getByTestId('crear-descripcion').fill('¿Qué selección ganó el Mundial de 1998?')
  await page.getByTestId('crear-siguiente').click()
  await expect(page.getByTestId('crear-paso')).toHaveText('Paso 2 de 4')
  await page.getByTestId('crear-siguiente').click()
  await expect(page.getByTestId('crear-paso')).toHaveText('Paso 3 de 4')
  await page.getByTestId('crear-pista-1').fill('Jugaba en casa.')
  await page.getByTestId('crear-respuesta').fill('Francia')
  await page.getByTestId('crear-publicar').click()
  await page.getByTestId('crear-ir-inicio').waitFor()
}

test.describe('Mis retos', () => {
  test('se llega desde el perfil y marca su pestaña', async ({ page }, info) => {
    await page.goto('/perfil')
    await page.getByTestId('perfil-menu-retos').click()
    await expect(page).toHaveURL(/\/perfil\/retos$/)
    const pestana = page.getByTestId(info.project.name === 'movil' ? 'nav-perfil' : 'sidebar-perfil')
    await expect(pestana).toHaveAttribute('aria-current', 'page')
  })

  test('muestra los retos propios con su estado, los más recientes primero', async ({ page }) => {
    await entrar(page)
    await expect(page.getByRole('article').getByRole('heading')).toHaveText([
      'Porteros de leyenda',
      'Finales de Champions',
      'Clásicos de LaLiga',
    ])
    await expect(tarjeta(page, 'propio-porteros')).toContainText('Pendiente')
    await expect(tarjeta(page, 'propio-finales')).toContainText('Aprobado')
    await expect(tarjeta(page, 'propio-clasicos')).toContainText('Rechazado')
    await expect(tarjeta(page, 'propio-finales')).toContainText('Champions')
    await expect(tarjeta(page, 'propio-finales')).toContainText('100 pts')
  })

  test('solo el rechazado enseña un motivo', async ({ page }) => {
    await entrar(page)
    await expect(tarjeta(page, 'propio-clasicos')).toContainText(`Motivo: ${MOTIVO}`)
    await expect(page.getByText('Motivo:')).toHaveCount(1)
  })

  test('Ver reto abre el detalle, con el motivo si está rechazado', async ({ page }) => {
    await entrar(page)
    await page.getByTestId('mis-retos-ver-propio-clasicos').click()
    await expect(page).toHaveURL(/\/retos\/propio-clasicos$/)
    await expect(page.getByTestId('detalle-aviso')).toHaveText('Es tu reto y ha sido rechazado.')
    await expect(page.getByTestId('detalle-motivo')).toHaveText(`Motivo: ${MOTIVO}`)
    await expect(page.getByTestId('detalle-comenzar')).toBeDisabled()
  })

  test('un reto recién publicado aparece el primero y cuenta en el perfil', async ({ page }) => {
    await publicarReto(page)
    await abrir(page, '/perfil/retos')
    const primero = page.getByRole('article').first()
    await expect(primero).toContainText('Mundiales 90s')
    await expect(primero).toContainText('Pendiente')
    await expect(page.getByRole('article')).toHaveCount(4)

    await abrir(page, '/perfil')
    await expect(page.getByTestId('perfil-retos-creados')).toHaveText('4')
  })

  test('lleva a los retos en curso', async ({ page }) => {
    await entrar(page)
    await page.getByTestId('mis-retos-en-curso').click()
    await expect(page).toHaveURL(/\/retos\/en-curso$/)
  })

  for (const [nombre, ruta, listo] of [
    ['la lista', '/perfil/retos', 'mis-retos-en-curso'],
    ['el detalle de un rechazado', '/retos/propio-clasicos', 'detalle-motivo'],
  ] as const) {
    test(`sin errores de accesibilidad graves: ${nombre}`, async ({ page }) => {
      await page.goto(ruta)
      await page.getByTestId(listo).waitFor()
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([])
    })
  }
})

test.describe('Mis retos en portátil @portatil', () => {
  test('los tres ejemplos y el botón se ven sin scroll', async ({ page }) => {
    await entrar(page)
    for (const id of ['mis-retos-ver-propio-clasicos', 'mis-retos-en-curso']) {
      await expect(page.getByTestId(id)).toBeInViewport({ ratio: 1 })
    }
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0)
  })
})

test.describe('Mis retos · visual @visual', () => {
  test('lista', async ({ page }) => {
    await entrar(page)
    await page.mouse.move(0, 0)
    await expectFullScreen(page, 'mis-retos.png')
  })
})
