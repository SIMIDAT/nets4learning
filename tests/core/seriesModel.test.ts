import { describe, test, expect, beforeAll } from 'vitest'
import * as tfjs from '@tensorflow/tfjs'

import { buildSeriesModel, modelFromArtifacts, ModelDefinitionError } from '@core/training/buildModels'
import { trainingWorkerApi } from '@core/training/training.worker'
import type { TrainingProgress_t } from '@core/training/trainingTypes'
import { prepareSeries } from '@core/timeSeries/series'
import { evaluateSeriesModel, forecastFuture } from '@core/timeSeries/seriesModel'
import { checkSeriesLayers } from '@core/nn-utils/checkLayers'
import { SERIES_OUTPUT_LAYER, type SeriesLayer_t } from '@core/timeSeries/seriesLayers'

// Una onda que se repite cada 12 valores, con algo de tendencia
const SERIES = Array.from({ length: 120 }, (_value, i) => 100 + i / 2 + 20 * Math.sin((2 * Math.PI * i) / 12))
const PREP = { window: 12, testSize: 20, difference: false }

describe('Series temporales: la red', () => {
  beforeAll(async () => {
    await tfjs.setBackend('cpu')
  })

  test('Dense recibe la ventana entera; las recurrentes, como secuencia, y solo la última da un valor por ventana', () => {
    const dense = buildSeriesModel([{ _class: 'dense', units: 4, activation: 'relu' }, SERIES_OUTPUT_LAYER], 12)
    expect(dense.inputs[0].shape).toEqual([null, 12])
    expect(dense.outputs[0].shape).toEqual([null, 1])
    dense.dispose()

    const recurrent = buildSeriesModel([
      { _class: 'lstm', units: 4, activation: 'tanh' },
      { _class: 'gru', units: 3, activation: 'tanh' },
      SERIES_OUTPUT_LAYER,
    ], 12)
    expect(recurrent.inputs[0].shape).toEqual([null, 12])
    expect(recurrent.layers.map((layer) => layer.getClassName())).toEqual(['Reshape', 'LSTM', 'GRU', 'Dense'])
    expect(recurrent.layers[1].outputShape).toEqual([null, 12, 4])
    expect(recurrent.layers[2].outputShape).toEqual([null, 3])
    recurrent.dispose()
  })

  test('una recurrente después de una Dense no se puede montar, y la comprobación lo arregla poniéndolas delante', () => {
    const layers: SeriesLayer_t[] = [{ _class: 'dense', units: 4, activation: 'relu' }, { _class: 'simpleRNN', units: 4, activation: 'tanh' }, SERIES_OUTPUT_LAYER]
    expect(() => buildSeriesModel(layers, 12)).toThrow(ModelDefinitionError)
    const [issue] = checkSeriesLayers(layers)
    expect(issue).toMatchObject({ kind: 'recurrent-after-dense', severity: 'error', layer: 1, values: { type: 'SimpleRNN' } })
    expect(issue.fixed.map(({ _class }) => _class)).toEqual(['simpleRNN', 'dense', 'dense'])
    expect(checkSeriesLayers(issue.fixed)).toEqual([])
    expect(checkSeriesLayers([{ _class: 'lstm', units: 0, activation: 'tanh' }, SERIES_OUTPUT_LAYER])[0]).toMatchObject({ kind: 'param', values: { value: 10 } })
  })

  test('el worker entrena con las ventanas de entrenamiento y valida con las de prueba (sin barajar la serie)', async () => {
    const prepared = prepareSeries(SERIES, PREP)
    const progress: TrainingProgress_t[] = []
    const result = await trainingWorkerApi.trainSeries({
      backend      : 'cpu',
      window       : PREP.window,
      X            : new Float32Array(prepared.train.X.flat()),
      y            : new Float32Array(prepared.train.y),
      XTest        : new Float32Array(prepared.test.X.flat()),
      yTest        : new Float32Array(prepared.test.y),
      layerList    : [{ _class: 'dense', units: 16, activation: 'relu' }, SERIES_OUTPUT_LAYER],
      compile      : { idOptimizer: 'train-adam', idLoss: 'losses-meanSquaredError', idMetrics: ['metrics-meanAbsoluteError'], learningRate: 0.01 },
      numberOfEpoch: 40,
      batchSize    : 16,
    }, { progress: (data) => progress.push(data as TrainingProgress_t), cancelled: () => false })

    expect(progress.filter(({ kind }) => kind === 'epoch')).toHaveLength(40)
    expect(result.history.history.val_loss).toHaveLength(40)
    expect(result.history.history.loss.at(-1)!).toBeLessThan(result.history.history.loss[0])

    const model = await modelFromArtifacts(result.artifacts)
    const evaluation = await evaluateSeriesModel(model, SERIES, prepared)
    expect(evaluation.trainOneStep).toHaveLength(prepared.train.targets.length)
    expect(evaluation.testOneStep).toHaveLength(24)
    expect(evaluation.testRecursive).toHaveLength(24)
    // Aprende la onda: a un paso se equivoca menos que repetir el valor anterior (que falla por toda la subida o bajada)
    const naive = prepared.test.targets.reduce((sum, t) => sum + Math.abs(SERIES[t] - SERIES[t - 1]), 0) / 24
    expect(evaluation.errors.oneStep.mae).toBeLessThan(naive)

    const future = await forecastFuture(model, SERIES, prepared, 6)
    expect(future).toHaveLength(6)
    expect(future.every(Number.isFinite)).toBe(true)
    model.dispose()
  }, 30_000)
})
