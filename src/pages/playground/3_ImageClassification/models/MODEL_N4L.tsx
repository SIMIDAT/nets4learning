import type { TFunction } from 'i18next'

import { TASKS } from '@/TASKS'
import type { ImageLayer_t } from '@/types/types'
import { n4lLabelKey, n4lTaskText } from '@core/n4l/format'
import { n4lFileUrls, n4lImageExamples, type N4LImageRuntime_t } from '@core/n4l/imageClassification'
import type { N4LPackage_t } from '@core/n4l/source'
import { loadN4LLayersModel } from '@core/n4l/tfjsModel'
import { N4LError } from '@core/n4l/validate'
import N4LPackageDescription from '@components/n4l/N4LPackageDescription'
import { CharacterFormsTable } from '../components/N4LCharacterForms'
import I_MODEL_IMAGE_SPRITE from './_model_sprite'
import { n4lCharacterForms, type CharacterForms_t } from './characterForms'
import { imageLayersOf } from './n4lLayers'
import type { SpriteDatasetConfig_t } from './SpriteImageDataset'

type SpriteRuntime_t = Extract<N4LImageRuntime_t, { kind: 'sprite' }>

// Las direcciones del sprite de cada paquete: las de un .n4l abierto se crean una vez (así el sprite se descarga y se
// decodifica una sola vez por visita, como el de un paquete servido)
const spriteUrls = new WeakMap<object, Promise<Record<string, string>>>()

/**
 * Un clasificador de las imágenes de un paquete .n4l (MNIST, KMNIST, CIFAR-10…): sus clases, su sprite, su modelo ya
 * entrenado, sus imágenes de ejemplo y su red por defecto salen del manifiesto y sus textos. `urls`: la dirección de
 * cada imagen de ejemplo
 */
export default class MODEL_N4L extends I_MODEL_IMAGE_SPRITE {
  readonly pkg          : N4LPackage_t
  readonly runtime      : SpriteRuntime_t
  DATASET_NAME          : string
  private readonly urls : Record<string, string>
  private readonly forms: CharacterForms_t[] | null

  constructor(t: TFunction<'translation', undefined>, pkg: N4LPackage_t, runtime: SpriteRuntime_t, urls: Record<string, string>) {
    super(t, runtime.dataset.image)
    const texts = n4lTaskText(pkg.namespace, TASKS.IMAGE_CLASSIFICATION)
    this.pkg = pkg
    this.runtime = runtime
    this.urls = urls
    this.TITLE = texts + 'title'
    this.i18n_TITLE = texts + 'title'
    this.DATASET_NAME = runtime.dataset.id.toUpperCase()
    this.CLASS_IDS = (runtime.section.classes ?? []).map(({ id }) => id)
    // Su nombre en los textos del paquete («avión»); si no lo tiene, el del conjunto («7», «お»)
    this.CLASS_LABELS = this.CLASS_IDS.map((id) => t(`${pkg.namespace}:classes.${n4lLabelKey(id)}`, { defaultValue: id }))
    this.forms = n4lCharacterForms(runtime.section, (file) => urls[file] ?? '')
  }

  /** El paquete del que sale (para descargarlo) */
  N4L_PACKAGE() {
    return this.pkg
  }

  async SPRITE(): Promise<SpriteDatasetConfig_t> {
    const { source } = this.pkg
    const { dataset } = this.runtime
    if (!spriteUrls.has(source)) spriteUrls.set(source, n4lFileUrls(source, [dataset.file, dataset.labels]))
    const urls = await spriteUrls.get(source)!
    return {
      name       : this.DATASET_NAME,
      imagesUrl  : urls[dataset.file],
      labelsUrl  : urls[dataset.labels],
      numElements: dataset.rows,
      numTrain   : dataset.train,
      numClasses : this.CLASS_IDS.length,
      image      : dataset.image,
    }
  }

  DESCRIPTION() {
    const texts = n4lTaskText(this.pkg.namespace, TASKS.IMAGE_CLASSIFICATION)
    return (
      <N4LPackageDescription manifest={this.pkg.manifest} namespace={this.pkg.namespace} task={TASKS.IMAGE_CLASSIFICATION}>
        {this.forms !== null && <CharacterFormsTable characters={this.forms} prefix={texts + 'forms.'} />}
      </N4LPackageDescription>
    )
  }

  /** Las imágenes de ejemplo (sin las formas antiguas de los caracteres: esas van con CHARACTER_FORMS) */
  LIST_IMAGES_EXAMPLES(): string[] {
    return n4lImageExamples(this.runtime.section).filter(({ old }) => old !== true).map(({ file }) => this.urls[file])
  }

  CHARACTER_FORMS() {
    return this.forms
  }

  DEFAULT_TRAINING() {
    const { learningRate, epochs } = this.runtime.section.training ?? {}
    return { learningRate, epochs }
  }

  DEFAULT_LAYERS(): ImageLayer_t[] {
    return imageLayersOf(this.runtime.section.training?.layers ?? [], this.IMAGE)
  }

  async ENABLE_MODEL() {
    const { model } = this.runtime
    if (model === undefined) throw new N4LError(this.pkg.manifest.id, ['image-classification: no tiene un modelo ya entrenado'])
    return loadN4LLayersModel(this.pkg.source, model.path)
  }
}
