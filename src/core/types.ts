import * as _dfd from "danfojs"
import * as _tfjs from "@tensorflow/tfjs"
import _I_MODEL_TABULAR_CLASSIFICATION from "@pages/playground/0_TabularClassification/models/_model"
import _I_MODEL_REGRESSION from "@pages/playground/1_Regression/models/_model"
import _I_MODEL_OBJECT_DETECTION from "@pages/playground/2_ObjectDetection/models/_model"
import _I_MODEL_IMAGE_CLASSIFICATION from "@pages/playground/3_ImageClassification/models/_model"
import type MODEL_IRIS from "@pages/playground/0_TabularClassification/models/MODEL_IRIS"
import type MODEL_CAR from "@pages/playground/0_TabularClassification/models/MODEL_CAR"
import type MODEL_LYMPHOGRAPHY from "@pages/playground/0_TabularClassification/models/MODEL_LYMPHOGRAPHY"
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from "@/types/nn-types"

export type BasicPrediction_t = {
  labels: string[]
  data  : Array<any>  
}

export type N4LDataFrameType = string | number | boolean | string[] | number[] | boolean[] | (string | number | boolean)[]

/**
 * Extracts the resolved type of a promise-returning function.
 *
 * @template T - A function type that returns a Promise.
 * @typedef {T extends (...args: any) => Promise<infer R> ? R : any} AsyncReturnType
 */

export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R>
  ? R
  : any

/**
 * @typedef {Object.<string, typeof _I_MODEL_TABULAR_CLASSIFICATION>} MAP_TC_CLASSES_t
 */
export type MAP_TC_CLASSES_t = {
  "IRIS"                          : typeof MODEL_IRIS
  "CAR"                           : typeof MODEL_CAR
  "LYMPHOGRAPHY"                  : typeof MODEL_LYMPHOGRAPHY
  "I_MODEL_TABULAR_CLASSIFICATION": typeof _I_MODEL_TABULAR_CLASSIFICATION
}

/**
 * @typedef {Object.<string, typeof _I_MODEL_REGRESSION>} MAP_LR_CLASSES_t
 */
export type MAP_LR_CLASSES_t = {
  [key: string]: typeof _I_MODEL_REGRESSION
}

/**
 * @typedef {Object.<string, typeof _I_MODEL_OBJECT_DETECTION>} MAP_OD_CLASSES_t
 */
export type MAP_OD_CLASSES_t = {
  [key: string]: typeof _I_MODEL_OBJECT_DETECTION
}

/**
 * @typedef {Object.<string, typeof _I_MODEL_IMAGE_CLASSIFICATION>} MAP_IC_CLASSES_t
 */
export type MAP_IC_CLASSES_t = {
  [key: string]: typeof _I_MODEL_IMAGE_CLASSIFICATION
}

/**
 * @typedef CustomParamsLayerModel_t
 * @property {number} units
 * @property {LayerActivation_t | string} activation
 * @property {boolean} [is_disabled]
 */
export type CustomParamsLayerModel_t = {
  units       : number
  activation  : LayerActivation_t | string | null
  is_disabled?: boolean
}

/**
 * @typedef {'elu'|'hardSigmoid'|'linear'|'relu'|'relu6'|'selu'|'sigmoid'|'softmax'|'softplus'|'softsign'|'tanh'|'swish'|'mish'|'gelu'|'gelu_new'} LayerActivation_t
 */
export type LayerActivation_t =
  | "elu"
  | "hardSigmoid"
  | "linear"
  | "relu"
  | "relu6"
  | "selu"
  | "sigmoid"
  | "softmax"
  | "softplus"
  | "softsign"
  | "tanh"
  | "swish"
  | "mish"
  | "gelu"
  | "gelu_new"

export type ClassLayer_t = 'flatten' | 'dense' | 'conv2d' | 'maxPooling2d' | 'dropout' | 'flatten'

/**
 * @typedef Layer_t
 * @property {number} units
 * @property {LayerActivation_t} activation
 * @property {boolean} [is_disabled]
 * @property {'dense'} [type_layer]
 */
