import path from 'node:path'
import { AxeBuilder } from '@axe-core/playwright'
import { test, expect } from './fixtures'

// Agrupamiento (k-means): sin red ni entrenamiento, todo en el navegador y al momento

test('desde la portada se agrupan las flores iris y los grupos se parecen a las especies', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('Test-InitialMenu-Clustering').click()
  await page.getByTestId('Test-GoTo-SelectDataset-Clustering').click()
  await expect(page).toHaveURL(/\/select-dataset\/clustering$/)
  // Sin modelos preentrenados no hay descripción que enseñar
  await expect(page.getByTestId('Test-MenuSelectDataset-Option-IRIS').getByRole('button')).toHaveCount(0)
  await page.getByTestId('Test-MenuSelectDataset-Open-IRIS').click()

  const controls = page.getByTestId('Test-Clustering-Controls')
  await expect(controls).toContainText('150 filas')
  // La especie no se usa para agrupar: es la columna con la que se compara al final
  await expect(controls.getByLabel('Columna con las clases reales')).toHaveValue('class')
  await expect(controls.getByLabel('Número de grupos (k)')).toHaveValue('3')
  await page.getByTestId('Test-Clustering-Run').click()

  await expect(page.getByTestId('Test-Clustering-Metrics')).toContainText('Silueta')
  const comparison = page.getByTestId('Test-Clustering-Comparison')
  await expect(comparison).toContainText('Setosa')
  await expect(page.getByTestId('Test-Clustering-Agreement')).toContainText('Los grupos se parecen bastante a las clases')
  // Cada grupo con su clase mayoritaria; uno es todo Setosa
  await expect(comparison.getByRole('row').filter({ hasText: 'Setosa · 100 %' })).toHaveCount(1)
  await expect(comparison.getByRole('row').last()).toContainText('Pureza: 85,3 %')
  await expect(page.getByTestId('Test-Clustering-Elbow').locator('canvas')).toBeVisible()
  await expect(page.getByTestId('Test-Clustering-Profiles')).toContainText('petal_length')

  // Paso a paso: de los centroides iniciales a la última iteración
  const iteration = page.getByTestId('Test-Clustering-Iteration')
  const last = await iteration.textContent()
  await page.getByTestId('Test-Clustering-Play').click()
  await expect(iteration).toHaveText('Iteración 0')
  await expect(iteration).toHaveText(last ?? '', { timeout: 10_000 })

  // Con otro k, otros grupos
  await controls.getByLabel('Número de grupos (k)').fill('2')
  await page.getByTestId('Test-Clustering-Run').click()
  await expect(page.getByTestId('Test-Clustering-Metrics')).toContainText(/Grupos\s*2/)
  // Dos filas de cabecera, los dos grupos y el total; Versicolor y Virginica acaban en el mismo grupo: una mezcla
  await expect(comparison.getByRole('row')).toHaveCount(5)
  await expect(comparison.getByRole('row').filter({ hasText: 'mezcla' })).toContainText('Versicolor')
})

test('un fichero propio (ARFF) se agrupa y su columna de texto se usa para comparar', async ({ page }) => {
  await page.goto('/playground/clustering/dataset/UPLOAD')
  await page.locator('input#drop-zone-clustering').setInputFiles(path.join(__dirname, 'files', 'iris.arff'))
  const controls = page.getByTestId('Test-Clustering-Controls')
  await expect(controls).toContainText('150 filas')
  await expect(controls.getByLabel('Columna con las clases reales')).toHaveValue('class')
  await page.getByTestId('Test-Clustering-Run').click()
  await expect(page.getByTestId('Test-Clustering-Comparison')).toContainText('Virginica')
})

test('desde /datasets se agrupa un conjunto de práctica: se carga con su ficha (clases numéricas, sin el identificador)', async ({ page }) => {
  await page.goto('/datasets')
  await page.getByRole('tab', { name: /Agrupamiento/ }).click()
  await expect(page).toHaveURL(/\/datasets\?task=clustering$/)
  // Los de ejemplo no tienen modelo que probar
  await expect(page.getByTestId('Test-DatasetModel-IRIS')).toHaveCount(0)
  await page.getByTestId('Test-DatasetTrain-n4l/breast-cancer.n4l/data/breast-cancer-wisconsin.csv').click()
  await expect(page).toHaveURL(/\/playground\/clustering\/dataset\/UPLOAD$/)

  const controls = page.getByTestId('Test-Clustering-Controls')
  await expect(controls.getByRole('heading')).toHaveText('breast-cancer-wisconsin.csv', { timeout: 30_000 })
  // «Class» (2 o 4) es la de las clases aunque sea un número, y el identificador no se usa para agrupar
  await expect(controls.getByLabel('Columna con las clases reales')).toHaveValue('Class')
  await expect(controls.getByLabel('Número de grupos (k)')).toHaveValue('2')
  await expect(controls.getByRole('checkbox', { name: 'Sample_code_number' })).not.toBeChecked()
  await page.getByTestId('Test-Clustering-Run').click()
  await expect(page.getByTestId('Test-Clustering-Agreement')).toContainText('Los grupos son casi las mismas clases')
})

test('los resultados del agrupamiento no tienen problemas de accesibilidad (temas claro y oscuro)', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await page.goto('/playground/clustering/dataset/WINE')
    await page.getByTestId('Test-Clustering-Run').click()
    await expect(page.getByTestId('Test-Clustering-Profiles')).toBeVisible()
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const found = violations.map(({ id, impact, nodes }) => `${id} [${impact}]: ${nodes.slice(0, 3).map(({ target }) => target.join(' ')).join(' | ')}`)
    expect(found, `tema ${colorScheme === 'light' ? 'claro' : 'oscuro'}`).toEqual([])
  }
})
