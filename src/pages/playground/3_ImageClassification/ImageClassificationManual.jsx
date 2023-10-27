import React from 'react'
import { Trans } from 'react-i18next'
import { VERBOSE } from '@/CONSTANTS'

export default function ImageClassificationManual (props) {
  const prefix = 'pages.playground.3-image-classification.generator.manual.'

  if (VERBOSE) console.debug('render ImageClassificationManual')
  return <>
    <details>
      <summary className={'n4l-summary'}><Trans i18nKey={prefix + 'details-edit-layers.title'} /></summary>
      <p><Trans i18nKey={prefix + 'details-edit-layers.text-0'} /></p>
      <ul>
        <li><Trans i18nKey={prefix + 'details-edit-layers.list.0'} /></li>
        <li><Trans i18nKey={prefix + 'details-edit-layers.list.1'} /></li>
      </ul>
    </details>

    <details>
      <summary className={'n4l-summary'}><Trans i18nKey={prefix + 'details-edit-layers-more-info.title'} /></summary>
      <p><Trans i18nKey={prefix + 'details-edit-layers-more-info.text-0'} /></p>
      <ul>
        <li><Trans i18nKey={prefix + 'details-edit-layers-more-info.list.0'} /></li>
        <li><Trans i18nKey={prefix + 'details-edit-layers-more-info.list.1'} /></li>
        <li><Trans i18nKey={prefix + 'details-edit-layers-more-info.list.2'} /></li>
        <li><Trans i18nKey={prefix + 'details-edit-layers-more-info.list.3'} /></li>
        <li><Trans i18nKey={prefix + 'details-edit-layers-more-info.list.4'} /></li>
        <li><Trans i18nKey={prefix + 'details-edit-layers-more-info.list.5'} /></li>
        <li><Trans i18nKey={prefix + 'details-edit-layers-more-info.list.6'} /></li>
        <li><Trans i18nKey={prefix + 'details-edit-layers-more-info.list.7'} /></li>
      </ul>
    </details>

    <details>
      <summary className={'n4l-summary'}><Trans i18nKey={prefix + 'details-hyper-parameters-editor.title'} /></summary>
      <ul>
        <li><Trans i18nKey={prefix + 'details-hyper-parameters-info.list.0'} /></li>
        <li><Trans i18nKey={prefix + 'details-hyper-parameters-info.list.1'} /></li>
        <li><Trans i18nKey={prefix + 'details-hyper-parameters-info.list.2'} /></li>
        <li><Trans i18nKey={prefix + 'details-hyper-parameters-info.list.3'} /></li>
        <li><Trans i18nKey={prefix + 'details-hyper-parameters-info.list.4'} /></li>
      </ul>
    </details>

    <details>
      <summary className={'n4l-summary'}><Trans i18nKey={prefix + 'details-create-and-train-models.title'} /></summary>
      <p><Trans i18nKey={prefix + 'details-create-and-train-models.text-0'} /></p>
      <p><Trans i18nKey={prefix + 'details-create-and-train-models.text-1'} /></p>
      <p><Trans i18nKey={prefix + 'details-create-and-train-models.text-2'} /></p>
    </details>

    <details>
      <summary className={'n4l-summary'}><Trans i18nKey={prefix + 'details-export-models.title'} /></summary>
      <p><Trans i18nKey={prefix + 'details-export-models.text-0'} /></p>
    </details>

    <details>
      <summary className={'n4l-summary'}><Trans i18nKey={prefix + 'details-prediction.title'} /></summary>
      <p><Trans i18nKey={prefix + 'details-prediction.text-0'} /></p>
      <p><Trans i18nKey={prefix + 'details-prediction.text-1'} /></p>
    </details>
  </>
}