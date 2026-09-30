import * as tfjs from '@tensorflow/tfjs'
import I_MODEL_IMAGE_CLASSIFICATION from './_model'
import type { SpriteDatasetConfig_t } from './SpriteImageDataset'
import { trainImageClassifier, type ParamsTrainImage_t } from '@pages/playground/3_ImageClassification/custom/trainImageClassifier'
import { DEFAULT_BAR_DATA, type BarChartData_t } from '@pages/playground/3_ImageClassification/CONSTANTS'
import { imageDataToMnistTensor4d, toImageData } from '@pages/playground/3_ImageClassification/utils/utils'
import type { Layer_t } from '@/types/types'
import {
  createActivationsHelpers,
  applyLRP,
} from '@pages/playground/3_ImageClassification/explainPrediction/modelEmbeddingActivations'

const _activationsHelpers = createActivationsHelpers({
  imageDataToTensor4d: imageDataToMnistTensor4d,
})

/**
 * Clasificador de imágenes de 28x28 en escala de grises con 10 clases (MNIST, KMNIST…).
 * Cada dataset solo define su sprite (`DATASET`), el nombre de sus clases y su descripción:
 * el entrenamiento, la clasificación y la explicación con LRP son comunes.
 */
export default abstract class I_MODEL_IMAGE_28X28 extends I_MODEL_IMAGE_CLASSIFICATION {
  abstract DATASET: SpriteDatasetConfig_t

  async PREDICTION_FORMAT(predictions: number[]): Promise<BarChartData_t> {
    return {
      labels  : this.CLASS_LABELS,
      datasets: [{
        label          : this.DATASET.name,
        data           : predictions,
        backgroundColor: DEFAULT_BAR_DATA.datasets[0].backgroundColor,
        borderColor    : DEFAULT_BAR_DATA.datasets[0].borderColor,
        borderWidth    : DEFAULT_BAR_DATA.datasets[0].borderWidth,
      }],
    }
  }

  async CLASSIFY(model: tfjs.LayersModel, imageData: ImageData): Promise<{ predictions: number[]; index: number }> {
    const predictions = Array.from(tfjs.tidy(() => {
      const predTensor = model.predict(imageDataToMnistTensor4d(imageData)) as tfjs.Tensor
      return predTensor.dataSync()
    }))
    const index = predictions.indexOf(Math.max(...predictions))
    return { predictions, index }
  }

  async CLASSIFY_IMAGE(model: tfjs.LayersModel, imageData: ImageData): Promise<{ predictions: number[]; index: number }> {
    return this.CLASSIFY(model, imageData)
  }

  /** Imagen del canvas reducida a 28×28 (entrada del modelo), sin dibujar en el canvas. */
  async GET_IMAGE_DATA(canvas: HTMLCanvasElement, _canvas_ctx: CanvasRenderingContext2D): Promise<ImageData> {
    return toImageData(canvas, 28, 28)
  }

  /**
   * Devuelve las activaciones (salidas de capa) de varias capas en una sola
   * inferencia. Útil para métodos de explicabilidad (LRP/Grad-CAM).
   */
  async GET_ACTIVATIONS_IMAGE(
    model: tfjs.LayersModel,
    imageData: ImageData,
    options: { layerNames?: string[]; includeInput?: boolean } = {},
  ) {
    return _activationsHelpers.GET_ACTIVATIONS_IMAGE(model, imageData, options)
  }

  /**
   * Calcula la propagación de relevancia LRP retropropagando desde la salida
   * hasta la entrada, capa a capa.
   */
  async CALCULATE_LRP_PROPAGATION(
    model: tfjs.LayersModel,
    _imageData: ImageData,
    activations: {
      layers: Record<string, { data: Float32Array; shape: number[] }>
      order : string[]
    },
    options: {
      rule?          : 'epsilon' | 'alpha_beta'
      epsilon?       : number
      alpha?         : number
      beta?          : number
      winnerTakesAll?: boolean
    } = {},
  ): Promise<tfjs.Tensor> {
    return tfjs.tidy(() => {
      const order = activations.order
      const orderReversed = [...order].reverse()

      const lastLayerName = orderReversed[0]
      const lastLayerData = activations.layers[lastLayerName]

      // LRP se inicializa con el LOGIT pre-softmax de la clase objetivo,
      // no con las probabilidades (Montavon et al. 2019, §10.2.1).
      // Como la softmax va fusionada en la última Dense, recalculamos z = x·W + b.
      const lastLayer = model.getLayer(lastLayerName)
      const prevData = activations.layers[orderReversed[1]]
      const xLast = tfjs.tensor(prevData.data, prevData.shape)
      const [wLast, bLast] = lastLayer.getWeights()
      let logits: tfjs.Tensor = xLast.matMul(wLast)
      if (bLast) logits = logits.add(bLast) // Podría no tener sesgo

      // Máscara one-hot sobre la clase predicha: solo R_c ≠ 0
      const probs = tfjs.tensor(lastLayerData.data, lastLayerData.shape)
      const targetClass = probs.argMax(-1)
      const numClasses = logits.shape[logits.shape.length - 1] as number
      const mask = tfjs.oneHot(targetClass, numClasses).cast('float32')

      // Inicializar relevancia con la salida de la última capa
      let R: tfjs.Tensor = logits.mul(mask)

      // Ir hacia atrás por todas las capas
      for (let i = 0; i < orderReversed.length - 1; i++) {
        const currentLayerName = orderReversed[i]
        const inputLayerName = orderReversed[i + 1]

        const currentLayer = model.getLayer(currentLayerName)
        const layerType = currentLayer.getClassName()

        // Entrada de esta capa (salida de la capa anterior)
        const inputData = activations.layers[inputLayerName]
        const x = tfjs.tensor(inputData.data, inputData.shape)

        // Aplicar LRP según el tipo de capa
        R = applyLRP({
          layerType,
          inputTensor : x,
          relevanceOut: R,
          layer       : currentLayer,
          options,
        })
      }

      return R
    })
  }

  async TRAIN_MODEL(params: ParamsTrainImage_t): Promise<{ model: tfjs.Sequential, history: tfjs.History }> {
    return trainImageClassifier(this.DATASET, this.CLASS_LABELS, params)
  }

  DEFAULT_LAYERS(): Layer_t[] {
    return [
      {
        _class    : 'conv2d',
        _protected: true,
        inputShape: [28, 28, 1],
        kernelSize: 3,
        filters   : 16,
        activation: 'relu',
      },
      {
        _class    : 'maxPooling2d',
        _protected: false,
        poolSize  : 2,
        strides   : 2,
      },
      {
        _class    : 'conv2d',
        _protected: false,

        kernelSize: 3,
        filters   : 32,
        activation: 'relu'
      },
      {
        _class    : 'maxPooling2d',
        _protected: false,
        poolSize  : 2,
        strides   : 2,
      },
      {
        _class    : 'conv2d',
        _protected: false,
        kernelSize: 3,
        filters   : 32,
        activation: 'relu'
      },
      {
        _class    : 'flatten',
        _protected: false,
      },
      {
        _class    : 'dense',
        _protected: false,
        units     : 64,
        activation: 'relu'
      },
      {
        _class    : 'dense',
        _protected: false,
        units     : 10,
        activation: 'softmax'
      }
    ]
  }
}
