import { MAP_TC_CLASSES } from '@pages/playground/0_TabularClassification/models'
import { MAP_LR_CLASSES } from '@pages/playground/1_Regression/models'
import { MAP_OD_CLASSES } from '@pages/playground/2_ObjectDetection/models'
import { MAP_IC_CLASSES } from '@pages/playground/3_ImageClassification/models'
import type { ModelRegistry } from '@core/models/modelRegistry'

import { TASKS, UPLOAD, type TASKS_TYPE_K, type TASKS_TYPE_V } from '@/TASKS'
import { TASK_DATASET_OPTIONS, TASK_MODEL_OPTIONS } from '@/TASK_OPTIONS'

export type { TASKS_TYPE_K, TASKS_TYPE_V }
export type { TASK_MODEL_OPTIONS_TYPE, MODEL_OPTIONS_TYPE, TASK_DATASET_OPTIONS_TYPE, DATASET_OPTIONS_TYPE } from '@/TASK_OPTIONS'

// Este módulo solo contiene claves, etiquetas y registros de carga perezosa: importarlo no
// descarga ningún modelo. Las clases se cargan con `loadModelClass(TASK_MODEL_REGISTRY[task], key)`.
// Las listas de opciones viven en TASK_OPTIONS.ts y se reexportan aquí.

/** Lo que los menús necesitan de cualquier modelo: su título y su descripción. */
export type MenuModel_t = { i18n_TITLE: string, DESCRIPTION: () => React.ReactNode }

/** Registro de carga perezosa de las clases de modelo de cada tarea. */
const TASK_MODEL_REGISTRY: Record<string, ModelRegistry<MenuModel_t>> = {
  [TASKS.TABULAR_CLASSIFICATION]: MAP_TC_CLASSES,
  [TASKS.REGRESSION]            : MAP_LR_CLASSES,
  [TASKS.OBJECT_DETECTION]      : MAP_OD_CLASSES,
  [TASKS.IMAGE_CLASSIFICATION]  : MAP_IC_CLASSES,
}

export {
  TASKS,
  TASK_MODEL_OPTIONS,
  TASK_MODEL_REGISTRY,
  TASK_DATASET_OPTIONS,

  // Genérico para todos
  UPLOAD,
}
