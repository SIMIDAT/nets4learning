import * as dfd from 'danfojs'

import { VERBOSE } from '@/CONSTANTS'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import * as _Types from '@core/types'
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'
import N4LDatasetProcessForm, { type DatasetProcessPlan_t } from '@components/dataframe/N4LDatasetProcessForm'

/**
 * Procesa el conjunto de datos subido para clasificar (N4LDatasetProcessForm pone la interfaz): las columnas elegidas,
 * codificadas y escaladas, son la entrada (X); la clase se codifica en one-hot (y).
 */
export default function TabularClassificationDatasetProcessForm() {
  const { datasets, setDatasets } = useTabularClassificationContext()
  const datasetSelected = datasets.datasets[datasets.index]

  const handleProcess = ({ target, scaler: typeScaler, transforms }: DatasetProcessPlan_t) => {
    const { dataframe_original } = datasetSelected
    let dataframe_processed = DataFrameUtils.DataFrameDeepCopy(dataframe_original)

    const encoders_map = DataFrameUtils.DataFrameEncoder(dataframe_original, transforms)
    dataframe_processed = DataFrameUtils.DataFrameTransform(dataframe_processed, transforms)
    const dataframe_X = dataframe_processed.drop({ columns: [target] })
    const dataframe_y = dataframe_original[target]

    const labelEncoder = new dfd.LabelEncoder()
    const dataset_labelEncoder = labelEncoder.fit(dataframe_y.values)
    const classes = DataFrameUtils.LabelEncoderClasses(dataset_labelEncoder)

    // Las columnas de entrada, para el formulario de clasificar: las categóricas con sus valores posibles
    const attributes = transforms
      .filter(({ column_name, column_transform }) => column_transform !== 'drop' && column_name !== target)
      .map(({ column_name, column_transform }) => {
        if (column_transform !== 'label-encoder') return { type: column_transform, name: column_name }
        // Con label-encoder, DataFrameEncoder crea siempre un LabelEncoder
        const encoder = encoders_map[column_name].encoder as dfd.LabelEncoder
        return { type: column_transform, name: column_name, options: Object.keys(encoder.classes).map((label) => ({ value: label, text: label })) }
      })

    const scaler = (typeScaler === 'min-max-scaler') ? new dfd.MinMaxScaler() : new dfd.StandardScaler()
    scaler.fit(dataframe_X)
    const X = scaler.transform(dataframe_X)

    const oneHotEncoder = new dfd.OneHotEncoder()
    oneHotEncoder.fit(dataframe_y)
    const y = oneHotEncoder.transform(dataframe_y)

    const data_processed: _Types.DataProcessed_t = {
      dataframe_X       : dataframe_X,
      dataframe_y       : dataframe_y,
      column_name_target: target,
      encoders          : encoders_map,
      scaler            : scaler,
      classes           : classes,
      attributes        : attributes,
      X                 : X,
      y                 : y,
    }

    setDatasets((prevDatasets) => ({
      ...prevDatasets,
      datasets: prevDatasets.datasets.map((_dataset, _index) => (prevDatasets.index === _index
        ? { ..._dataset, is_dataset_processed: true, dataframe_processed, dataset_transforms: transforms, data_processed }
        : _dataset)),
    }))
  }

  const { data_processed } = datasetSelected
  const processed = datasetSelected.is_dataset_processed && data_processed
    ? { dataframe: datasetSelected.dataframe_processed, X: data_processed.X, target: data_processed.column_name_target, transforms: datasetSelected.dataset_transforms ?? [] }
    : null

  if (VERBOSE) console.debug('render TabularClassificationDatasetForm')
  return <N4LDatasetProcessForm kind={'classification'} dataframe={datasetSelected.dataframe_original} processed={processed} onProcess={handleProcess} />
}
