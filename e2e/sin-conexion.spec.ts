import { test, expect } from './fixtures'

// El service worker de la versión publicada (public/sw.js, docs/offline.md): los e2e van contra `vite preview`, que la sirve

test('los modelos preentrenados se guardan en su propia caché del navegador (n4l-models-v1), no con la aplicación', async ({ page }) => {
  await page.goto('/')
  // Toma el control de la página en cuanto se activa (clients.claim)
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null && navigator.serviceWorker?.controller !== undefined, null, { timeout: 30_000 })
  const model = '/models/02-object-detection/face-api-js/v1.7.14/tiny_face_detector_model-weights_manifest.json'
  const where = await page.evaluate(async (path) => {
    await (await fetch(path)).text()
    // Los modelos de la aplicación se guardan al recibirlos: se espera un momento
    for (let attempt = 0; attempt < 50; attempt++) {
      const inModels = await (await caches.open('n4l-models-v1')).match(path)
      if (inModels !== undefined) return { models: true, runtime: (await (await caches.open('n4l-runtime-v1')).match(path)) !== undefined }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return { models: false, runtime: false }
  }, model)
  expect(where).toEqual({ models: true, runtime: false })
})
