import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { alerta, expectFullScreen } from './helpers'

async function expectNoSeriousA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

/** Navega sin recargar, para conservar los datos en memoria. */
const abrir = (page: Page, ruta: string) =>
  page.evaluate((r) => {
    history.pushState({}, '', r)
    dispatchEvent(new PopStateEvent('popstate'))
  }, ruta)

test.describe('Ajustes', () => {
  for (const seccion of ['juego', 'notificaciones', 'privacidad', 'soporte', 'contrasena']) {
    test(`lleva a ${seccion}`, async ({ page }) => {
      await page.goto('/ajustes')
      await page.getByTestId(`ajustes-${seccion}`).click()
      await expect(page).toHaveURL(new RegExp(`/ajustes/${seccion}$`))
    })
  }

  test('cada opción cabe en una línea', async ({ page }) => {
    await page.goto('/ajustes')
    for (const seccion of ['juego', 'notificaciones', 'privacidad', 'soporte', 'contrasena']) {
      const lineas = await page.getByTestId(`ajustes-${seccion}`).evaluate(async (el) => {
        await document.fonts.ready
        const texto = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)!
        const rango = document.createRange()
        rango.selectNodeContents(texto)
        return rango.getClientRects().length
      })
      expect(lineas, seccion).toBe(1)
    }
  })

  test('en desktop todo cabe sin scroll', async ({ page }, info) => {
    test.skip(info.project.name === 'movil', 'En móvil la lista se recorre con scroll')
    await page.goto('/ajustes')
    await expect(page.getByTestId('ajustes-eliminar-cuenta')).toBeInViewport({ ratio: 1 })
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0)
  })

  test('cerrar sesión lleva a Entrar', async ({ page }) => {
    await page.goto('/ajustes')
    await page.getByTestId('ajustes-cerrar-sesion').click()
    await expect(page).toHaveURL(/\/entrar$/)
  })

  test('eliminar la cuenta pide confirmación y se puede cancelar', async ({ page }) => {
    await page.goto('/ajustes')
    await page.getByTestId('ajustes-eliminar-cuenta').click()
    const dialogo = page.getByRole('dialog', { name: '¿Eliminar tu cuenta?' })
    await expect(dialogo).toContainText('permanente e irreversible')
    await expect(page.getByTestId('confirmar-cancelar')).toBeFocused()
    await page.getByTestId('confirmar-cancelar').click()
    await expect(dialogo).toHaveCount(0)

    await page.getByTestId('ajustes-eliminar-cuenta').click()
    await page.keyboard.press('Escape')
    await expect(dialogo).toHaveCount(0)
    await expect(page).toHaveURL(/\/ajustes$/)
  })

  test('confirmar elimina la cuenta y lleva al registro', async ({ page }) => {
    await page.goto('/ajustes')
    await page.getByTestId('ajustes-eliminar-cuenta').click()
    await page.getByTestId('confirmar-aceptar').click()
    await expect(page).toHaveURL(/\/registro$/)
  })
})

test.describe('Notificaciones', () => {
  test('refleja los ajustes y conserva los cambios', async ({ page }) => {
    await page.goto('/ajustes/notificaciones')
    const diarios = page.getByRole('switch', { name: 'Retos diarios' })
    const logros = page.getByRole('switch', { name: 'Nuevos logros' })
    await expect(diarios).toBeChecked()
    await expect(logros).not.toBeChecked()
    await expect(page.getByTestId('notificaciones-estadisticas')).toContainText('75 %')

    await logros.click()
    await diarios.click()
    await abrir(page, '/ajustes')
    await page.getByTestId('ajustes-notificaciones').click()
    await expect(logros).toBeChecked()
    await expect(diarios).not.toBeChecked()
  })
})

