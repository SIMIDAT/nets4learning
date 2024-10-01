import React from 'react'
import * as tfjs from '@tensorflow/tfjs'
import { Trans } from 'react-i18next'
import * as dfd from 'danfojs'

import * as _Types from '@core/types'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import I_MODEL_TABULAR_CLASSIFICATION from './_model'
import { F_FILTER_Categorical, F_MAP_LabelEncoder } from '@/core/nn-utils/utils'

export default class MODEL_CAR extends I_MODEL_TABULAR_CLASSIFICATION {
  static KEY = 'CAR'
  static URL = 'https://archive.ics.uci.edu/ml/datasets/Car+Evaluation'
  TITLE = 'datasets-models.0-tabular-classification.car.title'
  i18n_TITLE = 'datasets-models.0-tabular-classification.car.title'
  TABLE_HEADER = ['00-tc.car.buying', '00-tc.car.maint', '00-tc.car.doors', '00-tc.car.persons', '00-tc.car.lug_boot', '00-tc.car.safety', '00-tc.car.result']
  CLASSES = ['00-tc.car.unacc', '00-tc.car.acc', '00-tc.car.good', '00-tc.car.vgood']
  // @formatter:off
  DATA_DEFAULT_KEYS = ['Buying', 'Maint', 'Doors', 'Persons', 'Lug_boot', 'Safety']
  DATA_DEFAULT = {
    Buying  : 'vhigh',
    Maint   : 'vhigh',
    Doors   : '2',
    Persons : '2',
    Lug_boot: 'small',
    Safety  : 'low'
  }
  LIST_EXAMPLES_RESULTS = [
    'unacc',
    'acc',
    'good',
  ]
  LIST_EXAMPLES = [
    { Buying: 'low',   Maint: 'vhigh', Doors: '4',     Persons: '2',    Lug_boot: 'small', Safety: 'low' },
    { Buying: 'med',   Maint: 'low',   Doors: '5more', Persons: 'more', Lug_boot: 'med',   Safety: 'med' },
    { Buying: 'low',   Maint: 'low',   Doors: '5more', Persons: 'more', Lug_boot: 'big',   Safety: 'high' }
  ]
  FORM = [
    { type: 'label-encoder', name: 'Buying',   options: [{ value: 'vhigh', text: 'vhigh' }, { value: 'high', text: 'high' }, { value: 'med',  text: 'med'  }, { value: 'low',   text: 'low'   },] },
    { type: 'label-encoder', name: 'Maint',    options: [{ value: 'vhigh', text: 'vhigh' }, { value: 'high', text: 'high' }, { value: 'med',  text: 'med'  }, { value: 'low',   text: 'low'   },] },
    { type: 'label-encoder', name: 'Doors',    options: [{ value: '2',     text: '2'     }, { value: '3',    text: '3'    }, { value: '4',    text: '4'    }, { value: '5more', text: '5more' },] },
    { type: 'label-encoder', name: 'Persons',  options: [{ value: '2',     text: '2'     }, { value: '4',    text: '4'    }, { value: 'more', text: 'more' },] },
    { type: 'label-encoder', name: 'Lug_boot', options: [{ value: 'small', text: 'small' }, { value: 'med', text: 'med'   }, { value: 'big',  text: 'big'  },] },
    { type: 'label-encoder', name: 'Safety',   options: [{ value: 'low',   text: 'low'   }, { value: 'med', text: 'med'   }, { value: 'high', text: 'high' },] },
  ]
  // @formatter:on

