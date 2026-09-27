import { Trans } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'
import I_MODEL_IMAGE_CLASSIFICATION from './_model'
import * as Train_MNIST from '@pages/playground/3_ImageClassification/custom/Train_MNIST'
import { DEFAULT_BAR_DATA } from '@pages/playground/3_ImageClassification/CONSTANTS'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t, Layer_t } from '@/types/nn-types'
import {
  createEmbeddingActivationsHelpers,
  applyLRP,
} from '@pages/playground/3_ImageClassification/explainPrediction/modelEmbeddingActivations'

export type ParamsTrain_MNIST_t = {
  learningRate : number,
  numberEpochs : number,
  testSize     : number,
  idLoss       : IdLoss_t,
  idOptimizer  : IdOptimizer_t,
  idMetricsList: IdMetric_t[],
  layers       : Layer_t[],
}
export const LIST_OF_IMAGES_MNIST: string[] = [
  '0_new.png',
  '1_new.png',
  '2_new.png',
  '3_new.png',
  '4_new.png',
  '5_new.png',
  '6_new.png',
  '7_new.png',
  '8_new.png',
  '9_new.png'
]

function _imageDataToMnistTensor4d(imageData: ImageData): tfjs.Tensor4D {
  const arr: number[][][] = []
  let row: number[][] = []

  // Mantiene el preprocesado consistente: invierte colores y mapea a [0,1],
  // pero NO muta imageData.
  for (let p = 0; p < imageData.data.length; p += 4) {
    const inverted = 255 - imageData.data[p]
    const value01 = inverted / 255
    row.push([value01])
    if (row.length === 28) {
      arr.push(row)
      row = []
    }
  }

  return tfjs.tensor4d([arr])
}

const _embedActHelpers = createEmbeddingActivationsHelpers({
  imageDataToTensor4d: _imageDataToMnistTensor4d,
})

export default class MODEL_IMAGE_MNIST extends I_MODEL_IMAGE_CLASSIFICATION {
  static KEY = 'IMAGE-MNIST'
  TITLE = 'datasets-models.3-image-classifier.mnist.title'
  i18n_TITLE = 'datasets-models.3-image-classifier.mnist.title'

  DESCRIPTION() {
    const prefix = 'datasets-models.3-image-classifier.mnist.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text-0'} /></p>
      <p><Trans i18nKey={prefix + 'text-1'} /></p>
      <p><Trans i18nKey={prefix + 'text-2'} /></p>

      <details>
        <summary><Trans i18nKey={prefix + 'details-input.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-input.list.0'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-output.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-output.list.0'} /></li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
          {`
@article{deng2012mnist,
  title={The mnist database of handwritten digit images for machine learning research},
  author={Deng, Li},
  journal={IEEE Signal Processing Magazine},
  volume={29},
  number={6},
  pages={141--142},
  year={2012},
  publisher={IEEE}
}
`}
        </pre>
      </details>
    </>
  }

  LIST_IMAGES_EXAMPLES(): string[] {
    return LIST_OF_IMAGES_MNIST
  }

  /**
   * 
   * @returns {Promise<tfjs.LayersModel>}
   */
  async ENABLE_MODEL() {
    const model = await tfjs.loadLayersModel(import.meta.env.VITE_PATH + '/models/03-image-classification/keras-mnist/model.json')
    return model
  }

  async PREDICTION_FORMAT(predictions: number[]): Promise<{ labels: any[], datasets: any[] }> {
    return {
      labels  : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      datasets: [{
        label          : 'MNIST',
        data           : predictions,
        backgroundColor: DEFAULT_BAR_DATA.datasets[0].backgroundColor,
        borderColor    : DEFAULT_BAR_DATA.datasets[0].borderColor,
        borderWidth    : DEFAULT_BAR_DATA.datasets[0].borderWidth,
      }],
    }
  }

  async CLASSIFY(model: tfjs.LayersModel, imageData: ImageData) {
    const arr = []
    let arr28 = []
    for (let p = 0; p < imageData.data.length; p += 4) {
      const valor = imageData.data[p + 3] / 255
      arr28.push([valor])
      if (arr28.length === 28) {
        arr.push(arr28)
        arr28 = []
      }
    }
    const tensor4 = tfjs.tensor4d([arr])
    // TypeScript fix
    const model_predictions = model.predict(tensor4) as tfjs.Tensor<tfjs.Rank>
    const predictions = model_predictions.dataSync() as unknown as number[]
    const index = predictions.indexOf(Math.max.apply(null, predictions))
    return { predictions, index }
  }

  async CLASSIFY_IMAGE(model: tfjs.LayersModel, imageData: ImageData): Promise<{ predictions: number[]; index: number }> {
    const arr: number[][][] = []
    let arr28: number[][] = []
    for (let p = 0; p < imageData.data.length; p += 4) {
      imageData.data[p] = 255 - imageData.data[p]
      imageData.data[p + 1] = 255 - imageData.data[p + 1]
      imageData.data[p + 2] = 255 - imageData.data[p + 2]
      imageData.data[p + 3] = 255
      const valor = imageData.data[p] / 255
      arr28.push([valor])
      if (arr28.length === 28) {
        arr.push(arr28)
        arr28 = []
      }
    }

    // Convertir a tensor 4D dentro de tidy para liberar memoria
    const predictions = tfjs.tidy(() => {
      const tensor4 = tfjs.tensor4d([arr], [1, 28, 28, 1]);
      const predTensor = model.predict(tensor4) as tfjs.Tensor;
      return predTensor.dataSync(); // devuelve Float32Array
    });

    // Obtener índice máximo fuera de tidy
    const index = predictions.indexOf(Math.max(...predictions));

    return {
      predictions: predictions as unknown as number[],
      index,
    };
  }

  async GET_IMAGE_DATA(canvas: HTMLCanvasElement, canvas_ctx: CanvasRenderingContext2D): Promise<ImageData> {
    canvas_ctx.drawImage(canvas, 10, 10, 28, 28)
    return canvas_ctx.getImageData(10, 10, 28, 28)
  }

  async GET_EMBEDDING_IMAGE(
    model: tfjs.LayersModel,
    imageData: ImageData,
    options: { layerName?: string } = {},
  ) {
    return _embedActHelpers.GET_EMBEDDING_IMAGE(model, imageData, options)
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
    return _embedActHelpers.GET_ACTIVATIONS_IMAGE(model, imageData, options)
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
      order: string[]
    },
    options: {
      rule?: 'simple' | 'epsilon' | 'alpha_beta'
      epsilon?: number
      alpha?: number
      beta?: number
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

      console.log(
        `\n=== Iniciando LRP Propagation con regla: ${options.rule || 'epsilon'} ===`,
      )
      console.log(`Forma inicial de relevancia: [${R.shape}]`)

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
          inputTensor: x,
          relevanceOut: R,
          layer: currentLayer,
          options,
        })
      }

      console.log(`\n=== LRP Propagation completada ===`)
      console.log(`Forma final de relevancia: [${R.shape}]`)

      return R
    })
  }

  async TRAIN_MODEL(params: ParamsTrain_MNIST_t): Promise<{ model: tfjs.Sequential, history: tfjs.History }> {
    const { model, history } = await Train_MNIST.MNIST_run({
      learningRate : params.learningRate,
      numberEpochs : params.numberEpochs,
      testSize     : params.testSize,
      idLoss       : params.idLoss,
      idOptimizer  : params.idOptimizer,
      idMetricsList: params.idMetricsList,
      layers       : params.layers,
    })

    return { model, history }
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
