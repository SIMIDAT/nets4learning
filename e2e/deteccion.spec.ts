import { test, expect } from './fixtures'

// Detección de objetos: lo que ha fallado alguna vez con los modelos de MediaPipe (se descargan de jsDelivr)

test('FACE-DETECTOR: subir una imagen nada más abrir la página, con el modelo aún cargándose, no rompe MediaPipe', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/playground/object-detection/model/FACE-DETECTOR')
  // Antes se volvía a cargar el modelo con cada imagen: los dos de MediaPipe a la vez se pisaban y abortaba
  // (Module.arguments has been replaced…). El fixture comprueba que no hay errores de JavaScript
  await page.locator('input#drop-zone-object-detection').setInputFiles('public/logo512.png')
  await expect(page.getByTestId('Test-ImageDetections')).toBeVisible({ timeout: 120_000 })
})
