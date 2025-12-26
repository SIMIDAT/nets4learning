import { Trans } from 'react-i18next'
import * as Train_KMNIST from '@pages/playground/3_ImageClassification/custom/Train_KMNIST'
import I_MODEL_IMAGE_CLASSIFICATION from './_model'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'

export type ParamsTrain_KMNIST_t = {
  learningRate : number,
  numberEpochs : number,
  testSize     : number,
  idLoss       : IdLoss_t,
  idOptimizer  : IdOptimizer_t,
  idMetricsList: IdMetric_t[],
  layers       : any[],
}
export default class MODEL_IMAGE_KMNIST extends I_MODEL_IMAGE_CLASSIFICATION {
  static KEY = 'IMAGE-KMNIST'
  TITLE = 'datasets-models.3-image-classifier.kmnist.title'
  i18n_TITLE = 'datasets-models.3-image-classifier.kmnist.title'

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

  async TRAIN_MODEL(params: ParamsTrain_KMNIST_t) {
    const { model, history } = await Train_KMNIST.KMNIST_run({
      learningRate : params.learningRate,
      numberEpochs : params.numberEpochs,
      testSize     : params.testSize,
      idLoss       : params.idLoss,
      idOptimizer  : params.idOptimizer,
      idMetricsList: params.idMetricsList,
      layers       : params.layers,
    })
    return {
      model, 
      history,
    }
  }

  DEFAULT_LAYERS() {
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
