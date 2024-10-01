import 'katex/dist/katex.min.css'
import React from 'react'
import { Trans } from 'react-i18next'
import Latex from 'react-latex-next'
import { VERBOSE } from '@/CONSTANTS'

export default function RegressionManual () {

  const prefixManual = 'pages.playground.1-regression.generator.manual.'

  if(VERBOSE) console.debug('render RegressionManual')
  return <>
    <details>
      <summary className={'n4l-summary'}><Trans i18nKey={prefixManual + 'details-edit-layers.title'} /></summary>
      <p><Trans i18nKey={prefixManual + 'details-edit-layers.text.0'} /></p>
      <ul>
        <li><Trans i18nKey={prefixManual + 'details-edit-layers.list.0'} /></li>
        <li><Trans i18nKey={prefixManual + 'details-edit-layers.list.1'} /></li>
      </ul>
    </details>

    {/*<details>*/}
    {/*  <summary className={'n4l-summary'}><Trans i18nKey={prefixManual + 'details-hyper-parameters-editor.title'} /></summary>*/}
    {/*  <p><Trans i18nKey={prefixManual + 'details-hyper-parameters-editor.text.0'} /></p>*/}
    {/*  <ul>*/}
    {/*    <li><Trans i18nKey={prefixManual + 'details-hyper-parameters-editor.list.0'} /></li>*/}
    {/*    <li><Trans i18nKey={prefixManual + 'details-hyper-parameters-editor.list.1'} /></li>*/}
    {/*    <li><Trans i18nKey={prefixManual + 'details-hyper-parameters-editor.list.2'} /></li>*/}
    {/*    <li><Trans i18nKey={prefixManual + 'details-hyper-parameters-editor.list.3'} /></li>*/}
    {/*    <li><Trans i18nKey={prefixManual + 'details-hyper-parameters-editor.list.4'} /></li>*/}
    {/*    <li><Trans i18nKey={prefixManual + 'details-hyper-parameters-editor.list.5'} /></li>*/}
    {/*  </ul>*/}
    {/*</details>*/}

    <details>
      <summary className={'n4l-summary'}><Trans i18nKey={prefixManual + 'details-hyper-parameters-info.title'} /></summary>
      <ul>
        <li><Trans i18nKey={prefixManual + 'details-hyper-parameters-info.list.0'} /></li>
        <li><Trans i18nKey={prefixManual + 'details-hyper-parameters-info.list.1'} /></li>
        <li><Trans i18nKey={prefixManual + 'details-hyper-parameters-info.list.2'} /></li>
        <li><Trans i18nKey={prefixManual + 'details-hyper-parameters-info.list.3'} /></li>
        <li><Trans i18nKey={prefixManual + 'details-hyper-parameters-info.list.4'} /></li>
      </ul>
    </details>

    <details>
      <summary className={'n4l-summary'}><Trans i18nKey={prefixManual + 'details-create-and-train-models.title'} /></summary>
      <p><Trans i18nKey={prefixManual + 'details-create-and-train-models.text.0'} /></p>
      <p><Trans i18nKey={prefixManual + 'details-create-and-train-models.text.1'} /></p>
      <p><Trans i18nKey={prefixManual + 'details-create-and-train-models.text.2'} /></p>
    </details>

    <details>
      <summary className={'n4l-summary'}><Trans i18nKey={prefixManual + 'details-export-models.title'} /></summary>
      <p><Trans i18nKey={prefixManual + 'details-export-models.text.0'} /></p>
    </details>

    <details>
      <summary className={'n4l-summary'}><Trans i18nKey={prefixManual + 'details-plot-models.title'} /></summary>
      <p><Trans i18nKey={prefixManual + 'details-plot-models.text.0'} /></p>
    </details>

    <details>
      <summary className={'n4l-summary'}>Info</summary>
      <main>
        <strong><Trans i18nKey={prefixManual + 'simple-regression'} /><br /></strong>
        <Latex>{'$$ Y(x) = b x + a $$'}</Latex>

        <strong><Trans i18nKey={prefixManual + 'multiple-regression'} /><br /></strong>
        <Latex>{'$$ Y(x_1, x_2, ..., x_n) = w_1 x_1 + w_2 x_2 + ... + w_n x_n + w_0 $$'}</Latex>
      </main>
    </details>
  </>
}