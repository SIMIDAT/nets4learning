import type { TFunction } from 'i18next'

import type I_MODEL_OBJECT_DETECTION from './models/_model'

/** Algo detectado: su nombre y la confianza del modelo (de 0 a 1) */
export type DetectedItem_t = { label: string, score: number }

/**
 * Lo detectado en texto, de lo más seguro a lo menos (WCAG 1.1.1: el lienzo solo lo dibuja). Sirve para todos los
 * modelos porque usa lo mismo que su explicabilidad: qué etiquetas hay en las detecciones y cuánto puntúa cada una
 */
export function detectionSummary(model: I_MODEL_OBJECT_DETECTION, predictions: unknown[]): DetectedItem_t[] {
  const labels = model.EXPLAIN_LABELS(predictions)
  const scores = model.NORMALIZE_PREDICTIONS(predictions, labels)
  return labels
    .map((label, index) => ({ label: model.EXPLAIN_LABEL_TEXT(label), score: scores[index] ?? 0 }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
}

/** La frase: «Se detecta: persona (92 %), perro (81 %)» o «No se detecta nada» */
export function detectionText(t: TFunction, items: DetectedItem_t[], language: string): string {
  if (items.length === 0) return t('datasets-models.2-object-detection.interface.detections.nothing')
  const percent = new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 0 })
  return t('datasets-models.2-object-detection.interface.detections.detected', {
    list: items.map(({ label, score }) => `${label} (${percent.format(score)})`).join(', '),
  })
}
