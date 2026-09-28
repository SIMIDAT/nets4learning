import { describe, test, expect, beforeAll } from 'vitest'
import * as tfjs from '@tensorflow/tfjs'
import {
  applyLRP,
  lrpAvgPooling2D,
  lrpConv2D,
  lrpDense,
  lrpDenseAlphaBeta,
  lrpMaxPooling2D,
} from '../../src/pages/playground/3_ImageClassification/explainPrediction/modelEmbeddingActivations'

const sum = (t: tfjs.Tensor) => t.sum().dataSync()[0]

describe('LRP — reglas por capa', () => {

  beforeAll(async () => {
    await tfjs.setBackend('cpu')
  })

  test('Dense (epsilon, sin sesgo) conserva la relevancia', () => {
    const x = tfjs.tensor2d([[0.5, 1, 0.2, 0.8]])
    const w = tfjs.tensor2d([[0.3, -0.2], [0.1, 0.4], [-0.5, 0.2], [0.7, 0.1]])
    const r = tfjs.tensor2d([[1.5, 0.5]])

    const rIn = lrpDense(x, w, r)
    expect(rIn.shape).toStrictEqual([1, 4])
    expect(sum(rIn)).toBeCloseTo(sum(r), 5)
  })

  test('Dense (alpha-beta con α−β=1, sin sesgo) conserva la relevancia', () => {
    const x = tfjs.tensor2d([[0.5, 1, 0.2, 0.8]])
    const w = tfjs.tensor2d([[0.3, -0.2], [-0.1, 0.4], [-0.5, 0.2], [0.7, -0.1]])
    const r = tfjs.tensor2d([[1.5, 0.5]])

    const rIn = lrpDenseAlphaBeta(x, w, r, null, 2, 1)
    expect(sum(rIn)).toBeCloseTo(sum(r), 5)
  })

  test('Dense (alpha-beta) penaliza las entradas que contribuyen negativamente', () => {
    // Una salida; x0 contribuye positivamente y x1 negativamente.
    const x = tfjs.tensor2d([[1, 1]])
    const w = tfjs.tensor2d([[1], [-0.5]])
    const r = tfjs.tensor2d([[1]])

    const [r0, r1] = Array.from(lrpDenseAlphaBeta(x, w, r, null, 2, 1).dataSync())
    expect(r0).toBeCloseTo(2, 5)
    expect(r1).toBeCloseTo(-1, 5)
  })

  test('applyLRP usa la regla alpha-beta en capas Dense cuando se pide', () => {
    const x = tfjs.tensor2d([[1, 1]])
    const w = tfjs.tensor2d([[1], [-0.5]])
    const r = tfjs.tensor2d([[1]])
    const layer = { getWeights: () => [w] }

    const epsilon = applyLRP({ layerType: 'Dense', inputTensor: x, relevanceOut: r, layer })
    const alphaBeta = applyLRP({
      layerType   : 'Dense',
      inputTensor : x,
      relevanceOut: r,
      layer,
      options     : { rule: 'alpha_beta', alpha: 2, beta: 1 },
    })
    expect(Array.from(alphaBeta.dataSync())).not.toStrictEqual(Array.from(epsilon.dataSync()))
  })

  test('Conv2D (epsilon, stride 2, valid) conserva la relevancia', () => {
    const x = tfjs.randomUniform([1, 7, 7, 2], 0, 1, 'float32', 1) as tfjs.Tensor4D
    const kernel = tfjs.randomNormal([3, 3, 2, 3], 0, 1, 'float32', 2) as tfjs.Tensor4D
    const z = tfjs.conv2d(x, kernel, 2, 'valid')
    const r = z.abs()

    const rIn = lrpConv2D(x, kernel, r, { strides: [2, 2], padding: 'valid' })
    expect(rIn.shape).toStrictEqual(x.shape)
    expect(sum(rIn)).toBeCloseTo(sum(r), 3)
  })

  test('MaxPooling2D (winner-takes-all) lleva toda la relevancia a la neurona ganadora', () => {
    // 5×5 con pool 2 y padding valid: la última fila/columna no entra en ninguna ventana.
    const values = Array.from({ length: 25 }, (_, i) => (i * 7) % 25 + 1)
    const x = tfjs.tensor4d(values, [1, 5, 5, 1])
    const r = tfjs.tensor4d([1, 2, 3, 4], [1, 2, 2, 1])

    const rIn = lrpMaxPooling2D(x, r, { poolSize: [2, 2], strides: [2, 2], padding: 'valid' })
    expect(rIn.shape).toStrictEqual([1, 5, 5, 1])
    expect(sum(rIn)).toBeCloseTo(10, 5)

    const relevance = rIn.dataSync()
    const nonZero = Array.from(relevance).filter((v) => Math.abs(v) > 1e-6)
    expect(nonZero).toHaveLength(4) // una ganadora por ventana
    // Fila y columna 4 quedan fuera de las ventanas → relevancia 0.
    for (let k = 0; k < 5; k++) {
      expect(relevance[4 * 5 + k]).toBeCloseTo(0, 6)
      expect(relevance[k * 5 + 4]).toBeCloseTo(0, 6)
    }
  })

  test('MaxPooling2D sin winner-takes-all reparte en proporción a la activación', () => {
    const x = tfjs.tensor4d([1, 3, 2, 2], [1, 2, 2, 1])
    const r = tfjs.tensor4d([8], [1, 1, 1, 1])

    const rIn = lrpMaxPooling2D(x, r, { poolSize: [2, 2] }, false)
    expect(Array.from(rIn.dataSync()).map((v) => Number(v.toFixed(4)))).toStrictEqual([1, 3, 2, 2])
  })

  test('AveragePooling2D conserva la relevancia', () => {
    const x = tfjs.randomUniform([1, 6, 6, 2], 0.1, 1, 'float32', 3)
    const r = tfjs.randomUniform([1, 3, 3, 2], 0, 1, 'float32', 4)

    const rIn = lrpAvgPooling2D(x, r, { poolSize: [2, 2], strides: [2, 2], padding: 'valid' })
    expect(sum(rIn)).toBeCloseTo(sum(r), 4)
  })
})
