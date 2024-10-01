import React from 'react'
import * as tfjs from '@tensorflow/tfjs'
import * as dfd from 'danfojs'
import { Trans } from 'react-i18next'

import * as _Types from '@core/types'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import I_MODEL_REGRESSION from './_model'
import { F_FILTER_Categorical, F_MAP_LabelEncoder } from '@/core/nn-utils/utils'

export default class MODEL_3_HOUSING_PRICES extends I_MODEL_REGRESSION {

  static KEY = 'HOUSING_PRICES'
  static URL = 'https://www.cs.toronto.edu/~delve/data/boston/bostonDetail.html'

  // CALIFORNIA_URL = 'https://www.kaggle.com/datasets/fedesoriano/california-housing-prices-data-extra-features'

  BOSTON_URL = 'https://www.cs.toronto.edu/~delve/data/boston/bostonDetail.html'
  BOSTON_URL_MEDIUM = 'https://medium.com/@docintangible/racist-data-destruction-113e3eff54a8'


  i18n_TITLE = 'datasets-models.1-regression.housing-prices.title'
  _KEY = 'HOUSING_PRICES'

  DESCRIPTION () {
    const prefix = 'datasets-models.1-regression.housing-prices.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text.0'} /></p>
      <p><Trans i18nKey={prefix + 'text.1'} /></p>
      <p>
        <Trans i18nKey={prefix + 'link'}
               components={{
                 link1: <a href={this.BOSTON_URL} target={'_blank'} rel="noreferrer">link</a>,
                 }} />
      </p>
      {/* 
      <details>
        <summary><Trans i18nKey={prefix + 'details-input.title'} /></summary>
        <ol>
          {Object.entries(this.t(prefix + 'details-input.california.list', { returnObjects: true, defaultValue: [] }))
            .map((value, index) => {
              return <li key={index}><Trans i18nKey={prefix + 'details-input.california.list.' + index} /></li>
            })}        
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-output.title'} /></summary>
        <ol>
          {Object.entries(this.t(prefix + 'details-output.california.list', { returnObjects: true, defaultValue: [] }))
            .map((value, index) => {
              return <li key={index}><Trans i18nKey={prefix + 'details-output.california.list.' + index} /></li>
            })}
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-references.title'} /></summary>
        <ol>
          <li>
            <Trans i18nKey={prefix + 'details-references.california.list.0'}
                   components={{
                     link1: <a href={this.CALIFORNIA_URL} target={'_blank'} rel="noreferrer">link</a>,
                   }} />
          </li>

        </ol>
      </details>
      
      <hr />

      */}

      <details>
        <summary><Trans i18nKey={prefix + 'details-input.title'} /></summary>
        <ol>
          {Object.entries(this.t(prefix + 'details-input.boston.list', { returnObjects: true, defaultValue: [] }))
            .map((value, index) => {
              return <li key={index}><Trans i18nKey={prefix + 'details-input.boston.list.' + index} /></li>
            })}        
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-output.title'} /></summary>
        <ol>
          {Object.entries(this.t(prefix + 'details-output.boston.list', { returnObjects: true, defaultValue: [] }))
            .map((value, index) => {
              return <li key={index}><Trans i18nKey={prefix + 'details-output.boston.list.' + index} /></li>
            })}
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-references.title'} /></summary>
        <ol>
          <li>
            <Trans i18nKey={prefix + 'details-references.boston.list.0'}
                   components={{
                     link1: <a href={this.BOSTON_URL} target={'_blank'} rel="noreferrer">link</a>,
                   }} />
          </li>
        </ol>
      </details>

