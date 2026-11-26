import { defineConfig, devices } from '@playwright/test'

/**
 * Dos proyectos: móvil (390 de ancho, como el diseño) y desktop (1440×900).
 * CHROME_PATH permite usar un Chrome ya instalado en lugar del que descarga Playwright.
 * NAVEGADOR=webkit pasa la misma batería en el motor de Safari (sin las capturas visuales). Los
 * nombres de los proyectos no cambian porque los tests dependen de ellos.
 */
const safari = process.env.NAVEGADOR === 'webkit'
const movil = safari ? devices['iPhone 14'] : { ...devices['Desktop Chrome'], deviceScaleFactor: 2, hasTouch: true }
const escritorio = safari ? devices['Desktop Safari'] : devices['Desktop Chrome']
const launchOptions = !safari && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}

export default defineConfig({
  testDir: './e2e',
  // Las capturas de referencia se generan en la imagen Docker oficial de Playwright (ver README)
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  expect: {
    // Tolerancia cero: con un margen del 1 % pasaban sin avisar cambios en el logo o en una línea de
    // texto. `threshold` es la diferencia de color admitida en cada píxel (0,2 por defecto)
    toHaveScreenshot: { maxDiffPixels: 0, threshold: 0, animations: 'disabled' },
  },
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'movil',
      // Las pruebas de portátil solo tienen sentido a 1280×680
      grepInvert: /@portatil/,
      use: { ...movil, viewport: { width: 390, height: 844 }, launchOptions },
    },
    {
      name: 'desktop',
      grepInvert: /@portatil/,
      use: { ...escritorio, viewport: { width: 1440, height: 900 }, launchOptions },
    },
    {
      // Portátil típico (13-14"): comprueba que el contenido cabe sin scroll
      name: 'portatil',
      grep: /@portatil/,
      use: { ...escritorio, viewport: { width: 1280, height: 680 }, launchOptions },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
