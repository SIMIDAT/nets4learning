import * as tf from '@tensorflow/tfjs'
import { Trans } from 'react-i18next'
import I_MODEL_TABULAR_CLASSIFICATION from './_model'
import * as dfd from 'danfojs'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'

export default class MODEL_LYMPHOGRAPHY extends I_MODEL_TABULAR_CLASSIFICATION {
  static KEY = 'LYMPHOGRAPHY'
  static URL = 'https://archive.ics.uci.edu/ml/datasets/Lymphography'
  TITLE = 'datasets-models.0-tabular-classification.lymphography.title'
  i18n_TITLE = 'datasets-models.0-tabular-classification.lymphography.title'
  URL_DATASET = 'https://archive.ics.uci.edu/dataset/63/lymphography'

  // region ATTR
  CLASSES = [
    '00-tc.lymphography.normal find',
    '00-tc.lymphography.metastases',
    '00-tc.lymphography.malign lymph',
    '00-tc.lymphography.fibrosis',
  ]
  TABLE_HEADER = [
    '00-tc.lymphography.lymphatics',
    '00-tc.lymphography.block of affere',
    '00-tc.lymphography.bl. of lymph. c',
    '00-tc.lymphography.bl. of lymph. s',
    '00-tc.lymphography.by pass',
    '00-tc.lymphography.extravasates',
    '00-tc.lymphography.regeneration of',
    '00-tc.lymphography.early uptake in',
    '00-tc.lymphography.lym.nodes dimin',
    '00-tc.lymphography.lym.nodes enlar',
    '00-tc.lymphography.changes in lym.',
    '00-tc.lymphography.defect in node',
    '00-tc.lymphography.changes in node',
    '00-tc.lymphography.changes in stru',
    '00-tc.lymphography.special forms',
    '00-tc.lymphography.dislocation of',
    '00-tc.lymphography.exclusion of no',
    '00-tc.lymphography.no. of nodes in',
    '00-tc.lymphography.Category',
  ]

