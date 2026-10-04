import type { TASKS_TYPE_V } from '@/TASKS'
import type { ModelParameters_t, TrainingLogs_t } from '@core/history/trainingSummary'

// El informe de un modelo entrenado (/report): lo que hace falta para leerlo y entregarlo sin rehacer el entrenamiento.
// Viaja de la página de entrenamiento a la del informe (otra pestaña) por localStorage; solo se guarda el último.

export type TrainingReport_t = {
  version    : 1
  task       : TASKS_TYPE_V
  /** El conjunto de datos (la clave de la dirección: IRIS, SALARY, UPLOAD…) */
  dataset    : string
  /** El número del modelo en la tabla (desde 1) */
  model      : number
  createdAt  : string
  /** Cada capa en una línea («Dense · 10 neuronas · ReLU») */
  layers     : string[]
  /** Hiperparámetros, con las claves de generator.table-models.* (como al comparar modelos) */
  parameters : ModelParameters_t
  /** Pérdida y métricas de cada época */
  history    : Record<string, number[]>
  /** Clasificación: clase real y predicha de cada ejemplo de prueba */
  evaluation?: { classes: string[], labels: number[], predictions: number[] }
}

export const REPORT_STORAGE_KEY = 'n4l-report'

/** El historial de TF.js (números o tensores) como números */
export const historyNumbers = (history: TrainingLogs_t): Record<string, number[]> =>
  Object.fromEntries(Object.entries(history).map(([name, values]) => [name, values.map(Number)]))

/** Lo deja para la página del informe; false si el navegador no deja guardarlo */
export function saveReport(report: TrainingReport_t): boolean {
  try {
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report))
    return true
  } catch {
    return false
  }
}

/** El último informe, o null si no hay (o no es de esta versión) */
export function readReport(): TrainingReport_t | null {
  try {
    const report: unknown = JSON.parse(localStorage.getItem(REPORT_STORAGE_KEY) ?? 'null')
    if (typeof report !== 'object' || report === null) return null
    const { version, layers, parameters, history } = report as Partial<TrainingReport_t>
    if (version !== 1 || !Array.isArray(layers) || typeof parameters !== 'object' || typeof history !== 'object') return null
    return report as TrainingReport_t
  } catch {
    return null
  }
}
