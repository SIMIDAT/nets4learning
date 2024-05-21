import * as dfd from 'danfojs'

/**
 * @typedef {Object} DataframePlotConfig_t
 * @property {ConfigLayoutPlots_t} LAYOUT
 * @property {ConfigTimeSeriesPlots_t} TIME_SERIES_PLOTS
 * @property {Array<string>} COLUMNS
 */

/**
 * @typedef {Object} EncoderObject_t
 * @property {'label-encoder' | 'one-hot-encoder'} type
 * @property {dfd.LabelEncoder | dfd.OneHotEncoder} encoder
 */

/**
 * @typedef {Object.<string, EncoderObject_t>} EncoderMap_t
 */

/**
 * @typedef {Object} File_t
 * @property {string} title
 * @property {string} url
 */

/**
 * @typedef {Object} ErrorTensorShape_match_groups_t
 * @property {string} shape
 * @property {string} size
 * @property {string} tensor_shape_0
 * @property {string} tensor_shape_1
 * @property {string} target_shape
 * @property {string} target_tensor_shape_0
 * @property {string} target_tensor_shape_1
 */

/**
 * @typedef {Object} ConfigTimeSeriesPlots_t
 * @property {{config: index}} config
 */

/**
 * @typedef {Object} TimeSeriesPlotsValidConfigResponse_t
 * @property {boolean} isValidConfig_TimeSeries
 * @property {{columns: Array<string>}} config_TimeSeries
 * @property {{column, drop: boolean}} index
 */

/**
 * @typedef {'int32'|'float32'|'string'|'boolean'} ColumnType_t
 */

/**
 * @typedef {Object} DataFrameColumnType_t
 * @property {string} column_name
 * @property {ColumnType_t} column_type
 */

/**
 * @typedef {'one-hot-encoder'|'label-encoder'|'int32'|'float32'|'string'|'replace_?_NaN'|'drop_?'|'drop'|'dropNa'|'dropNa'|'ignored'} ColumnTransform_t
 */

/**
 * @typedef DataFrameColumnTransform_t
 * @property {string} column_name
 * @property {ColumnTransform_t} column_transform
 */

/**
 *
 * @typedef DataframePlotConfig_t
 * @property {string} PLOT_ENABLE
 * @property {string[]} LIST_OF_AVAILABLE_PLOTS
 * @property {{y_axis: string, x_axis: string, title: string}} LAYOUT,
 * @property {string[]} COLUMNS
 *
 * @property {any} BAR_CHARTS
 * @property {any} BOX_PLOTS
 * @property {any} HISTOGRAMS
 * @property {any} LINE_CHARTS
 * @property {{config: {labels: string}}} PIE_CHARTS
 * @property {any} SCATTER_PLOTS
 * @property {{config: {index: string}}} TIME_SERIES_PLOTS
 * @property {any} VIOLIN_PLOTS
 * @property {{config: {x: string, y: string}}} _DEFAULT_
 */

/**
 * @typedef CustomPreprocessDataset_t
 * @property {string} column_name
 * @property {string} column_transform
 */

/**
 * @typedef {Object} ConfigLayoutPlots_t
 * @property {string} title
 * @property {string} x_axis
 * @property {string} y_axis
 */