test.describe('Interruptores', () => {
  /** Distancia del centro del botón al centro de su marca: positiva si la marca está a la derecha. */
  const lado = (page: Page, nombre: string) =>
    page.getByRole('switch', { name: nombre }).evaluate((boton) => {
      const centro = (e: Element) => e.getBoundingClientRect().x + e.getBoundingClientRect().width / 2
      return centro(boton.firstElementChild!) - centro(boton)
    })

  test('encendido a la derecha y apagado a la izquierda', async ({ page }) => {
    await page.goto('/ajustes/notificaciones')
    await expect(page.getByRole('switch', { name: 'Retos diarios' })).toBeChecked()
    expect(await lado(page, 'Retos diarios')).toBeGreaterThan(0)
    expect(await lado(page, 'Nuevos logros')).toBeLessThan(0)
    await page.getByRole('switch', { name: 'Nuevos logros' }).click()
    await expect.poll(() => lado(page, 'Nuevos logros')).toBeGreaterThan(0)
  })
})

test.describe('Panel de avisos', () => {
  const campana = (page: Page, proyecto: string) =>
    page.getByTestId(proyecto === 'movil' ? 'header-avisos' : 'topbar-avisos')

  test('lista los avisos activados y lleva a su pantalla', async ({ page }, info) => {
    await page.goto('/inicio')
    await campana(page, info.project.name).click()
    await expect(campana(page, info.project.name)).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('avisos-reto-del-dia')).toBeVisible()
    await expect(page.getByTestId('avisos-logro-rey-del-gol')).toHaveCount(0)
    await page.getByTestId('avisos-reto-del-dia').click()
    await expect(page).toHaveURL(/\/retos\/gol-final-2005\/intro$/)
    await expect(page.getByTestId('avisos-panel')).toHaveCount(0)
  })

  test('sin avisos activados lo dice', async ({ page }, info) => {
    await page.goto('/ajustes/notificaciones')
    await page.getByTestId('notificaciones-diarios').click()
    await campana(page, info.project.name).click()
    await expect(page.getByTestId('avisos-panel')).toContainText('No tienes avisos nuevos')
    await page.getByTestId('avisos-ajustes').click()
    await expect(page.getByTestId('avisos-panel')).toHaveCount(0)
  })

  test('se cierra con Escape, al pulsar fuera y con la propia campana', async ({ page }, info) => {
    await page.goto('/inicio')
    const boton = campana(page, info.project.name)
    const panel = page.getByTestId('avisos-panel')
    await boton.click()
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(boton).toBeFocused()

    await boton.click()
    await page.getByTestId('home-saludo').click({ position: { x: 5, y: 5 } })
    await expect(panel).toHaveCount(0)

    await boton.click()
    await boton.click()
    await expect(panel).toHaveCount(0)
  })

  test('el panel cabe en la ventana y es accesible', async ({ page }, info) => {
    await page.goto('/inicio')
    await campana(page, info.project.name).click()
    await page.getByTestId('avisos-reto-del-dia').waitFor()
    await expect(page.getByTestId('avisos-panel')).toBeInViewport({ ratio: 1 })
    await expectNoSeriousA11y(page)
  })
})

test.describe('Privacidad', () => {
  test('cambia la visibilidad y el ranking, y se conservan', async ({ page }) => {
    await page.goto('/ajustes/privacidad')
    await expect(page.getByTestId('privacidad-publico')).toBeChecked()
    await page.getByTestId('privacidad-privado').check()
    await page.getByTestId('privacidad-aparecer').click()
    await abrir(page, '/ajustes')
    await page.getByTestId('ajustes-privacidad').click()
    await expect(page.getByTestId('privacidad-privado')).toBeChecked()
    await expect(page.getByTestId('privacidad-aparecer')).not.toBeChecked()
  })

  test('descarga un PDF con los datos', async ({ page }) => {
    await page.goto('/ajustes/privacidad')
    const descarga = page.waitForEvent('download')
    await page.getByTestId('privacidad-descargar').click()
    const archivo = await descarga
    expect(archivo.suggestedFilename()).toBe('escuadra-mis-datos.pdf')
    const contenido = await readFile(await archivo.path(), 'latin1')
    expect(contenido.startsWith('%PDF-1.4')).toBe(true)
    expect(contenido).toContain('Usuario: BasiMontes')
    expect(contenido).toContain('Puntos totales: 14.250')
    await expect(page.getByTestId('privacidad-aviso')).toHaveText('Informe descargado.')
  })

  test('eliminar cuenta pide confirmación', async ({ page }) => {
    await page.goto('/ajustes/privacidad')
    await page.getByTestId('privacidad-eliminar').click()
    await expect(page.getByTestId('confirmar-dialogo')).toBeVisible()
    await expectNoSeriousA11y(page)
  })
})

