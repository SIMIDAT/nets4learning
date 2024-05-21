import * as dfd from 'danfojs'
import { E_PLOTS, LIST_PLOTS } from '@components/_context/CONSTANTS'

// E_PLOTS.LINE_CHARTS
// E_PLOTS.BAR_CHARTS
// E_PLOTS.SCATTER_PLOTS
// E_PLOTS.HISTOGRAMS
// E_PLOTS.PIE_CHARTS
// E_PLOTS.BOX_PLOTS
// E_PLOTS.VIOLIN_PLOTS
// E_PLOTS.TIME_SERIES_PLOTS

export function columnsTimeSeriesValidForIndex (_dataFrameLocal, _columns) {
  return _columns.filter((column) => {
    if (_dataFrameLocal.columns.includes(column)) return _dataFrameLocal[column].unique().shape[0] === _dataFrameLocal.shape[0]
    return false
  })
}

export function isTimeSeriesDataFrameValidForIndex (_dataFrameLocal, _columns) {
  return columnsTimeSeriesValidForIndex(_dataFrameLocal, _columns).length > 0
}

export function listPlotsAvailable (_dataframeLocal, _columns) {
  const list_of_available_plots = []
  for (const plot_id of LIST_PLOTS) {
    let available = true
    if (E_PLOTS.TIME_SERIES_PLOTS === plot_id) {
      available = isTimeSeriesDataFrameValidForIndex(_dataframeLocal, _columns)
    }
    if (available) list_of_available_plots.push(plot_id)
  }
  return list_of_available_plots
}

/**
 *
 * @param {dfd.DataFrame} dataframe
 * @param {DataframePlotConfig_t} dataframePlotConfig
 *
 * @return {TimeSeriesPlotsValidConfigResponse_t}
 */
export function timeSeriesPlotsValidConfig (dataframe, dataframePlotConfig) {
  // const notContainIndexInColumnsToShow = !dataframePlotConfig.COLUMNS.includes(dataframePlotConfig.TIME_SERIES_PLOTS.config.index)
  // const containsIndexInDataframe = dataframe.columns.includes(dataframePlotConfig.TIME_SERIES_PLOTS.config.index)
  // const isValidConfig_TimeSeries = notContainIndexInColumnsToShow && containsIndexInDataframe
  const isValidConfig_TimeSeries = isTimeSeriesDataFrameValidForIndex(dataframe, dataframePlotConfig.COLUMNS)

  const config_TimeSeries = { columns: dataframePlotConfig.COLUMNS }

  const index = { column: dataframePlotConfig.TIME_SERIES_PLOTS.config.index, drop: true }

  return { isValidConfig_TimeSeries, config_TimeSeries, index }
}

/**
 *
 * @param dataframe
 * @param dataframePlotConfig
 * @return {{config_ViolinPlots: {columns: string[]}, isValidConfig_ViolinPlots: boolean}}
 */
export function violinPlotsValidConfig (dataframe, dataframePlotConfig) {
  /** @type {string[]} */
  const valid_columns_to_display = (dataframePlotConfig.COLUMNS).filter((column) => (dataframe[column].dtype !== 'string'))
  const config_ViolinPlots = { columns: valid_columns_to_display }
  const isValidConfig_ViolinPlots = true

  return { isValidConfig_ViolinPlots, config_ViolinPlots }
}

export function pieChartsValidConfig (dataframe, dataframePlotConfig) {
  const isValidConfig_PieCharts = true
  const config_PieCharts = { labels: dataframePlotConfig.PIE_CHARTS.config.labels }
  return { isValidConfig_PieCharts, config_PieCharts }
}

export function lineChartsValidConfig (dataframe, dataframePlotConfig, columnsToShow) {
  const config_LineCharts = {
    columns: columnsToShow,
  }

  const isValidConfig_LineCharts = true
  return { isValidConfig_LineCharts, config_LineCharts }
}

export function TransformArrayToSeriesTensor (series) {
  return new dfd.Series(series).tensor
}

/**
 *
 * @param {dfd.DataFrame} dataframe
 * @param {Array<{column_name: string, column_transform:'label-encoder'|'one-hot-encoder'}>} dataframe_transforms
 * @return {EncoderMap_t}
 */
