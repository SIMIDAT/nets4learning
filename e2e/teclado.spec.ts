import path from 'node:path'
import type { Locator, Page } from '@playwright/test'
import { test, expect } from './fixtures'

// Sin ratón (WCAG 2.1.1): los flujos principales solo con el tabulador, Enter, Espacio y las flechas, como quien usa el
// teclado, un conmutador o un lector de pantalla. Si algo no se puede alcanzar o activar así, la prueba falla.

/** El tabulador hasta llegar a `target` (o a algo de dentro); falla si no se llega en `max` pulsaciones */
async function tabTo(page: Page, target: Locator, max = 200) {
  await expect(target).toBeVisible()
  for (let index = 0; index < max; index++) {
    await page.keyboard.press('Tab')
    const isFocused = await target.evaluate((element) => element.contains(document.activeElement)).catch(() => false)
    if (isFocused) return
  }
  throw new Error(`con el tabulador no se llega a ${target}`)
}

/** Lo que tiene el foco: su etiqueta y su texto, para los mensajes de las pruebas */
const focused = (page: Page) => page.evaluate(() => {
  const element = document.activeElement
  return element === null ? '' : `${element.tagName.toLowerCase()} ${element.textContent?.trim().slice(0, 40) ?? ''}`
})

test('«Saltar al contenido» es lo primero al tabular y lleva a la página sin pasar por el menú', async ({ page }) => {
  await page.goto('/glossary')
  await expect(page.locator('main h1')).toBeVisible()
  await page.keyboard.press('Tab')
  const skip = page.getByTestId('Test-SkipLink')
  await expect(skip).toBeFocused()
  await expect(skip).toHaveText('Saltar al contenido')
  // Oculto hasta que recibe el foco; entonces se ve
  expect((await skip.boundingBox())?.width ?? 0).toBeGreaterThan(50)
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  // La dirección no cambia (no es otra navegación) y lo siguiente ya es de la página, no de la barra de navegación
  await expect(page).toHaveURL(/\/glossary$/)
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => document.querySelector('main')?.contains(document.activeElement)), await focused(page)).toBe(true)
})

test('cada página tiene su título: lo que se ve en la pestaña y lo primero que se anuncia', async ({ page }) => {
  await page.goto('/playground/time-series/dataset/AIRLINE-PASSENGERS')
  await expect(page).toHaveTitle('Pasajeros de avión - Entrenar un modelo - Series temporales - Nets4Learning')
  await page.locator('.n4l-navbar').getByRole('link', { name: 'Glosario', exact: true }).click()
  await expect(page).toHaveTitle('Glosario - Nets4Learning')
  await page.goto('/datasets?task=time-series')
  await expect(page).toHaveTitle('Conjuntos de datos - Series temporales - Nets4Learning')
  await page.goto('/no-existe')
  await expect(page).toHaveTitle('Página no encontrada - Nets4Learning')
})

test('solo con el teclado: de la portada a entrenar una serie temporal y ver su resultado', async ({ page }) => {
  await page.goto('/')
  await tabTo(page, page.getByTestId('Test-InitialMenu-TimeSeries'))
  await page.keyboard.press('Enter')
  await tabTo(page, page.getByTestId('Test-GoTo-SelectDataset-TimeSeries'))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/select-dataset\/time-series$/)
  // En la página nueva, el foco empieza en su título
  await expect(page.locator('main h1')).toBeFocused()

  await tabTo(page, page.getByTestId('Test-MenuSelectDataset-Open-SUNSPOTS'))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/playground\/time-series\/dataset\/SUNSPOTS$/)

  await tabTo(page, page.locator('#time-series-epochs'))
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('2')
  await expect(page.locator('#time-series-epochs')).toHaveValue('2')
  await tabTo(page, page.getByTestId('Test-TrainButton'))
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('Test-TimeSeries-Verdict')).toBeVisible({ timeout: 60_000 })
  // El aviso de «modelo entrenado» no se lleva el foco: sigue donde estaba
  await expect(page.getByTestId('Test-TrainButton')).toBeFocused()
})

