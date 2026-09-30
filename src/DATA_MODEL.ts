import { MAP_TC_CLASSES } from '@pages/playground/0_TabularClassification/models'
import { MAP_LR_CLASSES } from '@pages/playground/1_Regression/models'
import { MAP_OD_CLASSES } from '@pages/playground/2_ObjectDetection/models'
import { MAP_IC_CLASSES } from '@pages/playground/3_ImageClassification/models'
import type { ModelRegistry } from '@core/models/modelRegistry'

import { TASKS, UPLOAD, type TASKS_TYPE_K, type TASKS_TYPE_V } from '@/TASKS'
import { IC_MODEL_KEYS, LR_MODEL_KEYS, OD_MODEL_KEYS, TC_MODEL_KEYS } from '@/MODEL_KEYS'

export type { TASKS_TYPE_K, TASKS_TYPE_V }

// Este módulo solo contiene claves, etiquetas y registros de carga perezosa: importarlo no
// descarga ningún modelo. Las clases se cargan con `loadModelClass(TASK_MODEL_REGISTRY[task], key)`.

const TASK_MODEL_OPTIONS = {
  [TASKS.TABULAR_CLASSIFICATION]: [
    { i18n: 'datasets-models.0-tabular-classification.list-models.0-option-1', value: TC_MODEL_KEYS.CAR },
    { i18n: 'datasets-models.0-tabular-classification.list-models.0-option-2', value: TC_MODEL_KEYS.IRIS },
    { i18n: 'datasets-models.0-tabular-classification.list-models.0-option-3', value: TC_MODEL_KEYS.LYMPHOGRAPHY },
  ],
  [TASKS.REGRESSION]: [
    // { i18n: 'datasets-models.1-regression.list-models.salary', value: LR_MODEL_KEYS.SALARY },
    { i18n: 'datasets-models.1-regression.list-models.auto-mpg', value: LR_MODEL_KEYS.AUTO_MPG },
    // { i18n: 'datasets-models.1-regression.list-models.housing-prices', value: LR_MODEL_KEYS.HOUSING_PRICES },
    // { i18n: 'datasets-models.1-regression.list-models.breast-cancer', value: LR_MODEL_KEYS.BREAST_CANCER },
    { i18n: 'datasets-models.1-regression.list-models.student-performance', value: LR_MODEL_KEYS.STUDENT_PERFORMANCE },
    { i18n: 'datasets-models.1-regression.list-models.wine', value: LR_MODEL_KEYS.WINE },
  ],
  [TASKS.OBJECT_DETECTION]: [
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-1', value: OD_MODEL_KEYS.FACE_DETECTOR },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-2', value: OD_MODEL_KEYS.FACE_MESH },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-3', value: OD_MODEL_KEYS.MOVE_NET_POSE_NET },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-4', value: OD_MODEL_KEYS.COCO_SSD },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-5', value: OD_MODEL_KEYS.FACE_API },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-6', value: OD_MODEL_KEYS.HAND_SIGN },
  ],
  [TASKS.IMAGE_CLASSIFICATION]: [
    { i18n: 'datasets-models.3-image-classifier.list-models.3-option-1', value: IC_MODEL_KEYS.MNIST },
    { i18n: 'datasets-models.3-image-classifier.list-models.3-option-2', value: IC_MODEL_KEYS.MOBILENET },
  ],
}
export type TASK_MODEL_OPTIONS_TYPE = typeof TASK_MODEL_OPTIONS
export type MODEL_OPTIONS_TYPE = TASK_MODEL_OPTIONS_TYPE[keyof TASK_MODEL_OPTIONS_TYPE]

/** Lo que los menús necesitan de cualquier modelo: su título y su descripción. */
export type MenuModel_t = { i18n_TITLE: string, DESCRIPTION: () => React.ReactNode }

/** Registro de carga perezosa de las clases de modelo de cada tarea. */
const TASK_MODEL_REGISTRY: Record<string, ModelRegistry<MenuModel_t>> = {
  [TASKS.TABULAR_CLASSIFICATION]: MAP_TC_CLASSES,
  [TASKS.REGRESSION]            : MAP_LR_CLASSES,
  [TASKS.OBJECT_DETECTION]      : MAP_OD_CLASSES,
  [TASKS.IMAGE_CLASSIFICATION]  : MAP_IC_CLASSES,
}

const TASK_DATASET_OPTIONS = {
  [TASKS.TABULAR_CLASSIFICATION]: [
    { i18n: 'pages.menu-selection-dataset.0-tabular-classification.csv', value: UPLOAD },
    { i18n: 'datasets-models.0-tabular-classification.list-datasets.0-option-1', value: TC_MODEL_KEYS.CAR },
    { i18n: 'datasets-models.0-tabular-classification.list-datasets.0-option-2', value: TC_MODEL_KEYS.IRIS },
    { i18n: 'datasets-models.0-tabular-classification.list-datasets.0-option-3', value: TC_MODEL_KEYS.LYMPHOGRAPHY },
  ],
  [TASKS.REGRESSION]: [
    // TODO
    { i18n: 'pages.menu-selection-dataset.1-regression.csv', value: UPLOAD },
    { i18n: 'datasets-models.1-regression.list-datasets.salary', value: LR_MODEL_KEYS.SALARY },
    { i18n: 'datasets-models.1-regression.list-datasets.auto-mpg', value: LR_MODEL_KEYS.AUTO_MPG },
    { i18n: 'datasets-models.1-regression.list-datasets.housing-prices', value: LR_MODEL_KEYS.HOUSING_PRICES },
    // { i18n: 'datasets-models.1-regression.list-datasets.breast-cancer', value: LR_MODEL_KEYS.BREAST_CANCER },
    { i18n: 'datasets-models.1-regression.list-datasets.student-performance', value: LR_MODEL_KEYS.STUDENT_PERFORMANCE },
    { i18n: 'datasets-models.1-regression.list-datasets.wine', value: LR_MODEL_KEYS.WINE },
  ],
  [TASKS.OBJECT_DETECTION]    : [],
  [TASKS.IMAGE_CLASSIFICATION]: [
    { i18n: 'datasets-models.3-image-classification.list-datasets.mnist', value: IC_MODEL_KEYS.MNIST },
    { i18n: 'datasets-models.3-image-classification.list-datasets.kmnist', value: IC_MODEL_KEYS.KMNIST },
  ],
}
export type TASK_DATASET_OPTIONS_TYPE = typeof TASK_DATASET_OPTIONS
export type DATASET_OPTIONS_TYPE = TASK_DATASET_OPTIONS_TYPE[keyof TASK_DATASET_OPTIONS_TYPE]

export {
  TASKS,
  TASK_MODEL_OPTIONS,
  TASK_MODEL_REGISTRY,
  TASK_DATASET_OPTIONS,

  // Genérico para todos
  UPLOAD,
}
