import type * as _tfjs from '@tensorflow/tfjs'
import type {MobileNet} from '@tensorflow-models/mobilenet'

import type * as _Types from '@core/types'
import type { ImageLayer_t } from '@/types/types'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import type { BarChartData_t } from '../CONSTANTS'
import type { TFunction } from 'i18next'
import type { TrainProgress_t } from '@pages/playground/3_ImageClassification/custom/trainImageClassifier'
import type { ClassificationEvaluation_t } from '@core/controller/trainDenseModel'
import type { SpriteImageDataset } from './SpriteImageDataset'
import type { CharacterForms_t } from './characterForms'
import type { SpriteImage_t } from './spriteDecode'
import type { N4LPackage_t } from '@core/n4l/source'

/** Modelo que clasifica las imágenes: uno entrenado con tfjs o MobileNet */
export type ImageClassifierModel_t = _tfjs.LayersModel | MobileNet

/** Parámetros de entrenamiento que recoge la página de clasificación de imágenes */
/** Resultado de clasificar una imagen, listo para N4LClassificationChart */
export type ImageClassificationResult_t = { values: number[], labels: string[], topK: boolean }

export type ImageTrainParams_t = {
  learningRate : number
  numberEpochs : number
  testSize     : number
  idLoss       : IdLoss_t | IdMetric_t
  idOptimizer  : IdOptimizer_t
  idMetricsList: Array<IdLoss_t | IdMetric_t>
  layers       : ImageLayer_t[]
}

export default abstract class I_MODEL_IMAGE_CLASSIFICATION {
  TITLE       : string = ''
  i18n_TITLE  : string = ''
  /** Nombre de cada clase (en el idioma de la página), en el orden de las salidas del modelo (p. ej. '0'…'9') */
  CLASS_LABELS: string[] = []
  /** Su identificador en el conjunto de datos (en el mismo orden), si no es el nombre: 'airplane' para «avión» */
  CLASS_IDS   : string[] = []
  /** Clasifica dibujos en escala de grises: la revisión del modelo ofrece el lienzo y explica con LRP */
  DRAWABLE = false
  /** Cómo son las imágenes que recibe, si son las de un conjunto (null: cualquier foto, como MobileNet) */
  IMAGE       : SpriteImage_t | null = null
  /** Sus imágenes de prueba se pueden clasificar desde un selector (LOAD_DATASET) */
  TEST_IMAGES = false
  t           : TFunction<'translation', undefined>

  constructor (_t: TFunction<'translation', undefined>) {
    this.t = _t
  }

  DESCRIPTION () {
    return <></>
  }

  /** El paquete .n4l del que sale, para descargarlo (null si no sale de uno) */
  N4L_PACKAGE (): N4LPackage_t | null {
    return null
  }

  DEFAULT_LAYERS (): ImageLayer_t[] {
    return []
  }

  /** La tasa de aprendizaje y las épocas con las que se empieza a entrenar, si el conjunto las propone */
  DEFAULT_TRAINING (): { learningRate?: number, epochs?: number } {
    return {}
  }

  /**
   * 
   * @returns {Promise<_tfjs.LayersModel | MobileNet | null>}
   */
  async ENABLE_MODEL (): Promise<_tfjs.LayersModel | MobileNet | null> {
    return null
  }

  /** Las direcciones de las imágenes de ejemplo */
  LIST_IMAGES_EXAMPLES (): string[] {
    return []
  }

  /** Caracteres que se escribían de varias formas (KMNIST): los ejemplos enseñan la de hoy junto a las antiguas */
  CHARACTER_FORMS (): CharacterForms_t[] | null {
    return null
  }

  async CLASSIFY (_model: ImageClassifierModel_t, _imageData: ImageData): Promise<{predictions: unknown[], index: number}> {
    return { predictions: [], index: 0 }
  }

  async CLASSIFY_IMAGE (_model: ImageClassifierModel_t, _imageData: ImageData): Promise<{predictions: unknown[], index: number}> {
    return { predictions: [], index: 0 }
  }

  /**
   * La predicción como la muestra N4LClassificationChart: un valor por clase y su nombre. `topK` si son solo las
   * clases más probables de muchas (MobileNet devuelve las 3 primeras de 1000)
   */
  PREDICTION_RESULT (_predictions: unknown[]): ImageClassificationResult_t {
    return { values: [], labels: [], topK: false }
  }

  async PREDICTION_FORMAT (_predictions: unknown[]): Promise<BarChartData_t> {
    return {
      labels  : [],
      datasets: []
    }
  }

  /**
   * 
   * @returns {Promise<{model: _tfjs.Sequential, history: _tfjs.History, evaluation?: ClassificationEvaluation_t} | null>}
   */
  /** Dataset de imágenes con el que se entrena (null si el modelo no se entrena en N4L) */
  async LOAD_DATASET (): Promise<SpriteImageDataset | null> {
    return null
  }

  async TRAIN_MODEL (_params: ImageTrainParams_t, _progress?: TrainProgress_t): Promise<{model: _tfjs.Sequential, history: _tfjs.History, evaluation?: ClassificationEvaluation_t} | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(null)
      }, 1000)
    })
  }

  /** Imagen que recibe el modelo; por defecto, el canvas entero */
  async GET_IMAGE_DATA (canvas: HTMLCanvasElement, canvas_ctx: CanvasRenderingContext2D): Promise<ImageData> {
    return canvas_ctx.getImageData(0, 0, canvas.width, canvas.height)
  }
}
