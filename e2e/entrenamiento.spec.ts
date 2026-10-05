import { test, expect } from './fixtures'

// Las tres tareas que se entrenan en el navegador (en un worker), con pocas épocas para que no tarde. Las imágenes, con
// una: en CI (2 núcleos, WebGL por software y otra prueba a la vez) cada época tarda minutos. La de CIFAR-10 (en color
// y con una red más ancha) hace unas tres veces el trabajo de la de MNIST: en 2 núcleos con otra prueba a la vez, unos
// 4,5 min frente a 3, así que espera más (`trainTimeout`, lo que se espera al aviso de éxito)
const TRAINERS = [
  { name: 'clasificación tabular (Iris)', path: '/playground/tabular-classification/dataset/IRIS', epochs: '2' },
  { name: 'regresión (Auto MPG)', path: '/playground/regression/dataset/AUTO_MPG', epochs: '2' },
  { name: 'clasificación de imágenes (MNIST)', path: '/playground/image-classification/dataset/IMAGE-MNIST', epochs: '1' },
  { name: 'clasificación de fotos en color (CIFAR-10)', path: '/playground/image-classification/dataset/IMAGE-CIFAR10', epochs: '1', trainTimeout: 480_000 },
]

for (const { name, path, epochs, trainTimeout = 240_000 } of TRAINERS) {
  test(`entrena ${name}, el modelo aparece en la lista y sigue ahí al recargar`, async ({ page }) => {
    test.setTimeout(trainTimeout + 240_000)
    await page.goto(path)
    await page.getByRole('spinbutton', { name: 'N. épocas' }).fill(epochs)
    await page.getByTestId('Test-TrainButton').click()

    // Mientras entrena, el botón pasa a ser el progreso con "Detener"
    await expect(page.getByTestId('Test-TrainButton')).toBeHidden()
    // El aviso de éxito se cierra solo
    await expect(page.locator('.swal2-popup')).toContainText('Modelo entrenado con éxito', { timeout: trainTimeout })
    await expect(page.getByText(/Lista (de )?modelos generados \| 1/)).toBeVisible()
    await expect(page.getByTestId('Test-TrainButton')).toBeVisible()
    // Debajo del botón, cómo ha ido en palabras
    await expect(page.getByTestId('Test-TrainingDiagnosis')).toContainText('Cómo ha ido el entrenamiento del modelo 1')

    // Se guarda en el navegador: al volver a la página sigue en la lista, con un aviso para borrarlo
    await page.reload()
    const notice = page.getByTestId('Test-StoredModels')
    await expect(notice).toContainText('1 modelo', { timeout: 60_000 })
    await expect(page.getByText(/Lista (de )?modelos generados \| 1/)).toBeVisible()
    await notice.getByTestId('Test-StoredModels-Delete').click()
    await notice.getByTestId('Test-StoredModels-Confirm').click()
    await expect(notice).toHaveCount(0)
    await page.reload()
    await expect(page.getByTestId('Test-TrainButton')).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(1500)
    await expect(page.getByTestId('Test-StoredModels')).toHaveCount(0)
  })
}

test('una red mal montada se avisa en el editor de capas, no deja entrenar y se arregla con un botón', async ({ page }) => {
  await page.goto('/playground/tabular-classification/dataset/IRIS')
  const layers = page.locator('[data-guide="layers"]')
  const check = page.getByTestId('Test-LayerCheck')
  await expect(page.getByTestId('Test-TrainButton')).toBeVisible({ timeout: 60_000 })
  await expect(check).toHaveCount(0)

  // La salida de Iris con 5 neuronas (hay 3 clases)
  const last = await layers.locator('.accordion-button').count() - 1
  await layers.locator('.accordion-button').nth(last).click()
  await page.locator('#formUnitsLayer' + last).fill('5')
  await expect(check.getByTestId('Test-LayerCheck-output-units')).toContainText('hay 3 clases')
  await expect(layers.locator('.accordion-button').nth(last).getByTestId('Test-LayerFlag')).toHaveText('Error')

  await page.getByTestId('Test-TrainButton').click()
  await expect(page.locator('.swal2-popup')).toContainText('así no se puede entrenar')
  await page.locator('.swal2-confirm').click()

  await check.getByTestId('Test-LayerCheck-Fix').click()
  await expect(check).toHaveCount(0)
  await expect(page.locator('#formUnitsLayer' + last)).toHaveValue('3')
})

