import { Trans } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'
import I_MODEL_IMAGE_28X28 from './_model_28x28'
import { MNIST_DATASET } from './SpriteImageDataset'
import { IC_MODEL_KEYS } from '@/MODEL_KEYS'

// Cada dígito escrito con la fuente Lato Bold; las genera Scripts/build_mnist_examples.py
export const LIST_OF_IMAGES_MNIST: string[] = Array.from({ length: 10 }, (_, digit) => `mnist/${digit}.png`)

export default class MODEL_IMAGE_MNIST extends I_MODEL_IMAGE_28X28 {
  static KEY = IC_MODEL_KEYS.MNIST
  TITLE = 'datasets-models.3-image-classifier.mnist.title'
  i18n_TITLE = 'datasets-models.3-image-classifier.mnist.title'
  DATASET = MNIST_DATASET
  CLASS_LABELS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

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
}
