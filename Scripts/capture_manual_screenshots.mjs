// Rehace las capturas del manual de clasificación tabular (inglés, tema claro) siguiendo el tutorial con el
// dataset Car, en Chrome sin ventana (google-chrome) controlado por su protocolo de depuración.
// Uso, con `pnpm dev` en marcha:
//   node Scripts/capture_manual_screenshots.mjs http://localhost:5173/n4l public/docs/images/00-tabular-classification
// Las capturas de subir y procesar un CSV (00-*) y la del visor de tfjs-vis (05-visor-training) no se generan aquí.
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [base, outDir] = process.argv.slice(2)
const port = 9337
const chrome = spawn('google-chrome', [
  '--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, '--hide-scrollbars',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'n4l-manual-'))}`, '--window-size=1240,2600', 'about:blank',
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
const waitFor = async (expression, timeout = 60000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) { if (await evaluate(expression)) return true; await sleep(300) }
  throw new Error('Timeout: ' + expression)
}
// Cambia un campo como lo haría el usuario (React escucha input en los <input> y change en los <select>)
const setValue = (selector, value) => evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(selector)})
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(String(value))})
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
  return el.value
})()`)
/** Captura el elemento (opcionalmente solo hasta `untilSelector`) en outDir/name.png */
const capture = async (name, elementExpr, untilExpr = null) => {
  await evaluate(`${elementExpr}.scrollIntoView({ block: 'start' })`)
  await sleep(1500)
  const rect = await evaluate(`(() => {
    const r = ${elementExpr}.getBoundingClientRect()
    const until = ${untilExpr ?? 'null'}
    const bottom = until ? until.getBoundingClientRect().bottom + 16 : r.bottom
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: bottom - r.top }
  })()`)
  const { result } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { ...rect, scale: 1 } })
  writeFileSync(join(outDir, name + '.png'), Buffer.from(result.data, 'base64'))
  console.log('captura', name, Math.round(rect.width) + 'x' + Math.round(rect.height))
}
const card = (stepClass) => `document.querySelector('.${stepClass} .card')`

await send('Runtime.enable')
await send('Page.enable')
// Ventana alta: cada tarjeta cabe entera y no hace falta capturar fuera de ella (eso redimensiona y Chart.js se redibuja)
await send('Emulation.setDeviceMetricsOverride', { width: 1240, height: 2600, deviceScaleFactor: 1, mobile: false })
// Preferencias: inglés, tema claro, sin aviso de cookies ni tutorial
await send('Page.navigate', { url: base + '/' })
await sleep(1500)
await evaluate(`(() => {
  localStorage.setItem('language', 'en')
  localStorage.setItem('theme', 'light')
  localStorage.setItem('tabular-classification.joyride-TabularClassification', JSON.stringify({ seen: true }))
  document.cookie = 'n4l-accept-cookies=false; path=/'
})()`)
await send('Page.navigate', { url: base + '/playground/tabular-classification/dataset/CAR' })
const submit = `document.querySelector('form button[type=submit].btn-lg')`
await waitFor(`!!${submit} && !${submit}.disabled`, 90000)
await sleep(1500)

// Paso 1: conjunto de datos, original y procesado
await capture('01-dataset-0', card('joyride-step-dataset'))
await evaluate(`${card('joyride-step-dataset')}.querySelector('.card-header input[type=checkbox]').click()`)
await evaluate(`${card('joyride-step-dataset')}.querySelectorAll('details').forEach((d) => { if (/Attributes|Classes/.test(d.querySelector('summary')?.textContent ?? '')) d.open = true })`)
await sleep(500)
await capture('01-dataset-1', card('joyride-step-dataset'))

// Paso 3 (antes que las capturas del paso 2): arquitectura del tutorial (ReLU 10, ReLU 10, Softmax 4)
await evaluate(`${card('joyride-step-editor-layers')}.querySelector('.accordion-body .btn-outline-danger').click()`)
await sleep(300)
await setValue('#formUnitsLayer0', 10)
await setValue('#formUnitsLayer1', 10)
await sleep(800)

// Paso 2: diseño de capas, compacto y extendido
await capture('02-layer-design-0', card('joyride-step-layer'))
await setValue('.joyride-step-layer .card-header select', 'EXTEND')
await sleep(3000)
await capture('02-layer-design-1', card('joyride-step-layer'))
await setValue('.joyride-step-layer .card-header select', 'COMPACT')
await sleep(1500)

// Paso 3: editor con la última capa abierta y el resultado en el diseño de capas
await evaluate(`${card('joyride-step-editor-layers')}.querySelectorAll('.accordion-button')[2].click()`)
await sleep(800)
await capture('03-editor-layers-0', card('joyride-step-editor-layers'))
await capture('03-editor-layers-3-result', card('joyride-step-layer'))

// Paso 4: hiperparámetros del tutorial
await setValue('#FormNumberOfEpochs', 30)
await capture('04-editor-hyperparameters', card('joyride-step-editor-trainer'))

// Paso 5: tres entrenamientos (3, 10 y 30 épocas) y tabla de modelos
const rows = `(${card('joyride-step-list-of-models')}?.querySelectorAll('tbody tr').length ?? 0)`
for (const [index, epochs] of [3, 10, 30].entries()) {
  await setValue('#FormNumberOfEpochs', epochs)
  await evaluate(`${submit}.click()`)
  await waitFor(`!document.querySelector('[role=status]') && ${rows} >= ${index + 1}`, 300000)
  await sleep(2000)
}
// Cierra el visor de tfjs-vis, que tapa el lado derecho
await evaluate(`[...${card('joyride-step-list-of-models')}.querySelectorAll('.card-header button')].pop().click()`)
await sleep(1000)
await capture('05-table-models', card('joyride-step-list-of-models'))

// Paso 6: predicción con el modelo 2 sobre una instancia vgood
const predictCard = `document.querySelector('.joyride-step-classify-visualization .card')`
await setValue('.joyride-step-select-instance select', 1508)
await setValue('.joyride-step-select-model select', 1)
await sleep(800)
await capture('06-predict-0', predictCard, `${predictCard}.querySelector('button[type=submit]')`)
await evaluate(`${predictCard}.querySelector('button[type=submit]').click()`)
await waitFor(`!!${predictCard}.querySelector('canvas')`, 20000)
await sleep(1500)
await capture('06-predict-1', predictCard)

console.log('errores:', errors.slice(0, 5))
ws.close(); chrome.kill(); process.exit(0)
