// Motor «tabular-classification» de los paquetes .n4l: del manifiesto, el conjunto de datos preparado como lo usan el
// entrenador y la página del modelo (DatasetProcessed_t), el formulario para predecir y qué salida es cada clase.

import * as dfd from 'danfojs'
import type { TFunction } from 'i18next'

import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import type * as _Types from '@core/types'
import { n4lLabelKey, type N4LDataset_t, type N4LTask_t, type N4LTaskView_t } from './format'
import type { N4LPackage_t } from './source'
import { datasetFiles, featureColumns, legacyColumns, readN4LCSV, tabularPlan } from './tabularData'
import { N4LError } from './validate'

/** Campo del formulario de predicción (el de las clases de modelos de clasificación tabular) */
export type N4LTabularField_t =
  | { type: 'int32' | 'float32', name: string }
  | { type: 'label-encoder', name: string, options: Array<{ value: string, text: string }> }

/** El formulario para predecir: un campo por columna de entrada (desplegable si tiene valores fijos); `ns`: sus textos */
export function tabularFields({ dataset }: N4LTaskView_t<N4LDataset_t>, ns: string, t: TFunction): N4LTabularField_t[] {
  return dataset.columns.filter(({ role }) => role === 'Feature').map((column): N4LTabularField_t => {
    if (column.options !== undefined) {
      const key = n4lLabelKey(column.name)
      const options = column.options.map((value) => ({ value, text: t(`${ns}:options.${key}.${n4lLabelKey(value)}`, { defaultValue: value }) }))
      return { type: 'label-encoder', name: column.name, options }
    }
    return { type: column.type === 'Integer' ? 'int32' : 'float32', name: column.name }
  })
}

/** La salida del modelo de una clase tal como aparece en el conjunto de datos (o por otro de sus nombres); -1 si no */
export function tabularClassIndex(section: N4LTask_t, target: unknown): number {
  const name = String(target).toLowerCase()
  return (section.classes ?? []).findIndex(({ id, aliases = [] }) => [id, ...aliases].some((value) => value.toLowerCase() === name))
}

/**
 * El conjunto de datos preparado: cada columna codificada que pide el preprocesado, la entrada escalada (min-max) y el
 * objetivo en one-hot, con sus codificadores para predecir después. `attributes`: los campos del formulario
 */
export async function prepareTabularClassification(pkg: N4LPackage_t, view: N4LTaskView_t<N4LDataset_t>, attributes: N4LTabularField_t[] = []): Promise<_Types.DatasetProcessed_t[]> {
  const { manifest } = pkg
  return Promise.all([view.dataset].map(async (item) => {
    const target = item.columns.find(({ role }) => role === 'Target')
    if (target === undefined) throw new N4LError(manifest.id, [`datasets.${item.id}: falta la columna objetivo (role Target)`])
    const plan = tabularPlan(manifest, view.section, item)
    const dataframe_original = await readN4LCSV(pkg, item.file)
    let dataframe_processed = await readN4LCSV(pkg, item.file)
    // Las codificadas, como categóricas: así las trata el resto de la aplicación
    const dataset: _Types.Dataset_t = legacyColumns(item, plan.encoded, true)
    const dataset_transforms = dataset
      .filter(({ column_name }) => plan.encoded.has(column_name))
      .map((column) => ({ ...column, column_transform: 'label-encoder' as const }))
    const encoders = DataFrameUtils.DataFrameEncoder(dataframe_original, dataset_transforms)
    dataframe_processed = DataFrameUtils.DataFrameTransform(dataframe_processed, dataset_transforms)

    // La entrada, solo las columnas de entrada (sin el objetivo ni los identificadores)
    const features = featureColumns(item, plan)
    const dataframe_X = dataframe_processed.loc({ columns: features })
    const dataframe_y = dataframe_original[target.name]
    const scaler = new dfd.MinMaxScaler().fit(dataframe_X)
    const X = plan.scale ? scaler.transform(dataframe_X) : dataframe_X
    const y = new dfd.OneHotEncoder().fit(dataframe_y).transform(dataframe_y)
    const classes = DataFrameUtils.LabelEncoderClasses(new dfd.LabelEncoder().fit(dataframe_y.values))
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
        X,
        y,
        scaler,
        encoders,
        column_name_target: target.name,
        classes,
        attributes,
      },
    }
  }))
}