  DATA_OBJECT = {
    'lymphatics'     : ['1', '2', '3', '4'],
    'block of affere': ['1', '2'],
    'bl. of lymph. c': ['1', '2'],
    'bl. of lymph. s': ['1', '2'],
    'by pass'        : ['1', '2'],
    'extravasates'   : ['1', '2'],
    'regeneration of': ['1', '2'],
    'early uptake in': ['1', '2'],
    'lym.nodes dimin': ['1', '2', '3'],
    'lym.nodes enlar': ['1', '2', '3', '4'],
    'changes in lym.': ['1', '2', '3'],
    'defect in node' : ['1', '2', '3', '4'],
    'changes in node': ['1', '2', '3', '4'],
    'changes in stru': ['1', '2', '3', '4', '5', '6', '7'],
    'special forms'  : ['1', '2', '3'],
    'dislocation of' : ['1', '2'],
    'exclusion of no': ['1', '2'],
    'no. of nodes in': ['1', '2', '3', '4', '5', '6', '7', '8'],
  }
  DATA_DEFAULT = {
    // 4 -> fibrosis
    'lymphatics'     : '3',
    'block of affere': '1',
    'bl. of lymph. c': '1',
    'bl. of lymph. s': '1',
    'by pass'        : '1',
    'extravasates'   : '2',
    'regeneration of': '2',
    'early uptake in': '1',
    'lym.nodes dimin': '3',
    'lym.nodes enlar': '1',
    'changes in lym.': '1',
    'defect in node' : '2',
    'changes in node': '1',
    'changes in stru': '4',
    'special forms'  : '2',
    'dislocation of' : '1',
    'exclusion of no': '1',
    'no. of nodes in': '7',
  }
  DATA_DEFAULT_KEYS = [
    'lymphatics',
    'block of affere',
    'bl. of lymph. c',
    'bl. of lymph. s',
    'by pass',
    'extravasates',
    'regeneration of',
    'early uptake in',
    'lym.nodes dimin',
    'lym.nodes enlar',
    'changes in lym.',
    'defect in node',
    'changes in node',
    'changes in stru',
    'special forms',
    'dislocation of',
    'exclusion of no',
    'no. of nodes in',
  ]
  LIST_EXAMPLES_RESULTS = [
    'normal',
    'metastasis',
    'malign lymph',
    'fibrosis',
  ]
  LIST_EXAMPLES = [
    // Normal
    {
      'lymphatics'     : '1',
      'block of affere': '1',
      'bl. of lymph. c': '1',
      'bl. of lymph. s': '1',
      'by pass'        : '1',
      'extravasates'   : '2',
      'regeneration of': '1',
      'early uptake in': '2',
      'lym.nodes dimin': '1',
      'lym.nodes enlar': '2',
      'changes in lym.': '2',
      'defect in node' : '1',
      'changes in node': '1',
      'changes in stru': '1',
      'special forms'  : '1',
      'dislocation of' : '1',
      'exclusion of no': '1',
      'no. of nodes in': '2'
    },
    // metastasis
    {
      'lymphatics'     : '1',
      'block of affere': '1',
      'bl. of lymph. c': '1',
      'bl. of lymph. s': '1',
      'by pass'        : '1',
      'extravasates'   : '1',
      'regeneration of': '1',
      'early uptake in': '1',
      'lym.nodes dimin': '1',
      'lym.nodes enlar': '1',
      'changes in lym.': '1',
      'defect in node' : '1',
      'changes in node': '1',
      'changes in stru': '1',
      'special forms'  : '1',
      'dislocation of' : '1',
      'exclusion of no': '1',
      'no. of nodes in': '1'
    },
    // malign lymph
    {
      'lymphatics'     : '2',
      'block of affere': '1',
      'bl. of lymph. c': '1',
      'bl. of lymph. s': '1',
      'by pass'        : '1',
      'extravasates'   : '2',
      'regeneration of': '1',
      'early uptake in': '2',
      'lym.nodes dimin': '1',
      'lym.nodes enlar': '3',
      'changes in lym.': '3',
      'defect in node' : '4',
      'changes in node': '2',
      'changes in stru': '7',
      'special forms'  : '3',
      'dislocation of' : '2',
      'exclusion of no': '2',
      'no. of nodes in': '3'
    },
    // fibrosis
    {
      'lymphatics'     : '3',
      'block of affere': '1',
      'bl. of lymph. c': '1',
      'bl. of lymph. s': '1',
      'by pass'        : '1',
      'extravasates'   : '2',
      'regeneration of': '2',
      'early uptake in': '1',
      'lym.nodes dimin': '3',
      'lym.nodes enlar': '1',
      'changes in lym.': '1',
      'defect in node' : '2',
      'changes in node': '1',
      'changes in stru': '4',
      'special forms'  : '2',
      'dislocation of' : '1',
      'exclusion of no': '1',
      'no. of nodes in': '7'
    },
  ]
  // @formatter:off
  FORM             = [
    { type: "label-encoder", name: "lymphatics",       options: [{ value: "1", text: "normal" }, { value: "2", text: "arched" },    { value: "3", text: "deformed" },     { value: "4", text: "displaced" }]},
    { type: "label-encoder", name: "block of affere",  options: [{ value: "1", text: "No" },     { value: "2", text: "2" }]},
    { type: "label-encoder", name: "bl. of lymph. c",  options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "bl. of lymph. s",  options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "by pass",          options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "extravasates",     options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "regeneration of",  options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "early uptake in",  options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "lym.nodes dimin",  options: [{ value: "1", text: "1" },      { value: "2", text: "2" },         { value: "3", text: "3" }]},
    { type: "label-encoder", name: "lym.nodes enlar",  options: [{ value: "1", text: "1" },      { value: "2", text: "2" },         { value: "3", text: "3" },              { value: "4", text: "4" }]},
    { type: "label-encoder", name: "changes in lym.",  options: [{ value: "1", text: "bean" },   { value: "2", text: "oval" },      { value: "3", text: "round" }]},
    { type: "label-encoder", name: "defect in node",   options: [{ value: "1", text: "No" },     { value: "2", text: "lacunar" },   { value: "3", text: "lac. marginal" },  { value: "4", text: "lac. central" }]},
    { type: "label-encoder", name: "changes in node",  options: [{ value: "1", text: "No" },     { value: "2", text: "lacunar" },   { value: "3", text: "lac. marginal" },  { value: "4", text: "lac. central" }]},
    { type: "label-encoder", name: "changes in stru",  options: [{ value: "1", text: "No" },     { value: "2", text: "grainy" },    { value: "3", text: "drop-like" },      { value: "4", text: "coarse" }, { value: "5", text: "diluted" }, { value: "6", text: "reticular" }, { value: "7", text: "stripped" }, { value: "8", text: "faint" }]},
    { type: "label-encoder", name: "special forms",    options: [{ value: "1", text: "No" },     { value: "2", text: "chalices" },  { value: "3", text: "vesicles" }]},
    { type: "label-encoder", name: "dislocation of",   options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "exclusion of no",  options: [{ value: "1", text: "No" },     { value: "2", text: "Yes" }]},
    { type: "label-encoder", name: "no. of nodes in",  options: [{ value: "1", text: "0-9" },    { value: "2", text: "10-19" },     { value: "3", text: "20-29" },          { value: "4", text: "30-39" },  { value: "5", text: "40-49" },  { value: "6", text: "50-59" },      { value: "7", text: "60-69" },    { value: "8", text: "=>70" }]}
  ]
  // @formatter:on
  // endregion

