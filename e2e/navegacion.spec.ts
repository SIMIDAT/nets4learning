import path from 'node:path'
import { test, expect } from './fixtures'

test('la home enseña la tarjeta de la tarea elegida', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('Test-InitialMenu-LinearRegression').click()
  await expect(page.getByTestId('Test-GoTo-SelectModel-LinearRegression')).toBeVisible()
})

test('la barra de navegación lleva a cada página y marca la actual', async ({ page }) => {
  await page.goto('/')
  const navbar = page.locator('.n4l-navbar')
  for (const [name, path] of [['Manual', '/manual'], ['Glosario', '/glossary'], ['Conjuntos de datos', '/datasets'], ['AED', '/analyze']]) {
    await navbar.getByRole('link', { name, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(path + '$'))
    await expect(navbar.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page')
  }
})

test('las migas de pan cambian de modelo y llevan a entrenar con su dataset', async ({ page }) => {
  await page.goto('/playground/tabular-classification/model/IRIS')
  const breadcrumb = page.getByTestId('Test-Breadcrumb')
  await breadcrumb.locator('.n4l-breadcrumb-toggle').click()
  await breadcrumb.locator('.dropdown-item', { hasText: 'Clasificación de coches' }).click()
  await expect(page).toHaveURL(/\/playground\/tabular-classification\/model\/CAR$/)
  await expect(breadcrumb.locator('.n4l-breadcrumb-toggle')).toContainText('Clasificación de coches')

  await breadcrumb.locator('.n4l-breadcrumb-toggle').click()
  await breadcrumb.getByTestId('Test-Breadcrumb-OtherKind').click()
  await expect(page).toHaveURL(/\/playground\/tabular-classification\/dataset\/CAR$/)

  // La tarea lleva a su tarjeta en la home
  await breadcrumb.locator('.n4l-breadcrumb-task a').click()
  await expect(page).toHaveURL(/\/\?task=tabular-classification$/)
})

test('el AED analiza un conjunto de datos del proyecto', async ({ page }) => {
  await page.goto('/analyze')
  await page.locator('#analyze-project-dataset').selectOption('models/00-tabular-classification/iris/iris.csv')
  await expect(page.getByTestId('Test-AnalyzeInfo')).toContainText('150')
  await expect(page.getByTestId('Test-AnalyzeTile-rows')).toContainText('150')
  await expect(page.getByTestId('Test-AnalyzeProblem')).toBeVisible()
  // El conjunto queda en la dirección y el resumen trae la distribución del objetivo y los avisos en sus tarjetas
  await expect(page).toHaveURL(/\/analyze\?dataset=iris$/)
  await expect(page.getByTestId('Test-AnalyzeTargetCard')).toContainText('class')
  await expect(page.getByTestId('Test-AnalyzeWarningsCard')).toBeVisible()
})

// Ficheros propios en otros formatos o con otro separador: todos acaban siendo el mismo dataframe
const UPLOADS = [
  { file: 'iris.arff', shape: '150 filas × 5 columnas', numeric: 'Numéricas: 4' },
  { file: 'iris.json', shape: '150 filas × 5 columnas', numeric: 'Numéricas: 4' },
  { file: 'iris-pandas.json', shape: '150 filas × 5 columnas', numeric: 'Numéricas: 4' },
  { file: 'iris.jsonl', shape: '150 filas × 5 columnas', numeric: 'Numéricas: 4' },
  { file: 'iris.parquet', shape: '150 filas × 5 columnas', numeric: 'Numéricas: 4' },
  { file: 'iris-zstd.parquet', shape: '150 filas × 5 columnas', numeric: 'Numéricas: 4' },
  // ";" y coma decimal (Excel en español), y el mismo alineado con comas: sin las columnas vacías del final
  { file: 'aire-punto-y-coma.csv', shape: '6 filas × 7 columnas', numeric: 'Numéricas: 4' },
  { file: 'aire-alineado.csv', shape: '6 filas × 7 columnas', numeric: 'Numéricas: 4' },
]

for (const { file, shape, numeric } of UPLOADS) {
  test(`el AED lee ${file}`, async ({ page }) => {
    await page.goto('/analyze')
    await page.locator('input[type=file][accept*=".parquet"]').setInputFiles(path.join(__dirname, 'files', file))
    await expect(page.getByTestId('Test-AnalyzeInfo')).toContainText(shape)
    await expect(page.getByTestId('Test-AnalyzeTile-columns')).toContainText(numeric)
  })
}

test('desde /datasets un conjunto se abre en el AED', async ({ page }) => {
  await page.goto('/datasets')
  await page.getByTestId('Test-DatasetAnalyze-car').click()
  await expect(page).toHaveURL(/\/analyze\?dataset=car$/)
  await expect(page.getByTestId('Test-AnalyzeInfo')).toContainText('1728')
  await expect(page.locator('#analyze-project-dataset')).toHaveValue('models/00-tabular-classification/car/car.csv')
})

test('el modal de un conjunto de /datasets enseña sus datos y sus estadísticas', async ({ page }) => {
  await page.goto('/datasets')
  await page.getByTestId('Test-DatasetInfo-IRIS').click()
  const modal = page.getByRole('dialog')
  await modal.getByRole('tab', { name: 'Datos' }).click()
  await expect(modal.getByText('150 filas × 5 columnas')).toBeVisible()
  await expect(modal.locator('.js-plotly-plot')).toBeVisible()
  await modal.getByRole('tab', { name: 'Estadísticas' }).click()
  await expect(modal.locator('.tab-pane.active .js-plotly-plot')).toBeVisible()
  await page.keyboard.press('Escape')

  // Con varios ficheros se elige cuál (el vino: tinto y blanco)
  await page.getByRole('tab', { name: 'Regresión' }).click()
  await page.getByTestId('Test-DatasetInfo-WINE').click()
  await modal.getByRole('tab', { name: 'Datos' }).click()
  await expect(modal.getByText('1599 filas × 12 columnas')).toBeVisible()
  await modal.locator('.tab-pane.active select').selectOption({ label: 'wine-quality-white.csv' })
  await expect(modal.getByText('4898 filas × 12 columnas')).toBeVisible()
})

test('la barra de navegación se queda fija arriba al bajar', async ({ page }) => {
  await page.goto('/glossary')
  // Se insiste hasta que la página es larga y baja de verdad
  await expect.poll(async () => {
    await page.evaluate(() => window.scrollTo(0, 3000))
    return page.evaluate(() => window.scrollY)
  }).toBeGreaterThan(500)
  const box = await page.locator('.n4l-navbar').boundingBox()
  expect(box?.y).toBe(0)
  await expect(page.locator('.n4l-navbar').getByRole('link', { name: 'Glosario', exact: true })).toBeInViewport()
})

test('el glosario busca términos y cada uno tiene su enlace', async ({ page }) => {
  await page.goto('/glossary')
  await page.getByRole('searchbox').fill('relu')
  await expect(page.getByTestId('Test-GlossaryResults')).toContainText('términos')
  await expect(page.locator('#glossary-activation-relu')).toBeVisible()
  await expect(page.locator('#glossary-optimizer-adam')).toHaveCount(0)

  // Un enlace directo lleva al término (con su fórmula y su gráfica)
  await page.goto('/')
  await page.goto('/glossary#glossary-activation-sigmoid')
  const sigmoid = page.locator('#glossary-activation-sigmoid')
  await expect(sigmoid).toBeInViewport()
  await expect(sigmoid.locator('.katex')).toBeVisible()
  await expect(sigmoid.locator('img')).toHaveJSProperty('complete', true)
})

test('el diseño de capas se maximiza a pantalla completa y Escape lo devuelve a su sitio', async ({ page }) => {
  await page.goto('/playground/regression/dataset/AUTO_MPG')
  const card = page.locator('.card', { has: page.getByRole('heading', { name: 'Diseño de capas' }) })
  const graph = card.locator('#vis-network canvas')
  await expect(graph).toBeVisible()
  expect((await graph.boundingBox())?.height).toBe(250)

  await card.getByRole('button', { name: 'Maximizar' }).click()
  const viewport = page.viewportSize()!
  await expect.poll(() => card.boundingBox()).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height })
  // El grafo crece con la tarjeta
  await expect.poll(async () => (await graph.boundingBox())?.height ?? 0).toBeGreaterThan(400)

  await page.keyboard.press('Escape')
  await expect(card.getByRole('button', { name: 'Maximizar' })).toBeVisible()
  await expect.poll(async () => (await graph.boundingBox())?.height).toBe(250)
})

test('la revisión de un modelo de regresión enseña el análisis de su conjunto de datos', async ({ page }) => {
  await page.goto('/playground/regression/model/AUTO_MPG')
  await page.getByTestId('Test-ModelReviewDataset-AnalysisTab').click()
  await expect(page.getByTestId('Test-AnalyzeTile-rows')).toContainText('396')
  await expect(page.getByTestId('Test-AnalyzeTargetCard')).toContainText('mpg')
  await expect(page.getByTestId('Test-AnalyzeWarningsCard')).toBeVisible()
  await expect(page.getByTestId('Test-AnalyzeEssentialsLink')).toHaveAttribute('href', '/analyze?dataset=auto-mpg')
  // La tarjeta del gráfico de dispersión ya no está: la dispersión va en el análisis
  await expect(page.getByRole('heading', { name: 'Gráfico de dispersión' })).toHaveCount(0)
})
