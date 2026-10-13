import type { Locator, Page } from '@playwright/test'
import { test, expect } from './fixtures'
import { axeViolations, expandChartData } from './axe'

// Accesibilidad (e2e/axe.ts) de lo que aparece al usar la aplicación y no está al cargar la página
// (accesibilidad.spec.ts): modales, desplegables, la guía, los avisos, los resultados y los errores. En los dos temas.

const THEMES = ['light', 'dark'] as const

/** Espera a que termine de aparecer (con un fundido): a medio camino, axe ve el texto sin contraste */
const toBeOpaque = (locator: Locator) => expect.poll(() => locator.evaluate((element) => {
  let opacity = 1
  for (let node: Element | null = element; node !== null; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity)
  return opacity
})).toBe(1)

/** Prepara el estado en cada tema (lo que hace `open` tras cargar la página) y lo revisa con axe */
async function checkInBothThemes(page: Page, name: string, open: () => Promise<void>) {
  for (const colorScheme of THEMES) {
    await page.emulateMedia({ colorScheme })
    await open()
    // El «Descargado» de un modelo recién cargado se desvanece: a medio camino axe lo ve sin contraste
    await expect(page.getByTestId('Test-DownloadProgress')).toHaveCount(0)
    expect(await axeViolations(page), `${name} (tema ${colorScheme === 'light' ? 'claro' : 'oscuro'})`).toEqual([])
  }
}

test('el modal de un conjunto de datos, con sus datos y sus estadísticas', async ({ page }) => {
  await checkInBothThemes(page, 'modal de Iris', async () => {
    await page.goto('/datasets')
    await page.getByTestId('Test-DatasetInfo-IRIS').click()
    const modal = page.getByRole('dialog')
    await modal.getByRole('tab', { name: 'Datos' }).click()
    await expect(modal.getByText('150 filas × 5 columnas')).toBeVisible()
    await expect(modal.locator('.js-plotly-plot')).toBeVisible()
  })
})

test('los desplegables de la barra de navegación', async ({ page }) => {
  for (const [name, button] of [['Tareas', 'Tareas'], ['idioma', /Idioma/], ['tema', /Tema/]] as const) {
    await checkInBothThemes(page, `desplegable ${name}`, async () => {
      await page.goto('/')
      await page.locator('.n4l-navbar').getByRole('button', { name: button }).click()
      await expect(page.locator('.n4l-navbar .dropdown-menu.show')).toBeVisible()
    })
  }
})

test('la guía de una página, abierta', async ({ page }) => {
  await page.addInitScript(() => {
    window.speechSynthesis.speak = () => {}
    // La guía recuerda que estaba abierta: al cargar la página en el otro tema se abriría sola
    Object.keys(localStorage).filter((key) => key.startsWith('n4l-guide-progress.')).forEach((key) => localStorage.removeItem(key))
  })
  await checkInBothThemes(page, 'guía de CAR', async () => {
    await page.goto('/playground/tabular-classification/model/CAR')
    await page.getByTestId('Test-GuideButton').click()
    await expect(page.getByTestId('Test-GuideTooltip')).toContainText('Paso 1 de')
    await toBeOpaque(page.getByTestId('Test-GuideTooltip'))
  })
})

test('el aviso de cookies', async ({ page }) => {
  await checkInBothThemes(page, 'aviso de cookies', async () => {
    await page.context().clearCookies()
    await page.goto('/')
    await expect(page.getByTestId('Test-CookiesBanner')).toBeVisible()
  })
})

test('un modelo ya entrenado tras clasificar un ejemplo (con el aviso de «modelo cargado»)', async ({ page }) => {
  await checkInBothThemes(page, 'IRIS tras clasificar', async () => {
    await page.goto('/playground/tabular-classification/model/IRIS')
    await expect(page.locator('.swal2-popup')).toContainText('Modelo cargado con éxito', { timeout: 30_000 })
    await page.locator('[data-guide="classify"] button').click()
    await expect(page.getByText(/Clase predicha/).first()).toBeVisible({ timeout: 30_000 })
  })
})

