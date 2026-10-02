import { test, expect } from './fixtures'

// Las tres tareas que se entrenan en el navegador (en un worker), con pocas épocas para que no tarde
const TRAINERS = [
  { name: 'clasificación tabular (Iris)', path: '/playground/tabular-classification/dataset/IRIS' },
  { name: 'regresión (Auto MPG)', path: '/playground/regression/dataset/AUTO_MPG' },
  { name: 'clasificación de imágenes (MNIST)', path: '/playground/image-classification/dataset/IMAGE-MNIST' },
]

for (const { name, path } of TRAINERS) {
  test(`entrena ${name} y el modelo aparece en la lista`, async ({ page }) => {
    test.setTimeout(300_000)
    await page.goto(path)
    await page.getByRole('spinbutton', { name: 'N. épocas' }).fill('2')
    await page.getByTestId('Test-TrainButton').click()

    // Mientras entrena, el botón pasa a ser el progreso con "Detener"
    await expect(page.getByTestId('Test-TrainButton')).toBeHidden()
    // El aviso de éxito se cierra solo
    await expect(page.locator('.swal2-popup')).toContainText('Modelo entrenado con éxito', { timeout: 240_000 })
    await expect(page.getByText(/Lista (de )?modelos generados \| 1/)).toBeVisible()
    await expect(page.getByTestId('Test-TrainButton')).toBeVisible()
  })
}
