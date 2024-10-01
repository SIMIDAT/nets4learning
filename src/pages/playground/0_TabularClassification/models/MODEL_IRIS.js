import React from 'react'
import { Trans } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'
import * as dfd from 'danfojs'

import * as _Types from '@core/types'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import I_MODEL_TABULAR_CLASSIFICATION from './_model'
import { F_FILTER_Categorical, F_MAP_LabelEncoder } from '@/core/nn-utils/utils'

export default class MODEL_IRIS extends I_MODEL_TABULAR_CLASSIFICATION {

  static KEY = 'IRIS'
  static URL = 'https://archive.ics.uci.edu/ml/datasets/iris'
  static URL_MODEL = '/public/models/classification/iris/my-model-iris.json'
  TITLE = 'datasets-models.0-tabular-classification.iris.title'
  i18n_TITLE = 'datasets-models.0-tabular-classification.iris.title'

  // region ATTR
  DATA_DEFAULT_KEYS = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width']
  DATA_DEFAULT = {
    sepal_length: 5.1,
    sepal_width : 3.5,
    petal_length: 1.4,
    petal_width : 0.2
  }
  FORM = [
    { type: 'float32', name: 'sepal_length' },
    { type: 'float32', name: 'sepal_width' },
    { type: 'float32', name: 'petal_length' },
    { type: 'float32', name: 'petal_width' },
  ]
  LIST_EXAMPLES = [
    { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2 },
    { sepal_length: 6.1, sepal_width: 3.0, petal_length: 4.6, petal_width: 1.4 },
    { sepal_length: 5.8, sepal_width: 2.7, petal_length: 5.1, petal_width: 1.9 },
  ]
  LIST_EXAMPLES_RESULTS = [
    '0 Iris-setosa',
    '1 Iris-versicolor',
    '2 Iris-virginica',
  ]

  CLASSES = [
    '00-tc.iris.Iris-setosa',
    '00-tc.iris.Iris-versicolor',
    '00-tc.iris.Iris-virginica',
  ]
  TABLE_HEADER = [
    '00-tc.iris.sepal_length',
    '00-tc.iris.sepal_width',
    '00-tc.iris.petal_length',
    '00-tc.iris.petal_width',
    '00-tc.iris.class'
  ]

  // endregion

  DESCRIPTION () {
    const prefix = 'datasets-models.0-tabular-classification.iris.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text-1'} /></p>
      <details>
        <summary><Trans i18nKey={prefix + 'details-1.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-1.list.1'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.2'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.3'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.4'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-2.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-2.list.1'} /></li>
          <li><Trans i18nKey={prefix + 'details-2.list.2'} /></li>
          <li><Trans i18nKey={prefix + 'details-2.list.3'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-3.title'} /></summary>
        <ol>
          <li>
            <a href="https://archive.ics.uci.edu/ml/datasets/Iris" target="_blank" rel="noreferrer">
              <Trans i18nKey={prefix + 'details-3.list.1'} />
            </a>
          </li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
{`
@misc{misc_iris_53,
  author       = {Fisher,R. A.},
  title        = {{Iris}},
  year         = {1988},
  howpublished = {UCI Machine Learning Repository},
  note         = {{DOI}: https://doi.org/10.24432/C56C76}
}
`}
        </pre>
      </details>
    </>
  }