test('el aviso de una red mal montada y el error al intentar entrenarla', async ({ page }) => {
  await checkInBothThemes(page, 'red mal montada', async () => {
    await page.goto('/playground/tabular-classification/dataset/IRIS')
    const layers = page.locator('[data-guide="layers"]')
    await expect(page.getByTestId('Test-TrainButton')).toBeVisible({ timeout: 60_000 })
    const last = await layers.locator('.accordion-button').count() - 1
    await layers.locator('.accordion-button').nth(last).click()
    await page.locator('#formUnitsLayer' + last).fill('5')
    await expect(page.getByTestId('Test-LayerCheck-output-units')).toBeVisible()
    await page.getByTestId('Test-TrainButton').click()
    await expect(page.locator('.swal2-popup')).toContainText('así no se puede entrenar')
  })
})

test('el error al abrir un fichero que no es un .n4l', async ({ page }) => {
  await checkInBothThemes(page, 'error de .n4l', async () => {
    await page.goto('/packages')
    await page.locator('input#drop-zone-n4l').setInputFiles({ name: 'roto.n4l', mimeType: 'application/octet-stream', buffer: Buffer.from('hola') })
    await expect(page.getByTestId('Test-N4LImportError')).toContainText('no es un fichero .n4l')
  })
})

test('el glosario con una búsqueda sin resultados', async ({ page }) => {
  await checkInBothThemes(page, 'glosario sin resultados', async () => {
    await page.goto('/glossary')
    await page.getByRole('searchbox').first().fill('zzzzzz')
    await page.waitForTimeout(500)
  })
})

test('el modal con la descripción de un modelo', async ({ page }) => {
  await checkInBothThemes(page, 'descripción de COCO SSD', async () => {
    await page.goto('/select-model/object-detection')
    await page.getByTestId('Test-MenuSelectModel-Option-COCO-SSD').getByRole('button', { name: /^Descripción/ }).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByRole('link', { name: 'Abrir' })).toBeVisible()
    await toBeOpaque(modal)
  })
})

test('el modal para compartir un ejercicio', async ({ page }) => {
  await checkInBothThemes(page, 'compartir un ejercicio', async () => {
    await page.goto('/playground/tabular-classification/dataset/IRIS')
    await expect(page.getByTestId('Test-TrainButton')).toBeVisible({ timeout: 60_000 })
    await page.getByTestId('Test-SessionShare').click()
    const modal = page.getByTestId('Test-SessionShare-Modal')
    await expect(modal.getByTestId('Test-SessionShare-QR')).toBeVisible()
    await toBeOpaque(modal)
  })
})

test('las fórmulas llevan MathML para los lectores de pantalla y su dibujo queda oculto para ellos', async ({ page }) => {
  await page.goto('/glossary')
  await expect(page.locator('main h1')).toBeVisible()
  const formulas = page.locator('.katex')
  await expect(formulas.first()).toBeVisible()
  const count = await formulas.count()
  expect(count).toBeGreaterThan(5)
  await expect(page.locator('.katex .katex-mathml math')).toHaveCount(count)
  await expect(page.locator('.katex .katex-html[aria-hidden="true"]')).toHaveCount(count)
})

test('los datos de las gráficas del AED, desplegados', async ({ page }) => {
  await checkInBothThemes(page, 'AED con los datos de sus gráficas', async () => {
    await page.goto('/analyze?dataset=iris')
    await expect(page.getByTestId('Test-AnalyzeInfo')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('Test-ChartData-Toggle').first()).toBeVisible()
    await expandChartData(page)
    await expect(page.getByTestId('Test-ChartData').getByRole('table').first()).toBeVisible()
  })
})