test.describe('Soporte', () => {
  test('preguntas frecuentes plegables, sin tienda ni balones', async ({ page }) => {
    await page.goto('/ajustes/soporte')
    const pistas = page.getByTestId('soporte-faq-pistas')
    const reglas = page.getByTestId('soporte-faq-reglas')
    await expect(pistas).toHaveAttribute('open', '')
    await expect(pistas).toContainText('resta 30 puntos')
    await expect(reglas).not.toHaveAttribute('open', '')
    await reglas.locator('summary').click()
    await expect(reglas).toContainText('Medio ×1,5')
    await expect(page.getByRole('main')).not.toContainText(/tienda|balones/i)
  })

  test('valida el mensaje y confirma el envío', async ({ page }) => {
    await page.goto('/ajustes/soporte')
    await page.getByTestId('soporte-enviar').click()
    await expect(alerta(page)).toHaveText('Escribe tu mensaje.')
    await expect(page.getByTestId('soporte-mensaje')).toBeFocused()
    await page.getByTestId('soporte-asunto').selectOption('Sugerencia')
    await page.getByTestId('soporte-mensaje').fill('Me gustaría ver más retos de Ligue 1.')
    await page.getByTestId('soporte-enviar').click()
    await expect(page.getByTestId('soporte-enviado')).toContainText('Mensaje enviado.')
    await expect(page.getByTestId('soporte-mensaje')).toHaveValue('')
  })
})

test.describe('Cambiar contraseña', () => {
  async function rellenar(page: Page, actual: string, nueva: string, confirmar = nueva) {
    await page.getByTestId('contrasena-actual').fill(actual)
    await page.getByTestId('contrasena-nueva').fill(nueva)
    await page.getByTestId('contrasena-confirmar').fill(confirmar)
  }

  test('el botón se activa cuando se cumplen los requisitos', async ({ page }) => {
    await page.goto('/ajustes/contrasena')
    const boton = page.getByTestId('contrasena-actualizar')
    const cumplidas = page.getByTestId('contrasena-reglas-nueva').locator('[data-cumple="true"]')
    await expect(boton).toBeDisabled()
    await page.getByTestId('contrasena-nueva').fill('abcdefgh')
    await expect(cumplidas).toHaveCount(1)
    await page.getByTestId('contrasena-nueva').fill('abcdefg1!')
    await expect(cumplidas).toHaveCount(3)
    await expect(boton).toBeDisabled()
    await rellenar(page, 'Anterior123!', 'abcdefg1!')
    await expect(boton).toBeEnabled()
  })

  test('avisa si no coinciden', async ({ page }) => {
    await page.goto('/ajustes/contrasena')
    await rellenar(page, 'Anterior123!', 'Nueva1234!', 'Nueva1234?')
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible()
    await expect(page.getByTestId('contrasena-actualizar')).toBeDisabled()
  })

  test('no admite repetir la actual', async ({ page }) => {
    await page.goto('/ajustes/contrasena')
    await rellenar(page, 'Misma1234!', 'Misma1234!')
    await expect(page.getByText('La nueva contraseña debe ser distinta de la actual.')).toBeVisible()
    await expect(page.getByTestId('contrasena-actualizar')).toBeDisabled()
  })

  test('muestra el error del servidor y confirma el cambio', async ({ page }) => {
    await page.goto('/ajustes/contrasena')
    await rellenar(page, 'incorrecta', 'Nueva1234!')
    await page.getByTestId('contrasena-actualizar').click()
    await expect(page.getByTestId('contrasena-error')).toHaveText('La contraseña actual no es correcta.')
    await rellenar(page, 'Anterior123!', 'Nueva1234!')
    await page.getByTestId('contrasena-actualizar').click()
    await expect(page.getByTestId('contrasena-aviso')).toHaveText('Contraseña actualizada.')
    await expect(page.getByTestId('contrasena-actual')).toHaveValue('')
  })

  test('mostrar la contraseña y recuperar', async ({ page }) => {
    await page.goto('/ajustes/contrasena')
    await page.getByTestId('contrasena-actual-ver').click()
    await expect(page.getByTestId('contrasena-actual')).toHaveAttribute('type', 'text')
    await page.getByTestId('contrasena-olvidada').click()
    await expect(page).toHaveURL(/\/recuperar$/)
  })
})

