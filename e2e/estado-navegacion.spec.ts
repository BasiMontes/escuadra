import { expect, test, type Page } from '@playwright/test'
import { abrir } from './helpers'

/**
 * Fija qué recuerda cada entrada del historial: el resultado de la partida y el aviso de perfil
 * guardado. El cambio de router no puede alterarlo.
 */
const RETO = '/retos/balon-oro-2018'

async function terminarPartida(page: Page) {
  await page.goto(`${RETO}/intro`)
  await page.getByTestId('reto-intro-comenzar').click()
  await page.getByTestId('reto-opcion-a').click()
  await expect(page).toHaveURL(/\/resultado$/)
  await expect(page.getByTestId('resultado-titulo')).toHaveText('¡Correcto!')
}

async function guardarPerfil(page: Page) {
  await page.goto('/perfil/editar')
  await page.getByTestId('editar-usuario').fill('Striker99')
  await page.getByTestId('editar-guardar').click()
  await expect(page).toHaveURL(/\/perfil$/)
}

const aviso = (page: Page) => page.getByRole('status').filter({ hasText: 'Cambios guardados.' })

test.describe('Resultado de la partida', () => {
  test('sigue al recargar', async ({ page }) => {
    await terminarPartida(page)
    await page.reload()
    await expect(page.getByTestId('resultado-titulo')).toHaveText('¡Correcto!')
    await expect(page).toHaveURL(/\/resultado$/)
  })

  test('vuelve al ir atrás desde otra pantalla', async ({ page }) => {
    await terminarPartida(page)
    await abrir(page, '/ranking')
    await page.getByTestId('ranking-tarjeta').or(page.getByRole('heading', { name: 'Ranking', level: 1 })).first().waitFor()
    await page.goBack()
    await expect(page.getByTestId('resultado-titulo')).toHaveText('¡Correcto!')
  })

  test('no aparece al entrar de nuevo en la dirección', async ({ page }) => {
    await terminarPartida(page)
    await abrir(page, '/inicio')
    await page.getByTestId('home-saludo').waitFor()
    await abrir(page, `${RETO}/resultado`)
    await expect(page).toHaveURL(/\/intro$/)
  })
})

test.describe('Aviso de perfil guardado', () => {
  test('sigue al recargar', async ({ page }) => {
    await guardarPerfil(page)
    await expect(aviso(page)).toHaveCount(1)
    await page.reload()
    await page.getByTestId('perfil-identidad').waitFor()
    await expect(aviso(page)).toHaveCount(1)
  })

  test('desaparece al pulsar Perfil estando en el perfil', async ({ page }, info) => {
    await guardarPerfil(page)
    await expect(aviso(page)).toHaveCount(1)
    await page.getByTestId(info.project.name === 'movil' ? 'nav-perfil' : 'sidebar-perfil').click()
    await expect(aviso(page)).toHaveCount(0)
  })

  test('no aparece al entrar de nuevo en el perfil y vuelve al ir atrás', async ({ page }) => {
    await guardarPerfil(page)
    await abrir(page, '/inicio')
    await page.getByTestId('home-saludo').waitFor()
    await abrir(page, '/perfil')
    await page.getByTestId('perfil-identidad').waitFor()
    await expect(aviso(page)).toHaveCount(0)
    await page.goBack()
    await page.goBack()
    await page.getByTestId('perfil-identidad').waitFor()
    await expect(aviso(page)).toHaveCount(1)
  })
})
