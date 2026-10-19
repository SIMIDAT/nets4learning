import { describe, expect, test } from 'vitest'
import * as tf from '@tensorflow/tfjs'

import { buildDenseModel, buildImageModel, buildSeriesModel } from '@core/training/buildModels'
import { denseCodeLayers, imageCodeLayers, kerasCode, seriesCodeLayers, tfjsCode, type ModelCode_t } from '@core/nn-utils/modelCode'

const IRIS: ModelCode_t = {
  inputShape  : [4],
  layers      : denseCodeLayers([{ units: 10, activation: 'relu' }, { units: 3, activation: 'softmax' }]),
  optimizer   : 'train-adam',
  learningRate: 0.01,
  loss        : 'categoricalCrossentropy',
  metrics     : ['accuracy'],
  epochs      : 20,
  batchSize   : 32,
  dataComment : 'X: las filas; y: su clase en one-hot',
}

/** Ejecuta el código de TF.js generado (sin el import) y devuelve el modelo, compilado y entrenado una época */
async function run(code: string, inputShape: number[], outputs: number) {
  const body = code.replace(/^import .*$/m, '').replace(/epochs: \d+/, 'epochs: 1') + '\nreturn model'
  const rows = 8
  const XTrain = tf.randomNormal([rows, ...inputShape])
  // Clases en one-hot o, con una sola salida (regresión), un número
  const yTrain = outputs === 1
    ? tf.randomNormal([rows, 1])
    : tf.oneHot(tf.tensor1d(Array.from({ length: rows }, (_, i) => i % outputs), 'int32'), outputs).toFloat()
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
  const model: tf.Sequential = await new AsyncFunction('tf', 'XTrain', 'yTrain', 'XTest', 'yTest', body)(tf, XTrain, yTrain, XTrain, yTrain)
  return model
}

const shapes = (model: tf.LayersModel) => model.layers.map((layer) => `${layer.getClassName()}:${JSON.stringify(layer.outputShape)}`)

describe('modelCode: el código equivalente de la red', () => {
  test('TF.js: se ejecuta, entrena y da la misma red que la aplicación (clasificación tabular)', async () => {
    const model = await run(tfjsCode(IRIS), [4], 3)
    expect(shapes(model)).toEqual(shapes(buildDenseModel([{ units: 10, activation: 'relu' }, { units: 3, activation: 'softmax' }], 4)))
    expect(model.optimizer.getClassName()).toBe('Adam')
  })

  test('Keras: las mismas capas, el optimizador, la pérdida y las métricas con sus nombres de Python', () => {
    const code = kerasCode({ ...IRIS, metrics: ['accuracy', 'precision'] })
    expect(code).toContain('keras.Input(shape=(4,))')
    expect(code).toContain('layers.Dense(10, activation="relu")')
    expect(code).toContain('layers.Dense(3, activation="softmax")')
    expect(code).toContain('optimizer=keras.optimizers.Adam(learning_rate=0.01)')
    expect(code).toContain('loss="categorical_crossentropy"')
    expect(code).toContain('metrics=["accuracy", keras.metrics.Precision()]')
    expect(code).toContain('model.fit(X_train, y_train, epochs=20, batch_size=32, shuffle=True, validation_data=(X_test, y_test))')
    expect(code).toContain('# X: las filas; y: su clase en one-hot')
  })

  test('el optimizador con inercia (momentum) lleva su valor; los nombres de las activaciones se traducen', () => {
    const spec: ModelCode_t = { ...IRIS, optimizer: 'momentum', momentum: 0.9, layers: denseCodeLayers([{ units: 4, activation: 'hardSigmoid' }, { units: 3, activation: 'softmax' }]) }
    expect(tfjsCode(spec)).toContain('optimizer: tf.train.momentum(0.01, 0.9),')
    expect(kerasCode(spec)).toContain('optimizer=keras.optimizers.SGD(learning_rate=0.01, momentum=0.9)')
    expect(kerasCode(spec)).toContain('layers.Dense(4, activation="hard_sigmoid")')
  })

  test('imágenes: la red convolucional, igual que la de la aplicación', async () => {
    const layers = [
      { _class: 'conv2d' as const, _protected: true, inputShape: [28, 28, 1], kernelSize: 5, filters: 8, activation: 'relu' },
      { _class: 'maxPooling2d' as const, poolSize: 2, strides: 2 },
      { _class: 'flatten' as const },
      { _class: 'dense' as const, units: 10, activation: 'softmax' },
    ]
    const { inputShape, layers: code } = imageCodeLayers(layers)
    const spec = { ...IRIS, inputShape, layers: code }
    const model = await run(tfjsCode(spec), inputShape, 10)
    expect(shapes(model)).toEqual(shapes(buildImageModel(layers)))
    const keras = kerasCode(spec)
    expect(keras).toContain('keras.Input(shape=(28, 28, 1))')
    expect(keras).toContain('layers.Conv2D(8, kernel_size=5, activation="relu")')
    expect(keras).toContain('layers.MaxPooling2D(pool_size=2, strides=2)')
    expect(keras).toContain('layers.Flatten()')
  })

  test('series: la ventana como secuencia para las recurrentes, igual que la aplicación', async () => {
    const layers = [
      { _class: 'lstm' as const, units: 8, activation: 'tanh' },
      { _class: 'gru' as const, units: 4, activation: 'tanh' },
      { _class: 'dense' as const, units: 1, activation: 'linear' },
    ]
    const spec = { ...IRIS, inputShape: [12], layers: seriesCodeLayers(layers, 12), loss: 'meanSquaredError', metrics: ['mse'] }
    const model = await run(tfjsCode(spec), [12], 1)
    expect(shapes(model)).toEqual(shapes(buildSeriesModel(layers, 12)))
    const keras = kerasCode(spec)
    expect(keras).toContain('layers.Reshape((12, 1))')
    expect(keras).toContain('layers.LSTM(8, activation="tanh", return_sequences=True)')
    expect(keras).toContain('layers.GRU(4, activation="tanh")')
    expect(keras).toContain('loss="mean_squared_error"')
  })
})
