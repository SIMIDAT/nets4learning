import { Trans } from 'react-i18next'
import * as tf from '@tensorflow/tfjs'
import * as dfd from 'danfojs'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import I_MODEL_TABULAR_CLASSIFICATION from './_model'

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
    const dataset_path = process.env.REACT_APP_PATH + '/models/00-tabular-classification/iris/'
    const dataframe_original = await dfd.readCSV(dataset_path + 'iris.csv')
    let dataframe_processed = await dfd.readCSV(dataset_path + 'iris.csv')

    const dataset_transforms = [
      { column_transform: 'label-encoder', column_name: 'class' },
    ]
    const encoders_map = DataFrameUtils.DataFrameEncoder(dataframe_original, dataset_transforms)
    dataframe_processed = DataFrameUtils.DataFrameTransform(dataframe_processed, dataset_transforms)

    const column_name_target = 'class'
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
        info                : 'iris.names',
        csv                 : 'iris.csv',
        dataframe_original  : dataframe_original,
        dataframe_processed : dataframe_processed,
        dataset_transforms  : dataset_transforms,
        data_processed      : {
          X                 : X,
          y                 : y,
          missing_values    : false,
          missing_value_key : '',
          encoders          : encoders_map,
          scaler            : scaler,
          column_name_target: column_name_target,
          classes           : classes,
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
    return await tf.loadGraphModel(process.env.REACT_APP_PATH + '/models/00-tabular-classification/iris/my-model-iris.json', {
      onProgress: callbacks.onProgress
    })
  }

  async LOAD_LAYERS_MODEL (callbacks) {
    return tf.loadLayersModel(process.env.REACT_APP_PATH + '/models/00-tabular-classification/iris/my-model-iris.json', {
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
