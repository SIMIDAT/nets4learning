import { Trans } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'
import I_MODEL_IMAGE_28X28 from './_model_28x28'
import { KMNIST_DATASET } from './SpriteImageDataset'
import { IC_MODEL_KEYS } from '@/MODEL_KEYS'

// Modelo preentrenado con Scripts/train_kmnist_model.cjs y su precisión con las 10.000 imágenes de test
// (la que guarda el script en model.json como testAccuracy)
const PRETRAINED_MODEL_URL = import.meta.env.VITE_PATH + '/models/03-image-classification/kmnist/model.json'
export const KMNIST_PRETRAINED_TEST_ACCURACY = 0.9825

// Cada carácter (en el orden de CLASS_LABELS) escrito con la fuente Noto Sans CJK JP; las genera
// Scripts/build_kmnist_examples.py
export const LIST_OF_IMAGES_KMNIST: string[] = Array.from({ length: 10 }, (_, label) => `kmnist/${label}.png`)

export default class MODEL_IMAGE_KMNIST extends I_MODEL_IMAGE_28X28 {
  static KEY = IC_MODEL_KEYS.KMNIST
  TITLE = 'datasets-models.3-image-classifier.kmnist.title'
  i18n_TITLE = 'datasets-models.3-image-classifier.kmnist.title'
  DATASET = KMNIST_DATASET
  // Los 10 caracteres hiragana de KMNIST (kmnist_classmap.csv)
  CLASS_LABELS = ['お', 'き', 'す', 'つ', 'な', 'は', 'ま', 'や', 'れ', 'を']

  DESCRIPTION() {
    const prefix = 'datasets-models.3-image-classifier.kmnist.description.'
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
        <summary><Trans i18nKey={prefix + 'details-model.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-model.list.0'} values={{ accuracy: KMNIST_PRETRAINED_TEST_ACCURACY }} /></li>
          <li><Trans i18nKey={prefix + 'details-model.list.1'} /></li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
          {`
@online{clanuwat2018deep,
  author       = {Tarin Clanuwat and Mikel Bober-Irizar and Asanobu Kitamoto and Alex Lamb and Kazuaki Yamamoto and David Ha},
  title        = {Deep Learning for Classical Japanese Literature},
  date         = {2018-12-03},
  year         = {2018},
  eprintclass  = {cs.CV},
  eprinttype   = {arXiv},
  eprint       = {cs.CV/1812.01718},
}
`}
        </pre>
      </details>
    </>
  }

  LIST_IMAGES_EXAMPLES(): string[] {
    return LIST_OF_IMAGES_KMNIST
  }

  async ENABLE_MODEL() {
    return await tfjs.loadLayersModel(PRETRAINED_MODEL_URL)
  }
}