export type Layer_t = {
  units       : number
  activation  : LayerActivation_t | string | null
  is_disabled?: boolean
  type_layer? : "dense"
  // FIX 
  // TypeScript error
  _class      : ClassLayer_t
}

/**
 * @typedef {_dfd.DataFrame} DataFrame_t
 * @typedef {_dfd.Series} Series_t
 * @typedef {_dfd.MinMaxScaler} MinMaxScaler_t
 * @typedef {_dfd.StandardScaler} StandardScaler_t
 * @typedef {_dfd.LabelEncoder} LabelEncoder_t
 */
export type DataFrame_t = _dfd.DataFrame
export type Series_t = _dfd.Series
export type MinMaxScaler_t = _dfd.MinMaxScaler
export type StandardScaler_t = _dfd.StandardScaler
export type LabelEncoder_t = _dfd.LabelEncoder

/**
 * @typedef {'standard-scaler'|'min-max-scaler'} ScalerKey_t
 */
export type ScalerKey_t = "standard-scaler" | "min-max-scaler"

/**
 * @typedef {_I_MODEL_TABULAR_CLASSIFICATION} I_MODEL_TABULAR_CLASSIFICATION_t
 * @typedef {_I_MODEL_REGRESSION} I_MODEL_REGRESSION_t
 * @typedef {_I_MODEL_OBJECT_DETECTION} I_MODEL_OBJECT_DETECTION_t
 * @typedef {_I_MODEL_IMAGE_CLASSIFICATION} I_MODEL_IMAGE_CLASSIFICATION_t
 */

export type I_MODEL_TABULAR_CLASSIFICATION_t = typeof _I_MODEL_TABULAR_CLASSIFICATION
export type I_MODEL_REGRESSION_t = typeof _I_MODEL_REGRESSION
export type I_MODEL_OBJECT_DETECTION_t = typeof _I_MODEL_OBJECT_DETECTION
export type I_MODEL_IMAGE_CLASSIFICATION_t = typeof _I_MODEL_IMAGE_CLASSIFICATION

/**
 * @typedef File_t
 * @property {string} title
 * @property {string} url
 */
export type File_t = {
  title: string
  url  : string
}

/**
 * @typedef ErrorTensorShape_match_groups_t
 * @property {string} shape
 * @property {string} size
 * @property {string} tensor_shape_0
 * @property {string} tensor_shape_1
 * @property {string} target_shape
 * @property {string} target_tensor_shape_0
 * @property {string} target_tensor_shape_1
 */
export type ErrorTensorShape_match_groups_t = {
  shape                : string
  size                 : string
  tensor_shape_0       : string
  tensor_shape_1       : string
  target_shape         : string
  target_tensor_shape_0: string
  target_tensor_shape_1: string
}

/**
 * @typedef TimeSeriesPlotsValidConfigResponse_t
 * @property {boolean} isValidConfig_TimeSeries
 * @property {{columns: Array<string>}} config_TimeSeries
 * @property {{column: any, drop: boolean}} index
 */
export type TimeSeriesPlotsValidConfigResponse_t = {
  isValidConfig_TimeSeries: boolean
  config_TimeSeries       : { columns: Array<string> }
  index                   : { column: any; drop: boolean }
}

/**
 * @typedef {'string'|'one-hot-encoder'|'label-encoder'|'int32'|'float32'|'replace_<match>_NaN'|'replace_?_NaN'|'drop_?'|'drop'|'dropNa'|'ignored'} ColumnTransform_t
 */
export type ColumnTransform_t =
  | "string"
  | "one-hot-encoder"
  | "label-encoder"
  | "int32"
  | "float32"
  | `replace_${string}_NaN`
  | `replace_?_NaN`
  | `drop_?`
  | "drop"
  | "dropNa"
  | "ignored"
  // FIX TypeScript error
  | "boolean"
  | "datetime"

/**
 * @typedef {'int32'|'float32'|'string'|'boolean'|'datetime'} DataFrameColumnType_t
 */
export type DataFrameColumnType_t = "int32" | "float32" | "string" | "boolean" | "datetime"