  DESCRIPTION () {
    const prefix = 'datasets-models.0-tabular-classification.lymphography.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text-1'} /></p>
      <details>
        <summary><Trans i18nKey={prefix + 'details-input.title'} /></summary>
        <ol>
          {Array
            .from({ length: 17 })
            .map((v, i) => <li key={i}><Trans i18nKey={prefix + 'details-input.list.' + i} /></li>)}
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-output.title'} /></summary>
        <ol>
          {Array
            .from({ length: 4 })
            .map((v, i) => <li key={i}><Trans i18nKey={prefix + 'details-output.list.' + i} /></li>)}
        </ol>
      </details>
      <details>
        <summary>
          <Trans i18nKey={prefix + 'details-references.title'} />
        </summary>
        <ol>
          <li>
            <a href={this.URL_DATASET}
               target="_blank"
               rel="noreferrer">
              <Trans i18nKey={prefix + 'details-references.list.0'} />
            </a>
          </li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
{`
@misc{misc_lymphography_63,
  author       = {Zwitter,M. and Soklic,M.},
  title        = {{Lymphography}},
  year         = {1988},
  howpublished = {UCI Machine Learning Repository},
  note         = {{DOI}: https://doi.org/10.24432/C54598}
}
`}
        </pre>
      </details>
    </>
  }

  async DATASETS () {
    const dataset_path = process.env.REACT_APP_PATH + '/models/00-tabular-classification/lymphography/'
    const dataframe_original = await dfd.readCSV(dataset_path + 'lymphography.csv')
    let dataframe_processed = await dfd.readCSV(dataset_path + 'lymphography.csv')
    const dataset_transforms = [
      { column_transform: 'label-encoder', column_name: 'lymphatics' },
      { column_transform: 'label-encoder', column_name: 'block of affere' },
      { column_transform: 'label-encoder', column_name: 'bl. of lymph. c' },
      { column_transform: 'label-encoder', column_name: 'bl. of lymph. s' },
      { column_transform: 'label-encoder', column_name: 'by pass' },
      { column_transform: 'label-encoder', column_name: 'extravasates' },
      { column_transform: 'label-encoder', column_name: 'regeneration of' },
      { column_transform: 'label-encoder', column_name: 'early uptake in' },
      { column_transform: 'label-encoder', column_name: 'lym.nodes dimin' },
      { column_transform: 'label-encoder', column_name: 'lym.nodes enlar' },
      { column_transform: 'label-encoder', column_name: 'changes in lym.' },
      { column_transform: 'label-encoder', column_name: 'defect in node' },
      { column_transform: 'label-encoder', column_name: 'changes in node' },
      { column_transform: 'label-encoder', column_name: 'changes in stru' },
      { column_transform: 'label-encoder', column_name: 'special forms' },
      { column_transform: 'label-encoder', column_name: 'dislocation of' },
      { column_transform: 'label-encoder', column_name: 'exclusion of no' },
      { column_transform: 'label-encoder', column_name: 'no. of nodes in' },
      { column_transform: 'label-encoder', column_name: 'class' },
    ]
    const encoders = DataFrameUtils.DataFrameEncoder(dataframe_original, dataset_transforms)
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
        info                : 'lymphography.names',
        csv                 : 'lymphography.csv',
        dataframe_original  : dataframe_original,
        dataset_transforms  : dataset_transforms,
        dataframe_processed : dataframe_processed,
        data_processed      : {
          X                 : X,
          y                 : y,
          missing_values    : false,
          missing_value_key : '',
          encoders          : encoders,
          scaler            : scaler,
          column_name_target: column_name_target,
          classes           : classes,
          attributes        : this.FORM,
        },
      }
    ]
  }

  async LOAD_GRAPH_MODEL (callbacks) {
    return await tf.loadGraphModel(process.env.REACT_APP_PATH + '/models/00-tabular-classification/lymphography/my-model-lymphography.json', {
      onProgress: callbacks.onProgress,
    })
  }

  async LOAD_LAYERS_MODEL (callbacks) {
    return tf.loadLayersModel(process.env.REACT_APP_PATH + '/models/00-tabular-classification/lymphography/my-model-lymphography.json', {
      onProgress: callbacks.onProgress,
    })
  }

  DEFAULT_LAYERS () {
    return [
      { units: 18, activation: 'sigmoid' },
      { units: 10, activation: 'relu' },
      { units: 10, activation: 'relu' },
      { units: 4, activation: 'softmax' },
    ]
  }

  HTML_EXAMPLE () {
    const prefix = 'datasets-models.0-tabular-classification.lymphography.html-example.'
    return <>
      <p>
        <Trans i18nKey={prefix + 'text'} /><br />
        <b><Trans i18nKey={prefix + 'items'} /></b>
      </p>
    </>
  }
}
