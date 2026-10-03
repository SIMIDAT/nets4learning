import * as dfd from 'danfojs'

import * as _Types from '@core/types'
import { DEFAULT_SELECTOR_DATASET_INDEX, VERBOSE } from '@/CONSTANTS'
import { useRegressionContext } from '@context/useRegressionContext'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import N4LDatasetProcessForm, { type DatasetProcessPlan_t } from '@components/dataframe/N4LDatasetProcessForm'

/**
 * Procesa el conjunto de datos subido para la regresión (N4LDatasetProcessForm pone la interfaz): las columnas
 * elegidas, codificadas y escaladas, son la entrada (X); el número que se predice se queda como está (y).
 */
export default function RegressionDatasetProcessForm() {
  const { datasets, setDatasets } = useRegressionContext()
  const datasetSelected = datasets.index === DEFAULT_SELECTOR_DATASET_INDEX ? undefined : datasets.data[datasets.index as number]

  const handleProcess = ({ target, scaler: typeScaler, transforms }: DatasetProcessPlan_t) => {
    if (datasetSelected === undefined) {
      console.error('DEFAULT_SELECTOR_DATASET_INDEX')
      return
    }
    const { dataframe_original } = datasetSelected
    const keptColumns = new Set(transforms.filter(({ column_transform }) => column_transform !== 'drop').map(({ column_name }) => column_name))

    const new_dataset: _Types.DatasetColumn_t[] = dataframe_original.columns
      .map((column_name, index) => ({
        column_name,
        column_type          : DataFrameUtils.DataFrameColumnType_To_DatasetColumnType(dataframe_original.dtypes[index]),
        column_role          : column_name === target ? 'Target' : 'Feature',
        column_missing_values: false,
      } as _Types.DatasetColumn_t))
      .filter(({ column_name }) => keptColumns.has(column_name))

    // Siempre desde los datos originales: si se vuelve a procesar, las columnas descartadas antes también cuentan
    const dataframe_encoder = DataFrameUtils.DataFrameTransformAndEncoder(DataFrameUtils.DataFrameDeepCopy(dataframe_original), transforms)
    const dataframe_processed = dataframe_encoder.dataframe_processed
    const new_dataframe_X = dataframe_processed.drop({ columns: [target] }).copy()
    const new_dataframe_y = dataframe_original[target]

    const scaler = typeScaler === 'standard-scaler' ? new dfd.StandardScaler() : new dfd.MinMaxScaler()
    const new_scaler = scaler.fit(new_dataframe_X)
    const new_X = new_scaler.transform(new_dataframe_X)

    setDatasets((prevState) => {
      if (prevState.index === DEFAULT_SELECTOR_DATASET_INDEX) return prevState
      const previous = prevState.data[prevState.index as number]
      const newDatasetProcessed: _Types.DatasetProcessed_t = {
        is_dataset_upload   : true,
        is_dataset_processed: true,
        dataframe_original  : dataframe_original,
        dataframe_processed : dataframe_processed,
        dataset             : new_dataset,
        dataset_transforms  : transforms,
        path                : previous.path,
        csv                 : previous.csv,
        info                : previous.info,
        container_info      : previous.container_info,
        data_processed      : {
          dataframe_X       : new_dataframe_X,
          dataframe_y       : new_dataframe_y,
          X                 : new_X,
          y                 : new_dataframe_y,
          encoders          : dataframe_encoder.encoder_map,
          scaler            : new_scaler,
          column_name_target: target,
        },
      }
      // En su sitio, como en la clasificación (antes se añadía otra copia y el selector de fichero salía repetido)
      return { ...prevState, data: prevState.data.map((dataset, index) => (index === prevState.index ? newDatasetProcessed : dataset)) }
    })
  }

  if (datasetSelected === undefined) return null
  const { data_processed } = datasetSelected
  const processed = datasetSelected.is_dataset_processed && data_processed
    ? { dataframe: datasetSelected.dataframe_processed, X: data_processed.X, target: data_processed.column_name_target, transforms: datasetSelected.dataset_transforms ?? [] }
    : null

  if (VERBOSE) console.debug('render RegressionDatasetProcessForm')
  return <N4LDatasetProcessForm kind={'regression'} dataframe={datasetSelected.dataframe_original} processed={processed} onProcess={handleProcess} />
}
