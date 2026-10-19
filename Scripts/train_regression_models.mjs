#!/usr/bin/env node
/**
 * Reentrena modelos de regresión de los paquetes .n4l (public/n4l/<paquete>.n4l) y, si mejoran en datos que no han
 * visto, los guarda en su paquete.
 *
 * - Datos: el CSV del conjunto del modelo, preparado como lo prepara la aplicación al cargar el paquete
 *   (src/core/n4l/regression.ts): las columnas de «label-encoder» numeradas en el orden en que aparecen (como el
 *   LabelEncoder de danfo), sin las de «drop» ni las que no son de entrada, y escaladas con min-max sobre todo el
 *   conjunto. El objetivo, tal cual.
 * - Se aparta un 20 % para prueba (con semilla). Con el resto se entrenan varias redes (con un 15 % para validar y
 *   parar a tiempo) y se elige la de menor error de validación.
 * - El modelo actual se mide en la misma prueba. Solo si el nuevo tiene mejor R² se guarda (con --write): su
 *   model.json y sus pesos, sus métricas de prueba en el manifiesto y la versión del paquete subida (1.0.0 → 1.1.0).
 * - --force lo guarda aunque no mejore: cuando el actual pudo entrenarse con esas mismas filas de prueba, su nota
 *   sale inflada y solo la del nuevo dice cómo predice con datos que no ha visto.
 *
 * Uso:  node Scripts/train_regression_models.mjs --package wine-quality --model white [--write [--force]] [--seed 1]
 * Con TensorFlow.js de JavaScript (sin binarios nativos): son conjuntos pequeños.
 */
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import * as tf from '@tensorflow/tfjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const { values: args } = util.parseArgs({
  options: {
    'package': { type: 'string' },
    'model'  : { type: 'string' },
    'seed'   : { type: 'string', default: '1' },
    'write'  : { type: 'boolean', default: false },
    'force'  : { type: 'boolean', default: false },
  },
})
if (args.package === undefined || args.model === undefined) {
  console.error('Uso: node Scripts/train_regression_models.mjs --package <id> --model <id> [--write]')
  process.exit(1)
}

const TEST_SIZE = 0.2
const VALIDATION_SIZE = 0.15
const MAX_EPOCHS = 400
const PATIENCE = 30
// Las redes que se prueban (la salida, una neurona lineal, se añade siempre)
const CANDIDATES = [
  { layers: [[64, 'relu'], [32, 'relu']], learningRate: 0.001 },
  { layers: [[64, 'relu'], [64, 'relu']], learningRate: 0.001 },
  { layers: [[128, 'relu'], [64, 'relu'], [32, 'relu']], learningRate: 0.0005 },
  { layers: [[32, 'sigmoid'], [16, 'relu']], learningRate: 0.003 },
]

/** Números pseudoaleatorios con semilla (mulberry32): la misma partición siempre */
function seededRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6D2B79F5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/** Un CSV sencillo (comas, comillas dobles): cabecera y filas */
function readCSV(file) {
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/).filter((line) => line.trim() !== '')
  const parse = (line) => {
    const cells = []
    let cell = ''
    let quoted = false
    for (const char of line) {
      if (char === '"') quoted = !quoted
      else if (char === ',' && !quoted) {
        cells.push(cell)
        cell = ''
      } else cell += char
    }
    cells.push(cell)
    return cells.map((value) => value.trim())
  }
  const [header, ...rows] = lines.map(parse)
  return { header, rows }
}

const packageDir = path.join(ROOT, 'public/n4l', `${args.package}.n4l`)
const manifestFile = path.join(packageDir, 'manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'))
const section = manifest.tasks.find(({ task }) => task === 'regression')
const entry = section?.models.find(({ id }) => id === args.model)
if (entry === undefined) throw new Error(`${args.package} no tiene el modelo de regresión ${args.model}`)
const dataset = manifest.datasets.find(({ id }) => id === entry.dataset)

