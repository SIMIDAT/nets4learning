import { describe, test, expect } from 'vitest'
import { bestModelIndex, confusionMatrix, confusionStats, finalLoss, formatEpochs, historyCurves } from '../../src/core/history/trainingSummary'

describe('trainingSummary', () => {
  test('una curva por métrica, con la pérdida primero y su validación', () => {
    const curves = historyCurves({ acc: [0.5, 0.8], loss: [1, 0.5], val_loss: [1.2, 0.7], val_acc: [0.4, 0.7], mse: [3, 2] })
    expect(curves.map(({ name }) => name)).toStrictEqual(['loss', 'acc', 'mse'])
    expect(curves[0]).toStrictEqual({ name: 'loss', train: [1, 0.5], validation: [1.2, 0.7] })
    expect(curves[2].validation).toBeNull()
  })

  test('la pérdida final es la de validación de la última época, o la de entrenamiento si no hay', () => {
    expect(finalLoss({ loss: [1, 0.5], val_loss: [1.2, 0.7] })).toBe(0.7)
    expect(finalLoss({ loss: [1, 0.5] })).toBe(0.5)
    expect(finalLoss({ acc: [0.5] })).toBeNull()
  })

  test('el mejor modelo es el de menor pérdida final', () => {
    expect(bestModelIndex([{ val_loss: [0.9] }, { val_loss: [0.3] }, { val_loss: [0.5] }])).toBe(1)
    expect(bestModelIndex([{ acc: [0.5] }])).toBe(-1)
  })

  test('las épocas de un entrenamiento detenido se enseñan como entrenadas/configuradas', () => {
    expect(formatEpochs(10, 10)).toBe('10')
    expect(formatEpochs(2, 5)).toBe('2/5')
  })

  test('matriz de confusión: filas reales, columnas predichas', () => {
    expect(confusionMatrix([0, 0, 1, 2, 2], [0, 1, 1, 2, 0], 3)).toStrictEqual([
      [1, 1, 0],
      [0, 1, 0],
      [1, 0, 1],
    ])
  })

  test('totales de la matriz: sensibilidad por fila, precisión por columna y exactitud', () => {
    const stats = confusionStats([
      [1, 1, 0],
      [0, 1, 0],
      [1, 0, 1],
    ])
    expect(stats.support).toStrictEqual([2, 1, 2])
    expect(stats.recall).toStrictEqual([0.5, 1, 0.5])
    expect(stats.precision).toStrictEqual([0.5, 0.5, 1])
    expect(stats).toMatchObject({ correct: 3, total: 5, accuracy: 0.6 })
  })

  test('una clase sin ejemplos o que nunca se predice no tiene sensibilidad o precisión', () => {
    const stats = confusionStats([
      [2, 0],
      [0, 0],
    ])
    expect(stats.recall).toStrictEqual([1, null])
    expect(stats.precision).toStrictEqual([1, null])
    expect(confusionStats([]).accuracy).toBe(0)
  })
})
