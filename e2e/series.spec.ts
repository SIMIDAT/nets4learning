import { test, expect } from './fixtures'
import { axeViolations, expandChartData } from './axe'

// Series temporales: predecir los siguientes valores con los anteriores, entrenando la red en el navegador

test('desde la portada se entrena con los pasajeros de avión: la red mejora las predicciones sencillas y predice 1961', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('Test-InitialMenu-TimeSeries').click()
  await page.getByTestId('Test-GoTo-SelectDataset-TimeSeries').click()
  await expect(page).toHaveURL(/\/select-dataset\/time-series$/)
  await page.getByTestId('Test-MenuSelectDataset-Open-AIRLINE-PASSENGERS').click()

  await expect(page.getByTestId('Test-TimeSeries-Summary')).toContainText('144 valores, de 1949-01 a 1960-12, un valor al mes')
  // La prueba es lo último de la serie, sin barajar
  await expect(page.getByTestId('Test-TimeSeries-Split')).toContainText('Prueba: 1958-08 – 1960-12 (29 valores)')
  await expect(page.getByTestId('Test-TimeSeries-Windows').getByRole('row').nth(1)).toContainText('1951-01')

  await page.locator('#time-series-epochs').fill('60')
  await page.getByTestId('Test-TrainButton').click()
  await expect(page.getByTestId('Test-TimeSeries-Model-1')).toBeVisible({ timeout: 60_000 })
  const verdict = page.getByTestId('Test-TimeSeries-Verdict')
  await expect(verdict).toContainText('menos que la mejor predicción sencilla')
  await expect(page.getByTestId('Test-TimeSeries-Errors-Seasonal')).toContainText('Estacional: el de hace 12 valores')
  await expect(page.getByTestId('Test-TimeSeries-Future').getByRole('row').nth(1)).toContainText('1961-01')
  await expect(page.getByTestId('Test-TimeSeries-ForecastChart').locator('canvas')).toBeVisible()

  // Seguida: desde el final del entrenamiento, con lo ya predicho
  await page.locator('label[for="time-series-mode-recursive"]').click()
  await expect(page.getByTestId('Test-TimeSeries-Errors-Naive')).toContainText('Ingenua: el último conocido, repetido')

  // El modelo se guarda en el navegador
  await page.reload()
  await expect(page.getByTestId('Test-TimeSeries-Model-1')).toBeVisible({ timeout: 30_000 })
  await expect(verdict).toBeVisible()
})

test('desde la portada, el modelo ya entrenado de las manchas solares: su descripción, cómo predice la prueba y los meses siguientes', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('Test-InitialMenu-TimeSeries').click()
  await page.getByTestId('Test-GoTo-SelectModel-TimeSeries').click()
  await expect(page).toHaveURL(/\/select-model\/time-series$/)
  await expect(page.getByTestId('Test-MenuSelectModel-Option-SUNSPOTS')).toContainText('2820 meses, objetivo: Sunspots')
  // Su descripción, como la de los demás modelos: la del paquete, con sus métricas
  await page.getByTestId('Test-MenuSelectModel-Option-SUNSPOTS').getByRole('button', { name: /^Descripción/ }).click()
  const modal = page.getByRole('dialog')
  await expect(modal).toContainText('mínimo de Dalton')
  await modal.getByRole('link', { name: 'Abrir' }).click()
  await expect(page).toHaveURL(/\/playground\/time-series\/model\/SUNSPOTS$/)
  // Como en las demás tareas: su ficha, con cómo predice lo que no vio
  await expect(page.getByTestId('Test-TimeSeries-TestMetrics')).toContainText('se equivoca de media en 13,25 a un paso; repitiendo el valor anterior, en 14,84')
  await page.getByTestId('Test-ModelReviewDataset-WindowsTab').click()
  await expect(page.getByTestId('Test-TimeSeries-Preparation')).toContainText('Se entrenó con la serie hasta 1936-12')
  // Predecir un valor: el primero de la prueba, con los 24 meses anteriores
  await expect(page.getByTestId('Test-TimeSeries-PredictForm').getByRole('spinbutton')).toHaveCount(24)
  await page.getByTestId('Test-TimeSeries-PredictButton').click()
  await expect(page.getByTestId('Test-TimeSeries-PredictResult')).toContainText('Valor predicho de Sunspots (1937-01)')
  await expect(page.getByTestId('Test-TimeSeries-PredictActual')).toContainText('Valor real')
  // A un paso mejora un poco la ingenua; seguida, se va alejando (dos años no bastan para un ciclo de once)
  await expect(page.getByTestId('Test-TimeSeries-Verdict')).toContainText('menos que la mejor predicción sencilla', { timeout: 30_000 })
  await expect(page.getByTestId('Test-TimeSeries-Errors-Seasonal')).toHaveCount(0)
  await expect(page.getByTestId('Test-TimeSeries-Future').getByRole('row').nth(1)).toContainText('1984-01')
  // En la descripción, sus métricas del manifiesto
  await page.getByTestId('Test-N4LDescription').getByText('Modelo ya entrenado').click()
  await expect(page.getByTestId('Test-N4LDescription')).toContainText('se equivoca 13,3 manchas de media a un paso')

  await page.getByTestId('Test-TimeSeries-TrainYours').click()
  await expect(page).toHaveURL(/\/playground\/time-series\/dataset\/SUNSPOTS$/)
})

