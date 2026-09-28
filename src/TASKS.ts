// Constantes ligeras de las tareas. Están separadas de DATA_MODEL (que importa todas las
// clases de modelos) para que páginas como la home o el playground no carguen los modelos
// solo por usar estos identificadores.
export type TASKS_TYPE_K = 'TABULAR_CLASSIFICATION' | 'REGRESSION' | 'IMAGE_CLASSIFICATION' | 'OBJECT_DETECTION'
export type TASKS_TYPE_V = 'tabular-classification' | 'regression' | 'image-classification' | 'object-detection'

export const TASKS: Record<TASKS_TYPE_K, TASKS_TYPE_V> = {
  TABULAR_CLASSIFICATION: 'tabular-classification',
  REGRESSION            : 'regression',
  IMAGE_CLASSIFICATION  : 'image-classification',
  OBJECT_DETECTION      : 'object-detection',
}

export const UPLOAD = 'UPLOAD'