    </>
  }

  /**
   * 
   * @returns {Promise<_Types.DatasetProcessed_t[]>}
   */
  async DATASETS () {
    const path_datasets = process.env.REACT_APP_PATH + '/datasets/01-regression/housing-prices/'

    // ------------------------
    // #region Boston housing
    const boston_info = 'boston-housing.names'
    const boston_csv = 'boston-housing-2020.csv'
    const boston_dataset_promise_info = await fetch(path_datasets + boston_info)
    const boston_container_info = await boston_dataset_promise_info.text()
    let boston_dataframe_original = await dfd.readCSV(path_datasets + boston_csv)
    let boston_dataframe_processed = await dfd.readCSV(path_datasets + boston_csv)
    /** @type {_Types.Dataset_t} */
    const boston_dataset = [
      { column_name: 'CRIM',    column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'ZN',      column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'INDUS',   column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'CHAS',    column_type: 'Binary',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'NOX',     column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'RM',      column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'AGE',     column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'DIS',     column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'RAD',     column_type: 'Integer',      column_role: 'Feature', column_missing_values: false },
      { column_name: 'TAX',     column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'PTRATIO', column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
      // { column_name: 'B',       column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'LSTAT',   column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'MEDV',    column_type: 'Continuous',   column_role: 'Target',  column_missing_values: false }
    ]
    /** @type {_Types.DataFrameColumnTransform_t[]} */
    const boston_dataset_transforms = [
      ...boston_dataset.filter(F_FILTER_Categorical).map(F_MAP_LabelEncoder),
      // { column_name: 'B',    column_transform: 'drop'    },
      // { column_name: 'MEDV', column_transform: 'drop'    },
    ]
    const boston_target = 'MEDV'
    const boston_dataframe_encoder = DataFrameUtils.DataFrameTransformAndEncoder(boston_dataframe_processed, boston_dataset_transforms)
    const boston_encoders_map = boston_dataframe_encoder.encoder_map
    boston_dataframe_processed = boston_dataframe_encoder.dataframe_processed
    const boston_dataframe_X = boston_dataframe_processed.drop({ columns: [boston_target] }).copy()
    const boston_dataframe_y = boston_dataframe_original[boston_target]
    const minMaxScaler = new dfd.MinMaxScaler()
    const boston_scaler = minMaxScaler.fit(boston_dataframe_X)
    const boston_X = boston_scaler.transform(boston_dataframe_X)
    const boston_y = boston_dataframe_y
    // #endregion
    
    // #endregion California
    // const california_info = 'california-housing.names'
    // const california_csv = 'california-housing-2024.csv'
    // const promise_info = await fetch(path_datasets + california_info)
    // const california_container_info = await promise_info.text()
    // let california_dataframe_original = await dfd.readCSV(path_datasets + california_csv)
    // let california_dataframe_processed = await dfd.readCSV(path_datasets + california_csv)
    // /** @type {_Types.Dataset_t} */
    // const california_dataset = [
    //   { column_name: 'Median_Income',             column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Median_Age',                column_type: 'Integer',      column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Tot_Rooms',                 column_type: 'Integer',      column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Tot_Bedrooms',              column_type: 'Integer',      column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Population',                column_type: 'Integer',      column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Households',                column_type: 'Integer',      column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Latitude',                  column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Longitude',                 column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Distance_to_coast',         column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Distance_to_LA',            column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Distance_to_SanDiego',      column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Distance_to_SanJose',       column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Distance_to_SanFrancisco',  column_type: 'Continuous',   column_role: 'Feature', column_missing_values: false },
    //   { column_name: 'Median_House_Value',        column_type: 'Continuous',   column_role: 'Target',  column_missing_values: false },
    // ]
    // /** @type {_Types.DataFrameColumnTransform_t[]} */
    // const california_dataset_transforms = [
    //   ...california_dataset.filter(F_FILTER_Categorical).map(F_MAP_LabelEncoder),
    //   // { column_transform: 'label-encoder', column_name: 'Tot_Rooms' },
    //   // { column_transform: 'label-encoder', column_name: 'Tot_Bedrooms' },
    //   // { column_transform: 'label-encoder', column_name: 'Population' },
    //   // { column_transform: 'label-encoder', column_name: 'Households' },
    //   // { column_transform: 'drop', column_name: 'Latitude' },
    //   // { column_transform: 'drop', column_name: 'Longitude' },
    //   { column_transform: 'drop', column_name: 'Distance_to_coast'        },
    //   { column_transform: 'drop', column_name: 'Distance_to_LA'           },
    //   { column_transform: 'drop', column_name: 'Distance_to_SanDiego'     },
    //   { column_transform: 'drop', column_name: 'Distance_to_SanJose'      },
    //   { column_transform: 'drop', column_name: 'Distance_to_SanFrancisco' },
    //   // { column_transform: 'drop', column_name: 'Median_House_Value'       }
    // ]
    // const california_target = 'Median_House_Value'
    // const california_dataframe_encoder = DataFrameUtils.DataFrameTransformAndEncoder(california_dataframe_processed, california_dataset_transforms)
    // const california_encoders_map = california_dataframe_encoder.encoder_map
    // california_dataframe_processed = california_dataframe_encoder.dataframe_processed
    // const california_dataframe_X = california_dataframe_processed.drop({ columns: [california_target] }).copy()
    // const california_dataframe_y = california_dataframe_original[california_target]
    // const standardScaler = new dfd.StandardScaler()
    // const california_scaler = standardScaler.fit(california_dataframe_X)
    // const california_X = california_scaler.transform(california_dataframe_X)
    // const california_y = california_dataframe_y
    // #endregion

    return [
      {
        is_dataset_upload   : false,
        is_dataset_processed: true,
        path                : path_datasets,
        csv                 : boston_csv,
        info                : boston_info,
        container_info      : boston_container_info,
        dataset             : boston_dataset,
        dataset_transforms  : boston_dataset_transforms,
        dataframe_original  : boston_dataframe_original,
        dataframe_processed : boston_dataframe_processed,
        data_processed      : {
          dataframe_X       : boston_dataframe_X,
          dataframe_y       : boston_dataframe_y,
          X                 : boston_X,
          y                 : boston_y,
          scaler            : boston_scaler,
          encoders          : boston_encoders_map,
          column_name_target: boston_target,
        }
      },
      // {
      //   is_dataset_upload   : false,
      //   is_dataset_processed: true,
      //   path                : path_datasets,
      //   csv                 : california_csv,
      //   info                : california_info,
      //   container_info      : california_container_info,
      //   dataset             : california_dataset,
      //   dataframe_original  : california_dataframe_original,
      //   dataframe_processed : california_dataframe_processed,
      //   dataset_transforms  : california_dataset_transforms,
      //   data_processed      : {
      //     dataframe_X       : california_dataframe_X,
      //     dataframe_y       : california_dataframe_y,
      //     X                 : california_X,
      //     y                 : california_y,
      //     scaler            : california_scaler,
      //     encoders          : california_encoders_map,
      //     column_name_target: california_target,
      //   }
      // }
    ]
  }
  
  /**
   * 
   * @param {string} [dataset='']
   * @return {Promise<_Types.CustomModel_t[]>}
   */
  async MODELS (dataset) {
    const path = process.env.REACT_APP_PATH + '/models/01-regression/housing-dataset'
    const model = await tfjs.loadLayersModel(path + '/0/lr-model-0.json')
    const models = {
      'boston-housing-2020.csv': [
        { 
          model     : model,
          model_path: path + '/0/lr-model-0.json', 
          X         : ['CRIM', 'ZN', 'INDUS', 'CHAS', 'NOX', 'RM', 'AGE', 'DIS', 'RAD', 'TAX', 'PTRATIO', 'LSTAT'], 
          y         : 'MEDV', 
        },
      ],
      'california-housing-2024.csv': [],
    }
    return models[dataset]
  }

  DEFAULT_LAYERS (dataset) {
    const models = {
      'california-housing-2024.csv': [
        { is_disabled: false, units: 20, activation: 'sigmoid' },
        { is_disabled: true,  units: 1,  activation: 'linear' },
      ],
      'boston-housing-2020.csv': [
        { is_disabled: false, units: 32, activation: 'sigmoid'   },
        { is_disabled: false, units: 16, activation: 'sigmoid'   },
        { is_disabled: true,  units: 1,  activation: 'linear'    }
      ]
    }
    return models[dataset]
  }

  COMPILE () {
    // https://towardsdatascience.com/regression-on-boston-housing-dataset-f409b7e4a155
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
