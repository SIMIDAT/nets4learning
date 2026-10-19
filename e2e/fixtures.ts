import { test as base, expect } from '@playwright/test'

/**
 * Lo común a todas las pruebas: cookies rechazadas (sin el aviso tapando la página), la aplicación en español y la
 * prueba falla si la página lanza un error de JavaScript.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  context: async ({ context, baseURL }, provide) => {
    await context.addCookies([{ name: 'n4l-accept-cookies', value: 'false', url: baseURL ?? 'http://localhost' }])
    await context.addInitScript(() => {
      try {
        localStorage.setItem('language', 'es')
      } catch {
        // Sin almacenamiento: el idioma lo decide el navegador (locale es-ES)
      }
    })
    await provide(context)
  },
  pageErrors: [async ({ page }, provide) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await provide(errors)
    expect(errors, 'errores de JavaScript en la página').toEqual([])
  }, { auto: true }],
})

export { expect }
