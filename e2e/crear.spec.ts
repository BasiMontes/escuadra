import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { alerta, expectFullScreen } from './helpers'

const PREGUNTA = '¿Qué equipo juega en el Emirates Stadium?'

async function expectNoSeriousA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

const siguiente = (page: Page) => page.getByTestId('crear-siguiente').click()

async function hastaPaso2(page: Page) {
  await page.goto('/crear/1')
  await page.getByTestId('crear-titulo').fill('Mundiales 90s')
  await page.getByTestId('crear-descripcion').fill(PREGUNTA)
  await siguiente(page)
  await expect(page).toHaveURL(/\/crear\/2$/)
  // La URL cambia antes de que se pinte el paso: sin esto se mide la pantalla anterior
  await expect(page.getByTestId('crear-paso')).toHaveText('Paso 2 de 4')
}

async function hastaPaso3(page: Page) {
  await hastaPaso2(page)
  await siguiente(page)
  await expect(page).toHaveURL(/\/crear\/3$/)
  await expect(page.getByTestId('crear-paso')).toHaveText('Paso 3 de 4')
}

async function rellenarPaso3(page: Page) {
  await page.getByTestId('crear-pista-1').fill('El equipo juega en Londres.')
  await page.getByTestId('crear-agregar-pista').click()
  await page.getByTestId('crear-pista-2').fill('Su estadio se llama Emirates Stadium.')
  await page.getByTestId('crear-respuesta').fill('Arsenal FC')
}

async function publicar(page: Page) {
  await hastaPaso3(page)
  await rellenarPaso3(page)
  await page.getByTestId('crear-publicar').click()
  await expect(page).toHaveURL(/\/crear\/4$/)
}

