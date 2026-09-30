import { TASKS, type TASKS_TYPE_V } from '@/TASKS'

/** Lo que la interfaz necesita de cada tarea. Su color va en CSS: `[data-task="<tarea>"]` define `--n4l-task-color`. */
export type TaskInfo_t = {
  task     : TASKS_TYPE_V
  i18nTitle: string
}

export const TASK_INFO: Record<TASKS_TYPE_V, TaskInfo_t> = {
  'tabular-classification': { task: TASKS.TABULAR_CLASSIFICATION, i18nTitle: 'pages.index.tabular-classification.1-title' },
  'regression'            : { task: TASKS.REGRESSION, i18nTitle: 'pages.index.regression.1-title' },
  'image-classification'  : { task: TASKS.IMAGE_CLASSIFICATION, i18nTitle: 'pages.index.image-classification.1-title' },
  'object-detection'      : { task: TASKS.OBJECT_DETECTION, i18nTitle: 'pages.index.object-detection.1-title' },
}

export const isTask = (value: string | undefined): value is TASKS_TYPE_V => value !== undefined && value in TASK_INFO
