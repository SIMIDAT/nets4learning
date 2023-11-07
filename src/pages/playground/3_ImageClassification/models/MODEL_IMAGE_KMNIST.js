import React from 'react'
import I_MODEL_IMAGE_CLASSIFICATION from './_model'
import { Trans } from 'react-i18next'
import * as Train_KMNIST from '@pages/playground/3_ImageClassification/custom/Train_KMNIST'

export default class MODEL_IMAGE_KMNIST extends I_MODEL_IMAGE_CLASSIFICATION {
  static KEY = 'IMAGE-KMNIST'
  TITLE = 'datasets-models.3-image-classifier.kmnist.title'
  i18n_TITLE = 'datasets-models.3-image-classifier.kmnist.title'

  DESCRIPTION () {
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

  async TRAIN_MODEL (params) {
    return await Train_KMNIST.run({
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
