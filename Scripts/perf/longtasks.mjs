// Mide cuánto se bloquea el hilo principal (tareas largas de más de 50 ms) en los escenarios pesados de la aplicación,
// en Chrome sin ventana (google-chrome) controlado por su protocolo de depuración. Sirve para comparar antes y después
// de cada fase de TODO-worker.md.
// Uso, contra la build de producción (en desarrollo React registra cada render y infla las medidas). Con --mode simidat
// la build va en /n4l, como el servidor de desarrollo:
//   npx vite build --mode simidat --outDir /tmp/n4l-perf && npx vite preview --outDir /tmp/n4l-perf --port 4795
//   node Scripts/perf/longtasks.mjs http://localhost:4795/n4l [escenario ...]
// Escenarios: analyze (California y housing-price en /analyze), mnist (imágenes de test, clasificar y LRP),
// car (entrenar y SHAP global) y mnist-train (cargar MNIST y entrenar; tarda minutos, no va por defecto).
// Los tiempos de TF.js son orientativos: sin ventana, WebGL va por software.
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const [base = 'http://localhost:5173/n4l', ...requested] = process.argv.slice(2)
const scenarios = requested.length > 0 ? requested : ['analyze', 'mnist', 'car']
const PUBLIC = resolve('public')
const port = 9338

const chrome = spawn('google-chrome', [
  '--headless=new', '--no-sandbox', `--remote-debugging-port=${port}`, '--hide-scrollbars',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'n4l-perf-'))}`, '--window-size=1500,1000', 'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let target
for (let i = 0; i < 50 && !target; i++) {
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page') } catch { await sleep(200) }
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let id = 0
const pending = new Map()
const errors = []
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text)
})
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value
const waitFor = async (expression, timeout = 120000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) { if (await evaluate(expression)) return true; await sleep(250) }
  throw new Error('Timeout: ' + expression)
}
const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
// Cambia un <select> como lo haría el usuario (React escucha el evento change)
const select = (selector, value) => evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(selector)})
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, ${JSON.stringify(value)})
  el.dispatchEvent(new Event('change', { bubbles: true }))
})()`)
const setFile = async (selector, file) => {
  const { result: { root } } = await send('DOM.getDocument')
  const { result: { nodeId } } = await send('DOM.querySelector', { nodeId: root.nodeId, selector })
  await send('DOM.setFileInputFiles', { nodeId, files: [join(PUBLIC, file)] })
}
const closeAlerts = () => evaluate(`document.querySelector('.swal2-confirm')?.click()`)

