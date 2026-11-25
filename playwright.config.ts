import { defineConfig, devices } from '@playwright/test'

/**
 * Dos proyectos: móvil (390 de ancho, como el diseño) y desktop (1440×900).
 * CHROME_PATH permite usar un Chrome ya instalado en lugar del que descarga Playwright.
 */
const launchOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}

export default defineConfig({
  testDir: './e2e',
  // Las capturas de referencia se generan en la imagen Docker oficial de Playwright (ver README)
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
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
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, launchOptions },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
