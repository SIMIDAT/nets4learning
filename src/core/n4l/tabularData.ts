// Lo común a los motores de datos en tabla (clasificación tabular y regresión): leer un CSV del paquete y qué pide su
// preprocesado. Cada paso se registra por su nombre: uno nuevo se añade aquí sin tocar los demás.

import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import type { N4LColumn_t, N4LDataset_t, N4LManifest_t, N4LTask_t } from './format'
import type { N4LPackage_t } from './source'
import { N4LError } from './validate'

export const isCategorical = (column: N4LColumn_t) => column.type === 'Categorical' || column.type === 'Binary'

/** Qué se hace con las columnas de un conjunto: cuáles se codifican, cuáles no entran y si la entrada se escala */
export type TabularPlan_t = { encoded: Set<string>, dropped: Set<string>, scale: boolean }

const STEPS: Record<string, (plan: TabularPlan_t, columns: N4LColumn_t[]) => void> = {
  'label-encoder': (plan, columns) => columns.forEach(({ name }) => plan.encoded.add(name)),
  // Columnas de entrada que no entran en la red (p. ej. con valores que no son números, como «?»)
  'drop'         : (plan, columns) => columns.forEach(({ name }) => plan.dropped.add(name)),
  'min-max'      : (plan) => { plan.scale = true },
}

/** Las columnas que recibe la red: las de entrada que no se descartan */
export const featureColumns = (dataset: N4LDataset_t, plan: TabularPlan_t) =>
  dataset.columns.filter(({ role, name }) => role === 'Feature' && !plan.dropped.has(name)).map(({ name }) => name)

/** Las columnas de un paso: un grupo (las categóricas, las de entrada) o las que nombra (las que haya en el conjunto) */
function stepColumns(columns: N4LColumn_t[], selector: N4LTask_t['preprocessing'][number]['columns']) {
  if (selector === 'categorical') return columns.filter(isCategorical)
  if (selector === 'features') return columns.filter(({ role }) => role === 'Feature')
  return columns.filter(({ name }) => selector.includes(name))
}

/** El preprocesado de una tarea aplicado a uno de sus conjuntos */
export function tabularPlan(manifest: N4LManifest_t, section: N4LTask_t, dataset: N4LDataset_t): TabularPlan_t {
  const plan: TabularPlan_t = { encoded: new Set(), dropped: new Set(), scale: false }
  for (const step of section.preprocessing) {
    const apply = STEPS[step.op]
    if (apply === undefined) throw new N4LError(manifest.id, [`tasks.${section.task}.preprocessing: el paso «${step.op}» no existe en el motor ${section.runtime}`])
    apply(plan, stepColumns(dataset.columns, step.columns))
  }
  return plan
}

export const fileName = (path: string) => path.slice(path.lastIndexOf('/') + 1)
export const directory = (path: string) => path.slice(0, path.lastIndexOf('/') + 1)

/** Un CSV del paquete como DataFrame: por su dirección si está servido; si no, desde el fichero */
export async function readN4LCSV({ source }: N4LPackage_t, path: string) {
  const url = source.url(path)
  if (url !== null) return DataFrameUtils.DataFrameReadCSV(url)
  return DataFrameUtils.DataFrameReadCSV(new File([await source.readBytes(path)], fileName(path), { type: 'text/csv' }))
}

/** Dónde está el CSV y su descripción original (lo que la aplicación enseña de un conjunto) */
export async function datasetFiles({ source }: N4LPackage_t, dataset: N4LDataset_t) {
  const url = source.url(dataset.file)
  return {
    path          : url === null ? directory(dataset.file) : directory(url),
    csv           : fileName(dataset.file),
    info          : dataset.info === undefined ? '' : fileName(dataset.info),
    container_info: dataset.info === undefined ? '' : await source.readText(dataset.info),
  }
}

/** La ficha del conjunto como la usa el resto de la aplicación (que no tiene el rol Other: no entra) */
export const legacyColumns = (dataset: N4LDataset_t, encoded: Set<string>, encodedAsCategorical: boolean) => dataset.columns.map((column) => ({
  column_name          : column.name,
  column_role          : column.role === 'Other' ? 'ID' as const : column.role,
  column_type          : encodedAsCategorical && encoded.has(column.name) ? 'Categorical' as const : column.type,
  column_missing_values: column.missing > 0,
}))
