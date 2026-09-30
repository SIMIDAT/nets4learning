#!/usr/bin/env node
/**
 * Entrena el modelo preentrenado de KMNIST (/playground/image-classification/model/IMAGE-KMNIST) y lo guarda
 * en formato TensorFlow.js (model.json + weights.bin). Las imágenes de ejemplo de esa página las genera
 * Scripts/build_kmnist_examples.py.
 *
 * - Datos: los .npy originales de KMNIST (60.000 imágenes de entrenamiento y 10.000 de test). Se apartan
 *   5.000 de entrenamiento para validar; el test solo se usa al final para medir la precisión.
 * - Red: CNN tipo VGG sin BatchNormalization, porque la explicación con LRP de la app solo sabe propagar
 *   Conv2D, MaxPooling2D, Dropout, Flatten y Dense.
 * - Aumento de datos: pequeños giros, escalados y desplazamientos, y trazos más gruesos en parte de las
 *   imágenes, para que también reconozca los caracteres dibujados con el ratón.
 *
 * Requiere @tensorflow/tfjs-node con su binario nativo. En el proyecto su build está desactivada
 * (pnpm-workspace.yaml), así que lo más sencillo es instalarlo aparte:
 *
 *   npm install --prefix /tmp/tfjs-node @tensorflow/tfjs-node@4.22.0
 *   TFJS_NODE_DIR=/tmp/tfjs-node node Scripts/train_kmnist_model.cjs [--epochs 30] [--data-dir …] [--out-dir …]
 *
 * Con 32 núcleos tarda unos 25 s por época.
 */
const fs = require('node:fs')
const path = require('node:path')
const util = require('node:util')

// tfjs-node 4.22 usa funciones de node:util que Node 23 eliminó
util.isNullOrUndefined ??= (value) => value === null || value === undefined
util.isArray = Array.isArray

const tf = require(process.env.TFJS_NODE_DIR
  ? require.resolve('@tensorflow/tfjs-node', { paths: [process.env.TFJS_NODE_DIR] })
  : '@tensorflow/tfjs-node')

const ROOT = path.resolve(__dirname, '..')
const { values: args } = util.parseArgs({
  options: {
    'epochs'     : { type: 'string', default: '30' },
    'batch-size' : { type: 'string', default: '128' },
    'data-dir'   : { type: 'string', default: path.join(ROOT, 'public/datasets/03-image-classification/kmnist') },
    'out-dir'    : { type: 'string', default: path.join(ROOT, 'public/models/03-image-classification/kmnist') },
  },
})

const SIZE = 28
const PIXELS = SIZE * SIZE
const NUM_CLASSES = 10
// Los 10 caracteres hiragana de KMNIST (kmnist_classmap.csv), en el orden de las etiquetas
const CLASS_LABELS = ['お', 'き', 'す', 'つ', 'な', 'は', 'ま', 'や', 'れ', 'を']
const VALIDATION_SIZE = 5000
const LEARNING_RATE = 1e-3
const LEARNING_RATE_DECAY = 0.9 // por época
// Aumento de datos
const MAX_ROTATION = (12 * Math.PI) / 180
const MAX_SCALE = 0.12
const MAX_SHIFT = 2.5
const THICKEN_RATIO = 0.25

/** Lee un .npy de uint8 (formato de NumPy, versiones 1 a 3) y devuelve sus datos y su forma. */
function readNpyUint8(file) {
  const buffer = fs.readFileSync(file)
  if (buffer.toString('latin1', 1, 6) !== 'NUMPY') throw new Error(`${file} no es un fichero .npy`)
  const headerStart = buffer[6] === 1 ? 10 : 12
  const headerLength = buffer[6] === 1 ? buffer.readUInt16LE(8) : buffer.readUInt32LE(8)
  const header = buffer.toString('latin1', headerStart, headerStart + headerLength)
  if (!header.includes("'descr': '|u1'")) throw new Error(`${file}: se esperaba uint8 (${header.trim()})`)
  const shape = header.match(/'shape': \(([^)]*)\)/)[1].split(',').filter((s) => s.trim()).map(Number)
  const length = shape.reduce((a, b) => a * b, 1)
  return { data: buffer.subarray(headerStart + headerLength, headerStart + headerLength + length), shape }
}

