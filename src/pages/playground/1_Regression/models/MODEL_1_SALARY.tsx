import { Trans } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'
import * as dfd from 'danfojs'

import * as _Types from '@core/types'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import I_MODEL_REGRESSION from './_model'
import { F_FILTER_Categorical, F_MAP_LabelEncoder } from '@core/nn-utils/utils'

export default class MODEL_1_SALARY extends I_MODEL_REGRESSION {
  static KEY = 'SALARY'

  URL_SALARY = 'https://www.kaggle.com/datasets/saquib7hussain/experience-salary-dataset/data'
  URL_SALARY_EXTRA = 'https://www.kaggle.com/datasets/rkiattisak/salaly-prediction-for-beginer'
  i18n_TITLE = 'datasets-models.1-regression.salary.title'
  _KEY = 'SALARY'

  DESCRIPTION () {
    const prefix = 'datasets-models.1-regression.salary.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text.0'} /></p>
      <p><Trans i18nKey={prefix + 'text.1'} /></p>
      <p>
        <Trans i18nKey={prefix + 'link'}
               components={{
                 link1: <a href={this.URL_SALARY} target={'_blank'} rel="noreferrer" className={'text-info'}>link</a>,
               }} />
      </p>
      <details>
        <summary><Trans i18nKey={prefix + 'details-1-input.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-1-input.list.0'} /></li>
          <li><Trans i18nKey={prefix + 'details-1-input.list.1'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-2-output.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-2-output.list.0'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-3-references.title'} /></summary>
        <ol>
          <li>
            <a href={this.URL_SALARY} target="_blank" rel="noreferrer">
              <Trans i18nKey={prefix + 'details-3-references.list.0'} />
            </a>
          </li>
          <li>
            <a href={this.URL_SALARY_EXTRA} target="_blank" rel="noreferrer">
              <Trans i18nKey={prefix + 'details-3-references.list.1'} />
            </a>
          </li>
        </ol>
      </details>
    </>
  }

  /**
   * 
   * @returns {Promise<_Types.DatasetProcessed_t[]>}
   */
  async DATASETS () : Promise<_Types.DatasetProcessed_t[]> {
    const path_datasets = import.meta.env.VITE_PATH + '/datasets/01-regression/salary/'
    const salary_info = 'salary.names'
    const salary_csv = 'salary.csv'

    const dataset_promise_info = await fetch(path_datasets + salary_info)
    const salary_container_info = await dataset_promise_info.text()
    /** @type {_Types.Dataset_t} */
    const salary_dataset: _Types.Dataset_t = [
      { column_name: 'YearsExperience', column_role: 'Feature', column_type: 'Continuous',  column_missing_values: false },
      { column_name: 'Salary',          column_role: 'Target',  column_type: 'Continuous',  column_missing_values: false },
    ]
    const salary_dataset_transforms = [
      ...salary_dataset.filter(F_FILTER_Categorical).map(F_MAP_LabelEncoder),
      // { column_name: 'Salary', column_type: 'drop' }
    ]
    const salary_dataframe_original = await dfd.readCSV(path_datasets + salary_csv)
    let salary_dataframe_processed = await dfd.readCSV(path_datasets + salary_csv)
    const salary_dataframe_encoder = DataFrameUtils.DataFrameTransformAndEncoder(salary_dataframe_processed, salary_dataset_transforms)
    const salary_encoders_map = salary_dataframe_encoder.encoder_map
    salary_dataframe_processed = salary_dataframe_encoder.dataframe_processed
    const salary_target = 'Salary'
    const salary_dataframe_X = salary_dataframe_processed.drop({ columns: [salary_target] }).copy()
    const salary_dataframe_y = salary_dataframe_original[salary_target]
    const minMaxScaler = new dfd.MinMaxScaler()
    const salary_scaler = minMaxScaler.fit(salary_dataframe_X)
    const salary_X = salary_scaler.transform(salary_dataframe_X)
    const salary_y = salary_dataframe_y


    // SALARY EXTRA

    const salary_extra_info = 'salary-extra.names'
    const salary_extra_csv = 'salary-extra.csv'

    const salary_extra_dataset_promise_info = await fetch(path_datasets + salary_extra_info)
    const salary_extra_container_info = await salary_extra_dataset_promise_info.text()
    /** @type {_Types.Dataset_t} */
    const salary_extra_dataset: _Types.Dataset_t = [
      { column_name: 'Age',                 column_role: 'Feature', column_type: 'Integer',     column_missing_values: false },
      { column_name: 'Gender',              column_role: 'Feature', column_type: 'Categorical', column_missing_values: false },
      { column_name: 'Education Level',     column_role: 'Feature', column_type: 'Categorical', column_missing_values: false },
      { column_name: 'Job Title',           column_role: 'Feature', column_type: 'Categorical', column_missing_values: false },
      { column_name: 'Years of Experience', column_role: 'Feature', column_type: 'Integer',  column_missing_values: false },
      { column_name: 'Salary',              column_role: 'Target',  column_type: 'Integer',  column_missing_values: false },
    ]
    const salary_extra_dataset_transforms = [
      ...salary_extra_dataset.filter(F_FILTER_Categorical).map(F_MAP_LabelEncoder),
      // { column_name: 'Salary', column_type: 'drop' }
    ]
    const salary_extra_dataframe_original = await dfd.readCSV(path_datasets + salary_extra_csv)
    let salary_extra_dataframe_processed = await dfd.readCSV(path_datasets + salary_extra_csv)
    const salary_extra_dataframe_encoder = DataFrameUtils.DataFrameTransformAndEncoder(salary_extra_dataframe_processed, salary_extra_dataset_transforms)
    const salary_extra_encoders_map = salary_extra_dataframe_encoder.encoder_map
    salary_extra_dataframe_processed = salary_extra_dataframe_encoder.dataframe_processed
    const salary_extra_target = 'Salary'
    const salary_extra_dataframe_X = salary_extra_dataframe_processed.drop({ columns: [salary_extra_target] }).copy()
    const salary_extra_dataframe_y = salary_extra_dataframe_original[salary_extra_target]
    const minMaxScaler2 = new dfd.MinMaxScaler()
    const salary_extra_scaler = minMaxScaler2.fit(salary_extra_dataframe_X)
    const salary_extra_X = salary_extra_scaler.transform(salary_extra_dataframe_X)
    const salary_extra_y = salary_extra_dataframe_y

    return [
      {
        is_dataset_upload   : false,
        is_dataset_processed: true,
        path                : path_datasets,
        info                : salary_info,
        csv                 : salary_csv,
        container_info      : salary_container_info,
        dataset             : salary_dataset,
        dataset_transforms  : salary_dataset_transforms,
        dataframe_original  : salary_dataframe_original,  // Antes de aplicar los transformers
        dataframe_processed : salary_dataframe_processed, // Despues de aplicar los transformers
        data_processed      : {
          dataframe_X       : salary_dataframe_X, // Antes de hacer el escalado y sin el target
          dataframe_y       : salary_dataframe_y,
          X                 : salary_X,           // Despues de hacer el escalado y sin el target
          y                 : salary_y,
          scaler            : salary_scaler,
          encoders          : salary_encoders_map,
          column_name_target: salary_target,
        }
      },

      {
        is_dataset_upload   : false,
        is_dataset_processed: true,
        path                : path_datasets,
        info                : salary_extra_info,
        csv                 : salary_extra_csv,
        container_info      : salary_extra_container_info,
        dataset             : salary_extra_dataset,
        dataset_transforms  : salary_extra_dataset_transforms,
        dataframe_original  : salary_extra_dataframe_original,
        dataframe_processed : salary_extra_dataframe_processed,
        data_processed      : {
          dataframe_X       : salary_extra_dataframe_X,
          dataframe_y       : salary_extra_dataframe_y,
          X                 : salary_extra_X,
          y                 : salary_extra_y,
          scaler            : salary_extra_scaler,
          encoders          : salary_extra_encoders_map,
          column_name_target: salary_extra_target,
        }
      }
    ]
  }

  /**
   * 
   * @param {string} [dataset='']
   * @return {Promise<_Types.CustomModel_t[]>}
   */
  async MODELS (dataset: string): Promise<_Types.CustomModel_t[]> {
    const path = import.meta.env.VITE_PATH + '/models/01-regression/salary'
    const model_salary = await tfjs.loadLayersModel(path + '/2/lr-model-2.json')
    const models: { [key: string]: _Types.CustomModel_t[] } = {
      'salary-extras.csv': [],
      'salary.csv'       : [
        { 
          model     : model_salary,
          model_path: path + '/0/lr-model-0.json', 
          X         : ['YearsExperience'], 
          y         : 'Salary'
        },
      ]
    }
    return models[dataset]
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

  DEFAULT_LAYERS (_dataset: _Types.Dataset_t|string = ''): _Types.CustomParamsLayerModel_t[] {
    return [
      { is_disabled: false, units: 10, activation: 'sigmoid' },
      { is_disabled: false, units: 20, activation: 'relu'    },
      { is_disabled: true,  units: 1,  activation: 'linear'  }
    ]
  }

  ATTRIBUTE_INFORMATION () {
    return <></>
  }
}
