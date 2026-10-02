import { defineConfig, devices } from '@playwright/test'

// Pruebas de extremo a extremo (carpeta e2e/) en Chrome contra la build de producción servida con `vite preview`: la
// misma que se publica en Netlify (base "/"). En local, si ya hay algo escuchando en el puerto, se reutiliza.
// Uso: pnpm test:e2e (la primera vez, `pnpm exec playwright install chromium`)
const PORT = 4173
const OUT_DIR = 'node_modules/.cache/n4l-e2e'

export default defineConfig({
  testDir      : 'e2e',
  // Entrenar redes en el navegador lleva su tiempo, sobre todo en CI (WebGL por software)
  timeout      : 120_000,
  expect       : { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly   : !!process.env.CI,
  retries      : process.env.CI ? 1 : 0,
  workers      : process.env.CI ? 2 : undefined,
  reporter     : process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use          : {
    baseURL   : `http://localhost:${PORT}`,
    locale    : 'es-ES',
    trace     : 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] }, testIgnore: /movil\.spec\.ts/ },
    { name: 'movil', use: { ...devices['Pixel 7'] }, testMatch: /movil\.spec\.ts/ },
  ],
  webServer: {
    // `exec`: el servidor sustituye al shell y Playwright puede pararlo al acabar (con `pnpm exec` quedaba suelto y la
    // ejecución no terminaba). `vite` se encuentra porque pnpm (test:e2e) pone node_modules/.bin en el PATH
    command            : `vite build --mode netlify --outDir ${OUT_DIR} --emptyOutDir && exec vite preview --mode netlify --outDir ${OUT_DIR} --port ${PORT} --strictPort`,
    url                : `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout            : 240_000,
  },
})
