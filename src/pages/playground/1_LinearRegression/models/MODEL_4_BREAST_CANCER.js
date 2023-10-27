import I_MODEL_LINEAR_REGRESSION from './_model'
import * as dfd from 'danfojs'
import { Trans } from 'react-i18next'

import { DataFrameTransform } from '@core/dataframe/DataFrameUtils'

export default class MODEL_4_BREAST_CANCER extends I_MODEL_LINEAR_REGRESSION {

  static KEY = 'BREAST_CANCER'
  static URL = 'https://archive.ics.uci.edu/dataset/16/breast+cancer+wisconsin+prognostic'
  static URL_2 = 'https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic'

  URL = 'https://archive.ics.uci.edu/dataset/16/breast+cancer+wisconsin+prognostic'
  URL_2 = 'https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic'
  URL_IMAGE = 'https://www.cs.wisc.edu/~street/images/'

  i18n_TITLE = 'datasets-models.1-linear-regression.breast-cancer.title'
  _KEY = 'BREAST_CANCER'

  DESCRIPTION () {
    const prefix = 'datasets-models.1-linear-regression.breast-cancer.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text.0'} /></p>
      <p><Trans i18nKey={prefix + 'text.1'} /></p>
      <p><Trans i18nKey={prefix + 'text.2'}
                components={{
                  link1: <a href={this.URL_IMAGE} target={'_blank'} rel="noreferrer">link</a>,
                }} /></p>
      <p><Trans i18nKey={prefix + 'text.3'} /></p>
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
          <li><Trans i18nKey={prefix + 'details-3-references.list.1'}
                     components={{
                       link1: <a href={this.URL_2} target={'_blank'} rel={'noreferrer'}>TEXT</a>
                     }} /></li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
{`
@misc{misc_breast_cancer_wisconsin_(prognostic)_16,
  author       = {Wolberg,William, Street,W., and Mangasarian,Olvi},
  title        = {{Breast Cancer Wisconsin (Prognostic)}},
  year         = {1995},
  howpublished = {UCI Machine Learning Repository},
  note         = {{DOI}: https://doi.org/10.24432/C5GK50}
}
`}
          {`
@misc{misc_breast_cancer_wisconsin_(diagnostic)_17,
  author       = {Wolberg,William, Mangasarian,Olvi, Street,Nick, and Street,W.},
  title        = {{Breast Cancer Wisconsin (Diagnostic)}},
  year         = {1995},
  howpublished = {UCI Machine Learning Repository},
  note         = {{DOI}: https://doi.org/10.24432/C5DW2B}
}
`}
        </pre>
      </details>
    </>
  }

  async DATASETS () {
    const dataset_path = process.env.REACT_APP_PATH + '/datasets/01-linear-regression/breast-cancer/'
    const path_dataset_1 = dataset_path + 'breast-cancer-wisconsin.csv'
    const path_dataset_2 = dataset_path + 'wdbc.csv'
    const path_dataset_3 = dataset_path + 'wpbc.csv'

    let dataframe_original_1 = await dfd.readCSV(path_dataset_1)
    let dataframe_processed_1 = await dfd.readCSV(path_dataset_1)
    const dataset_transforms_1 = [
      { column_name: 'Bare Nuclei', column_transform: 'drop_?' },
      // { column_name: 'Bare Nuclei', column_transform: 'dropNa' },
      // { column_name: 'Bare Nuclei', column_transform: 'replace_?_NaN' },
      // { column_name: 'Bare Nuclei', column_transform: 'fill_NaN_median' }
    ]
    dataframe_processed_1 = DataFrameTransform(dataframe_original_1, dataset_transforms_1)
    dataframe_processed_1 = DataFrameTransform(dataframe_processed_1, dataset_transforms_1)

    const dataframe_original_2 = await dfd.readCSV(path_dataset_2)
    const dataframe_processed_2 = await dfd.readCSV(path_dataset_2)

    const dataframe_original_3 = await dfd.readCSV(path_dataset_3)
    const dataframe_processed_3 = await dfd.readCSV(path_dataset_3)

    return [
      {
        is_dataset_upload   : false,
        path                : dataset_path,
        info                : 'breast-cancer-wisconsin.names',
        csv                 : 'breast-cancer-wisconsin.csv',
        dataframe_original  : dataframe_original_1,
        dataframe_processed : dataframe_processed_1,
        dataset_transforms  : dataset_transforms_1,
        is_dataset_processed: true,
      },
      {
        is_dataset_upload   : false,
        path                : dataset_path,
        info                : 'wdbc.names',
        csv                 : 'wdbc.csv',
        dataframe_original  : dataframe_original_2,
        dataframe_processed : dataframe_processed_2,
        dataset_transforms  : [],
        is_dataset_processed: true,
      },
      {
        is_dataset_upload   : false,
        path                : dataset_path,
        info                : 'wpbc.names',
        csv                 : 'wpbc.csv',
        dataframe_original  : dataframe_original_3,
        dataframe_processed : dataframe_processed_3,
        dataset_transforms  : [],
        is_dataset_processed: true,
      }
    ]
  }

  async MODELS (dataset) {
    const path = process.env.REACT_APP_PATH + '/models/01-linear-regression/breast-cancer'
    const models = {
      'breast-cancer-wisconsin.csv': [],
      'wdbc.csv'                   : [{ model_path: path + '/0/lr-model-0.json', column_name_X: 'area_mean', column_name_Y: 'perimeter_mean' },],
      'wpbc.csv'                   : []
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