test('solo con el teclado: se añade una capa, se despliega y se borra', async ({ page }) => {
  await page.goto('/playground/tabular-classification/dataset/IRIS')
  const layers = page.locator('[data-guide="layers"] .accordion-item')
  await expect(layers.first()).toBeVisible({ timeout: 30_000 })
  const count = await layers.count()

  await tabTo(page, page.getByRole('button', { name: 'Añadir capa al final' }))
  await page.keyboard.press('Enter')
  await expect(layers).toHaveCount(count + 1)

  // La nueva va al final
  const header = layers.nth(count).locator('.accordion-button')
  await tabTo(page, header)
  await page.keyboard.press('Enter')
  await expect(header).toHaveAttribute('aria-expanded', 'true')
  await tabTo(page, layers.nth(count).getByRole('button', { name: /Eliminar capa/ }))
  await page.keyboard.press('Space')
  await expect(layers).toHaveCount(count)
  await expect(page.getByTestId('Test-Announcer')).toContainText('Puedes deshacerlo')

  // Se puede deshacer: vuelve la capa y el foco va a ella
  const undo = page.getByTestId('Test-LayerUndo')
  await page.keyboard.down('Shift')
  for (let index = 0; index < 30 && !(await undo.evaluate((element) => element === document.activeElement)); index++) await page.keyboard.press('Tab')
  await page.keyboard.up('Shift')
  await expect(undo).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(layers).toHaveCount(count + 1)
  await expect(layers.nth(count).locator('.accordion-button')).toBeFocused()
  await expect(page.getByTestId('Test-LayerRemoved')).toHaveCount(0)
})

test('solo con el teclado: un modelo ya entrenado clasifica un ejemplo', async ({ page }) => {
  await page.goto('/playground/tabular-classification/model/IRIS')
  await expect(page.locator('.swal2-popup')).toContainText('Modelo cargado con éxito', { timeout: 30_000 })
  await tabTo(page, page.locator('[data-guide="classify"] button'))
  await page.keyboard.press('Enter')
  await expect(page.getByText(/Clase predicha/).first()).toBeVisible({ timeout: 30_000 })
})

test('solo con el teclado: se analiza en el AED un conjunto del proyecto', async ({ page }) => {
  await page.goto('/analyze')
  await tabTo(page, page.locator('#analyze-project-dataset'))
  // Con el selector cerrado, la flecha elige la opción siguiente; si se abre la lista, Enter la elige
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/analyze\?dataset=/)
  await expect(page.getByTestId('Test-AnalyzeInfo')).toBeVisible({ timeout: 30_000 })
  // Mientras cargaba se desactivó: el foco vuelve al selector, no al principio de la página
  await expect(page.locator('#analyze-project-dataset')).toBeFocused()
})

test('solo con el teclado: se sube un fichero propio al AED', async ({ page }) => {
  await page.goto('/analyze')
  // La zona de arrastrar y soltar se alcanza con el tabulador y abre el selector de ficheros con Enter
  const zone = page.locator('#dataset-upload').locator('..')
  await tabTo(page, zone)
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.keyboard.press('Enter')])
  await chooser.setFiles(path.join(__dirname, 'files', 'iris.arff'))
  await expect(page.getByTestId('Test-AnalyzeInfo')).toContainText('150 filas × 5 columnas')
})

