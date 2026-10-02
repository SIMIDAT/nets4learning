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

test('la guía del modelo CAR solo empieza con su botón y explica la página paso a paso en voz alta', async ({ page }) => {
  // Lo que se leería en voz alta
  await page.addInitScript(() => {
    const spoken: string[] = []
    Object.assign(window, { spoken })
    window.speechSynthesis.speak = (utterance) => { spoken.push(utterance.text) }
  })
  await page.goto('/playground/tabular-classification/model/CAR')
  const button = page.getByTestId('Test-GuideButton')
  await expect(button).toBeVisible()
  // Encima de "Resumen del modelo" y sin arrancar sola
  const summary = page.locator('[data-guide="model-summary"]')
  expect((await button.boundingBox())!.y).toBeLessThan((await summary.boundingBox())!.y)
  const tooltip = page.getByTestId('Test-GuideTooltip')
  await page.waitForTimeout(1500)
  await expect(tooltip).toHaveCount(0)

  await button.click()
  await expect(tooltip).toContainText('Paso 1 de 18')
  await expect(tooltip).toContainText('Clasificación de coches')
  const spoken = () => page.evaluate(() => (window as unknown as { spoken: string[] }).spoken.join(' '))
  await expect.poll(spoken).toContain('Clasificación de coches.')

  // Paso a paso hasta la seguridad, que se señala en la página
  for (let step = 2; step <= 13; step++) {
    await tooltip.getByRole('button', { name: 'Siguiente' }).click()
    await expect(tooltip).toContainText(`Paso ${step} de 18`)
  }
  await expect(tooltip).toContainText('Seguridad')
  await expect(page.locator('[data-guide="field-Safety"]')).toBeInViewport()
  await expect.poll(spoken).toContain('con seguridad baja, el coche siempre es inaceptable.')

  await page.keyboard.press('Escape')
  await expect(tooltip).toHaveCount(0)
})

// Una guía de cada tarea, entera: cada paso encuentra su elemento (si no, se saltaría y el contador daría un salto). Los
// modelos de detección y MobileNet se descargan de internet: sus guías las prueban modelReviewGuide.test.ts
const GUIDES = [
  { path: '/playground/tabular-classification/model/LYMPHOGRAPHY', ready: '[data-guide="form"]' },
  { path: '/playground/regression/model/AUTO_MPG', ready: '[data-guide="field-weight"]' },
  { path: '/playground/image-classification/model/IMAGE-MNIST', ready: '[data-guide="model-summary"]' },
]
for (const { path, ready } of GUIDES) {
  test(`la guía de ${path.split('/').pop()} recorre todos sus pasos en orden`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.addInitScript(() => { window.speechSynthesis.speak = () => {} })
    await page.goto(path)
    // Con los datos ya cargados: los pasos de cada atributo dependen de ellos
    await expect(page.locator(ready)).toBeVisible({ timeout: 60_000 })
    await page.getByTestId('Test-GuideButton').click()
    const tooltip = page.getByTestId('Test-GuideTooltip')
    await expect(tooltip).toContainText(/Paso 1 de \d+/)
    const total = Number((await tooltip.innerText()).match(/Paso 1 de (\d+)/)![1])
    for (let step = 2; step <= total; step++) {
      await tooltip.getByRole('button', { name: 'Siguiente' }).click()
      await expect(tooltip).toContainText(`Paso ${step} de ${total}`)
    }
    await tooltip.getByRole('button', { name: 'Terminar', exact: true }).click()
    await expect(tooltip).toHaveCount(0)
    await expect(page.getByTestId('Test-GuideButton')).toHaveText('Guía')
  })
}

