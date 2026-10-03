import { trackEvent } from '@core/analytics'
import { diagnoseTraining } from '@core/training/diagnoseTraining'
import type { ClassificationEvaluation_t } from '@core/training/trainingTypes'

// Cómo terminó un entrenamiento, en números: lo que miran los retos de «Empieza aquí» (y las analíticas, si se aceptan).

export type TrainResult_t = {
  /** Aciertos con los datos de prueba (0–1); solo en clasificación */
  accuracy?   : number
  /** Neuronas de las capas ocultas (dense), sin contar la salida */
  hidden_units: number
  layers      : number
  /** Épocas entrenadas (menos que las configuradas si se detuvo) */
  epochs      : number
  /** Lo más importante del diagnóstico (diagnoseTraining): good, overfitting… */
  diagnosis?  : string
}

/** Aciertos de una evaluación: predicciones iguales a la clase real */
export function evaluationAccuracy({ labels, predictions }: ClassificationEvaluation_t): number | undefined {
  if (labels.length === 0) return undefined
  return labels.filter((label, index) => label === predictions[index]).length / labels.length
}

type TrainResultInput_t = {
  history    : Record<string, ReadonlyArray<unknown>>
  layers     : ReadonlyArray<{ _class?: string, units?: number }>
  evaluation?: ClassificationEvaluation_t
}

export function trainResult({ history, layers, evaluation }: TrainResultInput_t): TrainResult_t {
  const numeric = Object.fromEntries(Object.entries(history).map(([name, values]) => [name, values.map(Number)]))
  const hidden = layers.slice(0, -1).filter(({ _class }) => _class === undefined || _class === 'dense')
  const accuracy = evaluation === undefined ? undefined : evaluationAccuracy(evaluation)
  return {
    ...(accuracy !== undefined) && { accuracy },
    hidden_units: hidden.reduce((total, { units }) => total + (units ?? 0), 0),
    layers      : layers.length,
    epochs      : numeric.loss?.length ?? 0,
    diagnosis   : diagnoseTraining(numeric)[0]?.kind,
  }
}

/** Avisa (train_result) de cómo terminó un entrenamiento */
export function reportTrainResult(input: TrainResultInput_t) {
  const { accuracy, ...result } = trainResult(input)
  trackEvent('train_result', { ...result, ...(accuracy !== undefined) && { accuracy: Math.round(accuracy * 1000) / 1000 } })
}