test('se comparan dos modelos: curvas superpuestas y qué hiperparámetro ha cambiado', async ({ page }) => {
  test.setTimeout(300_000)
  await page.goto('/playground/tabular-classification/dataset/IRIS')
  await page.getByRole('spinbutton', { name: 'N. épocas' }).fill('2')
  for (const [model, learningRate] of [[1, '0.01'], [2, '0.1']] as const) {
    await page.locator('[data-guide="hp-learning-rate"] select').selectOption(learningRate)
    await page.getByTestId('Test-TrainButton').click()
    await expect(page.getByText(new RegExp(`Lista (de )?modelos generados \\| ${model}`))).toBeVisible({ timeout: 240_000 })
    await expect(page.getByTestId('Test-TrainButton')).toBeVisible()
    // En escritorio el visor se abre al entrenar y tapa la derecha de la página
    await page.locator('#tfjs-visor-container').getByRole('button', { name: 'Hide' }).click()
  }

  await page.getByTestId('Test-TrainingCurves-Compare').check()
  const comparison = page.getByTestId('Test-ModelComparison')
  await expect(comparison.getByTestId('Test-ModelComparison-Summary')).toHaveText(/^Solo cambia «Tasa de aprendizaje»/)
  await expect(comparison.locator('tr[data-changed="true"]')).toHaveCount(1)
  await expect(comparison.locator('canvas').first()).toBeVisible()

  // Con uno solo marcado no hay nada que comparar
  await comparison.getByLabel('Modelo 1').uncheck()
  await expect(comparison).toContainText('Marca al menos dos modelos')
})

test('el informe de un modelo entrenado se abre en otra pestaña, listo para imprimir', async ({ page, context }) => {
  test.setTimeout(300_000)
  await page.goto('/playground/tabular-classification/dataset/IRIS')
  await page.getByRole('spinbutton', { name: 'N. épocas' }).fill('3')
  await page.getByTestId('Test-TrainButton').click()
  await expect(page.getByText(/Lista (de )?modelos generados \| 1/)).toBeVisible({ timeout: 240_000 })
  await page.locator('#tfjs-visor-container').getByRole('button', { name: 'Hide' }).click()

  const [report] = await Promise.all([context.waitForEvent('page'), page.getByTestId('Test-ReportButton').click()])
  await expect(report.getByTestId('Test-Report')).toContainText('Clasificación tabular')
  await expect(report.getByTestId('Test-Report')).toContainText('Modelo 1')
  await expect(report.getByTestId('Test-Report-Layers').locator('li')).toHaveCount(3)
  await expect(report.getByTestId('Test-Report-Parameters')).toContainText('N. épocas')
  await expect(report.getByTestId('Test-Report-Results')).toContainText('loss')
  await expect(report.getByTestId('Test-TrainingDiagnosis')).toBeVisible()
  await expect(report.locator('.n4l-training-curve canvas').first()).toBeVisible()
  // Al imprimir no salen la barra de navegación ni el pie
  await report.emulateMedia({ media: 'print' })
  await expect(report.locator('.n4l-navbar')).toBeHidden()
  await expect(report.getByTestId('Test-Report-Print')).toBeHidden()
})

test('un modelo entrenado con un paquete se descarga como .n4l y se abre en «Paquetes .n4l»: para probarlo y para entrenar', async ({ page }, testInfo) => {
  test.setTimeout(480_000)
  await page.goto('/playground/tabular-classification/dataset/IRIS')
  await page.getByRole('spinbutton', { name: 'N. épocas' }).fill('2')
  await page.getByTestId('Test-TrainButton').click()
  await expect(page.locator('.swal2-popup')).toContainText('Modelo entrenado con éxito', { timeout: 240_000 })
  // En escritorio el visor se abre al entrenar y tapa la derecha de la página
  await page.locator('#tfjs-visor-container').getByRole('button', { name: 'Hide' }).click()

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('Test-N4LDownloadTrained-1').click()])
  expect(download.suggestedFilename()).toBe('iris-model-1-1.0.0.n4l')
  const file = testInfo.outputPath(download.suggestedFilename())
  await download.saveAs(file)

  // Como modelo ya entrenado: con su nombre y su modelo (que recibe la entrada escalada)
  await page.goto('/packages')
  await page.locator('input#drop-zone-n4l').setInputFiles(file)
  await expect(page.getByTestId('Test-N4LImported')).toContainText('Clasificación de flor iris (#1)')
  await page.getByTestId('Test-N4LLocal-iris-model-1-tabular-classification').getByRole('link', { name: 'Probar el modelo' }).click()
  await expect(page).toHaveURL(/\/playground\/tabular-classification\/model\/local-iris-model-1$/)
  await expect(page.getByTestId('Test-Breadcrumb')).toContainText('Clasificación de flor iris (#1)', { timeout: 30_000 })
  await expect(page.locator('.swal2-popup')).toContainText('Modelo cargado con éxito', { timeout: 30_000 })
  const confirm = page.locator('.swal2-confirm')
  if (await confirm.isVisible().catch(() => false)) await confirm.click()
  await expect(page.locator('.swal2-container')).toHaveCount(0)
  await page.locator('[data-guide="classify"] button').click()
  await expect(page.getByText(/Clase predicha/).first()).toBeVisible({ timeout: 30_000 })

  // Y para entrenar: con su conjunto y su red por defecto (la del modelo descargado)
  await page.goto('/packages')
  await page.getByTestId('Test-N4LLocal-iris-model-1-tabular-classification').getByRole('link', { name: 'Entrenar' }).click()
  await expect(page).toHaveURL(/\/playground\/tabular-classification\/dataset\/local-iris-model-1$/)
  await expect(page.getByTestId('Test-TrainButton')).toBeEnabled({ timeout: 60_000 })
})
