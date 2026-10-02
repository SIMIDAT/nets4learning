import { describe, test, expect, beforeAll } from 'vitest'
import * as tfjs from '@tensorflow/tfjs'

import { trainingWorkerApi } from '@core/training/training.worker'
import { modelFromArtifacts } from '@core/training/buildModels'
import { DEFINITION_ERROR_PREFIX, type DenseTrainingRequest_t, type TrainingProgress_t } from '@core/training/trainingTypes'
import type { WorkerTaskContext_t } from '@core/workers/workerProtocol'

// Las funciones del worker de entrenamiento, llamadas directamente (en un worker de verdad las llama exposeWorker)

/** Dos clases separables: la clase es 1 si x0 + x1 > 1 */
function classificationRequest(rows = 120): DenseTrainingRequest_t {
  const X = new Float32Array(rows * 2)
  const y = new Float32Array(rows * 2)
  for (let row = 0; row < rows; row++) {
    const x0 = (row * 37 % 100) / 100
    const x1 = (row * 61 % 100) / 100
    X.set([x0, x1], row * 2)
    y.set(x0 + x1 > 1 ? [0, 1] : [1, 0], row * 2)
  }
  return {
    backend      : 'cpu',
    X,
    rows,
    features     : 2,
    y,
    yShape       : [rows, 2],
    layerList    : [{ units: 8, activation: 'relu' }, { units: 2, activation: 'softmax' }],
    compile      : { idOptimizer: 'train-adam', idLoss: 'losses-categoricalCrossentropy', idMetrics: ['metrics-categoricalAccuracy'], learningRate: 0.05 },
    testSize     : 0.2,
    seed         : 42,
    numberOfEpoch: 3,
  }
}

function contextOf(progress: TrainingProgress_t[], cancelled = () => false): WorkerTaskContext_t {
  return { progress: (data) => progress.push(data as TrainingProgress_t), cancelled }
}

describe('worker de entrenamiento', () => {

  beforeAll(async () => {
    await tfjs.setBackend('cpu')
  })

  test('clasificación: avisa de cada lote y cada época y devuelve el modelo, el historial y la evaluación', async () => {
    const progress: TrainingProgress_t[] = []
    const result = await trainingWorkerApi.trainDense(classificationRequest(), contextOf(progress))

    const epochs = progress.filter((p) => p.kind === 'epoch')
    expect(epochs.map((p) => p.kind === 'epoch' && p.epoch)).toEqual([0, 1, 2])
    expect(epochs[0]).toMatchObject({ totalEpochs: 3, logs: expect.objectContaining({ loss: expect.any(Number), val_loss: expect.any(Number) }) })
    expect(progress.some((p) => p.kind === 'batch')).toBe(true)

    expect(result.history.epoch).toEqual([0, 1, 2])
    expect(result.history.history.loss).toHaveLength(3)
    // 20 % de validación: 24 de las 120 filas
    expect(result.evaluation?.labels).toHaveLength(24)
    expect(result.evaluation?.predictions).toHaveLength(24)

    // El modelo viaja como datos y se reconstruye en el hilo principal
    expect(result.artifacts.weightData).toBeDefined()
    const model = await modelFromArtifacts(result.artifacts)
    const output = model.predict(tfjs.tensor2d([[0.9, 0.9], [0.1, 0.1]])) as tfjs.Tensor
    expect(output.shape).toEqual([2, 2])
    tfjs.dispose([output])
    model.dispose()
  }, 30_000)

  test('regresión: un número por fila y sin evaluación de clases', async () => {
    const request = classificationRequest(60)
    const y = new Float32Array(60).map((_, row) => request.X[row * 2] * 3 + request.X[row * 2 + 1])
    const result = await trainingWorkerApi.trainDense({
      ...request,
      y,
      yShape   : [60],
      layerList: [{ units: 4, activation: 'relu' }, { units: 1, activation: 'linear' }],
      compile  : { idOptimizer: 'train-adam', idLoss: 'losses-meanSquaredError', idMetrics: ['metrics-meanAbsoluteError'], learningRate: 0.05 },
    }, contextOf([]))
    expect(result.evaluation).toBeUndefined()
    expect(result.history.history.loss).toHaveLength(3)
  }, 30_000)

  test('para cuando se le pide (el modelo se queda como esté)', async () => {
    const progress: TrainingProgress_t[] = []
    let stop = false
    const context: WorkerTaskContext_t = {
      progress: (data) => {
        progress.push(data as TrainingProgress_t)
        if ((data as TrainingProgress_t).kind === 'epoch') stop = true
      },
      cancelled: () => stop,
    }
    const result = await trainingWorkerApi.trainDense({ ...classificationRequest(), numberOfEpoch: 20 }, context)
    expect(result.history.epoch.length).toBeLessThan(20)
  }, 30_000)

  test('una arquitectura que no vale se distingue de los fallos del worker', async () => {
    const request = { ...classificationRequest(), layerList: [{ units: 2, activation: 'no-existe' }] }
    await expect(trainingWorkerApi.trainDense(request, contextOf([]))).rejects.toThrow(DEFINITION_ERROR_PREFIX + 'activation:')
  })
})
