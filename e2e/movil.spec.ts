import { test, expect } from './fixtures'

test('ninguna página se sale de la pantalla en horizontal', async ({ page }) => {
  test.setTimeout(180_000)
  const paths = [
    '/',
    '/select-dataset/tabular-classification',
    '/playground/tabular-classification/dataset/IRIS',
    '/playground/regression/model/AUTO_MPG',
    '/playground/image-classification/model/IMAGE-MNIST',
    '/playground/clustering/dataset/WINE',
    '/analyze',
    '/datasets',
    '/glossary',
    '/manual',
    '/settings',
    '/learn',
    '/contribute',
    '/version',
    '/terms-and-conditions',
    '/404',
  ]
  for (const path of paths) {
    await page.goto(path)
    await expect(page.locator('main').first()).toBeVisible()
    await page.waitForTimeout(1500)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, `desborde horizontal en ${path}`).toBeLessThanOrEqual(0)
  }
})

test('al bajar, la barra de navegación sigue arriba y el índice de secciones aparece debajo de ella', async ({ page }) => {
  await page.goto('/playground/regression/dataset/AUTO_MPG')
  await expect(page.getByTestId('Test-TrainButton')).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 3000))
  const navbar = page.locator('.n4l-navbar')
  const bar = page.locator('.n4l-section-bar-wrapper')
  await expect(bar).toHaveClass(/is-visible/)
  // Al final de la transición (0,2 s), justo debajo de la barra de navegación
  await expect.poll(async () => Math.round((await bar.boundingBox())!.y)).toBe(Math.round((await navbar.boundingBox())!.height))
  expect((await navbar.boundingBox())!.y).toBe(0)
})

test('el menú se cierra al ir a otra página, que empieza arriba', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('Test-InitialMenu')).toBeVisible()
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300)
  const toggler = page.locator('.navbar-toggler')
  await toggler.click()
  await expect(toggler).toHaveAttribute('aria-expanded', 'true')
  await page.locator('.n4l-navbar').getByRole('link', { name: 'Manual', exact: true }).click()
  await expect(page).toHaveURL(/\/manual$/)
  await expect(toggler).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.navbar-collapse')).not.toHaveClass(/show/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})

test('se dibuja un número con el dedo y el modelo lo reconoce', async ({ page }) => {
  await page.goto('/playground/image-classification/model/IMAGE-MNIST')
  // Con el modelo cargado la página ya no cambia de alto (el lienzo se queda donde se mide) y, cuando se va el aviso
  // de "modelo cargado", los toques llegan al lienzo y no a su fondo
  await expect(page.getByTestId('Test-LoadTestDataset')).toBeEnabled({ timeout: 60_000 })
  await expect(page.locator('.swal2-container')).toHaveCount(0)
  const canvas = page.locator('#canvas')
  await canvas.scrollIntoViewIfNeeded()
  const box = (await canvas.boundingBox())!
  // Un 7 con eventos táctiles de verdad (el lienzo usa eventos de puntero)
  const path = [[0.25, 0.22], [0.75, 0.22], [0.6, 0.5], [0.45, 0.8]].map(([x, y]) => ({ x: box.x + box.width * x, y: box.y + box.height * y }))
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [path[0]] })
  for (let segment = 1; segment < path.length; segment++) {
    for (let step = 1; step <= 8; step++) {
      const from = path[segment - 1], to = path[segment]
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + (to.x - from.x) * step / 8, y: from.y + (to.y - from.y) * step / 8 }] })
    }
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  // El trazo está en el lienzo y dibujar no mueve la página
  const inked = await canvas.evaluate((element) => {
    const lienzo = element as HTMLCanvasElement
    const data = lienzo.getContext('2d')!.getImageData(0, 0, lienzo.width, lienzo.height).data
    let pixels = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 128) pixels++
    return pixels
  })
  expect(inked).toBeGreaterThan(1000)
  expect(await canvas.evaluate((element) => getComputedStyle(element).touchAction)).toBe('none')

  await page.locator('.card', { has: canvas }).getByRole('button', { name: 'Clasificar' }).click()
  await expect(page.getByText(/Clase predicha\s*7/)).toBeVisible({ timeout: 30_000 })
})

test('al entrenar, el visor no tapa la página', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/playground/tabular-classification/dataset/IRIS')
  await page.getByRole('spinbutton', { name: 'N. épocas' }).fill('1')
  await page.getByTestId('Test-TrainButton').click()
  await expect(page.locator('.swal2-popup')).toContainText('Modelo entrenado con éxito', { timeout: 200_000 })
  const visorLeft = await page.locator('#tfjs-visor-container .visor').evaluate((visor) => visor.getBoundingClientRect().left)
  expect(visorLeft).toBeGreaterThanOrEqual(page.viewportSize()!.width)
})

test('al recargar la página (como al desbloquear el móvil), la guía sigue en su paso', async ({ page }) => {
  // Lo que se leería en voz alta (se apunta de nuevo en cada carga)
  await page.addInitScript(() => {
    const spoken: string[] = []
    Object.assign(window, { spoken })
    window.speechSynthesis.speak = (utterance) => { spoken.push(utterance.text) }
  })
  const spoken = () => page.evaluate(() => (window as unknown as { spoken: string[] }).spoken.join(' '))
  await page.goto('/playground/tabular-classification/model/CAR')
  await page.getByTestId('Test-GuideButton').click()
  const tooltip = page.getByTestId('Test-GuideTooltip')
  for (let step = 2; step <= 4; step++) {
    await tooltip.getByRole('button', { name: 'Siguiente' }).click()
    await expect(tooltip).toContainText(`Paso ${step} de 18`)
  }

  await page.reload()
  // Se vuelve a abrir sola en el mismo paso, cuando ya están los datos que señala
  await expect(tooltip).toContainText('Paso 4 de 18', { timeout: 30_000 })
  await expect(tooltip).toContainText('El conjunto de datos')
  // Se lee el paso: enseguida si el navegador lo deja (Chrome mantiene la activación al recargar) o, si no, al tocar la
  // página (eso lo prueba N4LGuide.test.tsx)
  await tooltip.locator('p').click()
  await expect.poll(spoken).toContain('El conjunto de datos.')

  // Cerrada a medias, al recargar ya no se abre sola y el botón sigue desde ese paso
  await page.keyboard.press('Escape')
  await expect(tooltip).toHaveCount(0)
  await page.reload()
  await expect(page.getByTestId('Test-GuideButton')).toHaveText('Continuar la guía (paso 4 de 18)')
  await page.waitForTimeout(1500)
  await expect(tooltip).toHaveCount(0)
})