/** Imágenes normalizadas a [0, 1] (trazo blanco sobre fondo negro, como espera la app) y etiquetas. */
function loadSplit(split) {
  const images = readNpyUint8(path.join(args['data-dir'], `kmnist-${split}-imgs`, 'arr_0.npy'))
  const labels = readNpyUint8(path.join(args['data-dir'], `kmnist-${split}-labels`, 'arr_0.npy'))
  const pixels = Float32Array.from(images.data, (value) => value / 255)
  return { pixels, labels: Uint8Array.from(labels.data), count: labels.shape[0] }
}

/** Subconjunto `indices` de un split. */
function take(split, indices) {
  const pixels = new Float32Array(indices.length * PIXELS)
  const labels = new Uint8Array(indices.length)
  indices.forEach((index, i) => {
    pixels.set(split.pixels.subarray(index * PIXELS, (index + 1) * PIXELS), i * PIXELS)
    labels[i] = split.labels[index]
  })
  return { pixels, labels, count: indices.length }
}

const random = (max) => (Math.random() * 2 - 1) * max

/** Copia de las imágenes con un giro, un escalado y un desplazamiento aleatorios para cada una. */
function augment(pixels, count) {
  const out = new Float32Array(pixels.length)
  const center = (SIZE - 1) / 2
  const at = (offset, x, y) => (x < 0 || y < 0 || x >= SIZE || y >= SIZE ? 0 : pixels[offset + y * SIZE + x])
  for (let k = 0; k < count; k++) {
    const angle = random(MAX_ROTATION)
    const scale = 1 + random(MAX_SCALE)
    const shiftX = random(MAX_SHIFT)
    const shiftY = random(MAX_SHIFT)
    // Transformación inversa: para cada píxel de salida, de qué punto de la imagen original viene
    const cos = Math.cos(angle) / scale
    const sin = Math.sin(angle) / scale
    const offset = k * PIXELS
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const dx = x - center - shiftX
        const dy = y - center - shiftY
        const sx = cos * dx + sin * dy + center
        const sy = -sin * dx + cos * dy + center
        const x0 = Math.floor(sx)
        const y0 = Math.floor(sy)
        const fx = sx - x0
        const fy = sy - y0
        out[offset + y * SIZE + x] =
          (at(offset, x0, y0) * (1 - fx) + at(offset, x0 + 1, y0) * fx) * (1 - fy) +
          (at(offset, x0, y0 + 1) * (1 - fx) + at(offset, x0 + 1, y0 + 1) * fx) * fy
      }
    }
  }
  return out
}

/** Engrosa el trazo (dilatación 3×3) de una parte aleatoria de las imágenes. */
function thicken(xs) {
  return tf.tidy(() => {
    const mask = tf.randomUniform([xs.shape[0], 1, 1, 1]).less(THICKEN_RATIO)
    return tf.where(mask.tile([1, SIZE, SIZE, 1]), tf.maxPool(xs, 3, 1, 'same'), xs)
  })
}

const toTensors = ({ pixels, labels, count }) => ({
  xs: tf.tensor4d(pixels, [count, SIZE, SIZE, 1]),
  ys: tf.oneHot(tf.tensor1d(labels, 'int32'), NUM_CLASSES),
})