test.describe('Crear reto', () => {
  test('se llega desde el botón de la navegación', async ({ page }, info) => {
    await page.goto('/inicio')
    await page.getByTestId(info.project.name === 'movil' ? 'nav-crear-reto' : 'sidebar-crear-reto').click()
    await expect(page).toHaveURL(/\/crear\/1$/)
    await expect(page.getByTestId('crear-paso')).toHaveText('Paso 1 de 4')
    await page.getByTestId('crear-volver').click()
    await expect(page).toHaveURL(/\/inicio$/)
  })

  test('volver en el paso 1 sin historial lleva a Inicio', async ({ page }) => {
    await page.goto('/crear/1')
    await page.getByTestId('crear-volver').click()
    await expect(page).toHaveURL(/\/inicio$/)
  })

  test('flujo completo hasta el resumen', async ({ page }) => {
    await page.goto('/crear/1')
    await expect(page.getByTestId('crear-tipo').locator('option')).toHaveText(['Pregunta de respuesta libre'])
    await expect(page.getByTestId('crear-liga')).toHaveValue('uefa')
    await page.getByTestId('crear-titulo').fill('Mundiales 90s')
    await page.getByTestId('crear-descripcion').fill(PREGUNTA)
    await page.getByTestId('crear-liga').selectOption('premier')
    await siguiente(page)

    await expect(page.getByTestId('crear-dificultad-medio')).toBeChecked()
    await page.getByTestId('crear-dificultad-dificil').check()
    await page.getByTestId('crear-puntos').fill('120')
    await siguiente(page)

    await rellenarPaso3(page)
    await page.getByTestId('crear-publicar').click()

    await expect(page.getByTestId('crear-paso')).toHaveText('Paso 4 de 4')
    const resumen = page.getByTestId('crear-resumen')
    await expect(resumen).toContainText('Mundiales 90s')
    await expect(resumen).toContainText('Respuesta libre')
    await expect(page.getByTestId('crear-resumen-liga')).toHaveText('Premier League')
    await expect(page.getByTestId('crear-resumen-dificultad')).toHaveText('Difícil')
    await expect(page.getByTestId('crear-resumen-puntos')).toHaveText('120')
    await expect(page.getByTestId('crear-resumen-pistas')).toHaveText('2/3')
    await expect(page.getByTestId('crear-resumen-estado')).toHaveText('Pendiente de revisión')

    await page.getByTestId('crear-ir-inicio').click()
    await expect(page).toHaveURL(/\/inicio$/)
  })

  test('el paso 1 valida y enfoca el primer error', async ({ page }) => {
    await page.goto('/crear/1')
    await siguiente(page)
    await expect(page.getByText('Escribe un título.')).toBeVisible()
    await expect(page.getByText('Escribe la pregunta de tu reto.')).toBeVisible()
    await expect(page.getByTestId('crear-titulo')).toBeFocused()
    await page.getByTestId('crear-titulo').fill('ab')
    await siguiente(page)
    await expect(page.getByText('Mínimo 3 caracteres.')).toBeVisible()
    await expect(page).toHaveURL(/\/crear\/1$/)
  })

  test('el campo de puntos no enseña flechas y responde a las del teclado', async ({ page }) => {
    await hastaPaso2(page)
    const puntos = page.getByTestId('crear-puntos')
    await expect(puntos).toHaveCSS('appearance', 'textfield')
    await puntos.press('ArrowUp')
    await expect(puntos).toHaveValue('110')
  })

  test('el paso 2 valida los puntos base', async ({ page }) => {
    await hastaPaso2(page)
    for (const valor of ['', '5', '500']) {
      await page.getByTestId('crear-puntos').fill(valor)
      await siguiente(page)
      await expect(alerta(page)).toHaveText('Escribe un número entero entre 10 y 200.')
    }
    await expect(page.getByTestId('crear-puntos')).toBeFocused()
    await expect(page).toHaveURL(/\/crear\/2$/)
  })

  test('la dificultad se elige con el teclado', async ({ page }) => {
    await hastaPaso2(page)
    await page.getByTestId('crear-dificultad-medio').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('crear-dificultad-dificil')).toBeChecked()
  })

  test('entre una y tres pistas', async ({ page }) => {
    await hastaPaso3(page)
    await expect(page.getByTestId('crear-eliminar-pista-1')).toBeDisabled()
    await page.getByTestId('crear-pista-1').fill('Primera')
    await page.getByTestId('crear-agregar-pista').click()
    await page.getByTestId('crear-pista-2').fill('Segunda')
    await page.getByTestId('crear-agregar-pista').click()
    await page.getByTestId('crear-pista-3').fill('Tercera')
    await expect(page.getByTestId('crear-agregar-pista')).toBeDisabled()

    await page.getByTestId('crear-eliminar-pista-2').click()
    await expect(page.getByTestId('crear-pista-1')).toHaveValue('Primera')
    await expect(page.getByTestId('crear-pista-2')).toHaveValue('Tercera')
    await expect(page.getByTestId('crear-pista-3')).toHaveCount(0)
  })

  test('el paso 3 valida pistas y respuesta', async ({ page }) => {
    await hastaPaso3(page)
    await page.getByTestId('crear-publicar').click()
    await expect(page.getByText('Escribe la pista o elimínala.')).toBeVisible()
    await expect(page.getByText('Escribe una respuesta con letras o números.')).toBeVisible()
    await expect(page.getByTestId('crear-pista-1')).toBeFocused()
    await expect(page).toHaveURL(/\/crear\/3$/)
  })

  test('volver conserva lo escrito', async ({ page }) => {
    await hastaPaso3(page)
    await rellenarPaso3(page)
    await page.getByTestId('crear-volver').click()
    await page.getByTestId('crear-volver').click()
    await expect(page.getByTestId('crear-titulo')).toHaveValue('Mundiales 90s')
    await siguiente(page)
    await siguiente(page)
    await expect(page.getByTestId('crear-pista-2')).toHaveValue('Su estadio se llama Emirates Stadium.')
  })

  for (const paso of [2, 3, 4]) {
    test(`no se puede entrar directamente en el paso ${paso}`, async ({ page }) => {
      await page.goto(`/crear/${paso}`)
      await expect(page).toHaveURL(/\/crear\/1$/)
    })
  }

  test('volver atrás tras publicar no repite la publicación', async ({ page }) => {
    await publicar(page)
    await page.goBack()
    await expect(page).toHaveURL(/\/crear\/1$/)
    await expect(page.getByTestId('crear-titulo')).toHaveValue('')
  })
})

test.describe('Compartir reto', () => {
  test('usa la hoja de compartir del sistema', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        value: async (data: ShareData) => void (document.body.dataset.shared = data.url),
      })
    })
    await publicar(page)
    await page.getByTestId('crear-compartir').click()
    await expect(page.locator('body')).toHaveAttribute('data-shared', /\/retos\/reto-propio-\d+$/)
  })

  test('sin hoja de compartir copia el enlace', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined })
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} } })
    })
    await publicar(page)
    await page.getByTestId('crear-compartir').click()
    await expect(page.getByTestId('crear-compartir-aviso')).toHaveText('Enlace copiado.')
  })

  test('si no puede copiar, enseña el enlace', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined })
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('no')) } })
    })
    await publicar(page)
    await page.getByTestId('crear-compartir').click()
    await expect(page.getByTestId('crear-compartir-aviso')).toContainText('/retos/reto-propio-')
  })

  test('quien crea el reto ve su estado y no puede jugarlo', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        value: async (data: ShareData) => void (document.body.dataset.shared = data.url),
      })
    })
    await publicar(page)
    await page.getByTestId('crear-compartir').click()
    const url = (await page.locator('body').getAttribute('data-shared'))!
    // Navegación sin recargar para conservar los datos en memoria
    const abrir = (ruta: string) =>
      page.evaluate((r) => {
        history.pushState({}, '', r)
        dispatchEvent(new PopStateEvent('popstate'))
      }, ruta)

    await abrir(new URL(url).pathname)
    await expect(page.getByTestId('detalle-pregunta')).toHaveText(PREGUNTA)
    await expect(page.getByTestId('detalle-aviso')).toHaveText('Es tu reto y está pendiente de revisión.')
    await expect(page.getByTestId('detalle-comenzar')).toBeDisabled()

    await abrir(`${new URL(url).pathname}/jugar`)
    await expect(page.getByTestId('vacio-tarjeta')).toContainText('Este reto no está disponible.')
  })
})

