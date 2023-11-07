import React from 'react'
import * as dfd from 'danfojs'
import I_MODEL_LINEAR_REGRESSION from './_model'
import { Trans } from 'react-i18next'

export default class MODEL_WINE extends I_MODEL_LINEAR_REGRESSION {

  static KEY = 'WINE'
  static URL = 'https://archive.ics.uci.edu/dataset/186/wine+quality'

  URL = 'https://archive.ics.uci.edu/dataset/186/wine+quality'
  i18n_TITLE = 'datasets-models.1-linear-regression.wine.title'
  _KEY = 'WINE'

  DESCRIPTION () {
    const prefix = 'datasets-models.1-linear-regression.wine.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text.0'} /></p>
      <p><Trans i18nKey={prefix + 'text.1'} /></p>
      <p><Trans i18nKey={prefix + 'text.2'} /></p>
      <p>
        <Trans i18nKey={prefix + 'link'}
               components={{
                 link1: <a href={this.URL} target={'_blank'} rel="noreferrer">link</a>,
               }} />
      </p>
      <details>
        <summary><Trans i18nKey={prefix + 'details-1-input.title'} /></summary>
        <ol>
          {Object.entries(this.t(prefix + 'details-1-input.list', { returnObjects: true, defaultValue: [] }))
            .map((value, index) => {
              return <li key={index}><Trans i18nKey={prefix + 'details-1-input.list.' + index} /></li>
            })}
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-2-output.title'} /></summary>
        <ol>
          {Object.entries(this.t(prefix + 'details-2-output.list', { returnObjects: true, defaultValue: [] }))
            .map((value, index) => {
              return <li key={index}><Trans i18nKey={prefix + 'details-2-output.list.' + index} /></li>
            })}
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-3-references.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-3-references.list.0'}
                     components={{
                       link1: <a href={this.URL} target={'_blank'} rel={'noreferrer'}>TEXT</a>
                     }} /></li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
{`
@misc{misc_wine_quality_186,
  author       = {Cortez,Paulo, Cerdeira,A., Almeida,F., Matos,T., and Reis,J.},
  title        = {{Wine Quality}},
  year         = {2009},
  howpublished = {UCI Machine Learning Repository},
  note         = {{DOI}: https://doi.org/10.24432/C56S3T}
}
`}
        </pre>
      </details>
    </>
  }

  async DATASETS () {
    const datasets_path = process.env.REACT_APP_PATH + '/datasets/01-linear-regression/wine-quality/'
    const dataframe_original = await dfd.readCSV(datasets_path + 'wine-quality-red.csv')
    const dataframe_processed = await dfd.readCSV(datasets_path + 'wine-quality-red.csv')
    const dataframe_original_2 = await dfd.readCSV(datasets_path + 'wine-quality-white.csv')
    const dataframe_processed_2 = await dfd.readCSV(datasets_path + 'wine-quality-white.csv')

    return [{
      is_dataset_upload   : false,
      path                : datasets_path,
      info                : 'wine-quality.names',
      csv                 : 'wine-quality-red.csv',
      dataframe_original  : dataframe_original,
      dataframe_processed : dataframe_processed,
      dataset_transforms  : [],
      is_dataset_processed: true,
    }, {
      is_dataset_upload   : false,
      path                : datasets_path,
      csv                 : 'wine-quality-white.csv',
      info                : 'wine-quality.names',
      dataframe_original  : dataframe_original_2,
      dataframe_processed : dataframe_processed_2,
      dataset_transforms  : [],
      is_dataset_processed: true,
    }]
  }

  async MODELS (dataset) {
    const path = process.env.REACT_APP_PATH + '/models/01-linear-regression/wine'
    const models = {
      'wine-quality-red.csv'  : [
        { model_path: path + '/0/lr-model-0.json', column_name_X: 'fixed acidity', column_name_Y: 'density' },
        { model_path: path + '/1/lr-model-1.json', column_name_X: 'fixed acidity', column_name_Y: 'pH' },
      ],
      'wine-quality-white.csv': []
    }
    return models[dataset]
  }

  ATTRIBUTE_INFORMATION () {
    return <></>
  }

  JOYRIDE () {
    return super.JOYRIDE()
  }
}
