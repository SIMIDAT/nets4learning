import { describe, test, expect, vi, beforeAll } from 'vitest'
import * as dfd from 'danfojs'
import * as tfjs from '@tensorflow/tfjs'

import { trainDenseModel, type TrainDenseModelParams_t } from '../../src/core/controller/trainDenseModel'
import type { DatasetProcessed_t } from '../../src/core/types'

vi.mock('@utils/alertHelper', () => ({ default: { alertError: vi.fn() } }))

// Dataset mínimo ya procesado: X numérica e y preparada según la tarea
const dataset = (y: dfd.DataFrame | dfd.Series) => ({
  data_processed: {
    X: new dfd.DataFrame({ a: [0, 0.2, 0.4, 0.6, 0.8, 1, 0.1, 0.9, 0.3, 0.7], b: [1, 0.8, 0.6, 0.4, 0.2, 0, 0.9, 0.1, 0.7, 0.3] }),
    y,
  },
}) as unknown as DatasetProcessed_t

const params = (dataset_processed: DatasetProcessed_t, activation: string | null = 'relu'): TrainDenseModelParams_t => ({
  dataset_processed,
  name_model   : 'test',
  layerList    : [{ units: 4, activation }, { units: 2, activation: 'softmax' }],
  learningRate : 0.01,
  testSize     : 0.2,
  numberOfEpoch: 2,
  idOptimizer  : 'adam',
  idLoss       : 'losses-meanSquaredError',
  idMetrics    : ['metrics-meanSquaredError'],
  seed         : 42,
  fitCallbacks : { callbacks: ['onEpochEnd'] },
})

describe('trainDenseModel', () => {
  beforeAll(async () => {
    await tfjs.setBackend('cpu')
  })

  test('entrena con y en one-hot (clasificación) y devuelve modelo e historial', async () => {
    const y = new dfd.DataFrame({ c0: [1, 1, 1, 0, 0, 0, 1, 0, 1, 0], c1: [0, 0, 0, 1, 1, 1, 0, 1, 0, 1] })
    const { model, history } = await trainDenseModel(params(dataset(y)))
    expect(model.layers).toHaveLength(2)
    expect(history.epoch).toStrictEqual([0, 1])
  })

  test('entrena con y numérica (regresión)', async () => {
    const y = new dfd.Series([1, 2, 3, 4, 5, 6, 1.5, 5.5, 2.5, 4.5])
    const p = params(dataset(y))
    p.layerList = [{ units: 4, activation: 'relu' }, { units: 1, activation: 'linear' }]
    const { history } = await trainDenseModel(p)
    expect(history.history.loss).toHaveLength(2)
  })

  test('rechaza una capa sin activación válida', async () => {
    const y = new dfd.Series([1, 2, 3, 4, 5, 6, 1.5, 5.5, 2.5, 4.5])
    await expect(trainDenseModel(params(dataset(y), null))).rejects.toThrow(/activation is not valid/)
    await expect(trainDenseModel(params(dataset(y), 'foo'))).rejects.toThrow(/activation is not valid \(foo\)/)
  })
})
