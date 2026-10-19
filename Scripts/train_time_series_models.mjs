#!/usr/bin/env node
/**
 * Entrena el modelo ya entrenado de una serie temporal de un paquete .n4l (public/n4l/<paquete>.n4l) y, con --write, lo
 * guarda en el paquete con sus métricas de prueba.
 *
 * - La serie se prepara como en la aplicación, con el mismo código (src/core/timeSeries/series.ts): la ventana, la
 *   parte de prueba (lo último de la serie, sin barajar), si se diferencia y el escalado min-max con el entrenamiento,
 *   según `forecast` del manifiesto.
 * - Las últimas ventanas del entrenamiento (un 15 %) se apartan para validar: con ellas se para a tiempo y se elige,
 *   de varias veces que se entrena la red de `training`, la que menos se equivoca. La prueba no se mira hasta el final.
 * - Con la prueba se mide a un paso y seguida (en las unidades de la serie) y se guardan en el manifiesto: test_mae,
 *   test_rmse, test_recursive_mae y, para compararse, test_naive_mae y (con estación) test_seasonal_mae. La versión del
 *   paquete sube (1.0.0 → 1.1.0).
 *
 * Uso:  node Scripts/train_time_series_models.mjs --package airline-passengers [--write] [--runs 5]
 * Con TensorFlow.js de JavaScript (sin binarios nativos): son series pequeñas.
 */
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import { pathToFileURL } from 'node:url'
import * as tf from '@tensorflow/tfjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const series = await import(pathToFileURL(path.join(ROOT, 'src/core/timeSeries/series.ts')).href)

const { values: args } = util.parseArgs({
  options: {
    'package': { type: 'string' },
    'runs'   : { type: 'string', default: '5' },
    'write'  : { type: 'boolean', default: false },
  },
})
if (args.package === undefined) {
  console.error('Uso: node Scripts/train_time_series_models.mjs --package <id> [--write] [--runs 5]')
  process.exit(1)
}

const VALIDATION_SIZE = 0.15
const MAX_EPOCHS = 400
const PATIENCE = 40
const BATCH_SIZE = 32
const MODEL_ID = 'forecast'

const packageDir = path.join(ROOT, 'public/n4l', `${args.package}.n4l`)
const manifestFile = path.join(packageDir, 'manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'))
const section = manifest.tasks.find(({ task }) => task === 'time-series')
if (section === undefined) throw new Error(`${args.package} no tiene la tarea time-series`)
const dataset = manifest.datasets.find(({ id }) => id === section.datasets[0])
const dateColumn = dataset.columns.find(({ type }) => type === 'Date').name
const valueColumn = dataset.columns.find(({ role }) => role === 'Target').name

// La serie, como la lee la aplicación (los CSV de los paquetes no llevan comillas)
const [header, ...lines] = fs.readFileSync(path.join(packageDir, dataset.file), 'utf-8').trim().split(/\r?\n/).map((line) => line.split(','))
const { values } = series.readSeries(header, lines, valueColumn, dateColumn)
const prep = { window: section.forecast.window, testSize: section.forecast.testSize ?? 20, difference: section.forecast.difference ?? false }
const season = section.forecast.season
const prepared = series.prepareSeries(values, prep)

// Validación: las últimas ventanas del entrenamiento (en orden, como la prueba)
const validationCount = Math.round(prepared.train.X.length * VALIDATION_SIZE)
const fitCount = prepared.train.X.length - validationCount
const tensor = (rows) => tf.tensor2d(rows)
const column = (values) => tf.tensor2d(values, [values.length, 1])
const XFit = tensor(prepared.train.X.slice(0, fitCount))
const yFit = column(prepared.train.y.slice(0, fitCount))
const XValidation = tensor(prepared.train.X.slice(fitCount))
const yValidation = column(prepared.train.y.slice(fitCount))

