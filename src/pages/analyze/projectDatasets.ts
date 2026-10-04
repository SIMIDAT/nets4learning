import { TASKS, type TASKS_TYPE_V } from '@/TASKS'
import { TASK_DATASET_OPTIONS, type TaskOption_t } from '@/TASK_OPTIONS'
import { EXTRA_DATASETS } from '@pages/datasets/extraDatasets'
import { variableTables, type DatasetVariable_t } from '@pages/datasets/datasetVariables'

/** Un CSV del proyecto que se puede analizar */
export type ProjectDataset_t = {
  /** Ruta dentro de public/ */
  file   : string
  task   : TASKS_TYPE_V
  /** Clave i18n del nombre del conjunto */
  i18n   : string
  source?: string
}

const TASKS_WITH_CSV = [TASKS.TABULAR_CLASSIFICATION, TASKS.REGRESSION] as const

/** Los CSV de los modelos y los de práctica de /datasets, por tarea */
export const PROJECT_DATASETS: ProjectDataset_t[] = TASKS_WITH_CSV.flatMap((task) => [
  ...(TASK_DATASET_OPTIONS[task] as TaskOption_t[]).flatMap(({ i18n, info }) =>
    (info?.files ?? []).map((file) => ({ file, task, i18n, source: info?.source }))),
  ...(EXTRA_DATASETS[task] ?? []).map(({ file, i18n, source }) => ({ file, task, i18n, source })),
])

/** Los CSV de una tarea: los de sus conjuntos (de los modelos o de ejemplo) y los de práctica. Un mismo CSV puede ser de
 * varias tareas: el vino se clasifica y se agrupa */
export const taskDatasetFiles = (task: TASKS_TYPE_V): string[] => [
  ...((TASK_DATASET_OPTIONS[task] ?? []) as TaskOption_t[]).flatMap(({ info }) => info?.files ?? []),
  ...(EXTRA_DATASETS[task] ?? []).map(({ file }) => file),
]

export const fileName = (file: string) => file.slice(file.lastIndexOf('/') + 1)

/** Clave de un CSV del proyecto en la dirección del AED (/analyze?dataset=iris): su nombre sin extensión (son únicos) */
export const datasetKey = (file: string) => fileName(file).replace(/\.csv$/i, '')

/** El CSV del proyecto con esa clave, si existe */
export const projectDatasetByKey = (key: string | null) =>
  key === null ? undefined : PROJECT_DATASETS.find(({ file }) => datasetKey(file) === key)

/** Variables del fichero según su ficha (UCI o la documentación original), si la tiene */
export const datasetVariables = (file: string): DatasetVariable_t[] | undefined => variableTables([file])[0]?.variables

/** La ficha de una columna (sin los espacios de más con que llegan algunas cabeceras: "Alcalinity of ash  " en wine.csv) */
export const variableOf = (variables: DatasetVariable_t[] | undefined, column: string) =>
  variables?.find(({ name }) => name === column.trim())

/** La variable objetivo según la ficha; si no, la última columna */
export function defaultTarget(columns: string[], variables?: DatasetVariable_t[]): string | null {
  const target = variables?.find(({ role }) => role === 'Target')?.name
  const column = columns.find((name) => name.trim() === target)
  if (column !== undefined) return column
  return columns[columns.length - 1] ?? null
}
