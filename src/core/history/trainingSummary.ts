import * as tfjs from '@tensorflow/tfjs'

/** Valores por época de `model.fit()` (History.history): loss, val_loss, métricas y sus val_… */
export type TrainingLogs_t = Record<string, Array<number | tfjs.Tensor>>

export type MetricCurve_t = {
  name      : string
  train     : number[]
  /** Valores sobre el conjunto de validación (claves val_…); null si no se calcularon */
  validation: number[] | null
}

const toNumber = (value: number | tfjs.Tensor): number => (typeof value === 'number' ? value : value.dataSync()[0])

/** Una curva por métrica, empezando por la pérdida, con los valores de entrenamiento y de validación por época */
export function historyCurves(logs: TrainingLogs_t): MetricCurve_t[] {
  const names = Object.keys(logs).filter((key) => !key.startsWith('val_'))
  names.sort((a, b) => (a === 'loss' ? -1 : b === 'loss' ? 1 : 0))
  return names.map((name) => ({
    name,
    train     : logs[name].map(toNumber),
    validation: logs['val_' + name]?.map(toNumber) ?? null,
  }))
}

/** Pérdida con la que se comparan los modelos: la de validación de la última época (la de entrenamiento si no hay) */
export function finalLoss(logs: TrainingLogs_t): number | null {
  const values = logs.val_loss ?? logs.loss
  if (values === undefined || values.length === 0) return null
  const last = toNumber(values[values.length - 1])
  return Number.isFinite(last) ? last : null
}

/** Índice del modelo con menor pérdida final; -1 si ninguno la tiene */
export function bestModelIndex(histories: TrainingLogs_t[]): number {
  let best = -1
  let bestLoss = Infinity
  histories.forEach((logs, index) => {
    const loss = finalLoss(logs)
    if (loss !== null && loss < bestLoss) {
      best = index
      bestLoss = loss
    }
  })
  return best
}

/** Épocas de un modelo: las configuradas o, si se detuvo antes, "entrenadas/configuradas" */
export function formatEpochs(trained: number, configured: number): string {
  return trained < configured ? `${trained}/${configured}` : String(configured)
}

/** Matriz de confusión: fila = clase real, columna = clase predicha, valor = número de ejemplos */
export function confusionMatrix(labels: number[], predictions: number[], numClasses: number): number[][] {
  const matrix = Array.from({ length: numClasses }, () => new Array<number>(numClasses).fill(0))
  labels.forEach((label, index) => {
    const prediction = predictions[index]
    if (label < numClasses && prediction < numClasses) matrix[label][prediction] += 1
  })
  return matrix
}

export type ConfusionStats_t = {
  /** Ejemplos de cada clase real (suma de su fila) */
  support  : number[]
  /** Sensibilidad (recall): de los ejemplos de cada clase, la parte acertada; null si la clase no tiene ejemplos */
  recall   : Array<number | null>
  /** Precisión: de las predicciones de cada clase, la parte correcta; null si el modelo nunca la predice */
  precision: Array<number | null>
  correct  : number
  total    : number
  /** Exactitud: aciertos (diagonal) sobre el total */
  accuracy : number
}

/** Totales de una matriz de confusión (fila = clase real, columna = clase predicha) */
export function confusionStats(matrix: number[][]): ConfusionStats_t {
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
  const hits = matrix.map((row, index) => row[index])
  const support = matrix.map(sum)
  const predicted = matrix.map((_, column) => sum(matrix.map((row) => row[column])))
  const correct = sum(hits)
  const total = sum(support)
  return {
    support,
    recall   : hits.map((value, index) => (support[index] > 0 ? value / support[index] : null)),
    precision: hits.map((value, index) => (predicted[index] > 0 ? value / predicted[index] : null)),
    correct,
    total,
    accuracy : total > 0 ? correct / total : 0,
  }
}