test('solo con el teclado: un modal se abre con el foco dentro, no se sale con el tabulador y Escape lo cierra y devuelve el foco', async ({ page }) => {
  await page.goto('/select-model/object-detection')
  const opener = page.getByTestId('Test-MenuSelectModel-Option-COCO-SSD').getByRole('button', { name: /^Descripción/ })
  await tabTo(page, opener)
  await page.keyboard.press('Enter')
  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible()
  await expect.poll(() => modal.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab')
    expect(await modal.evaluate((element) => element.contains(document.activeElement)), await focused(page)).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(modal).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test('solo con el teclado: los desplegables de la barra y de las migas de pan', async ({ page }) => {
  await page.goto('/playground/tabular-classification/model/IRIS')
  // «Tareas»: Enter lo abre, las flechas recorren sus elementos y Escape lo cierra volviendo al botón
  const tasks = page.locator('.n4l-navbar').getByRole('button', { name: 'Tareas' })
  await tabTo(page, tasks)
  await page.keyboard.press('Enter')
  await expect(tasks).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.n4l-navbar .dropdown-menu.show .dropdown-item').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(tasks).toHaveAttribute('aria-expanded', 'false')
  await expect(tasks).toBeFocused()

  // La miga de pan cambia de modelo
  const toggle = page.getByTestId('Test-Breadcrumb').locator('.n4l-breadcrumb-toggle')
  await tabTo(page, toggle)
  await page.keyboard.press('Enter')
  const car = page.getByTestId('Test-Breadcrumb').locator('.dropdown-item', { hasText: 'Clasificación de coches' })
  for (let index = 0; index < 10 && !(await car.evaluate((element) => element === document.activeElement)); index++) await page.keyboard.press('ArrowDown')
  await expect(car).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/playground\/tabular-classification\/model\/CAR$/)
})

test('solo con el teclado: pestañas con las flechas y páginas de una tabla', async ({ page }) => {
  await page.goto('/playground/time-series/model/SUNSPOTS')
  const card = page.getByTestId('Test-ModelReviewDataset')
  const tabs = card.getByRole('tab')
  await expect(tabs.first()).toBeVisible({ timeout: 30_000 })
  // La tabla de los valores, con sus páginas
  const pages = card.getByRole('navigation', { name: 'Páginas de la tabla' })
  await tabTo(page, pages.getByRole('button', { name: 'Página siguiente' }))
  await page.keyboard.press('Enter')
  await expect(pages.locator('[aria-current="page"]')).toContainText('2')

  // Las pestañas: la flecha pasa a la siguiente
  await tabs.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(tabs.nth(1)).toBeFocused()
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
})

test('solo con el teclado: el aviso de una red mal montada se arregla con su botón', async ({ page }) => {
  await page.goto('/playground/tabular-classification/dataset/IRIS')
  const layers = page.locator('[data-guide="layers"]')
  await expect(page.getByTestId('Test-TrainButton')).toBeVisible({ timeout: 60_000 })
  const last = await layers.locator('.accordion-button').count() - 1
  await tabTo(page, layers.locator('.accordion-button').nth(last))
  await page.keyboard.press('Enter')
  await tabTo(page, page.locator('#formUnitsLayer' + last))
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('5')
  // El lector de pantalla oye el problema al aparecer
  await expect(page.getByTestId('Test-Announcer')).toContainText('hay 3 clases')
  const fix = page.getByTestId('Test-LayerCheck').getByTestId('Test-LayerCheck-Fix').first()
  await page.keyboard.down('Shift')
  for (let index = 0; index < 60 && !(await fix.evaluate((element) => element === document.activeElement)); index++) await page.keyboard.press('Tab')
  await page.keyboard.up('Shift')
  await expect(fix).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('Test-LayerCheck')).toHaveCount(0)
  await expect(page.getByTestId('Test-Announcer')).toContainText('Las capas ya no tienen nada que revisar')
})

test('solo con el teclado: la guía se abre con el foco dentro, las flechas pasan de paso y Escape la cierra', async ({ page }) => {
  await page.addInitScript(() => {
    window.speechSynthesis.speak = () => {}
  })
  await page.goto('/playground/tabular-classification/model/CAR')
  const button = page.getByTestId('Test-GuideButton')
  await tabTo(page, button)
  await page.keyboard.press('Enter')
  const tooltip = page.getByTestId('Test-GuideTooltip')
  await expect(tooltip).toContainText('Paso 1 de')
  // El foco, en el título del paso; el diálogo se llama como él
  await expect(tooltip.getByRole('heading', { level: 2 })).toBeFocused()
  await expect(tooltip).toHaveAccessibleName(/Clasificación de coches/)
  await expect(page.getByTestId('Test-Announcer')).toContainText('Paso 1 de')

  await page.keyboard.press('ArrowRight')
  await expect(tooltip).toContainText('Paso 2 de')
  await expect(page.getByTestId('Test-Announcer')).toContainText('Paso 2 de')
  await page.keyboard.press('ArrowLeft')
  await expect(tooltip).toContainText('Paso 1 de')

  await page.keyboard.press('Escape')
  await expect(tooltip).toHaveCount(0)
  await expect(button).toBeFocused()
})

test('solo con el teclado: el aviso de cookies se alcanza enseguida, se decide y, al abrirlo desde el pie, el foco va y vuelve', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto('/glossary')
  const banner = page.getByTestId('Test-CookiesBanner')
  await expect(banner).toBeVisible()
  // Justo después de «Saltar al contenido», antes de la barra de navegación
  await page.keyboard.press('Tab')
  await expect(page.getByTestId('Test-SkipLink')).toBeFocused()
  await page.keyboard.press('Tab')
  expect(await banner.evaluate((element) => element.contains(document.activeElement)), await focused(page)).toBe(true)
  await tabTo(page, banner.getByTestId('Test-CookiesReject'), 10)
  await page.keyboard.press('Enter')
  await expect(banner).toHaveCount(0)
  // El foco no se pierde: va a la página
  expect(await page.evaluate(() => document.querySelector('main')?.contains(document.activeElement)), await focused(page)).toBe(true)

  // Desde el pie: el foco entra en el aviso y, al cerrarlo, vuelve al enlace
  const preferences = page.locator('.n4l-footer').getByRole('link', { name: 'Preferencias de cookies', exact: true })
  await preferences.focus()
  await page.keyboard.press('Enter')
  await expect(banner.getByRole('heading', { level: 2 })).toBeFocused()
  await tabTo(page, banner.getByRole('button', { name: 'Cerrar sin cambiar nada' }), 20)
  await page.keyboard.press('Enter')
  await expect(banner).toHaveCount(0)
  await expect(preferences).toBeFocused()
})

