// Motor «regression» de los paquetes .n4l: cada conjunto de la tarea preparado como lo usan el entrenador y la página
// del modelo (DatasetProcessed_t): las columnas codificadas que pide el preprocesado, la entrada escalada (min-max) y
// el objetivo tal cual, que es el número que se predice.

import * as dfd from 'danfojs'

import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import type * as _Types from '@core/types'
import type { N4LDataset_t, N4LTaskView_t } from './format'
import type { N4LPackage_t } from './source'
import { datasetFiles, featureColumns, legacyColumns, readN4LCSV, tabularPlan } from './tabularData'
import { N4LError } from './validate'

export async function prepareRegression(pkg: N4LPackage_t, view: N4LTaskView_t<N4LDataset_t>): Promise<_Types.DatasetProcessed_t[]> {
  const { manifest } = pkg
  return Promise.all(view.datasets.map(async (item) => {
    const target = item.columns.find(({ role }) => role === 'Target')
    if (target === undefined) throw new N4LError(manifest.id, [`datasets.${item.id}: falta la columna objetivo (role Target)`])
    const plan = tabularPlan(manifest, view.section, item)
    const dataframe_original = await readN4LCSV(pkg, item.file)
    const dataset = legacyColumns(item, plan.encoded, false)
    const dataset_transforms: _Types.DataFrameColumnTransform_t[] = [
      ...dataset.filter(({ column_name }) => plan.encoded.has(column_name)).map((column) => ({ ...column, column_transform: 'label-encoder' as const })),
      ...dataset.filter(({ column_name }) => plan.dropped.has(column_name)).map((column) => ({ ...column, column_transform: 'drop' as const })),
    ]
    const { dataframe_processed, encoder_map: encoders } = DataFrameUtils.DataFrameTransformAndEncoder(await readN4LCSV(pkg, item.file), dataset_transforms)

    // La entrada, solo las columnas de entrada (sin el objetivo ni los identificadores)
    const features = featureColumns(item, plan)
    const dataframe_X = dataframe_processed.loc({ columns: features }).copy()
    const dataframe_y = dataframe_original[target.name]
    const scaler = new dfd.MinMaxScaler().fit(dataframe_X)
    return {
      is_dataset_upload   : false,
      is_dataset_processed: true,
      ...await datasetFiles(pkg, item),
      dataset,
      dataset_transforms,
      dataframe_original,
      dataframe_processed,
      data_processed      : {
        dataframe_X,
        dataframe_y,
        X                 : plan.scale ? scaler.transform(dataframe_X) : dataframe_X,
        y                 : dataframe_y,
        scaler,
        encoders,
        column_name_target: target.name,
      },
    }
  }))
}
