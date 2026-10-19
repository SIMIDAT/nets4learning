import { describe, expect, test } from 'vitest'

import { evaluationAccuracy, trainResult } from '@core/training/trainResult'

describe('trainResult: cómo terminó un entrenamiento, en números', () => {
  test('aciertos con los datos de prueba', () => {
    expect(evaluationAccuracy({ labels: [0, 1, 2, 2], predictions: [0, 1, 1, 2] })).toBe(0.75)
    expect(evaluationAccuracy({ labels: [], predictions: [] })).toBeUndefined()
  })

  test('neuronas ocultas (sin la salida), capas, épocas y diagnóstico', () => {
    const result = trainResult({
      history   : { loss: [1, 0.8, 0.6, 0.45, 0.35], val_loss: [1, 0.82, 0.66, 0.5, 0.4] },
      layers    : [{ _class: 'dense', units: 8 }, { _class: 'dense', units: 4 }, { _class: 'dense', units: 3 }],
      evaluation: { labels: [0, 1], predictions: [0, 1] },
    })
    expect(result).toEqual({ accuracy: 1, hidden_units: 12, layers: 3, epochs: 5, diagnosis: 'still-improving' })
  })

  test('red de imágenes: solo cuentan las dense ocultas; regresión, sin aciertos', () => {
    const image = trainResult({
      history: { loss: [1, 0.5] },
      layers : [{ _class: 'conv2d' }, { _class: 'flatten' }, { _class: 'dense', units: 32 }, { _class: 'dense', units: 10 }],
    })
    expect(image.hidden_units).toBe(32)
    expect(image).not.toHaveProperty('accuracy')
    // Sin _class (regresión): dense
    expect(trainResult({ history: { loss: [1] }, layers: [{ units: 5 }, { units: 1 }] }).hidden_units).toBe(5)
  })
})
