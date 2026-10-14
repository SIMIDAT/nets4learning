import { useSyncExternalStore } from 'react'

import type { DiagnosisKind_t } from './diagnoseTraining'

// «Predice antes de entrenar»: antes de pulsar Entrenar se elige qué se cree que pasará y, al terminar, se compara con
// el diagnóstico del entrenamiento (diagnoseTraining). Predecir, observar y explicar: se aprende más comparando lo que
// se esperaba con lo que pasó. Se guarda en memoria, por página y por modelo (el que se va a entrenar: su número en la
// tabla de modelos), mientras dura la visita.

/** Lo que se puede predecir: lo que dice el diagnóstico de un entrenamiento */
export const PREDICTIONS = ['good', 'still-improving', 'overfitting', 'not-learning', 'unstable', 'diverged'] as const
export type Prediction_t = typeof PREDICTIONS[number]

const predictions = new Map<string, Prediction_t>()
const reported = new Set<string>()
const listeners = new Set<() => void>()
const keyOf = (page: string, model: number) => `${page}#${model}`

/** La predicción para el modelo `model` de la página `page` (null: ninguna) */
export const getPrediction = (page: string, model: number): Prediction_t | null => predictions.get(keyOf(page, model)) ?? null

export function setPrediction(page: string, model: number, prediction: Prediction_t | null) {
  if (prediction === null) predictions.delete(keyOf(page, model))
  else predictions.set(keyOf(page, model), prediction)
  listeners.forEach((listener) => listener())
}

export function usePrediction(page: string, model: number): Prediction_t | null {
  return useSyncExternalStore((listener) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, () => getPrediction(page, model), () => null)
}

/** Si se acertó: lo predicho está en el diagnóstico («apenas aprenderá» también vale si empeoró) */
export function isRightPrediction(prediction: Prediction_t, kinds: DiagnosisKind_t[]): boolean {
  return kinds.includes(prediction) || (prediction === 'not-learning' && kinds.includes('worse'))
}

/** Para avisar una sola vez de cada predicción comparada (analíticas): true la primera vez */
export function firstComparison(page: string, model: number): boolean {
  const key = keyOf(page, model)
  if (reported.has(key)) return false
  reported.add(key)
  return true
}