// El preprocesado del paquete, como lo aplica la aplicación
const isCategorical = ({ type }) => type === 'Categorical' || type === 'Binary'
const stepColumns = (selector) => (selector === 'categorical'
  ? dataset.columns.filter(isCategorical)
  : selector === 'features' ? dataset.columns.filter(({ role }) => role === 'Feature') : dataset.columns.filter(({ name }) => selector.includes(name)))
const encoded = new Set(section.preprocessing.filter(({ op }) => op === 'label-encoder').flatMap(({ columns }) => stepColumns(columns).map(({ name }) => name)))
const dropped = new Set(section.preprocessing.filter(({ op }) => op === 'drop').flatMap(({ columns }) => stepColumns(columns).map(({ name }) => name)))
const features = dataset.columns.filter(({ role, name }) => role === 'Feature' && !dropped.has(name)).map(({ name }) => name)
const target = dataset.columns.find(({ role }) => role === 'Target').name

const { header, rows } = readCSV(path.join(packageDir, dataset.file))
const index = (name) => header.indexOf(name)
// LabelEncoder de danfo: cada valor, su posición en el orden en que aparece
const codes = Object.fromEntries([...encoded].map((name) => [name, [...new Set(rows.map((row) => row[index(name)]))]]))
const raw = rows.map((row) => features.map((name) => (encoded.has(name) ? codes[name].indexOf(row[index(name)]) : Number(row[index(name)]))))
const y = rows.map((row) => Number(row[index(target)]))
const minimum = features.map((_, column) => Math.min(...raw.map((row) => row[column])))
const maximum = features.map((_, column) => Math.max(...raw.map((row) => row[column])))
const X = raw.map((row) => row.map((value, column) => (maximum[column] === minimum[column] ? 0 : (value - minimum[column]) / (maximum[column] - minimum[column]))))

// Partición de prueba, con semilla
const random = seededRandom(Number(args.seed))
const order = rows.map((_, row) => row)
for (let i = order.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [order[i], order[j]] = [order[j], order[i]]
}
const testCount = Math.round(order.length * TEST_SIZE)
const testRows = order.slice(0, testCount)
const trainRows = order.slice(testCount)

function metrics(model, rowsToUse) {
  const predictions = model.predict(tf.tensor2d(rowsToUse.map((row) => X[row]))).dataSync()
  const actual = rowsToUse.map((row) => y[row])
  const mean = actual.reduce((sum, value) => sum + value, 0) / actual.length
  const mae = actual.reduce((sum, value, i) => sum + Math.abs(value - predictions[i]), 0) / actual.length
  const baseline = actual.reduce((sum, value) => sum + Math.abs(value - mean), 0) / actual.length
  const residual = actual.reduce((sum, value, i) => sum + (value - predictions[i]) ** 2, 0)
  const total = actual.reduce((sum, value) => sum + (value - mean) ** 2, 0)
  return { r2: 1 - residual / total, mae, baseline }
}

/** Un model.json y sus pesos (de este paquete), en memoria */
async function loadModel(modelPath) {
  const file = path.join(packageDir, modelPath)
  const json = JSON.parse(fs.readFileSync(file, 'utf-8'))
  const buffers = json.weightsManifest.flatMap(({ paths }) => paths.map((weights) => fs.readFileSync(path.join(path.dirname(file), weights))))
  const weightData = Buffer.concat(buffers)
  return tf.loadLayersModel(tf.io.fromMemory({
    modelTopology: json.modelTopology,
    weightSpecs  : json.weightsManifest.flatMap(({ weights }) => weights),
    weightData   : weightData.buffer.slice(weightData.byteOffset, weightData.byteOffset + weightData.byteLength),
  }))
}