  DESCRIPTION () {
    const prefix = 'datasets-models.0-tabular-classification.car.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text-1'} /></p>
      <p>
        <Trans i18nKey={prefix + 'text-2'}
               components={{
                 link1: <a href="https://archive.ics.uci.edu/ml/datasets/Car+Evaluation"
                           target="_blank"
                           rel="noreferrer">link</a>,
               }}
        />
      </p>
      <details>
        <summary><Trans i18nKey={prefix + 'details-1.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-1.list.1'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.2'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.3'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.4'} /></li>
          <li><Trans i18nKey={prefix + 'details-1.list.5'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-2.title'} /></summary>
        <p><Trans i18nKey={prefix + 'details-2.text-1'} /></p>
        <ol>
          <li><Trans i18nKey={prefix + 'details-2.list.1'} /></li>
          <li><Trans i18nKey={prefix + 'details-2.list.2'} /></li>
          <li><Trans i18nKey={prefix + 'details-2.list.3'} /></li>
          <li><Trans i18nKey={prefix + 'details-2.list.4'} /></li>
          <li><Trans i18nKey={prefix + 'details-2.list.5'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-3.title'} /></summary>
        <p><Trans i18nKey={prefix + 'details-3.text-1'} /></p>
        <ol>
          <li><Trans i18nKey={prefix + 'details-3.list.1'} /></li>
          <li><Trans i18nKey={prefix + 'details-3.list.2'} /></li>
          <li><Trans i18nKey={prefix + 'details-3.list.3'} /></li>
          <li><Trans i18nKey={prefix + 'details-3.list.4'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-4.title'} /></summary>
        <ol>
          <li>
            <a href="https://archive.ics.uci.edu/ml/datasets/Car+Evaluation" target="_blank" rel="noreferrer">
              <Trans i18nKey={prefix + 'details-4.list.1'} />
            </a>
          </li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
{`
@misc{misc_car_evaluation_19,
  author       = {Bohanec,Marko},
  title        = {{Car Evaluation}},
  year         = {1997},
  howpublished = {UCI Machine Learning Repository},
  note         = {{DOI}: https://doi.org/10.24432/C5JP48}
}
`}
          </pre>
      </details>
    </>
  }

  async DATASETS () {
    const path_dataset = process.env.REACT_APP_PATH + '/models/00-tabular-classification/car/'
    const car_info = 'car.names'
    const car_csv = 'car.csv'

    const dataset_promise_info = await fetch(path_dataset + car_info)
    const car_container_info = await dataset_promise_info.text()

    let dataframe_original = await dfd.readCSV(path_dataset + car_csv)
    let dataframe_processed = await dfd.readCSV(path_dataset + car_csv)
    /** @type {_Types.Dataset_t} */
    const dataset = [
      { column_name: 'Buying',   column_role: 'Feature', column_type: 'Categorical', column_missing_values: false },
      { column_name: 'Maint',    column_role: 'Feature', column_type: 'Categorical', column_missing_values: false },
      { column_name: 'Doors',    column_role: 'Feature', column_type: 'Categorical', column_missing_values: false },
      { column_name: 'Persons',  column_role: 'Feature', column_type: 'Categorical', column_missing_values: false },
      { column_name: 'Lug_boot', column_role: 'Feature', column_type: 'Categorical', column_missing_values: false },
      { column_name: 'Safety',   column_role: 'Feature', column_type: 'Categorical', column_missing_values: false },
      { column_name: 'Result',   column_role: 'Target',  column_type: 'Categorical', column_missing_values: false },
    ]
    /** @type {Array<_Types.DataFrameColumnTransform_t>} */
    const dataset_transforms = [
      ...dataset.filter(F_FILTER_Categorical).map(F_MAP_LabelEncoder)
    ]
    const car_target = 'Result'
    const car_encoders_map = DataFrameUtils.DataFrameEncoder(dataframe_original, dataset_transforms)
    dataframe_processed = DataFrameUtils.DataFrameTransform(dataframe_processed, dataset_transforms)

    const car_dataframe_X = dataframe_processed.drop({ columns: [car_target] })
    const car_dataframe_y = dataframe_original[car_target]
    const minMaxScaler = new dfd.MinMaxScaler()
    const car_minMaxScaler = minMaxScaler.fit(car_dataframe_X)
    const car_X = car_minMaxScaler.transform(car_dataframe_X)
    const oneHotEncoder = new dfd.OneHotEncoder()
    const car_oneHotEncoder = oneHotEncoder.fit(car_dataframe_y)
    const car_y = car_oneHotEncoder.transform(car_dataframe_y)
    const labelEncoder = new dfd.LabelEncoder()
    const car_labelEncoder = labelEncoder.fit(car_dataframe_y.values)
    // @ts-ignore
    const car_classes = Object.keys(car_labelEncoder.$labels)

    return [
      {
        is_dataset_upload   : false,
        is_dataset_processed: true,
        path                : path_dataset,
        info                : car_info,
        container_info      : car_container_info,
        csv                 : car_csv,
        dataset_transforms  : dataset_transforms,
        dataframe_original  : dataframe_original,
        dataframe_processed : dataframe_processed,
        data_processed      : {
          dataframe_X       : car_dataframe_X,
          dataframe_y       : car_dataframe_y,
          X                 : car_X,
          y                 : car_y,
          scaler            : car_minMaxScaler,
          encoders          : car_encoders_map,
          column_name_target: car_target,
          classes           : car_classes,
          // @formatter:off
          attributes        : [
            { type: 'label-encoder', name: 'Buying',   options: [{ value: 'vhigh', text: 'vhigh' }, { value: 'high', text: 'high' }, { value: 'med',  text: 'med'  }, { value: 'low',   text: 'low'   } ] },
            { type: 'label-encoder', name: 'Maint',    options: [{ value: 'vhigh', text: 'vhigh' }, { value: 'high', text: 'high' }, { value: 'med',  text: 'med'  }, { value: 'low',   text: 'low'   } ] },
            { type: 'label-encoder', name: 'Doors',    options: [{ value: '2',     text: '2'     }, { value: '3',    text: '3'    }, { value: '4',    text: '4'    }, { value: '5more', text: '5more' } ] },
            { type: 'label-encoder', name: 'Persons',  options: [{ value: '2',     text: '2'     }, { value: '4',    text: '4'    }, { value: 'more', text: 'more' } ] },
            { type: 'label-encoder', name: 'Lug_boot', options: [{ value: 'small', text: 'small' }, { value: 'med', text: 'med'   }, { value: 'big',  text: 'big'  } ] },
            { type: 'label-encoder', name: 'Safety',   options: [{ value: 'low',   text: 'low'   }, { value: 'med', text: 'med'   }, { value: 'high', text: 'high' } ] }
          ],
          // @formatter:on
        }
      }
    ]
  }

  async LOAD_GRAPH_MODEL (callbacks) {
    return await tfjs.loadGraphModel(process.env.REACT_APP_PATH + '/models/00-tabular-classification/car/my-model-car.json', {
      onProgress: callbacks.onProgress,
    })
  }

  async LOAD_LAYERS_MODEL (callbacks) {
    return await tfjs.loadLayersModel(process.env.REACT_APP_PATH + '/models/00-tabular-classification/car/my-model-car.json', {
      onProgress: callbacks.onProgress,
    })
  }

  DEFAULT_LAYERS () {
    return [
      // { units: 10, activation: 'sigmoid' },
      { units: 128, activation: 'relu' },
      { units: 64, activation: 'relu' },
      { units: 32, activation: 'relu' },
      { units: 4, activation: 'softmax' },
    ]
  }

  HTML_EXAMPLE () {
    const prefix = 'datasets-models.0-tabular-classification.car.html-example.'
    return (<>
      <p>
        <Trans i18nKey={prefix + 'text'} /><br />
        <b><Trans i18nKey={prefix + 'items'} /></b>
      </p>
    </>)
  }
}
