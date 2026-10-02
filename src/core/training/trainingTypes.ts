import type * as tfjs from '@tensorflow/tfjs'
import type { TFBackend_t } from '@core/tfBackend'
import type { Layer_t } from '@/types/types'
import type { CompileParams_t, DenseLayer_t, TrainingHistory_t } from './buildModels'

// Lo que se intercambian el hilo principal y el worker de entrenamiento (TODO-worker.md)

/** Aviso de progreso: al acabar cada lote y cada época, con sus métricas (alimentan el visor y "Época x de N") */
export type TrainingProgress_t =
  | { kind: 'batch', batch: number, logs: tfjs.Logs }
  | { kind: 'epoch', epoch: number, totalEpochs: number, logs: tfjs.Logs }

/** Clase real y predicha de cada ejemplo de validación (índices de clase); solo en clasificación */
export type ClassificationEvaluation_t = { labels: number[], predictions: number[] }

/** Red de capas dense (clasificación tabular y regresión) con los datos ya procesados */
export type DenseTrainingRequest_t = {
  backend      : TFBackend_t
  /** Atributos, fila a fila (rows × features) */
  X            : Float32Array
  rows         : number
  features     : number
  /** Objetivo: [rows] (regresión) o [rows, clases] en one-hot (clasificación) */
  y            : Float32Array
  yShape       : number[]
  layerList    : DenseLayer_t[]
  compile      : CompileParams_t
  testSize     : number
  seed?        : number
  numberOfEpoch: number
}

/** Red convolucional con un sprite de imágenes de 28×28 (MNIST, KMNIST): el worker lo descarga y lo decodifica */
export type ImageTrainingRequest_t = {
  backend      : TFBackend_t
  /** URLs absolutas (el worker no conoce la ruta de la página) */
  imagesUrl    : string
  labelsUrl    : string
  numElements  : number
  numTrain     : number
  layers       : Layer_t[]
  compile      : CompileParams_t
  numberOfEpoch: number
  /** Imágenes de entrenamiento y de validación que se usan (barajadas) */
  trainSize    : number
  testSize     : number
  batchSize    : number
}

export type TrainingResult_t = {
  artifacts  : tfjs.io.ModelArtifacts
  history    : TrainingHistory_t
  evaluation?: ClassificationEvaluation_t
}

// Los errores cruzan del worker como texto: un prefijo dice de qué tipo eran
export const DEFINITION_ERROR_PREFIX = 'N4L_MODEL_DEFINITION:'
export const BACKEND_ERROR_PREFIX = 'N4L_BACKEND_UNAVAILABLE:'