/**
 * @typedef {'Integer'|'Continuous'|'Categorical'|'Binary'|'Date'|'Other'} DatasetColumnType_t
 */
export type DatasetColumnType_t = "Integer" | "Continuous" | "Categorical" | "Binary" | "Date" | "Other"

/**
 * @typedef {'ID'|'Feature'|'Target'} DatasetColumnRole_t
 */
export type DatasetColumnRole_t = "ID" | "Feature" | "Target"

/**
 * @typedef DataFrameColumnNameAndType_t
 * @property {string} column_name
 * @property {DataFrameColumnType_t} column_type
 */
export type DataFrameColumnNameAndType_t = {
  column_name: string
  column_type: DataFrameColumnType_t
}

/**
 * @typedef DataFrameColumnNameTypeEnable_t
 * @property {string} column_name
 * @property {DataFrameColumnType_t} column_type
 * @property {boolean} column_enable
 */
export type DataFrameColumnNameTypeEnable_t = {
  column_name  : string
  column_type  : DataFrameColumnType_t
  column_enable: boolean
}

/**
 * @typedef DatasetColumn_t
 * @property {string} column_name
 * @property {DatasetColumnType_t} column_type
 * @property {DatasetColumnRole_t} column_role
 * @property {boolean} column_missing_values
 * @property {string} [column_missing_values_key]
 *
 * @property {ColumnTransform_t} [column_transform]
 * @property {string} [match]
 */
export type DatasetColumn_t = {
  column_name               : string
  column_type               : DatasetColumnType_t
  column_role               : DatasetColumnRole_t
  column_missing_values     : boolean
  column_missing_values_key?: string
  column_transform?         : ColumnTransform_t
  match?                    : string
}

/**
 * @typedef {DatasetColumn_t[]} Dataset_t
 */
export type Dataset_t = Array<{
  column_name               : string
  column_type               : DatasetColumnType_t
  column_role               : DatasetColumnRole_t
  column_missing_values     : boolean
  column_missing_values_key?: string
  column_transform?         : ColumnTransform_t
  match?                    : string
}>

/**
 * @typedef DataFrameColumnTransform_t
 * @property {string} column_name
 * @property {ColumnTransform_t} column_transform
 * @property {DatasetColumnType_t} [column_type]
 * @property {string} [match]
 */
export type DataFrameColumnTransform_t = {
  column_name     : string
  column_transform: ColumnTransform_t
  column_type?    : DatasetColumnType_t
  match?          : string
}

/**
 * @typedef DataFrameColumnTransformEnable_t
 * @property {boolean} column_enable
 * @property {DataFrameColumnType_t} [column_type]
 * @property {string} column_name
 * @property {ColumnTransform_t} column_transform
 * @property {string} [match]
 */
export type DataFrameColumnTransformEnable_t = {
  column_enable   : boolean
  column_type     : DataFrameColumnType_t
  column_name     : string
  column_transform: ColumnTransform_t
  match?          : string
}

/**
 *
 * @typedef DataframePlotConfig_t
 * @property {string} PLOT_ENABLE
 * @property {string[]} LIST_OF_AVAILABLE_PLOTS
 * @property {{y_axis: string, x_axis: string, title: string}} LAYOUT
 * @property {string[]} COLUMNS
 *
 * @property {any} BAR_CHARTS
 * @property {any} BOX_PLOTS
 * @property {any} HISTOGRAMS
 * @property {any} LINE_CHARTS
 * @property {{config: {labels: string}}} PIE_CHARTS
 * @property {{config: {x: string, y: string}}} SCATTER_PLOTS
 * @property {{config: {index: string}}} TIME_SERIES_PLOTS
 * @property {any} VIOLIN_PLOTS
 * @property {{config: {x: string, y: string}}} _DEFAULT_
 */