test.describe('Crear reto · accesibilidad', () => {
  test('pasos 1 a 3 sin errores', async ({ page }) => {
    await page.goto('/crear/1')
    await expect(page.getByTestId('crear-liga')).toHaveValue('uefa')
    await expectNoSeriousA11y(page)
    await page.getByTestId('crear-titulo').fill('Mundiales 90s')
    await page.getByTestId('crear-descripcion').fill(PREGUNTA)
    await siguiente(page)
    await page.getByTestId('crear-puntos').waitFor()
    await expectNoSeriousA11y(page)
    await siguiente(page)
    await page.getByTestId('crear-respuesta').waitFor()
    await expectNoSeriousA11y(page)
  })

  test('paso 1 con errores', async ({ page }) => {
    await page.goto('/crear/1')
    await siguiente(page)
    await alerta(page).first().waitFor()
    await expectNoSeriousA11y(page)
  })

  test('paso 2 con error', async ({ page }) => {
    await hastaPaso2(page)
    await page.getByTestId('crear-puntos').fill('')
    await siguiente(page)
    await alerta(page).waitFor()
    await expectNoSeriousA11y(page)
  })

  test('paso 3 con errores', async ({ page }) => {
    await hastaPaso3(page)
    await page.getByTestId('crear-publicar').click()
    await alerta(page).first().waitFor()
    await expectNoSeriousA11y(page)
  })

  test('paso 4', async ({ page }) => {
    await publicar(page)
    await expectNoSeriousA11y(page)
  })
})

test.describe('Crear reto en portátil @portatil', () => {
  async function expectSinScroll(page: Page, testIds: string[]) {
    for (const id of testIds) await expect(page.getByTestId(id)).toBeInViewport({ ratio: 1 })
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0)
  }

  test('paso 1', async ({ page }) => {
    await page.goto('/crear/1')
    await expectSinScroll(page, ['crear-siguiente'])
  })

  test('paso 2', async ({ page }) => {
    await hastaPaso2(page)
    await expectSinScroll(page, ['crear-siguiente'])
  })

  test('paso 3 con tres pistas', async ({ page }) => {
    await hastaPaso3(page)
    await page.getByTestId('crear-agregar-pista').click()
    await page.getByTestId('crear-agregar-pista').click()
    await expectSinScroll(page, ['crear-publicar'])
  })

  test('paso 4', async ({ page }) => {
    await publicar(page)
    await expectSinScroll(page, ['crear-compartir', 'crear-ir-inicio'])
  })
})

test.describe('Crear reto · visual @visual', () => {
  test('paso 1', async ({ page }) => {
    await page.goto('/crear/1')
    await expect(page.getByTestId('crear-liga')).toHaveValue('uefa')
    await expectFullScreen(page, 'crear-1.png')
  })

  test('paso 2', async ({ page }) => {
    await hastaPaso2(page)
    await page.mouse.move(0, 0)
    await expectFullScreen(page, 'crear-2.png')
  })

  test('paso 3', async ({ page }) => {
    await hastaPaso3(page)
    await page.getByTestId('crear-pista-1').fill('El equipo juega en Londres.')
    await page.getByTestId('crear-agregar-pista').click()
    await page.getByTestId('crear-pista-2').fill('Su estadio se llama Emirates Stadium.')
    await page.getByTestId('crear-pista-2').blur()
    await page.mouse.move(0, 0)
    await expectFullScreen(page, 'crear-3.png')
  })

  test('paso 4', async ({ page }) => {
    await publicar(page)
    await page.getByTestId('crear-resumen-liga').getByText('Champions').waitFor()
    await page.mouse.move(0, 0)
    await expectFullScreen(page, 'crear-4.png')
  })
})
