import fs from 'node:fs'
import { join } from 'node:path'

import { test, expect } from './fixtures'
import { axeViolations } from './axe'

// Accesibilidad (WCAG 2.2 A y AA y buenas prácticas, e2e/axe.ts) de las páginas principales con axe, en el tema claro y
// en el oscuro: contraste, nombres de los controles, ARIA, orden de los encabezados, tamaño de los objetivos… Las
// páginas de modelos preentrenados se miran con la pregunta antes de descargar (preguntar siempre): así no se descarga
// nada y se revisa también esa pregunta.
const PAGES = [
  '/',
  '/learn',
  '/lab',
  '/glossary',
  '/manual',
  '/datasets',
  '/packages',
  '/datasets?task=clustering',
  '/datasets?task=time-series',
  '/settings',
  '/contribute',
  '/terms-and-conditions',
  '/accessibility',
  '/version',
  '/report',
  '/analyze',
  '/analyze?dataset=auto-mpg',
  '/task/regression',
  '/select-dataset/tabular-classification',
  '/select-model/tabular-classification',
  '/playground/description-regression',
  '/playground/tabular-classification/dataset/IRIS',
  '/playground/tabular-classification/model/CAR',
  '/playground/regression/dataset/AUTO_MPG',
  '/playground/image-classification/dataset/IMAGE-MNIST',
  '/playground/image-classification/model/IMAGE-MOBILENET',
  '/playground/image-classification/model/IMAGE-KMNIST',
  '/playground/image-classification/model/IMAGE-CIFAR10',
  '/playground/object-detection/model/COCO-SSD',
  '/select-dataset/clustering',
  '/playground/clustering/dataset/IRIS',
  '/select-dataset/time-series',
  '/playground/time-series/dataset/AIRLINE-PASSENGERS',
  '/playground/time-series/dataset/UPLOAD',
  '/playground/time-series/model/MELBOURNE-TEMPERATURES',
  '/404',
]

// Rutas de App.tsx que son la misma página que otra de la lista
const SAME_PAGE: Record<string, string> = { '/home': '/' }

test('se revisan todas las rutas de la aplicación', () => {
  const app = fs.readFileSync(join(__dirname, '..', 'src', 'App.tsx'), 'utf-8')
  // Sin las páginas de desarrollo (no se publican) ni la que lleva a la 404
  const published = app.replace(/\{SHOW_DEV_PAGES && <>[\s\S]*?<\/>\}/, '')
  const routes = [...published.matchAll(/<Route[^>]*\spath=\{?['"]([^'"]+)['"]/g)].map(([, route]) => route).filter((route) => route !== '*')
  expect(routes.length).toBeGreaterThan(10)
  const pathnames = PAGES.map((page) => page.split('?')[0])
  const missing = routes.filter((route) => {
    if (SAME_PAGE[route] !== undefined) return !pathnames.includes(SAME_PAGE[route])
    const pattern = new RegExp(`^${route.replace(/\/$/, '').replace(/:[^/]+/g, '[^/]+')}/?$`)
    return !pathnames.some((pathname) => pattern.test(pathname))
  })
  expect(missing, 'rutas sin revisar con axe (añadirlas a PAGES)').toEqual([])
})

for (const path of PAGES) {
  test(`${path} no tiene problemas de accesibilidad (temas claro y oscuro)`, async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('n4l-download-warning', 'always')
      } catch {
        // Sin almacenamiento: se descargaría el modelo, y se revisaría igual
      }
    })
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      await page.goto(path)
      await expect(page.locator('main').first()).toBeVisible()
      // Lo que se carga después (datos, gráficas, la pregunta antes de descargar)
      await page.waitForTimeout(2500)
      // El «Descargado» de un modelo recién cargado se desvanece: a medio camino axe lo ve sin contraste
      await expect(page.getByTestId('Test-DownloadProgress')).toHaveCount(0)
      expect(await axeViolations(page), `${path} (tema ${colorScheme === 'light' ? 'claro' : 'oscuro'})`).toEqual([])
    }
  })
}
