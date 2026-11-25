import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectFullScreen } from './helpers'

async function expectNoSeriousA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

/** Miércoles 4 de marzo de 2026 a las 10:00 en Madrid. */
async function fijarReloj(page: Page) {
  await page.clock.install({ time: new Date('2026-03-04T08:59:00Z') })
  await page.goto('/ranking')
  await page.getByTestId('ranking-fila-1').waitFor()
  await page.clock.pauseAt(new Date('2026-03-04T09:00:00Z'))
}

test.describe('Ranking', () => {
  test('semanal: posición propia y mejores jugadores', async ({ page }, info) => {
    await page.goto('/ranking')
    await expect(page.getByTestId('ranking-pestana-semanal')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('ranking-mi-posicion')).toContainText('#1.248')
    await expect(page.getByTestId('ranking-mi-posicion')).toContainText('850 pts')
    await expect(page.getByTestId('ranking-fila-1')).toContainText('GOLAZO_MASTER')
    await expect(page.getByTestId('ranking-fila-1')).toContainText('4.920')
    await expect(page.getByTestId(/ranking-fila-/)).toHaveCount(4)
    const pestana = page.getByTestId(info.project.name === 'movil' ? 'nav-ranking' : 'sidebar-ranking')
    await expect(pestana).toHaveAttribute('aria-current', 'page')
  })

  test('cuenta atrás hasta el lunes a las 00:00 de Madrid', async ({ page }) => {
    await fijarReloj(page)
    await expect(page.getByTestId('ranking-horas')).toHaveText('110')
    await expect(page.getByTestId('ranking-minutos')).toHaveText('00')
    await page.clock.runFor(1000)
    await expect(page.getByTestId('ranking-horas')).toHaveText('109')
    await expect(page.getByTestId('ranking-segundos')).toHaveText('59')
  })

  test('global: suma histórica sin cuenta atrás', async ({ page }) => {
    await page.goto('/ranking')
    await page.getByTestId('ranking-pestana-global').click()
    await expect(page).toHaveURL(/tipo=global$/)
    await expect(page.getByTestId('ranking-temporada')).toContainText('Ranking global')
    await expect(page.getByTestId('ranking-horas')).toHaveCount(0)
    await expect(page.getByTestId('ranking-mi-posicion')).toContainText('#42')
    await expect(page.getByTestId('ranking-mi-posicion')).toContainText('14.250 pts')
  })

  test('amigos: todavía vacío', async ({ page }) => {
    await page.goto('/ranking?tipo=amigos')
    await expect(page.getByTestId('vacio-tarjeta')).toContainText('Pronto podrás competir con tus amigos')
    await page.getByTestId('vacio-accion').click()
    await expect(page.getByTestId('ranking-fila-1')).toBeVisible()
  })

  test('un tipo desconocido muestra el semanal', async ({ page }) => {
    await page.goto('/ranking?tipo=raro')
    await expect(page.getByTestId('ranking-pestana-semanal')).toHaveAttribute('aria-pressed', 'true')
  })

  test('quien no quiere aparecer no ve su posición', async ({ page }, info) => {
    await page.goto('/ajustes/privacidad')
    await page.getByTestId('privacidad-aparecer').click()
    await page.getByTestId(info.project.name === 'movil' ? 'nav-ranking' : 'sidebar-ranking').click()
    await expect(page.getByTestId('ranking-oculto')).toContainText('No apareces en el ranking.')
    await expect(page.getByTestId('ranking-mi-posicion')).toHaveCount(0)
  })

  for (const tipo of ['semanal', 'global', 'amigos']) {
    test(`accesibilidad ${tipo}`, async ({ page }) => {
      await page.goto(`/ranking?tipo=${tipo}`)
      await page.getByTestId(tipo === 'amigos' ? 'vacio-tarjeta' : 'ranking-fila-1').waitFor()
      await expectNoSeriousA11y(page)
    })
  }
})

test.describe('Ranking en portátil @portatil', () => {
  test('todo cabe sin scroll', async ({ page }) => {
    await page.goto('/ranking')
    for (const id of ['ranking-pestana-semanal', 'ranking-mi-posicion', 'ranking-fila-4']) {
      await expect(page.getByTestId(id)).toBeInViewport({ ratio: 1 })
    }
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0)
  })
})

test.describe('Ranking · visual @visual', () => {
  test('semanal', async ({ page }) => {
    await fijarReloj(page)
    await expectFullScreen(page, 'ranking.png')
  })
})
