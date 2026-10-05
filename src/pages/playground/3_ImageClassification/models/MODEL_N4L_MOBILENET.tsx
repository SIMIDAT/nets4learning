import type { TFunction } from 'i18next'
import * as tf_mobilenet from '@tensorflow-models/mobilenet'

import { TASKS } from '@/TASKS'
import { n4lTaskText } from '@core/n4l/format'
import { n4lImageExamples, type N4LImageRuntime_t } from '@core/n4l/imageClassification'
import type { N4LPackage_t } from '@core/n4l/source'
import N4LPackageDescription from '@components/n4l/N4LPackageDescription'
import { DEFAULT_BAR_DATA, type BarChartData_t } from '@pages/playground/3_ImageClassification/CONSTANTS'
import I_MODEL_IMAGE_CLASSIFICATION, { type ImageClassificationResult_t } from './_model'

type MobileNetRuntime_t = Extract<N4LImageRuntime_t, { kind: 'mobilenet' }>

/** Una clase predicha por MobileNet con su probabilidad */
type MobileNetPrediction_t = { className: string, probability: number }

/**
 * MobileNet en un paquete .n4l (el de ImageNet): la librería lo descarga en la versión y el ancho del manifiesto; sus
 * textos y sus fotos de ejemplo son los del paquete. `urls`: la dirección de cada foto
 */
export default class MODEL_N4L_MOBILENET extends I_MODEL_IMAGE_CLASSIFICATION {
  readonly pkg         : N4LPackage_t
  readonly runtime     : MobileNetRuntime_t
  private readonly urls: Record<string, string>

  constructor(t: TFunction<'translation', undefined>, pkg: N4LPackage_t, runtime: MobileNetRuntime_t, urls: Record<string, string>) {
    super(t)
    const texts = n4lTaskText(pkg.namespace, TASKS.IMAGE_CLASSIFICATION)
    this.pkg = pkg
    this.runtime = runtime
    this.urls = urls
    this.TITLE = texts + 'title'
    this.i18n_TITLE = texts + 'title'
  }

  /** El paquete del que sale (para descargarlo) */
  N4L_PACKAGE() {
    return this.pkg
  }

  DESCRIPTION() {
    return <N4LPackageDescription manifest={this.pkg.manifest} namespace={this.pkg.namespace} task={TASKS.IMAGE_CLASSIFICATION} />
  }

  async ENABLE_MODEL(): Promise<tf_mobilenet.MobileNet> {
    const { version, alpha } = this.runtime.model
    return tf_mobilenet.load({ version, alpha: alpha as tf_mobilenet.MobileNetAlpha })
  }

  async CLASSIFY(model: tf_mobilenet.MobileNet, imageData: ImageData): Promise<{ predictions: MobileNetPrediction_t[], index: number }> {
    const predictions = await model.classify(imageData)
    return { predictions, index: 0 }
  }

  async CLASSIFY_IMAGE(model: tf_mobilenet.MobileNet, imageData: ImageData): Promise<{ predictions: MobileNetPrediction_t[], index: number }> {
    return this.CLASSIFY(model, imageData)
  }

  PREDICTION_RESULT(predictions: MobileNetPrediction_t[]): ImageClassificationResult_t {
    return { values: predictions.map((p) => p.probability), labels: predictions.map((p) => p.className), topK: true }
  }

  async PREDICTION_FORMAT(predictions: MobileNetPrediction_t[]): Promise<BarChartData_t> {
    return {
      labels  : [''],
      datasets: predictions.map((v, i) => ({
        label          : v.className,
        data           : [v.probability],
        backgroundColor: DEFAULT_BAR_DATA.datasets[0].backgroundColor[i % 7],
        borderColor    : DEFAULT_BAR_DATA.datasets[0].borderColor[i % 7],
        borderWidth    : DEFAULT_BAR_DATA.datasets[0].borderWidth,
      })),
    }
  }

  LIST_IMAGES_EXAMPLES(): string[] {
    return n4lImageExamples(this.runtime.section).map(({ file }) => this.urls[file])
  }
}
