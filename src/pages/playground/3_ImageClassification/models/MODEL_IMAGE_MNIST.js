import I_MODEL_IMAGE_CLASSIFICATION from './_model'
import { Trans } from 'react-i18next'
import * as Train_MNIST from '@pages/playground/3_ImageClassification/custom/Train_MNIST'

export const LIST_OF_IMAGES_MNIST = [
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

  DESCRIPTION () {
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

  async TRAIN_MODEL (params) {
    return await Train_MNIST.MNIST_run({
      learningRate : params.learningRate,
      numberOfEpoch: params.numberEpochs,
      testSize     : params.testSize,
      idLoss       : params.idLoss,
      idOptimizer  : params.idOptimizer,
      idMetricsList: params.idMetricsList,
      layerList    : params.layers,
    })
  }

  DEFAULT_LAYERS () {
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
        _class  : 'maxPooling2d',
        poolSize: 2,
        strides : 2,
      },
      {
        _class    : 'conv2d',
        kernelSize: 3,
        filters   : 32,
        activation: 'relu'
      },
      {
        _class  : 'maxPooling2d',
        poolSize: 2,
        strides : 2,
      },
      {
        _class    : 'conv2d',
        kernelSize: 3,
        filters   : 32,
        activation: 'relu'
      },
      {
        _class: 'flatten',
      },
      {
        _class    : 'dense',
        units     : 64,
        activation: 'relu'
      },
      {
        _class    : 'dense',
        units     : 10,
        activation: 'softmax'
      }
    ]
  }
}
