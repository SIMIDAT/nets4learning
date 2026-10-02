import * as tfjs from '@tensorflow/tfjs'
import { createLoss, createMetrics, createOptimizer } from '@core/nn-utils/ArchitectureHelper'
import { isActivation } from '@core/nn-utils/ArchitectureTypesHelper'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import type { Layer_t } from '@/types/types'
import type * as _Types from '@core/types'

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

/** Red convolucional (clasificación de imágenes de 28×28) */
export function buildImageModel(layerList: Layer_t[]): tfjs.Sequential {
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