export type DataframePlotConfig_t = {
  PLOT_ENABLE            : string
  LIST_OF_AVAILABLE_PLOTS: string[]
  LAYOUT                 : { y_axis: string; x_axis: string; title: string }
  COLUMNS                : string[]
  BAR_CHARTS             : any
  BOX_PLOTS              : any
  HISTOGRAMS             : any
  LINE_CHARTS            : any
  PIE_CHARTS             : { config: { labels: string } }
  SCATTER_PLOTS          : { config: { x: string; y: string } }
  TIME_SERIES_PLOTS      : { config: { index: string } }
  VIOLIN_PLOTS           : any
  _DEFAULT_              : { config: { x: string; y: string } }
}

/**
 * @typedef CustomPreprocessDataset_t
 * @property {string} column_name
 * @property {ColumnTransform_t} column_transform
 */
export type CustomPreprocessDataset_t = {
  column_name     : string
  column_transform: ColumnTransform_t
}

/**
 * @typedef ConfigLayoutPlots_t
 * @property {string} title
 * @property {string} x_axis
 * @property {string} y_axis
 */
export type ConfigLayoutPlots_t = {
  title : string
  x_axis: string
  y_axis: string
}

/**
 * @typedef DataFrameColumnTypeTransform_t
 * @property {'drop'|'ignore'|'int32'|'float32'|'label-encoder'} type
 * @property {string} name
 * @property {Array<{value: string, text: string}>} options
 */
export type DataFrameColumnTypeTransform_t = {
  type   : "drop" | "ignore" | "int32" | "float32" | "label-encoder"
  name   : string
  options: Array<{ value: string; text: string }>
}

/**
 * @typedef EncoderObject_t
 * @property {'label-encoder' | 'one-hot-encoder'} type
 * @property {_dfd.LabelEncoder | _dfd.OneHotEncoder} encoder
 */
export type EncoderObject_t = {
  type   : "label-encoder" | "one-hot-encoder"
  encoder: _dfd.LabelEncoder | _dfd.OneHotEncoder
}

/**
 * @typedef {Object.<string, EncoderObject_t>} EncoderMap_t - K: Column name, V: EncoderObject_t
 */
export type EncoderMap_t = {
  [key: string]: {
    type   : "label-encoder" | "one-hot-encoder"
    encoder: _dfd.LabelEncoder | _dfd.OneHotEncoder
  }
}

/**
 * @typedef DataProcessed_t
 * @property {boolean} [missing_values]
 * @property {string} column_name_target
 * @property {string[]} [classes]
 * @property {EncoderMap_t} encoders
 * @property {{type: string; name: string}[]} [attributes] [Array of attribute (column names and their types)]
 * @property {MinMaxScaler_t|StandardScaler_t} scaler
 * @property {DataFrame_t} dataframe_X [Before scaling and encoding]
 * @property {DataFrame_t|Series_t} dataframe_y [Before scaling and encoding]
 * @property {DataFrame_t} X [After scaling and encoding]
 * @property {DataFrame_t|Series_t} y [After scaling and encoding]
 */
export type DataProcessed_t = {
  missing_values?   : boolean
  column_name_target: string
  classes?          : string[]
  encoders: {
    [key: string]: {
      type   : "label-encoder" | "one-hot-encoder"
      encoder: _dfd.LabelEncoder | _dfd.OneHotEncoder
    }
  }
  attributes?: Array<{type: string; name: string, options: Array<{value: string; text: string}>}>
  scaler     : _dfd.MinMaxScaler | _dfd.StandardScaler
  dataframe_X: _dfd.DataFrame
  dataframe_y: _dfd.DataFrame | _dfd.Series
  X          : _dfd.DataFrame
  y          : _dfd.DataFrame | _dfd.Series
}

/**
 * @typedef DatasetProcessed_t
 * @property {boolean} is_dataset_processed
 * @property {boolean} is_dataset_upload
 * @property {string} path
 * @property {string} info
 * @property {string} container_info
 * @property {string} csv
 * @property {Dataset_t} dataset
 * @property {DataFrameColumnTransform_t[]} dataset_transforms
 * @property {DataFrame_t} dataframe_original
 * @property {DataFrame_t} dataframe_processed
 * @property {DataProcessed_t} [data_processed] - Data processed
 */
