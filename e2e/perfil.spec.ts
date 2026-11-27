import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { alerta, expectFullScreen } from './helpers'

/** PNG de 1×1 píxel */
const FOTO = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)
const CODIGOS = ['rey-del-gol', 'maestro-trivia', 'campeon-liga', 'heroe-hat-trick', 'porteria-cero', 'bota-de-oro']

async function expectNoSeriousA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

test.describe('Perfil', () => {
  test('muestra la identidad y las cifras', async ({ page }, info) => {
    await page.goto('/perfil')
    await expect(page.getByTestId('perfil-usuario')).toHaveText('BasiMontes')
    await expect(page.getByTestId('perfil-identidad')).toContainText('Goleador estrella')
    await expect(page.getByTestId('perfil-partidos')).toHaveText('128')
    await expect(page.getByTestId('perfil-retos-creados')).toHaveText('3')
    await expect(page.getByTestId('perfil-top')).toHaveText('Top 5 %')
    const pestana = page.getByTestId(info.project.name === 'movil' ? 'nav-perfil' : 'sidebar-perfil')
    await expect(pestana).toHaveAttribute('aria-current', 'page')
  })

  for (const [opcion, url] of [
    ['editar', /\/perfil\/editar$/],
    ['logros', /\/perfil\/logros$/],
    ['retos', /\/perfil\/retos$/],
    ['ajustes', /\/ajustes$/],
  ] as const) {
    test(`el menú lleva a ${opcion}`, async ({ page }) => {
      await page.goto('/perfil')
      await page.getByTestId(`perfil-menu-${opcion}`).click()
      await expect(page).toHaveURL(url)
    })
  }

  test('cerrar sesión lleva a Entrar', async ({ page }) => {
    await page.goto('/perfil')
    await page.getByTestId('perfil-cerrar-sesion').click()
    await expect(page).toHaveURL(/\/entrar$/)
  })
})

test.describe('Editar perfil', () => {
  async function abrir(page: Page) {
    await page.goto('/perfil')
    await page.getByTestId('perfil-menu-editar').click()
    await expect(page.getByTestId('editar-usuario')).toHaveValue('BasiMontes')
  }

  test('guarda los cambios y se ven en el perfil e Inicio', async ({ page }, info) => {
    await abrir(page)
    await page.getByTestId('editar-usuario').fill('Striker99')
    await page.getByTestId('editar-biografia').fill('Nueva biografía')
    await page.getByTestId('editar-guardar').click()

    await expect(page).toHaveURL(/\/perfil$/)
    await expect(page.getByTestId('perfil-usuario')).toHaveText('Striker99')
    await expect(page.getByRole('status').filter({ hasText: 'Cambios guardados.' })).toHaveCount(1)

    await page.getByTestId(info.project.name === 'movil' ? 'nav-inicio' : 'sidebar-inicio').click()
    await expect(page.getByTestId('home-saludo')).toContainText('Striker99')
  })

  test('cancelar descarta los cambios', async ({ page }) => {
    await abrir(page)
    await page.getByTestId('editar-usuario').fill('Descartado')
    await page.getByTestId('editar-cancelar').click()
    await expect(page.getByTestId('perfil-usuario')).toHaveText('BasiMontes')
  })

  test('valida los campos y enfoca el primer error', async ({ page }) => {
    await abrir(page)
    await page.getByTestId('editar-usuario').fill('ab')
    await page.getByTestId('editar-email').fill('no-es-un-correo')
    await page.getByTestId('editar-guardar').click()
    await expect(page.getByText('Mínimo 3 caracteres.')).toBeVisible()
    await expect(page.getByText('Ese correo no parece válido.')).toBeVisible()
    await expect(page.getByTestId('editar-usuario')).toBeFocused()
    await expect(page).toHaveURL(/\/editar$/)
  })

  test('muestra el error del servidor y permite corregirlo', async ({ page }) => {
    await abrir(page)
    await page.getByTestId('editar-usuario').fill('ocupado')
    await page.getByTestId('editar-guardar').click()
    await expect(page.getByTestId('editar-error')).toHaveText('Ese nombre de usuario ya existe.')
    await page.getByTestId('editar-usuario').fill('LibreDeVerdad')
    await page.getByTestId('editar-guardar').click()
    await expect(page.getByTestId('perfil-usuario')).toHaveText('LibreDeVerdad')
  })

  test('cambia la foto al guardar', async ({ page }) => {
    await abrir(page)
    const selector = page.waitForEvent('filechooser')
    await page.getByTestId('editar-cambiar-foto').click()
    await (await selector).setFiles({ name: 'foto.png', mimeType: 'image/png', buffer: FOTO })
    await expect(page.getByTestId('editar-foto')).toHaveAttribute('src', /^data:image\/png/)
    await page.getByTestId('editar-guardar').click()
    await expect(page.getByTestId('perfil-foto')).toHaveAttribute('src', /^data:image\/png/)
  })

  test('rechaza fotos de otro formato o demasiado grandes', async ({ page }) => {
    await abrir(page)
    const archivo = page.getByTestId('editar-archivo')
    await archivo.setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('hola') })
    await expect(alerta(page)).toHaveText('La foto debe ser JPG, PNG o WebP.')
    await archivo.setInputFiles({ name: 'grande.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) })
    await expect(alerta(page)).toHaveText('La foto no puede pesar más de 2 MB.')
    await expect(page.getByTestId('editar-foto')).toHaveAttribute('src', '/img/avatar-basimontes.jpg')
  })
})

