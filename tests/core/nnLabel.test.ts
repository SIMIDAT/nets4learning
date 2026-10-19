import { describe, test, expect } from 'vitest'
import { nnLabel, TYPE_LOSSES, TYPE_METRICS, TYPE_OPTIMIZER } from '../../src/core/nn-utils/ArchitectureTypesHelper'

describe('nnLabel', () => {

  test('cada pérdida con prefijo muestra su propio nombre', () => {
    expect(nnLabel('losses-meanSquaredError')).toBe('MeanSquaredError')
    expect(nnLabel('losses-hingeLoss')).toBe('HingeLoss')
    expect(nnLabel('metrics-recall')).toBe('Recall')
    expect(nnLabel('train-adam')).toBe('Adam')
  })

  test('nombres que no siguen la regla general', () => {
    expect(nnLabel('sgd')).toBe('SGD')
    expect(nnLabel('train-rmsprop')).toBe('RMSProp')
  })

  test('las opciones de los selectores usan las mismas etiquetas', () => {
    expect(TYPE_OPTIMIZER.map((o) => o.label)).toStrictEqual(['SGD', 'Adagrad', 'Adadelta', 'Adam', 'Adamax', 'RMSProp'])
    expect(TYPE_LOSSES.find((o) => o.key === 'categoricalCrossentropy')?.label).toBe('CategoricalCrossentropy')
    expect(TYPE_METRICS.find((o) => o.key === 'accuracy')?.label).toBe('Accuracy')
  })
})