export type DatasetProcessed_t = {
  is_dataset_processed: boolean
  is_dataset_upload   : boolean
  path                : string
  info                : string
  container_info      : string
  csv                 : string
  dataset             : Dataset_t
  dataset_transforms  : DataFrameColumnTransform_t[]
  dataframe_original  : _dfd.DataFrame
  dataframe_processed : _dfd.DataFrame
  data_processed?     : DataProcessed_t
}

// ================================ TABULAR CLASSIFICATION

/**
 * @typedef TabularClassificationPredictionBar_t
 * @property {Array<any>} classes
 * @property {Array<any>} labels
 * @property {Array<any>} data
 */
export type TabularClassificationPredictionBar_t = {
  classes: Array<any>
  labels : Array<any>
  data   : Array<any>
}

/**
 * @typedef TabularClassificationGeneratedModel_t
 * @property {number} [idMODEL]
 * @property {any} [TARGET_SET_CLASSES]
 * @property {any} [DATA_SET_CLASSES]
 * @property {_tfjs.Sequential} model
 * @property {_tfjs.History} history
 * @property {number} learningRate
 * @property {number} testSize
 * @property {number} numberOfEpoch
 * @property {Array<{units: number, activation: string | LayerActivation_t}>} layerList
 * @property {string} idOptimizer
 * @property {string} idLoss
 * @property {string} idMetrics
 */
export type TabularClassificationGeneratedModel_t = {
  idMODEL?           : number
  TARGET_SET_CLASSES?: any
  DATA_SET_CLASSES?  : any
  model              : _tfjs.Sequential
  history            : _tfjs.History
  learningRate       : number
  testSize           : number
  numberOfEpoch      : number
  layerList          : Array<Layer_t>
  idOptimizer        : IdOptimizer_t
  idLoss             : IdLoss_t
  idMetrics          : IdMetric_t
}

// ================================ REGRESSION

// =============================== IMAGE CLASSIFICATION
export type ImageClassificationGeneratedModel_t = {
  idMODEL?: number
  model   : _tfjs.Sequential
  history : _tfjs.History
  params: {
    learning_rate  : number
    test_size      : number
    n_epochs       : number
    layers         : Layer_t[]
    id_optimizer   : IdOptimizer_t
    id_loss        : IdLoss_t | IdMetric_t
    id_metrics_list: Array<IdLoss_t | IdMetric_t>
  }
}

/**
 * @typedef Prediction_t
 * @property {_dfd.DataFrame} dataframe
 */
export type Prediction_t = {
  dataframe: _dfd.DataFrame
}

/**
 * @typedef StatePrediction_t
 * @property {any[]} input_0_raw - Incluye el target
 * @property {_dfd.DataFrame} input_1_dataframe_original
 * @property {_dfd.DataFrame} input_1_dataframe_processed
 * @property {_dfd.DataFrame} input_2_dataframe_encoding
 * @property {_dfd.DataFrame} input_3_dataframe_scaling
 * @property {any[]} result
 */
export type StatePrediction_t = {
  input_0_raw                : Array<any>
  input_1_dataframe_original : _dfd.DataFrame
  input_1_dataframe_processed: _dfd.DataFrame
  input_2_dataframe_encoding : _dfd.DataFrame
  input_3_dataframe_scaling  : _dfd.DataFrame
  result                     : Array<any>
}

/**
 * @typedef CustomParamsFeaturesSelector_t
 * @property {Set<string>} X_features
 * @property {string} Y_target
 */
export type CustomParamsFeaturesSelector_t = {
  X_features: Set<string>
  Y_target  : string
}

/**
 * @typedef CustomParamsTrainModel_t
 * @property {number} learning_rate
 * @property {number} n_of_epochs
 * @property {number} test_size
 * @property {IdOptimizer_t} id_optimizer
 * @property {IdLoss_t} id_loss
 * @property {Array<IdMetric_t>} list_id_metrics
 */
export type CustomParamsTrainModel_t = {
  learning_rate  : number
  n_of_epochs    : number
  test_size      : number
  id_optimizer   : IdOptimizer_t
  id_loss        : IdLoss_t
  list_id_metrics: Array<IdMetric_t>
}

