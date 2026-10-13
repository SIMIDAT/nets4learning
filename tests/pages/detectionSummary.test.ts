import { describe, test, expect } from 'vitest'
import type { TFunction } from 'i18next'

import I_MODEL_OBJECT_DETECTION from '@pages/playground/2_ObjectDetection/models/_model'
import { detectionSummary, detectionText } from '@pages/playground/2_ObjectDetection/detectionSummary'

// t con las claves y lo que se interpola, para ver qué frase sale
const t = ((key: string, values?: Record<string, unknown>) => (values?.list ? `${key}: ${values.list}` : key)) as unknown as TFunction

// Un detector de clases (como COCO-SSD): usa lo que trae la clase base para la explicabilidad
class FakeDetector extends I_MODEL_OBJECT_DETECTION {}
const model = new FakeDetector(t as never)

describe('detectionSummary: lo detectado en texto', () => {
  test('una etiqueta por clase, con su mejor puntuación, de la más segura a la menos', () => {
    const items = detectionSummary(model, [
      { class: 'dog', score: 0.81 },
      { class: 'person', score: 0.6 },
      { class: 'person', score: 0.92 },
    ])
    expect(items).toEqual([{ label: 'person', score: 0.92 }, { label: 'dog', score: 0.81 }])
    // Intl pone un espacio que no se parte antes de «%»
    expect(detectionText(t, items, 'es')).toMatch(/^datasets-models\.2-object-detection\.interface\.detections\.detected: person \(92\s%\), dog \(81\s%\)$/)
  })

  test('sin detecciones lo dice', () => {
    expect(detectionSummary(model, [])).toEqual([])
    expect(detectionText(t, [], 'es')).toBe('datasets-models.2-object-detection.interface.detections.nothing')
  })
})
