import * as tfjs from '@tensorflow/tfjs'
import { createLoss, createMetrics, createOptimizer } from '@core/nn-utils/ArchitectureHelper'
import { isActivation } from '@core/nn-utils/ArchitectureTypesHelper'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import type { ImageLayer_t } from '@/types/types'
import type * as _Types from '@core/types'
import { isRecurrentLayer, type SeriesLayer_t } from '@core/timeSeries/seriesLayers'

export type { SeriesLayer_t } from '@core/timeSeries/seriesLayers'

// Construcción de las redes de los tres entrenadores. Sin DOM ni avisos: la usan igual el worker de entrenamiento y el
// hilo principal (el resumen del visor de tfjs-vis y el entrenamiento sin worker).

/** Error de la arquitectura o de su compilación (lo que el usuario puede corregir), no del worker */
export class ModelDefinitionError extends Error {
  readonly kind: 'activation' | 'compile'
  constructor(message: string, kind: 'activation' | 'compile') {
    super(message)
    this.name = 'ModelDefinitionError'
    this.kind = kind
  }
}

export type DenseLayer_t = Pick<_Types.Layer_t, 'units' | 'activation'>

/** Red de capas dense (clasificación tabular y regresión) para `inputSize` atributos */
export function buildDenseModel(layerList: DenseLayer_t[], inputSize: number): tfjs.Sequential {
  const model = tfjs.sequential()
  for (const [index, layer] of layerList.entries()) {
    if (layer.activation === null || layer.activation === undefined || !isActivation(layer.activation)) {
      throw new ModelDefinitionError(`Layer ${index + 1} activation is not valid (${layer.activation}). Please select an activation function.`, 'activation')
    }
    model.add(tfjs.layers.dense({
      units     : layer.units,
      activation: layer.activation,
      ...(index === 0) && { inputShape: [inputSize] },
    }))
  }
  return model
}

/**
 * Red de una serie temporal: recibe los `window` valores anteriores y predice el siguiente. Si empieza con capas
 * recurrentes, la ventana se les da como una secuencia ([window, 1]) y cada una, salvo la última, pasa la suya a la
 * siguiente; las recurrentes van antes que las dense
 */
export function buildSeriesModel(layerList: SeriesLayer_t[], window: number): tfjs.Sequential {
  const lastRecurrent = layerList.reduce((last, layer, index) => (isRecurrentLayer(layer) ? index : last), -1)
  const firstDense = layerList.findIndex((layer) => !isRecurrentLayer(layer))
  if (lastRecurrent !== -1 && firstDense !== -1 && firstDense < lastRecurrent) {
    throw new ModelDefinitionError(`Layer ${lastRecurrent + 1}: recurrent layers must come before the dense ones`, 'activation')
  }
  const model = tfjs.sequential()
  if (lastRecurrent !== -1) model.add(tfjs.layers.reshape({ targetShape: [window, 1], inputShape: [window] }))
  for (const [index, layer] of layerList.entries()) {
    if (layer.activation === null || layer.activation === undefined || !isActivation(layer.activation)) {
      throw new ModelDefinitionError(`Layer ${index + 1} activation is not valid (${layer.activation}). Please select an activation function.`, 'activation')
    }
    const config = { units: layer.units, activation: layer.activation }
    switch (layer._class) {
      case 'dense':
        model.add(tfjs.layers.dense({ ...config, ...(index === 0) && { inputShape: [window] } }))
        break
      case 'simpleRNN':
        model.add(tfjs.layers.simpleRNN({ ...config, returnSequences: index < lastRecurrent }))
        break
      case 'lstm':
        model.add(tfjs.layers.lstm({ ...config, returnSequences: index < lastRecurrent }))
        break
      case 'gru':
        model.add(tfjs.layers.gru({ ...config, returnSequences: index < lastRecurrent }))
        break
    }
  }
  return model
}

