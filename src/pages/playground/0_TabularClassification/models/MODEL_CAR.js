import React from 'react'
import * as tf from '@tensorflow/tfjs'
import { Trans } from 'react-i18next'
import * as dfd from 'danfojs'
import I_MODEL_TABULAR_CLASSIFICATION from './_model'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'

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
    Buying: 'vhigh',
    Maint: 'vhigh',
    Doors: '2',
    Persons: '2',
    Lug_boot: 'small',
    Safety: 'low'
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
    const dataset_path = process.env.REACT_APP_PATH + '/models/00-tabular-classification/car/'
    const dataframe_original = await dfd.readCSV(dataset_path + 'car.csv')
    let dataframe_processed = await dfd.readCSV(dataset_path + 'car.csv')
    // @formatter:off
    const dataset_transforms = [
      {  column_transform: 'label-encoder', column_name: 'Buying' },
      {  column_transform: 'label-encoder', column_name: 'Maint' },
      {  column_transform: 'label-encoder', column_name: 'Doors' },
      {  column_transform: 'label-encoder', column_name: 'Persons' },
      {  column_transform: 'label-encoder', column_name: 'Lug_boot' },
      {  column_transform: 'label-encoder', column_name: 'Safety' },
      {  column_transform: 'label-encoder', column_name: 'Result' },
    ]
    // @formatter:on
    const column_name_target = 'Result'
    const encoders_map = DataFrameUtils.DataFrameEncoder(dataframe_original, dataset_transforms)
    dataframe_processed = DataFrameUtils.DataFrameTransform(dataframe_processed, dataset_transforms)

    const dataframe_X = dataframe_processed.drop({ columns: [column_name_target] })
    const dataframe_y = dataframe_original[column_name_target]

    const scaler = new dfd.MinMaxScaler()
    scaler.fit(dataframe_X)
    const X = scaler.transform(dataframe_X)

    const oneHotEncoder = new dfd.OneHotEncoder()
    oneHotEncoder.fit(dataframe_y)
    const y = oneHotEncoder.transform(dataframe_y)

    const label_encoder_y = new dfd.LabelEncoder()
    label_encoder_y.fit(dataframe_y.values)
    const classes = Object.keys(label_encoder_y.$labels)

    return [
      {
        is_dataset_upload   : false,
        is_dataset_processed: true,
        path                : dataset_path,
        info                : 'car.names',
        csv                 : 'car.csv',
        dataframe_original  : dataframe_original,
        dataset_transforms  : dataset_transforms,
        dataframe_processed : dataframe_processed,
        data_processed      : {
          X                 : X,
          y                 : y,
          missing_values    : false,
          missing_value_key : '',
          encoders          : encoders_map,
          scaler            : scaler,
          column_name_target: column_name_target,
          classes           : classes,
          // @formatter:off
          attributes       : [
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
    return await tf.loadGraphModel(process.env.REACT_APP_PATH + '/models/00-tabular-classification/car/my-model-car.json', {
      onProgress: callbacks.onProgress,
    })
  }

  async LOAD_LAYERS_MODEL (callbacks) {
    return tf.loadLayersModel(process.env.REACT_APP_PATH + '/models/00-tabular-classification/car/my-model-car.json', {
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