test.describe('Mis logros', () => {
  test('muestra totales y el estado de cada logro', async ({ page }) => {
    await page.goto('/perfil/logros')
    await expect(page.getByTestId('logros-puntos')).toHaveText('14.250')
    await expect(page.getByTestId('logros-rango')).toHaveText('#42')
    await expect(page.getByRole('article')).toHaveCount(CODIGOS.length)
    await expect(page.getByTestId('logros-tarjeta-rey-del-gol')).toContainText('Desbloqueado')
    await expect(page.getByTestId('logros-tarjeta-maestro-trivia')).toContainText('80 % completado')
    await expect(page.getByTestId('logros-tarjeta-campeon-liga')).toContainText('Bloqueado')
    await expect(page.getByRole('progressbar', { name: 'Progreso de Maestro de la trivia' })).toHaveAttribute(
      'aria-valuenow',
      '80',
    )
    await expect(page.getByTestId('logro-aviso')).toHaveCount(0)
  })

  test('avisa de un logro desbloqueado y se cierra con Continuar', async ({ page }) => {
    await page.goto('/perfil/logros?nuevo=rey-del-gol')
    const aviso = page.getByRole('dialog', { name: '¡Logro desbloqueado!' })
    await expect(aviso).toContainText('Rey del gol')
    await expect(aviso).toContainText('¡Eres imparable!')
    await expect(page.getByTestId('logro-continuar')).toBeFocused()
    await page.getByTestId('logro-continuar').click()
    await expect(aviso).toHaveCount(0)
    await expect(page).toHaveURL(/\/perfil\/logros$/)
  })

  test('el aviso queda centrado en la ventana', async ({ page }) => {
    await page.goto('/perfil/logros?nuevo=rey-del-gol')
    const boton = (await page.getByTestId('logro-continuar').boundingBox())!
    const ancho = page.viewportSize()!.width
    expect(Math.abs(boton.x + boton.width / 2 - ancho / 2)).toBeLessThan(1)
  })

  test('el aviso se cierra con Escape', async ({ page }) => {
    await page.goto('/perfil/logros?nuevo=porteria-cero')
    await page.getByTestId('logro-aviso').waitFor()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('logro-aviso')).toHaveCount(0)
  })

  for (const codigo of ['campeon-liga', 'maestro-trivia', 'no-existe']) {
    test(`no avisa de "${codigo}" porque no está desbloqueado`, async ({ page }) => {
      await page.goto(`/perfil/logros?nuevo=${codigo}`)
      await page.getByTestId('logros-puntos').waitFor()
      await expect(page.getByTestId('logro-aviso')).toHaveCount(0)
    })
  }
})

const PANTALLAS: Array<[nombre: string, ruta: string, listo: string]> = [
  ['perfil', '/perfil', 'perfil-cerrar-sesion'],
  ['editar-perfil', '/perfil/editar', 'editar-guardar'],
  ['logros', '/perfil/logros', 'logros-tarjeta-bota-de-oro'],
  ['logro-desbloqueado', '/perfil/logros?nuevo=rey-del-gol', 'logro-continuar'],
]

test.describe('Perfil · accesibilidad', () => {
  for (const [nombre, ruta, listo] of PANTALLAS) {
    test(nombre, async ({ page }) => {
      await page.goto(ruta)
      await page.getByTestId(listo).waitFor()
      await expectNoSeriousA11y(page)
    })
  }

  test('editar con errores', async ({ page }) => {
    await page.goto('/perfil/editar')
    await page.getByTestId('editar-usuario').fill('')
    await page.getByTestId('editar-guardar').click()
    await alerta(page).waitFor()
    await expectNoSeriousA11y(page)
  })
})

test.describe('Perfil en portátil @portatil', () => {
  const botones: Array<[string, string[]]> = [
    ['/perfil', ['perfil-menu-editar', 'perfil-menu-ajustes', 'perfil-cerrar-sesion']],
    ['/perfil/editar', ['editar-cambiar-foto', 'editar-guardar', 'editar-cancelar']],
    ['/perfil/logros', ['logros-tarjeta-rey-del-gol', 'logros-tarjeta-bota-de-oro']],
    ['/perfil/logros?nuevo=rey-del-gol', ['logro-continuar']],
  ]
  for (const [ruta, ids] of botones) {
    test(`${ruta}: todo cabe sin scroll`, async ({ page }) => {
      await page.goto(ruta)
      for (const id of ids) await expect(page.getByTestId(id)).toBeInViewport({ ratio: 1 })
      expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0)
    })
  }
})

test.describe('Perfil · visual @visual', () => {
  for (const [nombre, ruta, listo] of PANTALLAS) {
    test(nombre, async ({ page }) => {
      await page.goto(ruta)
      await page.getByTestId(listo).waitFor()
      await page.mouse.move(0, 0)
      // El aviso ocupa la ventana: no se amplía a la altura del documento
      if (nombre === 'logro-desbloqueado') await expect(page).toHaveScreenshot(`${nombre}.png`)
      else await expectFullScreen(page, `${nombre}.png`)
    })
  }
})
