import * as _dfd from 'danfojs'
import * as _tfjs from '@tensorflow/tfjs'
import _I_MODEL_TABULAR_CLASSIFICATION from '@/pages/playground/0_TabularClassification/models/_model'
import _I_MODEL_REGRESSION from '@/pages/playground/1_Regression/models/_model'
import _I_MODEL_OBJECT_DETECTION from '@/pages/playground/2_ObjectDetection/models/_model'
import _I_MODEL_IMAGE_CLASSIFICATION from '@/pages/playground/3_ImageClassification/models/_model'

/**
 * Extracts the resolved type of a promise-returning function.
 * 
 * @template T - A function type that returns a Promise.
 * @typedef {T extends (...args: any) => Promise<infer R> ? R : any} AsyncReturnType
 */

/**
 * @typedef {Object.<string, typeof _I_MODEL_TABULAR_CLASSIFICATION>} MAP_TC_CLASSES_t
 */

/**
 * @typedef {Object.<string, typeof _I_MODEL_REGRESSION>} MAP_LR_CLASSES_t
 */

/**
 * @typedef {Object.<string, typeof _I_MODEL_OBJECT_DETECTION>} MAP_OD_CLASSES_t
 */

/**
 * @typedef {Object.<string, typeof _I_MODEL_IMAGE_CLASSIFICATION>} MAP_IC_CLASSES_t
 */


/**
 * @typedef CustomParamsLayerModel_t
 * @property {number} units
 * @property {string} activation
 * @property {boolean} [is_disabled]
 */

/**
 * @typedef {_dfd.DataFrame} DataFrame_t
 * @typedef {_dfd.Series} Series_t
 * @typedef {_dfd.MinMaxScaler} MinMaxScaler_t
 * @typedef {_dfd.StandardScaler} StandardScaler_t
 * @typedef {_dfd.LabelEncoder} LabelEncoder_t
*/

/**
 * @typedef {'standard-scaler'|'min-max-scaler'} ScalerKey_t
 */

/**
 * @typedef {_I_MODEL_TABULAR_CLASSIFICATION} I_MODEL_TABULAR_CLASSIFICATION_t
 * @typedef {_I_MODEL_REGRESSION} I_MODEL_REGRESSION_t
 * @typedef {_I_MODEL_OBJECT_DETECTION} I_MODEL_OBJECT_DETECTION_t
 * @typedef {_I_MODEL_IMAGE_CLASSIFICATION} I_MODEL_IMAGE_CLASSIFICATION_t
 */



/**
 * @typedef File_t
 * @property {string} title
 * @property {string} url
 */

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

/**
 * @typedef TimeSeriesPlotsValidConfigResponse_t
 * @property {boolean} isValidConfig_TimeSeries
 * @property {{columns: Array<string>}} config_TimeSeries
 * @property {{column: any, drop: boolean}} index
 */

/**
 * @typedef {'string'|'one-hot-encoder'|'label-encoder'|'int32'|'float32'|'replace_<match>_NaN'|'replace_?_NaN'|'drop_?'|'drop'|'dropNa'|'ignored'} ColumnTransform_t
 */

/**
 * @typedef {'int32'|'float32'|'string'|'boolean'|'datetime'} DataFrameColumnType_t
 */

/**
 * @typedef {'Integer'|'Continuous'|'Categorical'|'Binary'|'Date'|'Other'} DatasetColumnType_t
 */

/**
 * @typedef {'ID'|'Feature'|'Target'} DatasetColumnRole_t
 */

/**
 * @typedef DataFrameColumnNameAndType_t
 * @property {string} column_name
 * @property {DataFrameColumnType_t} column_type
 */

/**
 * @typedef DataFrameColumnNameTypeEnable_t
 * @property {string} column_name
 * @property {DataFrameColumnType_t} column_type
 * @property {boolean} column_enable
 */

/**
 */

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

/**
 * @typedef {DatasetColumn_t[]} Dataset_t
 */

/**
 * @typedef DataFrameColumnTransform_t
 * @property {string} column_name
 * @property {ColumnTransform_t} column_transform
 * @property {DatasetColumnType_t} [column_type]
 * @property {string} [match]
 */

/**
 * @typedef DataFrameColumnTransformEnable_t
 * @property {boolean} column_enable
 * @property {DataFrameColumnType_t} [column_type]
 * @property {string} column_name
 * @property {ColumnTransform_t} column_transform
 * @property {string} [match]
 */

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

