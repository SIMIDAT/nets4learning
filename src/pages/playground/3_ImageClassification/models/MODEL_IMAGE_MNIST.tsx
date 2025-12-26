import { Trans } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'
import I_MODEL_IMAGE_CLASSIFICATION from './_model'
import * as Train_MNIST from '@pages/playground/3_ImageClassification/custom/Train_MNIST'
import { DEFAULT_BAR_DATA } from '@pages/playground/3_ImageClassification/CONSTANTS'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t, Layer_t } from '@/types/nn-types'

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
