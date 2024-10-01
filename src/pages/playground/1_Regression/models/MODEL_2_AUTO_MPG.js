import React from 'react'
import * as tfjs from '@tensorflow/tfjs'
import * as dfd from 'danfojs'
import { Trans } from 'react-i18next'

import * as _Types from '@core/types'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import I_MODEL_REGRESSION from './_model'
import { F_FILTER_Categorical, F_MAP_LabelEncoder } from '@/core/nn-utils/utils'

export default class MODEL_2_AUTO_MPG extends I_MODEL_REGRESSION {

  static KEY = 'AUTO_MPG'
  static URL = 'https://archive.ics.uci.edu/ml/datasets/auto+mpg'

  URL = 'https://archive.ics.uci.edu/ml/datasets/auto+mpg'
  i18n_TITLE = 'datasets-models.1-regression.auto-mpg.title'
  _KEY = 'AUTO_MPG'

  DESCRIPTION () {
    const prefix = 'datasets-models.1-regression.auto-mpg.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text.0'} /></p>
      <p><Trans i18nKey={prefix + 'text.1'} /></p>
      <p>
        <Trans i18nKey={prefix + 'link'}
               components={{
                 link1: <a href={this.URL} target={'_blank'} rel="noreferrer">link</a>,
               }} />
      </p>
      <details>
        <summary><Trans i18nKey={prefix + 'details-0.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-0.list.0'} /></li>
          <li><Trans i18nKey={prefix + 'details-0.list.1'} /></li>
          <li><Trans i18nKey={prefix + 'details-0.list.2'} /></li>
          <li><Trans i18nKey={prefix + 'details-0.list.3'} /></li>
          <li><Trans i18nKey={prefix + 'details-0.list.4'} /></li>
          <li><Trans i18nKey={prefix + 'details-0.list.5'} /></li>
          <li><Trans i18nKey={prefix + 'details-0.list.6'} /></li>
          <li><Trans i18nKey={prefix + 'details-0.list.7'} /></li>
          <li><Trans i18nKey={prefix + 'details-0.list.8'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-1.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-1.list.0'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.1'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.2'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.3'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.4'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.5'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.6'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.7'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.8'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-2.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-2.list.0'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-3.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-3.list.0'}
                     components={{
                       link1: <a href={this.URL} target={'_blank'} rel="noreferrer">link</a>,
                     }} /></li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
{`
@misc{misc_auto_mpg_9,
  author       = {Quinlan,R.},
  title        = {{Auto MPG}},
  year         = {1993},
  howpublished = {UCI Machine Learning Repository},
  note         = {{DOI}: https://doi.org/10.24432/C5859H}
}
`}
        </pre>
      </details>
    </>
  }

  /**
   * 
   * @returns {Promise<_Types.DatasetProcessed_t[]>}
   */
  async DATASETS () {
    const path_datasets = process.env.REACT_APP_PATH + '/datasets/01-regression/auto-mpg/'
    const auto_info = 'auto-mpg.names'
    const auto_csv = 'auto-mpg.csv'

    const auto_promise_info = await fetch(path_datasets + auto_info)
    const auto_container_info = await auto_promise_info.text()
    let auto_dataframe_original = await dfd.readCSV(path_datasets + auto_csv)
    let auto_dataframe_processed = await dfd.readCSV(path_datasets + auto_csv)
    /** @type {_Types.Dataset_t} */
    const auto_dataset = [
      { column_name: 'cylinders',    column_role: 'Feature', column_type: 'Integer',     column_missing_values: false },
      { column_name: 'displacement', column_role: 'Feature', column_type: 'Continuous',  column_missing_values: false },
      { column_name: 'horsepower',   column_role: 'Feature', column_type: 'Continuous',  column_missing_values: true  },
      { column_name: 'weight',       column_role: 'Feature', column_type: 'Continuous',  column_missing_values: false },
      { column_name: 'acceleration', column_role: 'Feature', column_type: 'Continuous',  column_missing_values: false },
      { column_name: 'model-year',   column_role: 'Feature', column_type: 'Integer',     column_missing_values: false },
      // { column_name: 'origin',       column_role: 'Feature', column_type: 'Integer',     column_missing_values: false },
      { column_name: 'mpg',          column_role: 'Target',  column_type: 'Continuous',  column_missing_values: false },
      // { column_name: 'car_name',     column_role: 'ID',      column_type: 'Categorical', column_missing_values: false },
    ]
    const auto_dataset_transforms = [
      ...auto_dataset.filter(F_FILTER_Categorical).map(F_MAP_LabelEncoder),
      // { column_name: 'mpg', column_type: 'drop' }
    ]
    const auto_target = 'mpg'
    const auto_dataframe_encoder = DataFrameUtils.DataFrameTransformAndEncoder(auto_dataframe_processed, auto_dataset_transforms)
    const auto_encoders_map = auto_dataframe_encoder.encoder_map
    auto_dataframe_processed = auto_dataframe_encoder.dataframe_processed
    const auto_dataframe_X = auto_dataframe_processed.drop({ columns: [auto_target] }).copy()
    const auto_dataframe_y = auto_dataframe_original[auto_target]
    const minMaxScaler = new dfd.MinMaxScaler()
    const auto_minMaxScaler = minMaxScaler.fit(auto_dataframe_X)
    const auto_X = auto_minMaxScaler.transform(auto_dataframe_X)
    const auto_y = auto_dataframe_y

    return [
      {
        is_dataset_upload   : false,
        is_dataset_processed: true,
        path                : path_datasets,
        csv                 : auto_csv,
        info                : auto_info,
        container_info      : auto_container_info,
        dataset             : auto_dataset,
        dataset_transforms  : auto_dataset_transforms,
        dataframe_original  : auto_dataframe_original,
        dataframe_processed : auto_dataframe_processed,
        data_processed      : {
          dataframe_X       : auto_dataframe_X,
          dataframe_y       : auto_dataframe_y,
          X                 : auto_X,
          y                 : auto_y,
          scaler            : auto_minMaxScaler,
          encoders          : auto_encoders_map,
          column_name_target: auto_target,
        }
      }
    ]
  }

  /**
   * 
   * @param {string} [dataset='']
   * @return {Promise<_Types.CustomModel_t[]>}
   */
  async MODELS (dataset) {
    const path = process.env.REACT_APP_PATH + '/models/01-regression/auto-mpg'
    const model = await tfjs.loadLayersModel(path + '/0/lr-model-0.json')
    const models = {
      'auto-mpg.csv': [
        { 
          model     : model,
          model_path: path + '/0/lr-model-0.json', 
        },
      ]
    }
    return models[dataset]
  }

  DEFAULT_LAYERS () {
    return [
      { is_disabled: false, units: 64, activation: 'relu' },
      { is_disabled: false, units: 64, activation: 'relu' },
      { is_disabled: true,  units: 1,  activation: 'linear'  }
    ]
  }

  COMPILE () {
    const model = new tfjs.Sequential()
    model.compile({
      optimizer: tfjs.train.rmsprop(0.01),
      loss     : 'meanSquaredError',
      metrics  : ['meanSquaredError', 'meanAbsoluteError']
    })
    return model
  }

  ATTRIBUTE_INFORMATION () {
    return <></>
  }
}
