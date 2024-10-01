// http://eio.usc.es/eipc1/BASE/BASEMASTER/FORMULARIOS-PHP-DPTO/MATERIALES/Mat_50140128_RegresionMultiple.pdf
import * as dfd from 'danfojs'
import * as _Types from '@core/types'


/**
 * 
 * @param {_Types.DatasetProcessed_t} dataset_processed 
 * @param {number} [index_row=0] 
 * @returns {_Types.StatePrediction_t}
 */
export function TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION (dataset_processed, index_row = 0) {

  const {dataframe_original, dataframe_processed, data_processed} = dataset_processed  

  const _dataframe_original = dataframe_original.copy()
  const _dataframe_processed = dataframe_processed.copy()
  const _dataframe_X = data_processed.dataframe_X.copy()
  const _X = data_processed.X.copy()

  // @ts-ignore
  const input_raw = Array.from(_dataframe_original.values[index_row])

  const prediction_input_original = _dataframe_original.values[index_row]
  const prediction_input_processed = _dataframe_processed.values[index_row]
  const prediction_input_dataframe_X = _dataframe_X.values[index_row]
  const prediction_input_X = _X.values[index_row]

  const df_void_input_original = new dfd.DataFrame([], { columns: _dataframe_original.columns, dtypes: _dataframe_original.dtypes })
  const df_void_input_processed = new dfd.DataFrame([], { columns: _dataframe_processed.columns, dtypes: _dataframe_original.dtypes })
  const df_void_dataframe_X = new dfd.DataFrame([], { columns: _dataframe_X.columns, dtypes: _dataframe_X.dtypes })
  const df_void_X = new dfd.DataFrame([], { columns: _X.columns, dtypes: _X.dtypes })

  // @ts-ignore
  const new_df_original = df_void_input_original.append([prediction_input_original], [0])
  // @ts-ignore
  const new_df_processed = df_void_input_processed.append([prediction_input_processed], [0])
  // @ts-ignore
  const new_df_dataframe_X = df_void_dataframe_X.append([prediction_input_dataframe_X], [0])
  // @ts-ignore
  const new_df_X = df_void_X.append([prediction_input_X], [0])

  return {
    input_0_raw                : input_raw,
    input_1_dataframe_original : new_df_original.copy(),
    input_1_dataframe_processed: new_df_processed.copy(),
    input_2_dataframe_encoding : new_df_dataframe_X.copy(),
    input_3_dataframe_scaling  : new_df_X.copy(),
    result                     : []
  }
}