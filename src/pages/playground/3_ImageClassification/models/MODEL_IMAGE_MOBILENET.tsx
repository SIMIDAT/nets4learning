import I_MODEL_IMAGE_CLASSIFICATION, { type ImageClassificationResult_t } from './_model'
import { Trans } from 'react-i18next'
import * as tf_mobilenet from '@tensorflow-models/mobilenet'
import { DEFAULT_BAR_DATA, type BarChartData_t } from '@pages/playground/3_ImageClassification/CONSTANTS'

/** Una clase predicha por MobileNet con su probabilidad */
type MobileNetPrediction_t = { className: string, probability: number }
import { IC_MODEL_KEYS } from '@/MODEL_KEYS'

export const LIST_OF_IMAGES_MOBILENET = [
  'beef-burger.jpg',
  'bulldog.jpg',
  'butterfly.jpg',
  'cat.jpg',
  'cheetah.jpg',
  'cruise.jpg',
  'duck.jpg',
  'elephant.jpg',
  'lion.jpg',
]
export default class MODEL_IMAGE_MOBILENET extends I_MODEL_IMAGE_CLASSIFICATION {
  static KEY = IC_MODEL_KEYS.MOBILENET
  TITLE = 'datasets-models.3-image-classifier.mobilenet.title'
  i18n_TITLE = 'datasets-models.3-image-classifier.mobilenet.title'

  DESCRIPTION() {
    const prefix = 'datasets-models.3-image-classifier.mobilenet.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text-0'} /></p>
      <p><Trans i18nKey={prefix + 'text-1'} /></p>

      <details>
        <summary><Trans i18nKey={prefix + 'details-input.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-input.list.0'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-output.title'} /></summary>
        <ol>
          <li>
            <Trans i18nKey={prefix + 'details-output.list.0'}
              components={{
                link1: <a href="https://storage.googleapis.com/download.tensorflow.org/data/ImageNetLabels.txt" rel="noreferrer" target="_blank">Text</a>
              }} />
          </li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-references.title'} /></summary>
        <p><Trans i18nKey={prefix + 'details-references.text-0'} /></p>
        <ol>
          <li>
            <Trans i18nKey={prefix + 'details-references.list.0'}
              components={{
                link1: <a href="https://arxiv.org/abs/1801.04381" target="_blank" rel="noreferrer">Text</a>
              }} />
          </li>
        </ol>
      </details>
    </>
  }

  async ENABLE_MODEL(): Promise<tf_mobilenet.MobileNet> {
    return await tf_mobilenet.load()
  }

  async CLASSIFY(model: tf_mobilenet.MobileNet, imageData: ImageData): Promise<{predictions: MobileNetPrediction_t[], index: number}> {
    const predictions = await model.classify(imageData)
    return { predictions, index: 0 }
  }

  async CLASSIFY_IMAGE(model: tf_mobilenet.MobileNet, imageData: ImageData): Promise<{predictions: MobileNetPrediction_t[], index: number}> {
    const predictions = await model.classify(imageData)
    return { predictions, index: 0 }
  }

  PREDICTION_RESULT(predictions: MobileNetPrediction_t[]): ImageClassificationResult_t {
    return { values: predictions.map((p) => p.probability), labels: predictions.map((p) => p.className), topK: true }
  }

  async PREDICTION_FORMAT(predictions: MobileNetPrediction_t[]): Promise<BarChartData_t> {
    return {
      labels  : [''],
      datasets: predictions.map((v, i) => {
        return {
          label          : v.className,
          data           : [v.probability],
          backgroundColor: DEFAULT_BAR_DATA.datasets[0].backgroundColor[i % 7],
          borderColor    : DEFAULT_BAR_DATA.datasets[0].borderColor[i % 7],
          borderWidth    : DEFAULT_BAR_DATA.datasets[0].borderWidth,
        }
      }),
    }
  }

  LIST_IMAGES_EXAMPLES(): string[] {
    return LIST_OF_IMAGES_MOBILENET
  }
}
