import * as dfd from 'danfojs'
import { Trans } from 'react-i18next'

import * as _Types from '@core/types'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import I_MODEL_REGRESSION from './_model'
import { F_FILTER_Categorical, F_MAP_LabelEncoder } from '@core/nn-utils/utils'

export default class MODEL_4_BREAST_CANCER extends I_MODEL_REGRESSION {

  static KEY = 'BREAST_CANCER'
  static URL = 'https://archive.ics.uci.edu/dataset/15/breast+cancer+wisconsin+original'
  static URL_2 = 'https://archive.ics.uci.edu/dataset/16/breast+cancer+wisconsin+prognostic'
  static URL_3 = 'https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic'

  URL = 'https://archive.ics.uci.edu/dataset/15/breast+cancer+wisconsin+original'
  URL_2 = 'https://archive.ics.uci.edu/dataset/16/breast+cancer+wisconsin+prognostic'
  URL_3 = 'https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic'
  URL_IMAGE = 'https://www.cs.wisc.edu/~street/images/'

  i18n_TITLE = 'datasets-models.1-regression.breast-cancer.title'
  _KEY = 'BREAST_CANCER'

  wdbc_columns_X = [
    'Time',
    'radius1',
    'texture1',
    'perimeter1',
    'area1',
    'smoothness1',
    'compactness1',
    'concavity1',
    'concave_points1',
    'symmetry1',
    'fractal_dimension1',
    'radius2',
    'texture2',
    'perimeter2',
    'area2',
    'smoothness2',
    'compactness2',
    'concavity2',
    'concave_points2',
    'symmetry2',
    'fractal_dimension2',
    'radius3',
    'texture3',
    'perimeter3',
    'area3',
    'smoothness3',
    'compactness3',
    'concavity3',
    'concave_points3',
    'symmetry3',
    'fractal_dimension3',
    'tumor_size',
    'lymph_node_status',
  ]

  DESCRIPTION () {
    const prefix = 'datasets-models.1-regression.breast-cancer.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text.0'} /></p>
      <p><Trans i18nKey={prefix + 'text.1'} /></p>
      <p>
        <Trans 
          i18nKey={prefix + 'text.2'}
          components={{
            link1: <a href={this.URL_IMAGE} target={'_blank'} rel="noreferrer">link</a>,
          }} 
          />
      </p>
      <p><Trans i18nKey={prefix + 'text.3'} /></p>
      <p>
        <Trans 
          i18nKey={prefix + 'link'}
          components={{
            link1: <a href={this.URL} target={'_blank'} rel="noreferrer">link</a>,
          }} 
          />
      </p>
      <details>
        <summary><Trans i18nKey={prefix + 'details-1-input.title'} /></summary>
        <ol>
          {Object.entries(this.t(prefix + 'details-1-input.list', { returnObjects: true, defaultValue: [] }))
            .map((_value, index) => {
              return <li key={index}><Trans i18nKey={prefix + 'details-1-input.list.' + index} /></li>
            })}
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-2-output.title'} /></summary>
        <ol>
          {Object.entries(this.t(prefix + 'details-2-output.list', { returnObjects: true, defaultValue: [] }))
            .map((_value, index) => {
              return <li key={index}><Trans i18nKey={prefix + 'details-2-output.list.' + index} /></li>
            })}
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-3-references.title'} /></summary>
        <ol>
          <li>
            <Trans i18nKey={prefix + 'details-3-references.list.0'}
                   components={{
                    link1: <a href={this.URL} target={'_blank'} rel={'noreferrer'}>TEXT</a>
                   }} />
          </li>
          <li>
            <Trans i18nKey={prefix + 'details-3-references.list.1'}
                   components={{
                    link1: <a href={this.URL_2} target={'_blank'} rel={'noreferrer'}>TEXT</a>
                   }} />
          </li>
          <li>
            <Trans i18nKey={prefix + 'details-3-references.list.2'}
                   components={{
                    link1: <a href={this.URL_3} target={'_blank'} rel={'noreferrer'}>TEXT</a>
                   }} />
          </li>
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