test('el pie lleva a la configuración, y el tema elegido allí se mantiene al recargar', async ({ page }) => {
  await page.goto('/')
  await page.locator('footer').getByRole('link', { name: 'Configuración', exact: true }).click()
  await expect(page).toHaveURL(/\/settings$/)
  const theme = page.getByTestId('Test-Settings-appearance').getByLabel('Tema')
  await theme.selectOption('dark')
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark')
  await expect(page.getByTestId('Test-Settings-appearance').getByLabel('Tema')).toHaveValue('dark')
  // La barra de navegación también lo sabe
  await page.locator('.n4l-navbar').getByRole('button', { name: 'Tema' }).click()
  await expect(page.locator('.n4l-navbar .dropdown-item.active')).toContainText('Oscuro')
})

test('el modelo CAR enseña el análisis de su conjunto de datos', async ({ page }) => {
  await page.goto('/playground/tabular-classification/model/CAR')
  await page.getByTestId('Test-ModelReviewDataset-AnalysisTab').click()
  await expect(page.getByTestId('Test-AnalyzeTile-rows')).toContainText('1728')
  // Clasificación: el reparto de las clases y los avisos (las clases de car.csv están muy desequilibradas)
  await expect(page.getByTestId('Test-AnalyzeTargetCard')).toBeVisible()
  await expect(page.getByTestId('Test-AnalyzeWarningsCard')).toBeVisible()
  await expect(page.getByTestId('Test-AnalyzeEssentialsLink')).toHaveAttribute('href', '/analyze?dataset=car')
})

test('la 404 tiene de fondo una red neuronal, que se quita al volver al inicio', async ({ page }) => {
  await page.goto('/esta-ruta-no-existe')
  await expect(page).toHaveURL(/\/404$/)
  const network = page.getByTestId('Test-NotFoundNetwork')
  await expect(network).toBeAttached()
  // Ocupa todo el fondo de la página, detrás del contenido (que sigue pudiéndose pulsar)
  const [canvasBox, pageBox] = await Promise.all([network.boundingBox(), page.getByTestId('Test-NotFoundPage').boundingBox()])
  expect(canvasBox).toEqual(pageBox)
  await page.mouse.move(200, 300)
  await page.getByRole('link', { name: 'Volver al inicio' }).click()
  await expect(page.getByTestId('Test-InitialMenu-LinearRegression')).toBeVisible()
  await expect(network).not.toBeAttached()
})

test('el aviso de cookies explica qué se mide, rechazar es tan fácil como aceptar y sin aceptar no se carga Google Analytics', async ({ page }) => {
  // Sin la decisión que ponen las pruebas; lo que vaya a Google se intercepta: nada sale de la prueba
  await page.context().clearCookies()
  const google: string[] = []
  await page.route(/googletagmanager\.com|google-analytics\.com/, (route) => {
    google.push(route.request().url())
    return route.fulfill({ status: 204, body: '' })
  })
  await page.goto('/playground/tabular-classification/model/CAR')
  const banner = page.getByTestId('Test-CookiesBanner')
  await expect(banner).toBeVisible()
  await banner.getByText('Qué se mide y qué no').click()
  await expect(banner.getByTestId('Test-AnalyticsDisclosure')).toContainText('Nunca se envía')
  const [reject, accept] = await Promise.all([page.getByTestId('Test-CookiesReject').boundingBox(), page.getByTestId('Test-CookiesAccept').boundingBox()])
  expect(reject!.width).toBe(accept!.width)
  expect(reject!.height).toBe(accept!.height)
  expect(google).toEqual([])

  await page.getByTestId('Test-CookiesAccept').click()
  await expect(banner).toBeHidden()
  await expect.poll(() => google.some((url) => url.includes('googletagmanager.com/gtag/js'))).toBe(true)
  // La página en la que se aceptó queda registrada, con su contexto y sin publicidad
  const dataLayer = await page.evaluate(() => (window as unknown as { dataLayer: unknown[][] }).dataLayer.map((args) => Array.from(args)))
  expect(dataLayer).toContainEqual(['consent', 'default', expect.objectContaining({ ad_storage: 'denied', analytics_storage: 'granted' })])
  expect(dataLayer).toContainEqual(['event', 'page_view', expect.objectContaining({ page_type: 'playground', task: 'tabular-classification', mode: 'pretrained', item: 'CAR' })])
})
