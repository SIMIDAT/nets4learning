import React from 'react'
import * as dfd from 'danfojs'
import * as tfjs from '@tensorflow/tfjs'
import { Trans } from 'react-i18next'

import * as _Types from '@core/types'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import I_MODEL_REGRESSION from './_model'
import { F_FILTER_Categorical, F_MAP_LabelEncoder } from '@/core/nn-utils/utils'

export default class MODEL_5_STUDENT_PERFORMANCE extends I_MODEL_REGRESSION {

  static KEY = 'STUDENT_PERFORMANCE'
  static URL = 'https://archive.ics.uci.edu/dataset/320/student+performance'

  URL = 'https://archive.ics.uci.edu/dataset/320/student+performance'
  i18n_TITLE = 'datasets-models.1-regression.student-performance.title'
  _KEY = 'STUDENT_PERFORMANCE'

  student_performance_columns_X = [
    'school',
    'sex',
    'age',
    'address',
    'famsize',
    'Pstatus',
    'Medu',
    'Fedu',
    'Mjob',
    'Fjob',
    'reason',
    'guardian',
    'traveltime',
    'studytime',
    'failures',
    'schoolsup',
    'famsup',
    'paid',
    'activities',
    'nursery',
    'higher',
    'internet',
    'romantic',
    'famrel',
    'freetime',
    'goout',
    'Dalc',
    'Walc',
    'health',
    'absences'
  ]