test('tras entrenar dos modelos: las curvas, la comparación y sus datos', async ({ page }) => {
  test.setTimeout(300_000)
  await page.goto('/playground/tabular-classification/dataset/IRIS')
  await page.getByRole('spinbutton', { name: 'N. épocas' }).fill('2')
  for (const model of [1, 2]) {
    await page.getByTestId('Test-TrainButton').click()
    await expect(page.getByText(new RegExp(`Lista (de )?modelos generados \\| ${model}`))).toBeVisible({ timeout: 240_000 })
    await expect(page.getByTestId('Test-TrainButton')).toBeVisible()
    await page.locator('#tfjs-visor-container').getByRole('button', { name: 'Hide' }).click()
  }
  // La tendencia de cada curva, en texto
  await expect(page.getByTestId('Test-TrainingCurves-Trend').first()).toContainText('en 2 épocas')
  // El aviso de «modelo entrenado» se va solo: a medio fundido axe lo vería sin contraste
  await expect(page.locator('.swal2-container')).toHaveCount(0, { timeout: 15_000 })
  for (const colorScheme of THEMES) {
    await page.emulateMedia({ colorScheme })
    await expandChartData(page)
    expect(await axeViolations(page), `curvas (tema ${colorScheme === 'light' ? 'claro' : 'oscuro'})`).toEqual([])
  }
  await page.getByTestId('Test-TrainingCurves-Compare').check()
  await expect(page.getByTestId('Test-ModelComparison').locator('canvas').first()).toBeVisible()
  for (const colorScheme of THEMES) {
    await page.emulateMedia({ colorScheme })
    await expandChartData(page)
    expect(await axeViolations(page), `comparación (tema ${colorScheme === 'light' ? 'claro' : 'oscuro'})`).toEqual([])
  }
})

test('con todos los ajustes de accesibilidad activados (alto contraste, texto grande, espaciado…)', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('n4l-display', JSON.stringify({ textSize: 150, spacing: true, highContrast: true, reduceMotion: true, underlineLinks: true, strongFocus: true }))
    } catch {
      // Sin almacenamiento no se aplicarían
    }
  })
  for (const path of ['/', '/playground/tabular-classification/dataset/IRIS', '/analyze?dataset=iris', '/settings']) {
    await checkInBothThemes(page, `${path} con los ajustes`, async () => {
      await page.goto(path)
      await expect(page.locator('main').first()).toBeVisible()
      await expect(page.locator('html')).toHaveClass(/n4l-high-contrast/)
      await page.waitForTimeout(1500)
    })
  }
})

test('los ajustes de /settings cambian la página al momento y se recuerdan', async ({ page }) => {
  await page.goto('/settings#accessibility')
  const section = page.getByTestId('Test-Settings-accessibility')
  const html = page.locator('html')
  await section.getByLabel('150 %').check()
  await expect(html).toHaveAttribute('data-n4l-text-size', '150')
  await section.getByLabel('Subrayar siempre los enlaces').check()
  await expect(html).toHaveClass(/n4l-underline-links/)
  await section.getByLabel('Reducir el movimiento').check()
  await expect(html).toHaveClass(/n4l-reduce-motion/)
  // Con el texto grande, la barra de navegación es la del móvil (la del escritorio no cabe)
  await expect(page.locator('.navbar-toggler')).toBeVisible()
  await page.reload()
  await expect(html).toHaveAttribute('data-n4l-text-size', '150')
  await expect(html).toHaveClass(/n4l-underline-links/)
})

test('cada apartado de /settings (sus pestañas)', async ({ page }) => {
  for (const colorScheme of THEMES) {
    await page.emulateMedia({ colorScheme })
    await page.goto('/settings')
    const tabs = page.getByRole('tablist', { name: 'Apartados de la configuración' }).getByRole('tab')
    await expect(tabs).toHaveCount(9)
    for (let index = 0; index < 9; index++) {
      await tabs.nth(index).click()
      await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true')
      // La pestaña cambia de color con una transición de Bootstrap (0,15 s): a medio camino axe la vería sin contraste
      await page.waitForTimeout(300)
      const name = await tabs.nth(index).textContent()
      expect(await axeViolations(page), `${name} (tema ${colorScheme === 'light' ? 'claro' : 'oscuro'})`).toEqual([])
    }
  }
})
