import type * as _Types from '@core/types'
import type { ImageLayer_t } from '@/types/types'
import { isRecurrentLayer, type SeriesLayer_t } from '@core/timeSeries/seriesLayers'

// El código equivalente de la red que se ha diseñado, en TensorFlow.js (JavaScript) y en Keras (Python): para pasar de
// la interfaz a programar. Hace lo mismo que la aplicación al entrenar (src/core/training/buildModels.ts y los
// entrenadores): las mismas capas, la misma compilación y las mismas opciones de fit().

export type CodeLayer_t =
  | { kind: 'dense', units: number, activation: string }
  | { kind: 'conv2d', filters: number, kernelSize: number, activation?: string }
  | { kind: 'maxPooling2d', poolSize?: number, strides?: number }
  | { kind: 'flatten' }
  | { kind: 'reshape', targetShape: number[] }
  | { kind: 'simpleRNN' | 'lstm' | 'gru', units: number, activation: string, returnSequences: boolean }

export type ModelCode_t = {
  /** La forma de cada ejemplo de entrada, sin el lote: [atributos], [alto, ancho, canales] o [ventana] */
  inputShape  : number[]
  layers      : CodeLayer_t[]
  /** El optimizador (con o sin el prefijo «train-»: adam, sgd, rmsprop…), su tasa y, si es momentum, su inercia */
  optimizer   : string
  learningRate: number
  momentum?   : number
  /** La pérdida y las métricas, con sus nombres de tfjs-layers (categoricalCrossentropy, mse…) */
  loss        : string
  metrics     : string[]
  epochs      : number
  batchSize   : number
  /** Comentario sobre los datos (en el idioma de la página): qué son X e y */
  dataComment : string
}

// region De la aplicación a la especificación

const activationOf = (activation: string | null | undefined) => activation ?? 'linear'

/** Las capas dense de la clasificación tabular y de la regresión, para `inputSize` atributos */
export const denseCodeLayers = (layers: Pick<_Types.Layer_t, 'units' | 'activation'>[]): CodeLayer_t[] =>
  layers.map(({ units, activation }) => ({ kind: 'dense', units, activation: activationOf(activation) }))

/** Las capas de la red de imágenes, y su forma de entrada (la de la primera capa convolucional) */
export function imageCodeLayers(layers: ImageLayer_t[]): { inputShape: number[], layers: CodeLayer_t[] } {
  const inputShape = layers.find((layer) => layer._class === 'conv2d' && layer.inputShape)?.inputShape ?? [28, 28, 1]
  const code: CodeLayer_t[] = []
  for (const layer of layers) {
    switch (layer._class) {
      case 'conv2d':
        code.push({ kind: 'conv2d', filters: layer.filters ?? 1, kernelSize: layer.kernelSize ?? 3, activation: layer.activation ?? undefined })
        break
      case 'maxPooling2d':
        code.push({ kind: 'maxPooling2d', poolSize: layer.poolSize, strides: layer.strides })
        break
      case 'flatten':
        code.push({ kind: 'flatten' })
        break
      case 'dense':
        code.push({ kind: 'dense', units: layer.units ?? 1, activation: activationOf(layer.activation) })
        break
    }
  }
  return { inputShape, layers: code }
}

/** Las capas de una serie temporal: si empieza con recurrentes, la ventana se les da como una secuencia */
export function seriesCodeLayers(layers: SeriesLayer_t[], window: number): CodeLayer_t[] {
  const lastRecurrent = layers.reduce((last, layer, index) => (isRecurrentLayer(layer) ? index : last), -1)
  const code: CodeLayer_t[] = lastRecurrent === -1 ? [] : [{ kind: 'reshape', targetShape: [window, 1] }]
  layers.forEach((layer, index) => {
    const activation = activationOf(layer.activation)
    if (layer._class === 'dense') code.push({ kind: 'dense', units: layer.units, activation })
    else code.push({ kind: layer._class, units: layer.units, activation, returnSequences: index < lastRecurrent })
  })
  return code
}
// endregion

// region TensorFlow.js

