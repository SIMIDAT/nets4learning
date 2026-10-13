// Constantes ligeras de las tareas. Están separadas de DATA_MODEL (que importa todas las
// clases de modelos) para que páginas como la home o el playground no carguen los modelos
// solo por usar estos identificadores.
export type TASKS_TYPE_K = 'TABULAR_CLASSIFICATION' | 'REGRESSION' | 'IMAGE_CLASSIFICATION' | 'OBJECT_DETECTION' | 'CLUSTERING' | 'TIME_SERIES'
export type TASKS_TYPE_V = 'tabular-classification' | 'regression' | 'image-classification' | 'object-detection' | 'clustering' | 'time-series'

export const TASKS: Record<TASKS_TYPE_K, TASKS_TYPE_V> = {
  TABULAR_CLASSIFICATION: 'tabular-classification',
  REGRESSION            : 'regression',
  IMAGE_CLASSIFICATION  : 'image-classification',
  OBJECT_DETECTION      : 'object-detection',
  // Agrupar sin etiquetas (aprendizaje no supervisado): k-means
  CLUSTERING            : 'clustering',
  // Predecir los siguientes valores de una serie a partir de los anteriores
  TIME_SERIES           : 'time-series',
}

export const UPLOAD = 'UPLOAD'
