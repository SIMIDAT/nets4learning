import * as tfjs from '@tensorflow/tfjs'
import I_MODEL_IMAGE_CLASSIFICATION, { type ImageClassificationResult_t } from './_model'
import { loadSpriteDataset, type SpriteDatasetConfig_t, type SpriteImageDataset } from './SpriteImageDataset'
import { trainImageClassifier, type ParamsTrainImage_t, type TrainProgress_t } from '@pages/playground/3_ImageClassification/custom/trainImageClassifier'
import { DEFAULT_BAR_DATA, type BarChartData_t } from '@pages/playground/3_ImageClassification/CONSTANTS'
import { imageDataToTensor4d, toImageData } from '@pages/playground/3_ImageClassification/utils/utils'
import type { SpriteImage_t } from './spriteDecode'
import type { ClassificationEvaluation_t } from '@core/controller/trainDenseModel'
import {
  createActivationsHelpers,
  applyLRP,
} from '@pages/playground/3_ImageClassification/explainPrediction/modelEmbeddingActivations'

/**
 * Clasificador de las imágenes de un sprite, en gris (MNIST, KMNIST…) o en color (CIFAR-10…). Cada conjunto solo da
 * cómo son sus imágenes (`IMAGE`), su sprite (`SPRITE`), el nombre de sus clases y su descripción: el entrenamiento, la
 * clasificación y la explicación con LRP son comunes. Las de gris se pueden dibujar
 */
export default abstract class I_MODEL_IMAGE_SPRITE extends I_MODEL_IMAGE_CLASSIFICATION {
  /** El nombre del conjunto (en la gráfica de la predicción) */
  abstract DATASET_NAME: string
  TEST_IMAGES = true
  private readonly activations: ReturnType<typeof createActivationsHelpers>
  declare IMAGE               : SpriteImage_t

  /** `image`: cómo son las imágenes del conjunto */
  constructor(t: ConstructorParameters<typeof I_MODEL_IMAGE_CLASSIFICATION>[0], image: SpriteImage_t) {
    super(t)
    this.IMAGE = image
    this.DRAWABLE = image.channels === 1
    this.activations = createActivationsHelpers({ imageDataToTensor4d: (imageData: ImageData) => imageDataToTensor4d(imageData, image.channels) })
  }

  /** El sprite del conjunto (sus direcciones pueden necesitar leer el paquete: se pide al usarlo) */
  abstract SPRITE(): Promise<SpriteDatasetConfig_t>

  PREDICTION_RESULT(predictions: number[]): ImageClassificationResult_t {
    return { values: predictions, labels: this.CLASS_LABELS, topK: false }
  }

  async PREDICTION_FORMAT(predictions: number[]): Promise<BarChartData_t> {
    return {
      labels  : this.CLASS_LABELS,
      datasets: [{
        label          : this.DATASET_NAME,
        data           : predictions,
        backgroundColor: DEFAULT_BAR_DATA.datasets[0].backgroundColor,
        borderColor    : DEFAULT_BAR_DATA.datasets[0].borderColor,
        borderWidth    : DEFAULT_BAR_DATA.datasets[0].borderWidth,
      }],
    }
  }

  async CLASSIFY(model: tfjs.LayersModel, imageData: ImageData): Promise<{ predictions: number[]; index: number }> {
    const predTensor = tfjs.tidy(() => model.predict(imageDataToTensor4d(imageData, this.IMAGE.channels)) as tfjs.Tensor)
    // Lectura asíncrona: dataSync detiene el hilo principal hasta que la GPU termina
    const predictions = Array.from(await predTensor.data())
    predTensor.dispose()
    const index = predictions.indexOf(Math.max(...predictions))
    return { predictions, index }
  }

  async CLASSIFY_IMAGE(model: tfjs.LayersModel, imageData: ImageData): Promise<{ predictions: number[]; index: number }> {
    return this.CLASSIFY(model, imageData)
  }

  /** Imagen del canvas reducida al tamaño de las del conjunto (entrada del modelo), sin dibujar en el canvas */
  async GET_IMAGE_DATA(canvas: HTMLCanvasElement, _canvas_ctx: CanvasRenderingContext2D): Promise<ImageData> {
    return toImageData(canvas, this.IMAGE.width, this.IMAGE.height)
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
    return this.activations.GET_ACTIVATIONS_IMAGE(model, imageData, options)
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

  /** Dataset (ya descargado si se ha entrenado): sus imágenes de test se pueden clasificar desde el selector */
  async LOAD_DATASET(): Promise<SpriteImageDataset> {
    // Solo las imágenes de test: es lo que enseña el selector (si el entero ya se cargó al entrenar, se usa ese)
    return loadSpriteDataset(await this.SPRITE(), { testOnly: true })
  }

  async TRAIN_MODEL(params: ParamsTrainImage_t, progress: TrainProgress_t = {}): Promise<{ model: tfjs.Sequential, history: tfjs.History, evaluation: ClassificationEvaluation_t }> {
    return trainImageClassifier(await this.SPRITE(), this.CLASS_LABELS, params, progress)
  }
}