/**
 * @typedef {{x: *, y: *}} Point_t
 */
export type Point_t = {
  x: any
  y: any
}

/**
 * @typedef CustomModel_t
 * @property {_tfjs.Sequential} model
 * @property {string} [model_path]
 */
export type CustomModel_t = {
  model?     : _tfjs.Sequential | _tfjs.LayersModel
  model_path?: string
  X?         : string[]
  y?         : string
}

/**
 * @typedef CustomParams_t
 * @property {Array<CustomParamsLayerModel_t>} params_layers
 * @property {CustomParamsFeaturesSelector_t} params_features
 * @property {CustomParamsTrainModel_t} params_training
 * @property {Array<string>} [params_visor]
 */

export type CustomParams_t = {
  params_layers  : Array<CustomParamsLayerModel_t>
  params_features: CustomParamsFeaturesSelector_t
  params_training: CustomParamsTrainModel_t
  params_visor   : Array<string>
}

/**
 * @typedef CustomModelGenerated_t
 * CustomModel_t
 * @property {_tfjs.Sequential} model
 * @property {_tfjs.History} history
 * CustomParams_t
 * @property {Array<CustomParamsLayerModel_t>} params_layers
 * @property {CustomParamsFeaturesSelector_t} params_features
 * @property {CustomParamsTrainModel_t} params_training
 * @property {DatasetProcessed_t} dataset_processed
 *
 * @property {_dfd.DataFrame} [dataframe]
 */
export type CustomModelGenerated_t = {
  model            : _tfjs.Sequential
  history          : _tfjs.History
  params_layers    : Array<CustomParamsLayerModel_t>
  params_features  : CustomParamsFeaturesSelector_t
  params_training  : CustomParamsTrainModel_t
  dataset_processed: DatasetProcessed_t
  dataframe?       : _dfd.DataFrame
}

/**
 * @typedef StateListDatasetProcessed_t
 * @property {Array<DatasetProcessed_t>} data
 * @property {number} index
 * @property {"select-dataset"} dataset
 */
export type StateListDatasetProcessed_t = {
  data   : Array<DatasetProcessed_t>
  index  : number 
  dataset: "select-dataset" 
}

/**
 * @typedef StateListCustomModel_t
 * @property {Array<CustomModel_t>} data
 * @property {number} index
 * @property {"select-model"} model
 */
export type StateListCustomModel_t = {
  data : Array<CustomModel_t>
  index: number
  model: "select-model"
}

/**
 * TODO
 *
 * @typedef StateInstance_t
 * @property {Array<any>} data
 * @property {number} index
 * @property {"select-instance"} instance
 */
export type StateInstance_t = {
  data    : Array<any>
  index   : number
  instance: "select-instance"
}

// TYPESCRIPT TYPE EXPORTS

/**
 * @typedef JoyrideStep_t
 * @property {string} title
 * @property {string} content
 * @property {string} target
 * @property {'top'|'right'|'bottom'|'left'|'left-start'} placement
 */
export type JoyrideStep_t = {
  title    : string
  content  : string
  target   : string
  placement: "top" | "right" | "bottom" | "left" | "left-start"
}

/**
 * @typedef Joyride_t
 * @property {boolean} run
 * @property {boolean} continuous
 * @property {(data: any) => Promise<void>} [handleJoyrideCallback]
 * @property {(data: any) => Promise<void>} [handleClick_StartJoyride]
 * @property {Array<JoyrideStep_t>} steps
 */

export type Joyride_t = {
  run                      : boolean
  continuous               : boolean
  handleJoyrideCallback?   : (data: any) => Promise<void>
  handleClick_StartJoyride?: (data: any) => Promise<void>
  steps                    : Array<JoyrideStep_t>
}

/**
 * @typedef Joyride_void_t
 * @property {any} [handleClick_StartJoyride]
 */
export type Joyride_void_t = {
  handleClick_StartJoyride?: (data: any) => Promise<void>
}
