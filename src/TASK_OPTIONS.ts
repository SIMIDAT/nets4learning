import { TASKS, UPLOAD, type TASKS_TYPE_V } from '@/TASKS'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'
import { n4lPackagesOf, n4lPublicFile } from '@core/n4l/catalog'
import { isImageDataset, isTableDataset, n4lNamespace, n4lTaskText } from '@core/n4l/format'

// Modelos preentrenados y datasets de cada tarea (clave y etiqueta). Separado de DATA_MODEL, que importa los
// registros de modelos, para que la home o las migas de pan puedan usar estas listas sin cargarlos.
// Las tareas que ya están en paquetes .n4l (public/n4l/) los toman del catálogo: n4lModelOptions y n4lDatasetOptions.

/** Los paquetes de una tarea que salen en los menús, en su orden (`order`; sin él, por su carpeta) */
const listedPackages = (task: TASKS_TYPE_V) => n4lPackagesOf(task)
  .filter(({ section }) => section.listed !== false)
  .sort((a, b) => (a.section.order ?? Infinity) - (b.section.order ?? Infinity))

/** Los modelos ya entrenados de los paquetes de una tarea */
const n4lModelOptions = (task: TASKS_TYPE_V): TaskOption_t[] => listedPackages(task)
  .filter(({ section }) => section.models.length > 0)
  .map(({ entry, section }) => ({ i18n: n4lTaskText(n4lNamespace(entry.id), task) + 'name', value: section.key, summary: n4lTaskText(n4lNamespace(entry.id), task) + 'summary' }))

/**
 * Los conjuntos de datos de los paquetes de una tarea, con lo que se cuenta de ellos en su tarjeta. Solo los que traen
 * sus datos (con uno externo, como ImageNet, no se entrena)
 */
const n4lDatasetOptions = (task: TASKS_TYPE_V): TaskOption_t[] => listedPackages(task)
  .filter(({ datasets }) => datasets.every(({ kind }) => kind !== 'external'))
  .map(({ entry, section, datasets, dataset }) => {
    const tables = datasets.filter(isTableDataset)
    const features = new Set(tables.map(({ columns }) => columns.filter(({ role }) => role === 'Feature').length))
    const target = isTableDataset(dataset) ? dataset.columns.find(({ role }) => role === 'Target') : undefined
    return {
      i18n   : n4lTaskText(n4lNamespace(entry.id), task) + 'name',
      value  : section.key,
      summary: n4lTaskText(n4lNamespace(entry.id), task) + 'summary',
      info   : {
        source: entry.source?.url,
        // Los CSV (se pueden ver y descargar en /datasets); las imágenes, no
        ...(tables.length > 0 && { files: tables.map(({ file }) => n4lPublicFile(entry, file)) }),
        rows  : datasets.map(({ rows }) => rows ?? 0),
        ...(isImageDataset(dataset) && { images: dataset.image }),
        // Las de entrada, solo si todos sus ficheros tienen las mismas
        ...(tables.length > 0 && features.size === 1 && { features: [...features][0] }),
        // Regresión: lo que se predice; si no, las clases (las salidas del modelo o los valores distintos del objetivo)
        ...(task === TASKS.REGRESSION
          ? { target: target?.name }
          : { classes: section.classes?.length ?? target?.options?.length }),
      },
    }
  })

const TASK_MODEL_OPTIONS = {
  [TASKS.TABULAR_CLASSIFICATION]: n4lModelOptions(TASKS.TABULAR_CLASSIFICATION),
  [TASKS.REGRESSION]            : n4lModelOptions(TASKS.REGRESSION),
  [TASKS.OBJECT_DETECTION]      : [
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-1', value: OD_MODEL_KEYS.FACE_DETECTOR },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-2', value: OD_MODEL_KEYS.FACE_MESH },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-3', value: OD_MODEL_KEYS.MOVE_NET_POSE_NET },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-4', value: OD_MODEL_KEYS.COCO_SSD },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-5', value: OD_MODEL_KEYS.FACE_API },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-6', value: OD_MODEL_KEYS.HAND_SIGN },
  ],
  [TASKS.IMAGE_CLASSIFICATION]: n4lModelOptions(TASKS.IMAGE_CLASSIFICATION),
  // Agrupar no necesita un modelo entrenado antes: se hace al momento con los datos
  [TASKS.CLUSTERING]          : [],
}
export type TASK_MODEL_OPTIONS_TYPE = typeof TASK_MODEL_OPTIONS
export type MODEL_OPTIONS_TYPE = TASK_MODEL_OPTIONS_TYPE[keyof TASK_MODEL_OPTIONS_TYPE]

const TASK_DATASET_OPTIONS = {
  [TASKS.TABULAR_CLASSIFICATION]: [
    { i18n: 'pages.menu-selection-dataset.0-tabular-classification.csv', value: UPLOAD },
    ...n4lDatasetOptions(TASKS.TABULAR_CLASSIFICATION),
  ],
  [TASKS.REGRESSION]: [
    { i18n: 'pages.menu-selection-dataset.1-regression.csv', value: UPLOAD },
    ...n4lDatasetOptions(TASKS.REGRESSION),
  ],
  [TASKS.OBJECT_DETECTION]    : [],
  [TASKS.IMAGE_CLASSIFICATION]: n4lDatasetOptions(TASKS.IMAGE_CLASSIFICATION),
  // Conjuntos con clases conocidas: se agrupan sin verlas y al final se comparan los grupos con ellas
  [TASKS.CLUSTERING]          : [
    { i18n: 'pages.menu-selection-dataset.clustering.csv', value: UPLOAD },
    ...n4lDatasetOptions(TASKS.CLUSTERING),
  ],
}
export type TASK_DATASET_OPTIONS_TYPE = typeof TASK_DATASET_OPTIONS
export type DATASET_OPTIONS_TYPE = TASK_DATASET_OPTIONS_TYPE[keyof TASK_DATASET_OPTIONS_TYPE]

/** Lo que se cuenta de un dataset en su tarjeta (los números salen de sus CSV; un test lo comprueba) */
export type DatasetInfo_t = {
  /** CSV del dataset, relativos a public/ (los mismos que carga la clase del modelo) */
  files?   : string[]
  /** Filas de cada CSV, o imágenes del dataset */
  rows     : number[]
  /** Columnas de entrada (sin la variable objetivo); solo si todos los CSV tienen las mismas */
  features?: number
  /** Clasificación: número de clases */
  classes? : number
  /** Regresión: variable que se predice */
  target?  : string
  /** Imágenes en lugar de filas de un CSV: cómo son (tamaño y canales: 1 gris, 3 color) */
  images?  : { width: number, height: number, channels: number }
  /** Página original del dataset (UCI, Kaggle…) */
  source?  : string
}

/** Un modelo o un conjunto de un menú: su título (i18n), su clave en la dirección y, si la tiene, su frase en /datasets */
export type TaskOption_t = { i18n: string, value: string, summary?: string, info?: DatasetInfo_t }
export type TaskKind_t = 'model' | 'dataset'

/** Modelos preentrenados (`model`) o datasets con los que entrenar (`dataset`) de una tarea */
export function taskOptions(task: string, kind: TaskKind_t): TaskOption_t[] {
  const options: Record<string, TaskOption_t[]> = kind === 'model' ? TASK_MODEL_OPTIONS : TASK_DATASET_OPTIONS
  return options[task] ?? []
}

export {
  TASK_MODEL_OPTIONS,
  TASK_DATASET_OPTIONS,
}