async function train({ layers, learningRate }, seed) {
  const model = tf.sequential()
  layers.forEach(([units, activation], i) => model.add(tf.layers.dense({
    units, activation, ...(i === 0 && { inputShape: [features.length] }),
    kernelInitializer: tf.initializers.glorotUniform({ seed: seed + i }),
  })))
  model.add(tf.layers.dense({ units: 1, activation: 'linear', kernelInitializer: tf.initializers.glorotUniform({ seed: seed + 99 }) }))
  model.compile({ optimizer: tf.train.adam(learningRate), loss: 'meanSquaredError' })
  const validationCount = Math.round(trainRows.length * VALIDATION_SIZE)
  const fitRows = trainRows.slice(validationCount)
  const validationRows = trainRows.slice(0, validationCount)
  const history = await model.fit(tf.tensor2d(fitRows.map((row) => X[row])), tf.tensor2d(fitRows.map((row) => [y[row]])), {
    epochs        : MAX_EPOCHS,
    batchSize     : 32,
    shuffle       : false,
    validationData: [tf.tensor2d(validationRows.map((row) => X[row])), tf.tensor2d(validationRows.map((row) => [y[row]]))],
    callbacks     : tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: PATIENCE }),
    verbose       : 0,
  })
  const validationLoss = Math.min(...history.history.val_loss)
  return { model, validationLoss, epochs: history.epoch.length }
}

const current = metrics(await loadModel(entry.path), testRows)
console.log(`${args.package}/${args.model} (${dataset.file}): ${rows.length} filas, ${features.length} columnas de entrada; prueba: ${testRows.length}`)
console.log(`  actual: R² ${current.r2.toFixed(3)}, error medio ${current.mae.toFixed(3)} (prediciendo la media, ${current.baseline.toFixed(3)})`)

let best = null
for (const [i, candidate] of CANDIDATES.entries()) {
  const result = await train(candidate, Number(args.seed) * 1000 + i * 10)
  const test = metrics(result.model, testRows)
  console.log(`  ${candidate.layers.map(([units, activation]) => `${units} ${activation}`).join(' → ')} (lr ${candidate.learningRate}, ${result.epochs} épocas): validación ${result.validationLoss.toFixed(4)}, prueba R² ${test.r2.toFixed(3)}, error ${test.mae.toFixed(3)}`)
  if (best === null || result.validationLoss < best.validationLoss) best = { ...result, candidate, test }
}
console.log(`  elegida por validación: R² ${best.test.r2.toFixed(3)} en prueba (antes, ${current.r2.toFixed(3)})`)

if (best.test.r2 <= current.r2 && !args.force) {
  console.log('  no mejora: se queda el actual (con --write --force se guarda igualmente)')
} else if (!args.write) {
  console.log('  mejora: con --write se guarda en el paquete')
} else {
  // El modelo, como lo guarda TF.js: model.json y un fichero de pesos
  await best.model.save(tf.io.withSaveHandler(async (artifacts) => {
    const dir = path.join(packageDir, path.dirname(entry.path))
    fs.writeFileSync(path.join(packageDir, entry.path), JSON.stringify({
      modelTopology  : artifacts.modelTopology,
      format         : 'layers-model',
      generatedBy    : `TensorFlow.js tfjs-layers v${tf.version.tfjs}`,
      convertedBy    : null,
      weightsManifest: [{ paths: ['model.weights.bin'], weights: artifacts.weightSpecs }],
    }))
    fs.writeFileSync(path.join(dir, 'model.weights.bin'), Buffer.from(artifacts.weightData))
    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } }
  }))
  entry.metrics = { test_r2: Number(best.test.r2.toFixed(4)), test_mae: Number(best.test.mae.toFixed(4)), test_baseline_mae: Number(best.test.baseline.toFixed(4)) }
  const [major, minor] = manifest.version.split('.').map(Number)
  manifest.version = `${major}.${minor + 1}.0`
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`  guardado en ${path.relative(ROOT, packageDir)} (versión ${manifest.version})`)
}