/** La red de `training` del manifiesto (las recurrentes reciben la ventana como secuencia) */
function buildModel() {
  const layers = section.training.layers
  const lastRecurrent = layers.reduce((last, layer, index) => (layer.class !== 'dense' ? index : last), -1)
  const model = tf.sequential()
  if (lastRecurrent !== -1) model.add(tf.layers.reshape({ targetShape: [prep.window, 1], inputShape: [prep.window] }))
  layers.forEach((layer, index) => {
    const config = { units: layer.units, activation: layer.activation ?? 'tanh' }
    if (layer.class === 'dense') model.add(tf.layers.dense({ ...config, ...(index === 0 && lastRecurrent === -1 && { inputShape: [prep.window] }) }))
    else model.add(tf.layers[layer.class]({ ...config, returnSequences: index < lastRecurrent }))
  })
  model.compile({ optimizer: tf.train.adam(section.training.learningRate ?? 0.001), loss: 'meanSquaredError' })
  return model
}

/** Entrena hasta que la validación deja de mejorar y se queda con los pesos de su mejor época */
async function train() {
  const model = buildModel()
  let best = { loss: Infinity, epoch: 0, weights: null }
  await model.fit(XFit, yFit, {
    epochs        : MAX_EPOCHS,
    batchSize     : BATCH_SIZE,
    shuffle       : true,
    validationData: [XValidation, yValidation],
    verbose       : 0,
    callbacks     : {
      onEpochEnd: async (epoch, logs) => {
        if (logs.val_loss < best.loss) {
          best.weights?.forEach((weight) => weight.dispose())
          best = { loss: logs.val_loss, epoch, weights: model.getWeights().map((weight) => weight.clone()) }
        } else if (epoch - best.epoch >= PATIENCE) {
          model.stopTraining = true
        }
      },
    },
  })
  model.setWeights(best.weights)
  best.weights.forEach((weight) => weight.dispose())
  return { model, loss: best.loss, epochs: best.epoch + 1 }
}

const predict = (model, rows) => tf.tidy(() => Array.from(model.predict(tf.tensor2d(rows, [rows.length, prep.window])).dataSync()))

console.log(`${args.package}: ${values.length} valores · ventana ${prep.window} · prueba ${prep.testSize} % · ${prepared.train.X.length} ventanas de entrenamiento (${validationCount} para validar)`)
let chosen = null
for (let run = 1; run <= Number(args.runs); run++) {
  const result = await train()
  console.log(`  vez ${run}: validación ${result.loss.toFixed(5)} (época ${result.epochs})`)
  if (chosen === null || result.loss < chosen.loss) {
    chosen?.model.dispose()
    chosen = result
  } else {
    result.model.dispose()
  }
}

// La prueba, solo con el elegido
const actual = prepared.test.targets.map((t) => values[t])
const oneStep = series.forecastErrors(actual, series.oneStepValues(values, prepared.test.targets, predict(chosen.model, prepared.test.X), prep, prepared.scale))
const recursive = series.forecastErrors(actual, await series.recursiveForecast(values, prepared.test.targets[0], actual.length, prep, prepared.scale, (window) => predict(chosen.model, [window])[0]))
const baselines = series.baselineErrors(values, prepared, season)
const round = (value) => Number(value.toFixed(4))
const metrics = {
  test_mae          : round(oneStep.mae),
  test_rmse         : round(oneStep.rmse),
  test_recursive_mae: round(recursive.mae),
  test_naive_mae    : round(baselines.oneStep.naive.mae),
  ...(baselines.oneStep.seasonal !== undefined && { test_seasonal_mae: round(baselines.oneStep.seasonal.mae) }),
}
console.log('  prueba:', metrics)

if (!args.write) {
  console.log('  con --write se guarda en el paquete')
} else {
  const entry = { id: MODEL_ID, format: 'tfjs-layers', path: `models/${MODEL_ID}/model.json`, dataset: dataset.id, input: 'scaled', metrics }
  const dir = path.join(packageDir, path.dirname(entry.path))
  fs.mkdirSync(dir, { recursive: true })
  // El modelo, como lo guarda TF.js: model.json y un fichero de pesos
  await chosen.model.save(tf.io.withSaveHandler(async (artifacts) => {
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
  section.models = [entry]
  const [major, minor] = manifest.version.split('.').map(Number)
  manifest.version = `${major}.${minor + 1}.0`
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`  guardado en ${path.relative(ROOT, packageDir)} (versión ${manifest.version})`)
}
