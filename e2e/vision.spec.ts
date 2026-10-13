import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

// Visión baja (WCAG 1.4.10, 1.4.12, 1.3.4): con 320 px de ancho (lo que queda de 1280 px con el zoom al 400 %), con
// el móvil en horizontal y con el espaciado de texto máximo de WCAG, ninguna página obliga a desplazarse en horizontal.
// Solo pueden hacerlo las tablas de datos y lo que tiene su propio desplazamiento (y se puede enfocar).

const PAGES = [
  '/',
  '/task/tabular-classification',
  '/select-dataset/tabular-classification',
  '/playground/tabular-classification/dataset/IRIS',
  '/playground/regression/model/AUTO_MPG',
  '/playground/time-series/model/SUNSPOTS',
  '/playground/clustering/dataset/IRIS',
  '/analyze?dataset=iris',
  '/datasets',
  '/glossary',
  '/manual',
  '/settings',
  '/packages',
]

/** Lo que se sale por la derecha y no está dentro de algo con su propio desplazamiento horizontal */
const overflowing = (page: Page) => page.evaluate(() => {
  const width = document.documentElement.clientWidth
  const scrolls = (element: Element | null): boolean => {
    for (let node = element?.parentElement ?? null; node !== null && node !== document.body; node = node.parentElement) {
      const { overflowX } = getComputedStyle(node)
      if (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden' || overflowX === 'clip') return true
    }
    return false
  }
  const describe = (element: Element) => `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}.${String(element.className).split(' ').slice(0, 2).join('.')}`
  return {
    scrollWidth: document.documentElement.scrollWidth,
    width,
    offenders  : Array.from(document.querySelectorAll('main *, nav *, footer *'))
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && rect.right > width + 1 && !scrolls(element)
      })
      .slice(0, 5)
      .map(describe),
  }
})

async function expectNoHorizontalScroll(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('main').first()).toBeVisible()
  await page.waitForTimeout(1500)
  const { scrollWidth, width, offenders } = await overflowing(page)
  expect(scrollWidth, `${path}: ${offenders.join(', ')}`).toBeLessThanOrEqual(width + 1)
}

test.describe('con 320 px de ancho (zoom al 400 %)', () => {
  test.use({ viewport: { width: 320, height: 640 } })
  for (const path of PAGES) {
    test(`${path} no se sale en horizontal`, async ({ page }) => {
      await expectNoHorizontalScroll(page, path)
    })
  }
})

test.describe('con el móvil en horizontal (1.3.4)', () => {
  test.use({ viewport: { width: 740, height: 360 } })
  for (const path of ['/', '/playground/image-classification/model/IMAGE-MNIST', '/playground/tabular-classification/dataset/IRIS']) {
    test(`${path} se usa igual`, async ({ page }) => {
      await expectNoHorizontalScroll(page, path)
    })
  }
})

test.describe('con el espaciado de texto máximo de WCAG (1.4.12) y el texto al 200 %', () => {
  test.use({ viewport: { width: 1280, height: 800 } })
  for (const path of ['/', '/playground/tabular-classification/dataset/IRIS', '/analyze?dataset=iris', '/settings']) {
    test(`${path} no se sale ni se corta`, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('n4l-display', JSON.stringify({ spacing: true, textSize: 200 }))
        } catch {
          // Sin almacenamiento no se aplicaría
        }
      })
      await expectNoHorizontalScroll(page, path)
      await expect(page.locator('html')).toHaveClass(/n4l-text-spacing/)
    })
  }
})
