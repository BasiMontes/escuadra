import { expect, test } from '@playwright/test'

/** Rutas desde las que se recogen los enlaces de la app. */
const PARTIDA = [
  '/registro',
  '/entrar',
  '/recuperar',
  '/inicio',
  '/retos',
  '/retos/balon-oro-2018',
  '/retos/balon-oro-2018/intro',
  '/retos/en-curso',
  '/crear/1',
  '/ranking',
  '/ranking?tipo=amigos',
  '/perfil',
  '/perfil/editar',
  '/perfil/logros',
  '/ajustes',
  '/ajustes/notificaciones',
  '/ajustes/privacidad',
  '/ajustes/soporte',
  '/ajustes/contrasena',
  '/bienvenida',
  '/privacidad',
  '/terminos',
]

test('ningún enlace lleva a una página que no existe', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Los destinos son los mismos en todos los tamaños')
  test.slow()
  const destinos = new Set<string>()
  for (const ruta of PARTIDA) {
    await page.goto(ruta)
    await page.locator('h1').first().waitFor({ state: 'attached' })
    await page.waitForLoadState('networkidle')
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) => links.map((a) => a.getAttribute('href')!))
    hrefs.forEach((href) => destinos.add(href))
  }
  expect(destinos.size).toBeGreaterThan(20)

  const rotos: string[] = []
  for (const destino of destinos) {
    await page.goto(destino)
    await page.waitForLoadState('networkidle')
    const texto = await page.locator('body').innerText()
    if (/No encontramos (esta página|este reto)|Pantalla en construcción/i.test(texto)) rotos.push(destino)
  }
  expect(rotos).toEqual([])
})