  async DATASETS () {
    const path_dataset = process.env.REACT_APP_PATH + '/models/00-tabular-classification/iris/'
    const iris_info = 'iris.names'
    const iris_csv = 'iris.csv'
    const dataset_promise_info = await fetch(path_dataset + iris_info)
    const iris_container_info = await dataset_promise_info.text()
    let dataframe_original = await dfd.readCSV(path_dataset + iris_csv)
    let dataframe_processed = await dfd.readCSV(path_dataset + iris_csv)
    /** @type {_Types.Dataset_t} */
    const dataset = [
      { column_name: 'sepal length',  column_role: 'Feature', column_type: 'Continuous',  column_missing_values: false },
      { column_name: 'sepal width',   column_role: 'Feature', column_type: 'Continuous',  column_missing_values: false },
      { column_name: 'petal length',  column_role: 'Feature', column_type: 'Continuous',  column_missing_values: false },
      { column_name: 'petal width',   column_role: 'Feature', column_type: 'Continuous',  column_missing_values: false },
      { column_name: 'class',         column_role: 'Target',  column_type: 'Categorical', column_missing_values: false },
    ]
    /** @type {_Types.DataFrameColumnTransform_t[]} */
    const dataset_transforms = [
      ...dataset.filter(F_FILTER_Categorical).map(F_MAP_LabelEncoder)
      // { column_transform: 'label-encoder', column_name: 'class' },
    ]
    const iris_encoders_map = DataFrameUtils.DataFrameEncoder(dataframe_original, dataset_transforms)
    dataframe_processed = DataFrameUtils.DataFrameTransform(dataframe_processed, dataset_transforms)
    const iris_target = 'class'
    const iris_dataframe_X = dataframe_processed.drop({ columns: [iris_target] })
    const iris_dataframe_y = dataframe_original[iris_target]
    const minMaxScaler = new dfd.MinMaxScaler()
    const iris_minMaxScaler = minMaxScaler.fit(iris_dataframe_X)
    const iris_X = iris_minMaxScaler.transform(iris_dataframe_X)
    const oneHotEncoder = new dfd.OneHotEncoder()
    const iris_oneHotEncoder = oneHotEncoder.fit(iris_dataframe_y)
    const iris_y = iris_oneHotEncoder.transform(iris_dataframe_y)
    const labelEncoder = new dfd.LabelEncoder()
    const iris_labelEncoder = labelEncoder.fit(iris_dataframe_y.values)
    // @ts-ignore
    const iris_classes = Object.keys(iris_labelEncoder.$labels)

    return [
      {
        is_dataset_upload   : false,
        is_dataset_processed: true,
        path                : path_dataset,
        info                : iris_info,
        container_info      : iris_container_info,
        csv                 : iris_csv,
        dataframe_original  : dataframe_original,
        dataframe_processed : dataframe_processed,
        dataset_transforms  : dataset_transforms,
        data_processed      : {
          dataframe_X       : iris_dataframe_X,
          dataframe_y       : iris_dataframe_y,
          X                 : iris_X,
          y                 : iris_y,
          encoders          : iris_encoders_map,
          scaler            : iris_minMaxScaler,
          column_name_target: iris_target,
          classes           : iris_classes,
          attributes        : [
            // @formatter:off
            { type: 'float32', name: 'sepal_length' },
            { type: 'float32', name: 'sepal_width' },
            { type: 'float32', name: 'petal_length' },
            { type: 'float32', name: 'petal_width' },
            // @formatter:on
          ],
        },
      }
    ]
  }

  async LOAD_GRAPH_MODEL (callbacks) {
    return await tfjs.loadGraphModel(process.env.REACT_APP_PATH + '/models/00-tabular-classification/iris/my-model-iris.json', {
      onProgress: callbacks.onProgress
    })
  }

  async LOAD_LAYERS_MODEL (callbacks) {
    return await tfjs.loadLayersModel(process.env.REACT_APP_PATH + '/models/00-tabular-classification/iris/my-model-iris.json', {
      onProgress: callbacks.onProgress
    })
  }

  DEFAULT_LAYERS () {
    return [
      { units: 10, activation: 'relu' },
      { units: 10, activation: 'relu' },
      { units: 3, activation: 'softmax' },
    ]
  }

  HTML_EXAMPLE () {
    const prefix = 'datasets-models.0-tabular-classification.iris.html-example.'
    return <>
      <p>
        <Trans i18nKey={prefix + 'text'} /><br />
        <b><Trans i18nKey={prefix + 'items'} /></b>
      </p>
    </>
  }
}