export function DataFrameEncoder (dataframe, dataframe_transforms) {
  /** @type EncoderMap_t */
  const encoders_map = {}
  for (const { column_transform, column_name } of dataframe_transforms) {
    switch (column_transform) {
      case 'label-encoder': {
        const encoder = new dfd.LabelEncoder()
        const _serie = dataframe[column_name]
        encoder.fit(_serie)
        encoders_map[column_name] = {
          type   : 'label-encoder',
          encoder: encoder,
        }
        break
      }
      case 'one-hot-encoder': {
        const encoder = new dfd.OneHotEncoder()
        const _serie = dataframe[column_name]
        encoder.fit(_serie)
        encoders_map[column_name] = {
          type   : 'label-encoder',
          encoder: encoder,
        }
        break
      }
      default: {
        console.warn('Error, option not valid', { column_transform, column_name })
        break
      }
    }
  }
  return encoders_map
}

/**
 *
 * @param {EncoderMap_t}         encoders_map
 * @param {Object.<string, any>} values_map
 * @param {string[]}             column_name_list
 * @returns {number[]}
 */
export function DataFrameApplyEncoders (encoders_map, values_map, column_name_list) {
  const new_values = []
  for (const column_name of column_name_list) {
    const prev_value = values_map[column_name]
    if (column_name in encoders_map) {
      const new_value = encoders_map[column_name].encoder.transform([prev_value])[0]
      new_values.push(new_value)
    } else {
      new_values.push(prev_value)
    }
  }
  return new_values
}

/**
 *
 * @param {EncoderMap_t} encoders_map
 * @param {Array<string|number>} input_data
 * @param {string[]} column_name_list
 * @return {number[]}
 */
export function DataFrameApplyEncodersVector (encoders_map, input_data, column_name_list) {
  const new_input_vector = []
  for (const [column_index, column_name] of column_name_list.entries()) {
    const prev_value = input_data[column_index]
    if (column_name in encoders_map) {
      const new_value = encoders_map[column_name].encoder.transform([prev_value])[0]
      new_input_vector.push(new_value)
    } else {
      new_input_vector.push(prev_value)
    }
  }
  return new_input_vector
}

/**
 * @param {dfd.DataFrame} dataframe
 * @param {Array<DataFrameColumnTransform_t>} dataframe_transforms
 * @return {dfd.DataFrame}
 */
export function DataFrameTransform (dataframe, dataframe_transforms) {
  const _dataframe = dataframe.copy()
  for (const { column_transform, column_name } of dataframe_transforms) {
    switch (column_transform) {
      case 'one-hot-encoder': {
        const encoder = new dfd.OneHotEncoder()
        encoder.fit(_dataframe[column_name])
        const new_serie = encoder.transform(_dataframe[column_name].values)
        _dataframe.addColumn(column_name, new_serie, { inplace: true })
        break
      }
      case 'label-encoder': {
        const encoder = new dfd.LabelEncoder()
        encoder.fit(_dataframe[column_name])
        const new_serie = encoder.transform(_dataframe[column_name].values)
        _dataframe.addColumn(column_name, new_serie, { inplace: true })
        _dataframe.asType(column_name, 'int32', { inplace: true })
        break
      }
      case 'int32': {
        break
      }
      case 'float32': {
        break
      }
      case 'string': {
        break
      }
      case 'drop_?': {
        console.debug('TODO')
        break
      }
      case 'replace_?_NaN': {
        console.debug('TODO', column_name, _dataframe[column_name])
        const new_serie = _dataframe[column_name].apply((val) => {
          if (val === '?') {
            console.log("FOUND")
            return NaN;
          }
          return val;
        })
        _dataframe.addColumn(column_name, new_serie, { inplace: true })
        break
      }
      case 'drop': {
        _dataframe.drop({ columns: [column_name], inplace: true })
        break
      }
      case 'dropNa': {
        _dataframe.dropNa({ axis: 1, inplace: true })
        break
      }
      default: {
        console.warn('Error, option not valid', { column_transform, column_name })
      }
    }
  }
  return _dataframe
}

/**
 *
 * @param {dfd.DataFrame} dataframe
 * @return {dfd.DataFrame}
 */
export function DataFrameDeepCopy (dataframe) {
  const dataframe_deep_copy_JSON = dfd.toJSON(dataframe, { format: 'row' })
  return new dfd.DataFrame(dataframe_deep_copy_JSON)
}

/**
 * @param {dfd.DataFrame} dataframe
 * @return {Array<Array<string|float32|int32|boolean>>}
 */
export function DataFrameIterRows (dataframe) {
  return dataframe.$data
}