await send('Page.enable')
await send('Runtime.enable')
await send('DOM.enable')
// Registro de tareas largas desde que empieza cada página
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.__longtasks = []; new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__longtasks.push({ start: e.startTime, duration: e.duration }) }).observe({ type: 'longtask', buffered: true })`,
})
const goto = async (path, readySelector) => {
  await send('Page.navigate', { url: base + path })
  await waitFor(`!!document.querySelector(${JSON.stringify(readySelector)})`)
}

const results = []
const record = (label, tasks, wall) => {
  const total = tasks.reduce((sum, t) => sum + t.duration, 0)
  const max = tasks.reduce((m, t) => Math.max(m, t.duration), 0)
  const row = { label, count: tasks.length, total: Math.round(total), max: Math.round(max), wall }
  results.push(row)
  console.log(`${label}: ${row.count} tareas largas · bloqueo ${row.total} ms · la mayor ${row.max} ms · ${(row.wall / 1000).toFixed(1)} s`)
}
const measure = async (label, action, settleMs = 1500) => {
  await evaluate('window.__mark = performance.now()')
  const start = Date.now()
  await action()
  await sleep(settleMs)
  record(label, await evaluate('window.__longtasks.filter((t) => t.start >= window.__mark)'), Date.now() - start - settleMs)
}

// Sin el aviso de cookies (se acepta el rechazo como haría el usuario)
await send('Page.navigate', { url: base + '/' })
await sleep(1500)
await evaluate(`[...document.querySelectorAll('button')].find((b) => /Rechazar|Reject/.test(b.textContent))?.click()`)

if (scenarios.includes('analyze')) {
  for (const file of ['datasets/01-regression/housing-prices/california-housing.csv', 'datasets/01-regression/housing-price/housing-price.csv']) {
    const name = file.split('/').pop()
    await goto('/analyze', '#analyze-project-dataset')
    await sleep(1500)
    await measure(`/analyze ${name}: cargar y analizar`, async () => {
      await setFile('input[type=file][accept*="csv"]', file)
      await waitFor(`!!document.querySelector('[data-testid=Test-AnalyzeInfo]')`)
    }, 3000)
    await measure(`/analyze ${name}: cambiar el escalado`, () => select('#analyze-preprocess-scaler', 'standard'), 2000)
    const other = await evaluate(`[...document.querySelectorAll('#analyze-target option')].map((o) => o.value).filter(Boolean)[1]`)
    await measure(`/analyze ${name}: cambiar la variable objetivo`, () => select('#analyze-target', other), 2500)
  }
}

if (scenarios.includes('mnist')) {
  const start = Date.now()
  await goto('/playground/image-classification/model/IMAGE-MNIST', '#ModelReviewImageClassification')
  await waitFor(`!!document.querySelector('.swal2-confirm')`)
  // Desde que empieza la página: descargar y preparar el modelo (y compilar sus shaders, también los de LRP)
  await sleep(1500)
  record('MNIST: abrir la página y cargar el modelo', await evaluate('window.__longtasks'), Date.now() - start - 1500)
  await closeAlerts()
  await sleep(1500)
  await measure('MNIST: cargar las imágenes de test', async () => {
    await click('[data-testid=Test-LoadTestDataset]')
    await waitFor(`!document.querySelector('[data-testid=Test-LoadTestDataset]')`)
  })
  // Dos veces: la primera incluye compilar los shaders de WebGL (síncrono y solo una vez)
  for (const [round, example] of [['primera vez', 0], ['otra vez', 1]]) {
    await measure(`MNIST: clasificar un ejemplo (${round})`, async () => {
      await evaluate(`document.querySelectorAll('.n4l-example-image')[${example}].click()`)
      await waitFor(`!!document.querySelector('[data-testid=Test-ClassificationChart-class]')`)
    }, 800)
    await measure(`MNIST: explicar con LRP (${round})`, async () => {
      await click('[data-testid=Test-ExplainButton]')
      await waitFor(`document.querySelector('[data-testid=Test-ExplainButton]')?.dataset.calculating === 'true'`, 10000).catch(() => undefined)
      await waitFor(`document.querySelector('[data-testid=Test-ExplainButton]')?.dataset.calculating === 'false'`, 600000)
    })
  }
}

if (scenarios.includes('car')) {
  await goto('/playground/tabular-classification/dataset/CAR', '#TabularClassificationCustomDataset')
  await sleep(2500)
  // Dos veces: la primera incluye compilar los shaders de WebGL (síncrono y solo una vez)
  for (const round of ['primera vez', 'otra vez']) {
    await measure(`Car: entrenar (${round})`, async () => {
      await click('#TabularClassificationCustomDataset button[type=submit]')
      await waitFor(`!!document.querySelector('.swal2-confirm')`, 300000)
    }, 500)
    await closeAlerts()
    await sleep(500)
  }
  await measure('Car: SHAP global', async () => {
    await click('[data-testid=Test-ShapGlobal]')
    await waitFor(`document.querySelector('[data-testid=Test-ShapGlobal]')?.dataset.calculating === 'true'`, 10000)
    await waitFor(`document.querySelector('[data-testid=Test-ShapGlobal]')?.dataset.calculating === 'false'`, 600000)
  }, 1000)
}

if (scenarios.includes('mnist-train')) {
  await goto('/playground/image-classification/dataset/IMAGE-MNIST', '#ImageClassification')
  await sleep(2500)
  await measure('MNIST: cargar el conjunto y entrenar', async () => {
    await click('#ImageClassification button[type=submit]')
    await waitFor(`!!document.querySelector('.swal2-confirm')`, 900000)
  }, 500)
}

console.log('\n| Escenario | Tareas largas | Bloqueo total | La mayor | Duración |\n|---|---|---|---|---|')
for (const r of results) console.log(`| ${r.label} | ${r.count} | ${r.total} ms | ${r.max} ms | ${(r.wall / 1000).toFixed(1)} s |`)
if (errors.length) console.log('\nErrores en la página:', errors)
ws.close()
chrome.kill()
process.exit(0)