/**
 * @typedef CustomPreprocessDataset_t
 * @property {string} column_name
 * @property {ColumnTransform_t} column_transform
 */

/**
 * @typedef ConfigLayoutPlots_t
 * @property {string} title
 * @property {string} x_axis
 * @property {string} y_axis
 */

/**
 * @typedef DataFrameColumnTypeTransform_t
 * @property {'drop'|'ignore'|'int32'|'float32'|'label-encoder'} type
 * @property {string} name
 * @property {Array<{value: string, text: string}>} options
 */

/**
 * @typedef EncoderObject_t
 * @property {'label-encoder' | 'one-hot-encoder'} type
 * @property {_dfd.LabelEncoder | _dfd.OneHotEncoder} encoder
 */

/**
 * @typedef {Object.<string, EncoderObject_t>} EncoderMap_t - K: Column name, V: EncoderObject_t
 */

/**
 * @typedef DataProcessed_t
 * @property {boolean} [missing_values]
 * @property {string} column_name_target
 * @property {string[]} [classes]
 * @property {EncoderMap_t} encoders
 * @property {any[]} [attributes]
 * @property {MinMaxScaler_t|StandardScaler_t} scaler
 * @property {DataFrame_t} dataframe_X [Before scaling and encoding]
 * @property {DataFrame_t|Series_t} dataframe_y [Before scaling and encoding]
 * @property {DataFrame_t} X [After scaling and encoding]
 * @property {DataFrame_t|Series_t} y [After scaling and encoding]
 */

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


// ================================ TABULAR CLASSIFICATION


/**
 * @typedef TabularClassificationPredictionBar_t
 * @property {Array<any>} classes
 * @property {Array<any>} labels
 * @property {Array<any>} data
 * 
 */

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
 * @property {Array<{units: number, activation: string}>} layerList
 * @property {string} idOptimizer
 * @property {string} idLoss
 * @property {string} idMetrics
 */



// ================================ REGRESSION

/**
 * @typedef Prediction_t
 * @property {_dfd.DataFrame} dataframe
 */

/**
 * @typedef StatePrediction_t
 * @property {any[]} input_0_raw - Incluye el target
 * @property {_dfd.DataFrame} input_1_dataframe_original
 * @property {_dfd.DataFrame} input_1_dataframe_processed
 * @property {_dfd.DataFrame} input_2_dataframe_encoding
 * @property {_dfd.DataFrame} input_3_dataframe_scaling
 * @property {any[]} result
 */


/**
 * @typedef CustomParamsFeaturesSelector_t
 * @property {Set<string>} X_features
 * @property {string} Y_target
 */

/**
 * @typedef CustomParamsTrainModel_t
 * @property {number} learning_rate
 * @property {number} n_of_epochs
 * @property {number} test_size
 * @property {string} id_optimizer
 * @property {string} id_loss
 * @property {Array<string>} list_id_metrics
 */

/**
 * @typedef {{x: *, y: *}} Point_t
 */

/**
 * @typedef CustomModel_t
 * @property {_tfjs.Sequential} model
 * @property {string} [model_path]
 */

/**
 * @typedef CustomParams_t
 * @property {Array<CustomParamsLayerModel_t>} params_layers
 * @property {CustomParamsFeaturesSelector_t} params_features
 * @property {CustomParamsTrainModel_t} params_training
 * @property {Array<string>} [params_visor]
 */

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

/**
 * @typedef StateListDatasetProcessed_t
 * @property {Array<DatasetProcessed_t>} data
 * @property {number|"select-dataset"} index
 */

/**
 * @typedef StateListCustomModel_t
 * @property {Array<CustomModel_t>} data
 * @property {number|"select-model"} index
 */

/**
 * TODO
 * 
 * @typedef StateInstance_t
 * @property {Array<any>} data
 * @property {number|"select-instance"} index
 */

/**
 * @typedef JoyrideStep_t
 * @property {string} title
 * @property {string} content
 * @property {string} target
 * @property {'top'|'right'|'bottom'|'left'|'left-start'} placement
 */


/**
 * @typedef Joyride_t
 * @property {boolean} run
 * @property {boolean} continuous
 * @property {(data: any) => Promise<void>} [handleJoyrideCallback]
 * @property {(data: any) => Promise<void>} [handleClick_StartJoyride]
 * @property {Array<JoyrideStep_t>} steps
 */

  /**
   * @typedef Joyride_void_t
   * @property {any} [handleClick_StartJoyride]
   */