  DESCRIPTION () {
    const prefix = 'datasets-models.1-regression.student-performance.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text.0'} /></p>
      <p><Trans i18nKey={prefix + 'text.1'} /></p>
      <p><Trans i18nKey={prefix + 'text.2'} /></p>
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
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
{`
@misc{misc_student_performance_320,
  author       = {Cortez,Paulo},
  title        = {{Student Performance}},
  year         = {2014},
  howpublished = {UCI Machine Learning Repository},
  note         = {{DOI}: https://doi.org/10.24432/C5TG7T}
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
    const path_datasets = process.env.REACT_APP_PATH + '/datasets/01-regression/student-performance/'
    const student_info = 'student.names'
    const mat_csv = 'student-mat-2024.csv'
    const por_csv = 'student-por-2024.csv'

    const dataset_fetch_info = await fetch(path_datasets + student_info)
    const student_container_info = await dataset_fetch_info.text()

    /**
     * @type {_Types.Dataset_t}
     */
    const dataset = [
      { column_name: 'school',     column_type: 'Categorical',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'sex',        column_type: 'Binary',        column_role: 'Feature', column_missing_values: false },
      { column_name: 'age',        column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'address',    column_type: 'Categorical',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'famsize',    column_type: 'Categorical',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'Pstatus',    column_type: 'Categorical',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'Medu',       column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'Fedu',       column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'Mjob',       column_type: 'Categorical',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'Fjob',       column_type: 'Categorical',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'reason',     column_type: 'Categorical',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'guardian',   column_type: 'Categorical',   column_role: 'Feature', column_missing_values: false },
      { column_name: 'traveltime', column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'studytime',  column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'failures',   column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'schoolsup',  column_type: 'Binary',        column_role: 'Feature', column_missing_values: false },
      { column_name: 'famsup',     column_type: 'Binary',        column_role: 'Feature', column_missing_values: false },
      { column_name: 'paid',       column_type: 'Binary',        column_role: 'Feature', column_missing_values: false },
      { column_name: 'activities', column_type: 'Binary',        column_role: 'Feature', column_missing_values: false },
      { column_name: 'nursery',    column_type: 'Binary',        column_role: 'Feature', column_missing_values: false },
      { column_name: 'higher',     column_type: 'Binary',        column_role: 'Feature', column_missing_values: false },
      { column_name: 'internet',   column_type: 'Binary',        column_role: 'Feature', column_missing_values: false },
      { column_name: 'romantic',   column_type: 'Binary',        column_role: 'Feature', column_missing_values: false },
      { column_name: 'famrel',     column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'freetime',   column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'goout',      column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'Dalc',       column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'Walc',       column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'health',     column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      { column_name: 'absences',   column_type: 'Integer',       column_role: 'Feature', column_missing_values: false },
      // { column_name: 'G1',         column_type: 'Categorical',   column_role: 'Target',  column_missing_values: false },
      // { column_name: 'G2',         column_type: 'Categorical',   column_role: 'Target',  column_missing_values: false },
      { column_name: 'G3',         column_type: 'Integer',       column_role: 'Target',  column_missing_values: false },
    ]
    
    // #region Student Mat
    let mat_dataframe_original = await dfd.readCSV(path_datasets + mat_csv)
    let mat_dataframe_processed = await dfd.readCSV(path_datasets + mat_csv)
    /** @type {_Types.DataFrameColumnTransform_t[]} */
    const mat_dataset_transforms = [
      ...dataset.filter(F_FILTER_Categorical).map(F_MAP_LabelEncoder),
      // { column_name: 'G1',             column_transform: 'drop' },
      // { column_name: 'G2',             column_transform: 'drop' },
      // { column_name: 'G3',             column_transform: 'drop' },
    ]
    const mat_target = 'G3' // G1;G2;G3
    const mat_dataframe_encoder = DataFrameUtils.DataFrameTransformAndEncoder(mat_dataframe_processed, mat_dataset_transforms)
    const mat_encoders_map = mat_dataframe_encoder.encoder_map
    mat_dataframe_processed = mat_dataframe_encoder.dataframe_processed
    const mat_dataframe_X = mat_dataframe_processed.drop({ columns: ['G3'] }).copy()
    /**@type {_Types.Series_t}*/
    const mat_dataframe_y = mat_dataframe_original[mat_target]
    const minMaxScaler1 = new dfd.MinMaxScaler()
    const mat_scaler = minMaxScaler1.fit(mat_dataframe_X)
    const mat_X = mat_scaler.transform(mat_dataframe_X)
    const mat_y = mat_dataframe_y
    // #endregion
    
    
    // #region Student Por
    let por_dataframe_original = await dfd.readCSV(path_datasets + por_csv)
    let por_dataframe_processed = await dfd.readCSV(path_datasets + por_csv)
    /** @type {_Types.DataFrameColumnTransform_t[]} */
    const por_dataset_transforms = [
      ...dataset.filter(F_FILTER_Categorical).map(F_MAP_LabelEncoder),
      // { column_name: 'G1',             column_transform: 'drop' },
      // { column_name: 'G2',             column_transform: 'drop' },
      // { column_name: 'G3',             column_transform: 'drop' },
    ]
    const por_target = 'G3' // G1;G2;G3
    const por_dataframe_encoder = DataFrameUtils.DataFrameTransformAndEncoder(por_dataframe_processed, por_dataset_transforms)
    const por_encoders_map = por_dataframe_encoder.encoder_map
    por_dataframe_processed = por_dataframe_encoder.dataframe_processed
    const por_dataframe_X = por_dataframe_processed.drop({ columns: ['G3'] }).copy()
    /**@type {_Types.Series_t}*/
    const por_dataframe_y = por_dataframe_original[por_target]
    const minMaxScaler2 = new dfd.MinMaxScaler()
    const por_minMaxScaler = minMaxScaler2.fit(por_dataframe_X)
    /**@type {_Types.DataFrame_t}*/
    const por_X = por_minMaxScaler.transform(por_dataframe_X)
    const por_y = por_dataframe_y
    // #endregion


    return [
      {
        is_dataset_upload   : false,
        is_dataset_processed: true,
        path                : path_datasets,
        info                : student_info,
        container_info      : student_container_info,
        csv                 : mat_csv,
        dataset             : dataset,
        dataset_transforms  : mat_dataset_transforms,
        dataframe_original  : mat_dataframe_original,
        dataframe_processed : mat_dataframe_processed,
        data_processed      : {
          dataframe_X       : mat_dataframe_X,
          dataframe_y       : mat_dataframe_y,
          X                 : mat_X,
          y                 : mat_y,
          scaler            : mat_scaler,
          encoders          : mat_encoders_map,
          column_name_target: mat_target,
        }
      }, 
      {
        is_dataset_upload   : false,
        is_dataset_processed: true,
        path                : path_datasets,
        info                : student_info,
        container_info      : student_container_info,
        csv                 : por_csv,
        dataset             : dataset,
        dataset_transforms  : por_dataset_transforms,
        dataframe_original  : por_dataframe_original,
        dataframe_processed : por_dataframe_processed,
        data_processed      : {
          dataframe_X       : por_dataframe_X,
          dataframe_y       : por_dataframe_y,
          X                 : por_X,
          y                 : por_y,
          scaler            : por_minMaxScaler,
          encoders          : por_encoders_map,
          column_name_target: por_target,
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
    const path = process.env.REACT_APP_PATH + '/models/01-regression/student-performance'
    const mat_model_0 = await tfjs.loadLayersModel(path + '/0/lr-model-mat.json')
    const por_model_0 = await tfjs.loadLayersModel(path + '/0/lr-model-por.json')
    const models = {
      'student-mat-2024.csv': [
        { 
          model     : mat_model_0,
          model_path: path + '/0/lr-model-mat.json', 
          X         : this.student_performance_columns_X,               
          y         : 'G3' 
        },
      ],
      'student-por-2024.csv': [
        { 
          model     : por_model_0,
          model_path: path + '/0/lr-model-por.json', 
          X         : this.student_performance_columns_X,               
          y         : 'G3' 
        },
      ]
    }
    return models[dataset]
  }

  DEFAULT_LAYERS () {
    return [
      { is_disabled: false, units: 32, activation: 'sigmoid' },
      { is_disabled: false, units: 16, activation: 'sigmoid' },
      { is_disabled: true,  units: 1,  activation: 'linear'  }
    ]
  }

  ATTRIBUTE_INFORMATION () {
    return <>

    </>
  }
}