test('una serie propia (cada día, con fechas) se entrena con una capa LSTM y se predicen los días siguientes', async ({ page }) => {
  // 140 días con un patrón semanal y algo de tendencia
  const start = Date.UTC(2024, 0, 1)
  const rows = Array.from({ length: 140 }, (_value, i) => {
    const date = new Date(start + i * 86_400_000).toISOString().slice(0, 10)
    return `${date},${(50 + 10 * Math.sin((2 * Math.PI * i) / 7) + i / 10).toFixed(2)}`
  })
  await page.goto('/playground/time-series/dataset/UPLOAD')
  await page.locator('input#drop-zone-time-series').setInputFiles({ name: 'ventas.csv', mimeType: 'text/csv', buffer: Buffer.from(['Fecha,Ventas', ...rows].join('\n')) })
  await expect(page.getByLabel('Columna con los valores')).toHaveValue('Ventas')
  await expect(page.getByLabel('Columna con la fecha')).toHaveValue('Fecha')
  await expect(page.getByTestId('Test-TimeSeries-Summary')).toContainText('140 valores, de 2024-01-01 a 2024-05-19, un valor al día')
  // Una semana: la ventana y la estación por defecto
  await expect(page.getByLabel('Ventana (valores anteriores)')).toHaveValue('7')
  await expect(page.getByLabel('Estación (valores)')).toHaveValue('7')

  await page.getByRole('button', { name: /Capa 1/ }).click()
  await page.locator('#time-series-layer-class-0').selectOption('lstm')
  await expect(page.getByRole('button', { name: /Capa 1/ })).toContainText('LSTM')
  await page.locator('#time-series-epochs').fill('5')
  await page.getByTestId('Test-TrainButton').click()
  await expect(page.getByTestId('Test-TimeSeries-Model-1')).toContainText('LSTM', { timeout: 60_000 })
  await expect(page.getByTestId('Test-TimeSeries-Errors-Model')).toBeVisible()
  await expect(page.getByTestId('Test-TimeSeries-Future').getByRole('row').nth(1)).toContainText('2024-05-20')
})

test('los resultados de una serie no tienen problemas de accesibilidad (temas claro y oscuro)', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await page.goto('/playground/time-series/dataset/SUNSPOTS')
    await page.locator('#time-series-epochs').fill('2')
    await page.getByTestId('Test-TrainButton').click()
    await expect(page.getByTestId('Test-TimeSeries-Verdict')).toBeVisible({ timeout: 60_000 })
    // El aviso de «modelo entrenado» se cierra solo
    await expect(page.locator('.swal2-container')).toHaveCount(0, { timeout: 10_000 })
    // El visor de tfjs-vis (de la librería, no de la aplicación) se aparta, como en los demás entrenadores
    await page.locator('#tfjs-visor-container').getByRole('button', { name: 'Hide' }).click()
    // También con los datos de las gráficas a la vista
    await expandChartData(page)
    await expect(page.getByTestId('Test-ChartData').getByRole('table').first()).toBeVisible()
    expect(await axeViolations(page), `tema ${colorScheme === 'light' ? 'claro' : 'oscuro'}`).toEqual([])
  }
})