/** Los tensores de un entrenamiento de una serie: ventanas [filas, window] y valores [filas, 1] */
export function seriesTensors({ window, X, y, XTest, yTest }: { window: number, X: Float32Array, y: Float32Array, XTest: Float32Array, yTest: Float32Array }) {
  return {
    X    : tfjs.tensor2d(X, [y.length, window]),
    y    : tfjs.tensor2d(y, [y.length, 1]),
    XTest: tfjs.tensor2d(XTest, [yTest.length, window]),
    yTest: tfjs.tensor2d(yTest, [yTest.length, 1]),
  }
}

/** Red convolucional (clasificación de imágenes de 28×28) */
export function buildImageModel(layerList: ImageLayer_t[]): tfjs.Sequential {
  const model = tfjs.sequential()
  for (const [index, layer] of layerList.entries()) {
    const activation = layer.activation ?? undefined
    if (activation !== undefined && !isActivation(activation)) {
      throw new ModelDefinitionError(`Layer ${index + 1} activation is not valid (${activation})`, 'activation')
    }
    switch (layer._class) {
      case 'conv2d': {
        if (layer.kernelSize === undefined || layer.filters === undefined) {
          throw new ModelDefinitionError(`Layer ${index + 1}: conv2d needs kernelSize and filters`, 'activation')
        }
        model.add(tfjs.layers.conv2d({
          ...(layer._protected ? { inputShape: layer.inputShape } : {}),
          kernelSize: layer.kernelSize,
          filters   : layer.filters,
          activation,
        }))
        break
      }
      case 'maxPooling2d': {
        model.add(tfjs.layers.maxPooling2d({ poolSize: layer.poolSize, strides: layer.strides }))
        break
      }
      case 'flatten': {
        model.add(tfjs.layers.flatten({}))
        break
      }
      case 'dense': {
        if (layer.units === undefined) {
          throw new ModelDefinitionError(`Layer ${index + 1}: dense needs units`, 'activation')
        }
        model.add(tfjs.layers.dense({ units: layer.units, activation }))
        break
      }
      default: {
        console.error('Error, layer not valid', { layer })
        break
      }
    }
  }
  return model
}

export type CompileParams_t = {
  idOptimizer : IdOptimizer_t
  idLoss      : IdLoss_t
  idMetrics   : IdMetric_t | IdMetric_t[]
  learningRate: number
  momentum?   : number
}

/** Compila con el optimizador, la pérdida y las métricas elegidas; si tfjs-layers no las admite, ModelDefinitionError */
export function compileModel(model: tfjs.Sequential, { idOptimizer, idLoss, idMetrics, learningRate, momentum = 0 }: CompileParams_t) {
  try {
    model.compile({
      optimizer: createOptimizer(idOptimizer, { learningRate, momentum }),
      loss     : createLoss(idLoss, {}),
      metrics  : createMetrics(idMetrics, {}),
    })
  } catch (error) {
    throw new ModelDefinitionError(error instanceof Error ? error.message : String(error), 'compile')
  }
}

/** Historial de `fit()` como datos (lo que viaja desde el worker): épocas y valores de cada métrica */
export type TrainingHistory_t = { epoch: number[], history: Record<string, number[]>, params: Record<string, unknown> }

export function historyData(history: tfjs.History): TrainingHistory_t {
  const values: Record<string, number[]> = {}
  for (const [name, list] of Object.entries(history.history)) {
    values[name] = list.map((value) => (typeof value === 'number' ? value : Number(value)))
  }
  return { epoch: [...history.epoch], history: values, params: { ...history.params } }
}

/** El modelo como datos: topología y pesos (los pesos viajan sin copiarse) */
export async function modelArtifacts(model: tfjs.LayersModel): Promise<tfjs.io.ModelArtifacts> {
  let artifacts: tfjs.io.ModelArtifacts | undefined
  await model.save(tfjs.io.withSaveHandler(async (saved) => {
    artifacts = saved
    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } }
  }))
  if (artifacts === undefined) throw new Error('The model could not be serialized')
  return artifacts
}

/** El modelo a partir de sus datos (en el hilo principal, tras entrenarlo en el worker) */
export async function modelFromArtifacts(artifacts: tfjs.io.ModelArtifacts): Promise<tfjs.Sequential> {
  return await tfjs.loadLayersModel(tfjs.io.fromMemory(artifacts)) as tfjs.Sequential
}