function buildModel() {
  const model = tf.sequential()
  model.add(tf.layers.conv2d({ inputShape: [SIZE, SIZE, 1], filters: 32, kernelSize: 3, padding: 'same', activation: 'relu' }))
  model.add(tf.layers.conv2d({ filters: 32, kernelSize: 3, padding: 'same', activation: 'relu' }))
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }))
  model.add(tf.layers.dropout({ rate: 0.25 }))
  model.add(tf.layers.conv2d({ filters: 64, kernelSize: 3, padding: 'same', activation: 'relu' }))
  model.add(tf.layers.conv2d({ filters: 64, kernelSize: 3, padding: 'same', activation: 'relu' }))
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }))
  model.add(tf.layers.dropout({ rate: 0.25 }))
  model.add(tf.layers.conv2d({ filters: 128, kernelSize: 3, padding: 'same', activation: 'relu' }))
  model.add(tf.layers.conv2d({ filters: 128, kernelSize: 3, padding: 'same', activation: 'relu' }))
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }))
  model.add(tf.layers.dropout({ rate: 0.25 }))
  model.add(tf.layers.flatten())
  model.add(tf.layers.dense({ units: 256, activation: 'relu' }))
  model.add(tf.layers.dropout({ rate: 0.5 }))
  model.add(tf.layers.dense({ units: NUM_CLASSES, activation: 'softmax' }))
  model.compile({ optimizer: tf.train.adam(LEARNING_RATE), loss: 'categoricalCrossentropy', metrics: ['accuracy'] })
  return model
}

/** Clase predicha para cada imagen. */
function predictClasses(model, xs) {
  return tf.tidy(() => model.predict(xs, { batchSize: 1000 }).argMax(-1).dataSync())
}

async function main() {
  const epochs = Number(args.epochs)
  const batchSize = Number(args['batch-size'])

  const full = loadSplit('train')
  const test = loadSplit('test')
  // Validación: 5.000 imágenes de entrenamiento elegidas al azar
  const order = tf.util.createShuffledIndices(full.count)
  const train = take(full, Array.from(order.subarray(VALIDATION_SIZE)))
  const validation = toTensors(take(full, Array.from(order.subarray(0, VALIDATION_SIZE))))
  const trainYs = tf.oneHot(tf.tensor1d(train.labels, 'int32'), NUM_CLASSES)
  console.log(`Entrenamiento: ${train.count}, validación: ${VALIDATION_SIZE}, test: ${test.count}`)

  const model = buildModel()
  model.summary()

  for (let epoch = 1; epoch <= epochs; epoch++) {
    const start = Date.now()
    model.optimizer.learningRate = LEARNING_RATE * LEARNING_RATE_DECAY ** (epoch - 1)
    const xs = tf.tidy(() => thicken(tf.tensor4d(augment(train.pixels, train.count), [train.count, SIZE, SIZE, 1])))
    const { history } = await model.fit(xs, trainYs, {
      epochs        : 1,
      batchSize,
      shuffle       : true,
      validationData: [validation.xs, validation.ys],
      verbose       : 0,
    })
    xs.dispose()
    const seconds = Math.round((Date.now() - start) / 1000)
    console.log(`Época ${epoch}/${epochs} (${seconds}s) · loss ${history.loss[0].toFixed(4)} · acc ${history.acc[0].toFixed(4)} · val_acc ${history.val_acc[0].toFixed(4)}`)
  }

  // Precisión final con las 10.000 imágenes de test, que no se han usado hasta ahora
  const testXs = tf.tensor4d(test.pixels, [test.count, SIZE, SIZE, 1])
  const predicted = predictClasses(model, testXs)
  const hits = new Array(NUM_CLASSES).fill(0)
  const totals = new Array(NUM_CLASSES).fill(0)
  test.labels.forEach((label, i) => {
    totals[label]++
    if (predicted[i] === label) hits[label]++
  })
  const accuracy = hits.reduce((a, b) => a + b, 0) / test.count
  console.log(`\nPrecisión en test: ${(accuracy * 100).toFixed(2)} %`)
  console.log(CLASS_LABELS.map((c, i) => `${c} ${(100 * hits[i] / totals[i]).toFixed(1)} %`).join(' · '))

  model.setUserDefinedMetadata({
    dataset     : 'KMNIST (Kuzushiji-MNIST)',
    classLabels : CLASS_LABELS,
    trainImages : train.count,
    testImages  : test.count,
    testAccuracy: Number(accuracy.toFixed(4)),
    epochs,
  })
  fs.mkdirSync(args['out-dir'], { recursive: true })
  await model.save(`file://${args['out-dir']}`)
  console.log(`Modelo guardado en ${path.relative(ROOT, args['out-dir'])}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