const js = (value: unknown) => JSON.stringify(value).replace(/"/g, "'")

function tfjsLayer(layer: CodeLayer_t, first: number[] | null): string {
  const input = first === null ? '' : `, inputShape: ${js(first)}`
  switch (layer.kind) {
    case 'dense':
      return `tf.layers.dense({ units: ${layer.units}, activation: ${js(layer.activation)}${input} })`
    case 'conv2d':
      return `tf.layers.conv2d({ filters: ${layer.filters}, kernelSize: ${layer.kernelSize}${layer.activation ? `, activation: ${js(layer.activation)}` : ''}${input} })`
    case 'maxPooling2d': {
      const options = [
        layer.poolSize === undefined ? null : `poolSize: ${layer.poolSize}`,
        layer.strides === undefined ? null : `strides: ${layer.strides}`,
        first === null ? null : `inputShape: ${js(first)}`,
      ].filter((option) => option !== null)
      return `tf.layers.maxPooling2d(${options.length === 0 ? '' : `{ ${options.join(', ')} }`})`
    }
    case 'flatten':
      return first === null ? 'tf.layers.flatten()' : `tf.layers.flatten({ inputShape: ${js(first)} })`
    case 'reshape':
      return `tf.layers.reshape({ targetShape: ${js(layer.targetShape)}${input} })`
    default:
      return `tf.layers.${layer.kind}({ units: ${layer.units}, activation: ${js(layer.activation)}, returnSequences: ${layer.returnSequences}${input} })`
  }
}

function tfjsOptimizer({ optimizer, learningRate, momentum }: ModelCode_t): string {
  const id = optimizer.replace(/^train-/, '')
  return id === 'momentum' ? `tf.train.momentum(${learningRate}, ${momentum ?? 0})` : `tf.train.${id}(${learningRate})`
}

/** El código en TensorFlow.js: el modelo, su compilación y su entrenamiento */
export function tfjsCode(spec: ModelCode_t): string {
  return [
    "import * as tf from '@tensorflow/tfjs'",
    '',
    'const model = tf.sequential()',
    ...spec.layers.map((layer, index) => `model.add(${tfjsLayer(layer, index === 0 ? spec.inputShape : null)})`),
    '',
    'model.compile({',
    `  optimizer: ${tfjsOptimizer(spec)},`,
    `  loss: ${js(spec.loss)},`,
    `  metrics: ${js(spec.metrics)},`,
    '})',
    '',
    `// ${spec.dataComment}`,
    'await model.fit(XTrain, yTrain, {',
    `  epochs: ${spec.epochs},`,
    `  batchSize: ${spec.batchSize},`,
    '  shuffle: true,',
    '  validationData: [XTest, yTest],',
    '})',
  ].join('\n')
}
// endregion

// region Keras (Python)

const KERAS_ACTIVATIONS: Record<string, string> = { hardSigmoid: 'hard_sigmoid', gelu_new: 'gelu' }
const KERAS_OPTIMIZERS: Record<string, string> = {
  sgd: 'SGD', momentum: 'SGD', adagrad: 'Adagrad', adadelta: 'Adadelta', adam: 'Adam', adamax: 'Adamax', rmsprop: 'RMSprop',
}
const KERAS_LOSSES: Record<string, string> = {
  categoricalCrossentropy    : 'categorical_crossentropy',
  binaryCrossentropy         : 'binary_crossentropy',
  kullbackLeiblerDivergence  : 'kl_divergence',
  hinge                      : 'hinge',
  squaredHinge               : 'squared_hinge',
  categoricalHinge           : 'categorical_hinge',
  meanSquaredError           : 'mean_squared_error',
  meanAbsoluteError          : 'mean_absolute_error',
  meanAbsolutePercentageError: 'mean_absolute_percentage_error',
  meanSquaredLogarithmicError: 'mean_squared_logarithmic_error',
  logcosh                    : 'log_cosh',
  poisson                    : 'poisson',
  cosineProximity            : 'cosine_similarity',
}
// Las métricas como las nombra Keras: un texto o, si no tiene nombre corto, el objeto
const KERAS_METRICS: Record<string, string> = {
  accuracy                 : '"accuracy"',
  binaryAccuracy           : '"binary_accuracy"',
  binaryCrossentropy       : '"binary_crossentropy"',
  categoricalAccuracy      : '"categorical_accuracy"',
  categoricalCrossentropy  : '"categorical_crossentropy"',
  cosine                   : '"cosine_similarity"',
  mae                      : '"mae"',
  mape                     : '"mape"',
  mse                      : '"mse"',
  precision                : 'keras.metrics.Precision()',
  recall                   : 'keras.metrics.Recall()',
  sparseCategoricalAccuracy: '"sparse_categorical_accuracy"',
}

const py = (value: string) => `"${KERAS_ACTIVATIONS[value] ?? value}"`
const tuple = (values: number[]) => `(${values.join(', ')}${values.length === 1 ? ',' : ''})`

function kerasLayer(layer: CodeLayer_t): string {
  switch (layer.kind) {
    case 'dense':
      return `layers.Dense(${layer.units}, activation=${py(layer.activation)})`
    case 'conv2d':
      return `layers.Conv2D(${layer.filters}, kernel_size=${layer.kernelSize}${layer.activation ? `, activation=${py(layer.activation)}` : ''})`
    case 'maxPooling2d': {
      const options = [layer.poolSize === undefined ? null : `pool_size=${layer.poolSize}`, layer.strides === undefined ? null : `strides=${layer.strides}`]
      return `layers.MaxPooling2D(${options.filter((option) => option !== null).join(', ')})`
    }
    case 'flatten':
      return 'layers.Flatten()'
    case 'reshape':
      return `layers.Reshape(${tuple(layer.targetShape)})`
    default: {
      const name = { simpleRNN: 'SimpleRNN', lstm: 'LSTM', gru: 'GRU' }[layer.kind]
      return `layers.${name}(${layer.units}, activation=${py(layer.activation)}${layer.returnSequences ? ', return_sequences=True' : ''})`
    }
  }
}

function kerasOptimizer({ optimizer, learningRate, momentum }: ModelCode_t): string {
  const id = optimizer.replace(/^train-/, '')
  const name = KERAS_OPTIMIZERS[id] ?? 'Adam'
  return `keras.optimizers.${name}(learning_rate=${learningRate}${id === 'momentum' ? `, momentum=${momentum ?? 0}` : ''})`
}

/** El código en Keras (Python): el mismo modelo, compilado y entrenado igual */
export function kerasCode(spec: ModelCode_t): string {
  return [
    'import keras',
    'from keras import layers',
    '',
    'model = keras.Sequential([',
    `    keras.Input(shape=${tuple(spec.inputShape)}),`,
    ...spec.layers.map((layer) => `    ${kerasLayer(layer)},`),
    '])',
    '',
    'model.compile(',
    `    optimizer=${kerasOptimizer(spec)},`,
    `    loss="${KERAS_LOSSES[spec.loss] ?? spec.loss}",`,
    `    metrics=[${spec.metrics.map((metric) => KERAS_METRICS[metric] ?? `"${metric}"`).join(', ')}],`,
    ')',
    '',
    `# ${spec.dataComment}`,
    `model.fit(X_train, y_train, epochs=${spec.epochs}, batch_size=${spec.batchSize}, shuffle=True, validation_data=(X_test, y_test))`,
  ].join('\n')
}
// endregion