const PANTALLAS: Array<[nombre: string, ruta: string, listo: string]> = [
  ['ajustes', '/ajustes', 'ajustes-eliminar-cuenta'],
  ['preferencias', '/ajustes/juego', 'preferencias-guardar'],
  ['notificaciones', '/ajustes/notificaciones', 'notificaciones-amigos'],
  ['privacidad', '/ajustes/privacidad', 'privacidad-eliminar'],
  ['soporte', '/ajustes/soporte', 'soporte-enviar'],
  ['contrasena', '/ajustes/contrasena', 'contrasena-actualizar'],
]

test.describe('Ajustes · accesibilidad', () => {
  for (const [nombre, ruta, listo] of PANTALLAS) {
    test(nombre, async ({ page }) => {
      await page.goto(ruta)
      await page.getByTestId(listo).waitFor()
      await expectNoSeriousA11y(page)
    })
  }

  test('contraseña con errores', async ({ page }) => {
    await page.goto('/ajustes/contrasena')
    await page.getByTestId('contrasena-actual').fill('incorrecta')
    await page.getByTestId('contrasena-nueva').fill('Nueva1234!')
    await page.getByTestId('contrasena-confirmar').fill('Nueva1234!')
    await page.getByTestId('contrasena-actualizar').click()
    await page.getByTestId('contrasena-error').waitFor()
    await expectNoSeriousA11y(page)
  })
})

test.describe('Ajustes en portátil @portatil', () => {
  const botones: Array<[ruta: string, ids: string[], sinScroll: boolean]> = [
    ['/ajustes', ['ajustes-juego', 'ajustes-cerrar-sesion', 'ajustes-eliminar-cuenta'], true],
    ['/ajustes/juego', ['preferencias-competicion-premier', 'preferencias-pistas-3', 'preferencias-guardar'], true],
    ['/ajustes/notificaciones', ['notificaciones-diarios', 'notificaciones-amigos'], true],
    ['/ajustes/privacidad', ['privacidad-publico', 'privacidad-aparecer', 'privacidad-eliminar'], true],
    // La respuesta desplegada puede alargar la página, pero el formulario debe verse
    ['/ajustes/soporte', ['soporte-enviar'], false],
    ['/ajustes/contrasena', ['contrasena-actualizar'], true],
  ]
  for (const [ruta, ids, sinScroll] of botones) {
    test(`${ruta}: los botones se ven sin scroll`, async ({ page }) => {
      await page.goto(ruta)
      for (const id of ids) await expect(page.getByTestId(id)).toBeInViewport({ ratio: 1 })
      if (sinScroll) {
        expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0)
      }
    })
  }
})

test.describe('Ajustes · visual @visual', () => {
  for (const [nombre, ruta, listo] of PANTALLAS) {
    test(nombre, async ({ page }) => {
      await page.goto(ruta)
      await page.getByTestId(listo).waitFor()
      await page.mouse.move(0, 0)
      await expectFullScreen(page, `${nombre}.png`)
    })
  }
})
