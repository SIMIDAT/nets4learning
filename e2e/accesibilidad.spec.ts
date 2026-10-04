import { AxeBuilder } from '@axe-core/playwright'
import { test, expect } from './fixtures'

// Accesibilidad (WCAG 2.1 A y AA) de las páginas principales con axe, en el tema claro y en el oscuro: contraste,
// nombres de los controles, ARIA… Las páginas de modelos preentrenados se miran con la pregunta antes de descargar
// (preguntar siempre): así no se descarga nada y se revisa también esa pregunta.
const PAGES = [
  '/',
  '/learn',
  '/glossary',
  '/manual',
  '/datasets',
  '/datasets?task=clustering',
  '/settings',
  '/analyze',
  '/select-dataset/tabular-classification',
  '/playground/tabular-classification/dataset/IRIS',
  '/playground/tabular-classification/model/CAR',
  '/playground/regression/dataset/AUTO_MPG',
  '/playground/image-classification/dataset/IMAGE-MNIST',
  '/playground/image-classification/model/IMAGE-MOBILENET',
  '/playground/object-detection/model/COCO-SSD',
  '/select-dataset/clustering',
  '/playground/clustering/dataset/IRIS',
  '/404',
]

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
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      const found = violations.map(({ id, impact, nodes }) => `${id} [${impact}]: ${nodes.slice(0, 3).map(({ target }) => target.join(' ')).join(' | ')}`)
      expect(found, `${path} (tema ${colorScheme === 'light' ? 'claro' : 'oscuro'})`).toEqual([])
    }
  })
}