test('solo con el teclado: «Ver los datos» de una gráfica despliega su tabla, que se recorre con el teclado', async ({ page }) => {
  await page.goto('/analyze?dataset=iris')
  await expect(page.getByTestId('Test-AnalyzeInfo')).toBeVisible({ timeout: 30_000 })
  const data = page.getByTestId('Test-ChartData').first()
  const toggle = data.getByTestId('Test-ChartData-Toggle')
  await tabTo(page, toggle)
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  const table = data.getByRole('table')
  await expect(table).toBeVisible()
  // Encabezados de columna y de fila, y la región se alcanza con el tabulador (por si hay que desplazarla)
  await expect(table.getByRole('columnheader').first()).toBeVisible()
  await expect(table.getByRole('rowheader').first()).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(data.getByRole('region')).toBeFocused()
})

test('solo con el teclado: los apartados de /settings son pestañas verticales que se recorren con las flechas', async ({ page }) => {
  await page.goto('/settings')
  const tabs = page.getByRole('tablist', { name: 'Apartados de la configuración' })
  await expect(tabs).toHaveAttribute('aria-orientation', 'vertical')
  const first = tabs.getByRole('tab').first()
  await tabTo(page, first)
  await page.keyboard.press('ArrowDown')
  const accessibility = tabs.getByRole('tab', { name: 'Accesibilidad' })
  await expect(accessibility).toBeFocused()
  await expect(accessibility).toHaveAttribute('aria-selected', 'true')
  await expect(page).toHaveURL(/\/settings#accessibility$/)
  // Lo siguiente con el tabulador ya es el apartado abierto
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => document.querySelector('[data-testid="Test-Settings-accessibility"]')?.contains(document.activeElement)), await focused(page)).toBe(true)

  // Un enlace a un apartado (desde la declaración de accesibilidad) lo abre
  await page.goto('/accessibility')
  await page.getByRole('link', { name: 'Ir a los ajustes de accesibilidad' }).click()
  await expect(page.getByRole('tab', { name: 'Accesibilidad' })).toHaveAttribute('aria-selected', 'true')
  // El enlace lleva a la pestaña, con el foco en ella (el lector la anuncia)
  await expect(page.getByRole('tab', { name: 'Accesibilidad' })).toBeFocused()
  await expect(page.getByTestId('Test-Settings-accessibility')).toBeVisible()
})