  /**
   * 
   * @returns {Promise<_Types.DatasetProcessed_t[]>}
   */
  async DATASETS () {
    const path_datasets = import.meta.env.VITE_PATH + '/datasets/01-regression/breast-cancer/'
    const bcw_info = 'breast-cancer-wisconsin.names'
    const bcw_csv = 'breast-cancer-wisconsin.csv'
    const wdbc_info = 'wdbc.names'
    const wdbc_csv = 'wdbc.csv'
    const wpbc_info = 'wpbc.names'
    const wpbc_csv = 'wpbc.csv'

    const [bcw_promise_info, wdbc_promise_info, wpbc_promise_info] = await Promise.all([
      fetch(path_datasets + bcw_info),
      fetch(path_datasets + wdbc_info),
      fetch(path_datasets + wpbc_info),
    ])
    const [bcw_container_info, wdbc_container_info, wpbc_container_info] = await Promise.all([
      bcw_promise_info.text(),
      wdbc_promise_info.text(),
      wpbc_promise_info.text(),
    ])
    
    // --------------------
    // #region Dataset Breast cancer wisconsin (Original)
    const bcw_dataframe_original = await dfd.readCSV(path_datasets + bcw_csv)
    let bcw_dataframe_processed = await dfd.readCSV(path_datasets + bcw_csv)
    
    /** @type {_Types.Dataset_t} */
    const bcw_dataset: _Types.Dataset_t = [
      { column_name: 'Sample_code_number',           column_role: 'ID',       column_type: 'Categorical', column_missing_values: false },
      { column_name: 'Clump_thickness',              column_role: 'Feature',  column_type: 'Integer',     column_missing_values: false },
      { column_name: 'Uniformity_of_cell_size',      column_role: 'Feature',  column_type: 'Integer',     column_missing_values: false },
      { column_name: 'Uniformity_of_cell_shape',     column_role: 'Feature',  column_type: 'Integer',     column_missing_values: false },
      { column_name: 'Marginal_adhesion',            column_role: 'Feature',  column_type: 'Integer',     column_missing_values: false },
      { column_name: 'Single_epithelial_cell_size',  column_role: 'Feature',  column_type: 'Integer',     column_missing_values: false },
      { column_name: 'Bare_nuclei',                  column_role: 'Feature',  column_type: 'Integer',     column_missing_values: true, column_missing_values_key: '?' },
      { column_name: 'Bland_chromatin',              column_role: 'Feature',  column_type: 'Integer',     column_missing_values: false },
      { column_name: 'Normal_nucleoli',              column_role: 'Feature',  column_type: 'Integer',     column_missing_values: false },
      { column_name: 'Mitoses',                      column_role: 'Feature',  column_type: 'Integer',     column_missing_values: false },
      { column_name: 'Class',                        column_role: 'Target',   column_type: 'Binary',      column_missing_values: false },
    ]
    /** @type {_Types.DataFrameColumnTransform_t[]} */
    const bcw_dataset_transforms: _Types.DataFrameColumnTransform_t[] = [
      ...bcw_dataset.filter(F_FILTER_Categorical).map(v => F_MAP_LabelEncoder(v) as _Types.DataFrameColumnTransform_t),
      { column_name: 'Sample_code_number', column_transform: 'drop' },
      { column_name: 'Bare_Nuclei',        column_transform: 'drop' },
      // { column_name: 'Bare_Nuclei',        column_transform: 'replace_?_NaN' },
      // { column_name: 'Bare_Nuclei',        column_transform: 'dropNa' },
      // { column_name: 'Class',              column_transform: 'drop' },
    ]
    const bcw_target = 'Class'
    const bcw_dataframe_encoder = DataFrameUtils.DataFrameTransformAndEncoder(bcw_dataframe_processed, bcw_dataset_transforms)
    const bcw_encoders_map = bcw_dataframe_encoder.encoder_map
    bcw_dataframe_processed = bcw_dataframe_encoder.dataframe_processed
    const bcw_dataframe_X = bcw_dataframe_processed.drop({ columns: [bcw_target] }).copy()
    const bcw_dataframe_y = bcw_dataframe_original[bcw_target]
    const minMaxScaler_1 = new dfd.MinMaxScaler()
    const bcw_scaler = minMaxScaler_1.fit(bcw_dataframe_X)
    const bcw_X = bcw_scaler.transform(bcw_dataframe_X)
    const bcw_y = bcw_dataframe_y
    // #endregion
    
    
    // --------------------
    // #region Breast Cancer Wisconsin (Diagnostic)
    const wdbc_dataframe_original = await dfd.readCSV(path_datasets + wdbc_csv)
    let wdbc_dataframe_processed = await dfd.readCSV(path_datasets + wdbc_csv)
    /**@type {_Types.Dataset_t} */
    const wdbc_dataset: _Types.Dataset_t = [
      { column_name: 'ID',                  column_type: 'Categorical', column_role: 'ID',      column_missing_values: false },
      { column_name: 'radius1',             column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'texture1',            column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'perimeter1',          column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'area1',               column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'smoothness1',         column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'compactness1',        column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'concavity1',          column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'concave_points1',     column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'symmetry1',           column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'fractal_dimension1',  column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'radius2',             column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'texture2',            column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'perimeter2',          column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'area2',               column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'smoothness2',         column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'compactness2',        column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'concavity2',          column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'concave_points2',     column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'symmetry2',           column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'fractal_dimension2',  column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'radius3',             column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'texture3',            column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'perimeter3',          column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'area3',               column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'smoothness3',         column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'compactness3',        column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'concavity3',          column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'concave_points3',     column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'symmetry3',           column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'fractal_dimension3',  column_type: 'Continuous',  column_role: 'Feature', column_missing_values: false },
      { column_name: 'Diagnosis',           column_type: 'Categorical', column_role: 'Target',  column_missing_values: false },
    ]
    /** @type {_Types.DataFrameColumnTransform_t[]} */
    const wdbc_dataset_transforms = [
      ...wdbc_dataset.filter(F_FILTER_Categorical).map(v => F_MAP_LabelEncoder(v) as _Types.DataFrameColumnTransform_t),
      // { column_name: 'ID',        column_transform: 'drop' },
      // { column_name: 'Diagnosis', column_transform: 'drop' },

    ]
    const wdbc_target = 'Diagnosis'
    const wdbc_dataframe_encoder = DataFrameUtils.DataFrameTransformAndEncoder(wdbc_dataframe_processed, wdbc_dataset_transforms)
    const wdbc_encoders_map = wdbc_dataframe_encoder.encoder_map
    wdbc_dataframe_processed = wdbc_dataframe_encoder.dataframe_processed
    const wdbc_dataframe_X = wdbc_dataframe_processed.drop({ columns: [wdbc_target] }).copy()
    const wdbc_dataframe_y = wdbc_dataframe_original[wdbc_target]
    const minMaxScaler_2 = new dfd.MinMaxScaler()
    const wdbc_scaler = minMaxScaler_2.fit(wdbc_dataframe_X)
    const wdbc_X = wdbc_scaler.transform(wdbc_dataframe_X)
    const wdbc_y = wdbc_dataframe_y
    // #endregion

    // --------------------
    // #region Breast Cancer Wisconsin (Prognostic)
    const wpbc_dataframe_original = await dfd.readCSV(path_datasets + wpbc_csv)
    let wpbc_dataframe_processed = await dfd.readCSV(path_datasets + wpbc_csv)
    /** @type {_Types.Dataset_t} */
    const wpbc_dataset: _Types.Dataset_t = [
      { column_name: 'ID',                   column_role: 'ID',             column_type: 'Integer',        column_missing_values: false },
      { column_name: 'Time',                 column_role: 'Feature',        column_type: 'Integer',        column_missing_values: false }, // empiezan los 3 ciclos
      { column_name: 'radius1',              column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'texture1',             column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'perimeter1',           column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'area1',                column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'smoothness1',          column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'compactness1',         column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'concavity1',           column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'concave_points1',      column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'symmetry1',            column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'fractal_dimension1',   column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'radius2',              column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'texture2',             column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'perimeter2',           column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'area2',                column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'smoothness2',          column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'compactness2',         column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'concavity2',           column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'concave_points2',      column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'symmetry2',            column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'fractal_dimension2',   column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'radius3',              column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'texture3',             column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'perimeter3',           column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'area3',                column_role: 'Feature',        column_type: 'Integer',        column_missing_values: false },
      { column_name: 'smoothness3',          column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'compactness3',         column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'concavity3',           column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'concave_points3',      column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'symmetry3',            column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'fractal_dimension3',   column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false }, // Fin 3 ciclos
      { column_name: 'tumor_size',           column_role: 'Feature',        column_type: 'Continuous',     column_missing_values: false },
      { column_name: 'lymph_node_status',    column_role: 'Feature',        column_type: 'Integer',        column_missing_values: true,  column_missing_values_key: '?' },
      { column_name: 'Outcome',              column_role: 'Target',         column_type: 'Categorical',    column_missing_values: false },
    ]
    /** @type {_Types.DataFrameColumnTransform_t[]} */
    const wpbc_dataset_transforms: _Types.DataFrameColumnTransform_t[] = [
      ...wpbc_dataset.filter(F_FILTER_Categorical).map(v => F_MAP_LabelEncoder(v) as _Types.DataFrameColumnTransform_t)
,
      { column_name: 'ID',                column_transform: 'drop'          },
      { column_name: 'lymph_node_status', column_transform: 'drop'          },
      // { column_name: 'lymph_node_status', column_transform: 'replace_?_NaN' },
      // { column_name: 'lymph_node_status', column_transform: 'dropNa'        },
      // { column_name: 'lymph_node_status', column_transform: 'drop'          },
      // { column_name: 'Outcome',           column_transform: 'drop'          },
    ]
    const wpbc_target = 'Outcome'
    const wpbc_dataframe_encoder = DataFrameUtils.DataFrameTransformAndEncoder(wpbc_dataframe_processed, wpbc_dataset_transforms)
    const wpbc_encoders_map = wpbc_dataframe_encoder.encoder_map
    wpbc_dataframe_processed = wpbc_dataframe_encoder.dataframe_processed
    const wpbc_dataframe_X = wpbc_dataframe_processed.drop({ columns: [wpbc_target] }).copy()
    const wpbc_dataframe_y = wpbc_dataframe_original[wpbc_target]
    const minMaxScaler_3 = new dfd.MinMaxScaler()
    const wpbc_scaler = minMaxScaler_3.fit(wpbc_dataframe_X)
    const wpbc_X = wpbc_scaler.transform(wpbc_dataframe_X)
    const wpbc_y = wpbc_dataframe_y
    // #endregion


    return [
      {
        is_dataset_upload   : false,
        is_dataset_processed: true,
        path                : path_datasets,
        info                : bcw_info,
        csv                 : bcw_csv,
        container_info      : bcw_container_info,
        dataset             : bcw_dataset,
        dataset_transforms  : bcw_dataset_transforms,
        dataframe_original  : bcw_dataframe_original,
        dataframe_processed : bcw_dataframe_processed,
        data_processed      : {
          dataframe_X       : bcw_dataframe_X,
          dataframe_y       : bcw_dataframe_y,
          X                 : bcw_X,
          y                 : bcw_y,
          scaler            : bcw_scaler,
          encoders          : bcw_encoders_map,
          column_name_target: bcw_target,
        }
      },
      {
        is_dataset_upload   : false,
        is_dataset_processed: true,
        path                : path_datasets,
        csv                 : wdbc_csv,
        info                : wdbc_info,
        container_info      : wdbc_container_info,
        dataset             : wdbc_dataset,
        dataset_transforms  : wdbc_dataset_transforms,
        dataframe_original  : wdbc_dataframe_original,
        dataframe_processed : wdbc_dataframe_processed,
        data_processed      : {
          dataframe_X       : wdbc_dataframe_X,
          dataframe_y       : wdbc_dataframe_y,
          X                 : wdbc_X,
          y                 : wdbc_y,
          scaler            : wdbc_scaler,
          encoders          : wdbc_encoders_map,
          column_name_target: wdbc_target,
        }
      },
      {
        is_dataset_upload   : false,
        is_dataset_processed: true,
        path                : path_datasets,
        info                : wpbc_info,
        csv                 : wpbc_csv,
        container_info      : wpbc_container_info,
        dataset             : wpbc_dataset,
        dataset_transforms  : wpbc_dataset_transforms,
        dataframe_original  : wpbc_dataframe_original,
        dataframe_processed : wpbc_dataframe_processed,
        data_processed      : {
          dataframe_X       : wpbc_dataframe_X,
          dataframe_y       : wpbc_dataframe_y,
          X                 : wpbc_X,
          y                 : wpbc_y,
          scaler            : wpbc_scaler,
          encoders          : wpbc_encoders_map,
          column_name_target: wpbc_target,
        }
      }
    ]
  }

  DEFAULT_LAYERS () {
    return [
      { is_disabled: false, units: 32, activation: 'relu'   },
      { is_disabled: false, units: 16, activation: 'relu'   },
      { is_disabled: true,  units: 1,  activation: 'linear' }
    ]
  }

  /**
   * 
   * @param {string} [dataset='']
   * @return {Promise<_Types.CustomModel_t[]>}
   */
  async MODELS (dataset: string = ''): Promise<_Types.CustomModel_t[]> {
    const path = import.meta.env.VITE_PATH + '/models/01-regression/breast-cancer'
    // const model = await tfjs.loadLayersModel(path + '/0/lr-model-0.json')
    
    const models: { [key: string]: _Types.CustomModel_t[] } = {
      'breast-cancer-wisconsin.csv': [],
      'wpbc.csv'                   : [],
      'wdbc.csv'                   : [
        { 
          model_path: path + '/0/lr-model-0.json', 
          X         : this.wdbc_columns_X, 
          y         : 'Outcome'
        }
      ],
    }
    return models[dataset]
  }

  ATTRIBUTE_INFORMATION () {
    return <></>
  }
}
