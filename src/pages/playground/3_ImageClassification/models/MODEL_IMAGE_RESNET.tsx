import { Trans } from 'react-i18next'

import I_MODEL_IMAGE_CLASSIFICATION from './_model'
import { IC_MODEL_KEYS } from '@/MODEL_KEYS'

// TODO: el modelo no se carga todavía (no está en los menús); de momento, solo su descripción
export default class MODEL_IMAGE_RESNET extends I_MODEL_IMAGE_CLASSIFICATION {
  static KEY = IC_MODEL_KEYS.RESNET
  TITLE = ''
  i18n_TITLE = ''

  DESCRIPTION () {
    const prefix = 'datasets-models.3-image-classifier.resnet.description.'
    const link = (href: string) => <a href={href} target={'_blank'} rel={'noreferrer'} />
    return <>
      <p><Trans i18nKey={prefix + 'text-0'} /></p>
      <p><Trans i18nKey={prefix + 'text-1'} components={{ link1: link('https://arxiv.org/abs/1512.03385') }} /></p>
      <p><Trans i18nKey={prefix + 'text-2'} components={{ link1: link('https://arxiv.org/abs/1603.05027') }} /></p>
      <p><Trans i18nKey={prefix + 'text-3'} /></p>

      <details>
        <summary><Trans i18nKey={prefix + 'details-input.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-input.list.0'} components={{ bold: <b /> }} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-output.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-output.list.0'} components={{ link1: link('https://storage.googleapis.com/download.tensorflow.org/data/ImageNetLabels.txt') }} /></li>
        </ol>
      </details>
    </>
  }
}
