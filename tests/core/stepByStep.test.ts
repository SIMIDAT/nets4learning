import { describe, test, expect } from 'vitest'
import { TYPE_ACTIVATION } from '@core/nn-utils/ArchitectureTypesHelper'
import {
  backward, countNodes, forward, initNetwork, lossOf, MAX_STEP_NODES, stepPhases, update,
  type StepLayer_t, type StepLoss_t, type StepNetwork_t,
} from '@core/nn-utils/stepByStep'

/** El gradiente de un peso medido a mano: cuánto cambia la pérdida al mover el peso un poquito */
function numericGradient(network: StepNetwork_t, input: number[], target: number[], kind: StepLoss_t, l: number, j: number, i: number) {
  const h = 1e-6
  const shifted = (delta: number) => {
    const weights = network.weights.map((layer) => layer.map((row) => [...row]))
    weights[l][j][i] += delta
    const trace = forward({ ...network, weights }, input)
    return lossOf(kind, trace.a.at(-1)!, target)
  }
  return (shifted(h) - shifted(-h)) / (2 * h)
}

const INPUT = [0.3, -0.7, 0.9]

describe('stepByStep: una red pequeña calculada a mano', () => {
  // Las activaciones del editor de capas, todas
  test.each(TYPE_ACTIVATION.map(({ key }) => key))('la retropropagación con %s da los mismos gradientes que medirlos a mano', (activation) => {
    const kind: StepLoss_t = activation === 'softmax' ? 'cross-entropy' : 'mse'
    const layers: StepLayer_t[] = [{ units: 4, activation }, { units: 2, activation: kind === 'cross-entropy' ? 'softmax' : 'linear' }]
    const network = initNetwork(3, layers, 7)
    const target = kind === 'cross-entropy' ? [0, 1] : [0.4, -0.2]
    const gradients = backward(network, forward(network, INPUT), target, kind)
    for (const [l, j, i] of [[0, 0, 0], [0, 3, 2], [1, 1, 3], [1, 0, 1]]) {
      expect(gradients.gradWeights[l][j][i]).toBeCloseTo(numericGradient(network, INPUT, target, kind, l, j, i), 5)
    }
  })

  test('con softmax y entropía cruzada, el delta de la salida es probabilidad menos objetivo', () => {
    const network = initNetwork(3, [{ units: 5, activation: 'relu' }, { units: 3, activation: 'softmax' }])
    const trace = forward(network, INPUT)
    const target = [0, 0, 1]
    const { deltas } = backward(network, trace, target, 'cross-entropy')
    trace.a[1].forEach((p, k) => expect(deltas[1][k]).toBeCloseTo(p - target[k], 10))
    // Las probabilidades suman 1
    expect(trace.a[1].reduce((sum, p) => sum + p, 0)).toBeCloseTo(1, 10)
  })

  test('un paso de descenso del gradiente baja la pérdida de ese ejemplo', () => {
    for (const kind of ['cross-entropy', 'mse'] as const) {
      const layers: StepLayer_t[] = [{ units: 6, activation: 'tanh' }, { units: kind === 'mse' ? 1 : 3, activation: kind === 'mse' ? 'linear' : 'softmax' }]
      const network = initNetwork(3, layers)
      const target = kind === 'mse' ? [0.8] : [1, 0, 0]
      const trace = forward(network, INPUT)
      const before = lossOf(kind, trace.a.at(-1)!, target)
      const after = update(network, backward(network, trace, target, kind), 0.1)
      expect(lossOf(kind, forward(after, INPUT).a.at(-1)!, target)).toBeLessThan(before)
      // La red de antes no cambia: cada paso se puede volver a enseñar
      expect(forward(network, INPUT).a).toEqual(trace.a)
    }
  })

  test('los pesos iniciales son los mismos con la misma semilla, y del tamaño de cada capa', () => {
    const layers: StepLayer_t[] = [{ units: 10, activation: 'relu' }, { units: 3, activation: 'softmax' }]
    expect(initNetwork(4, layers, 1)).toEqual(initNetwork(4, layers, 1))
    expect(initNetwork(4, layers, 1).weights).not.toEqual(initNetwork(4, layers, 2).weights)
    const { weights, biases } = initNetwork(4, layers)
    expect(weights.map((layer) => [layer.length, layer[0].length])).toEqual([[10, 4], [3, 10]])
    expect(biases).toEqual([new Array(10).fill(0), new Array(3).fill(0)])
    // Glorot uniforme: |w| ≤ √(6 / (entradas + salidas))
    expect(Math.max(...weights[0].flat().map(Math.abs))).toBeLessThanOrEqual(Math.sqrt(6 / 14))
  })

  test('cuenta los nodos de la red (entradas y neuronas) y el límite es 64', () => {
    // IRIS por defecto: 4 entradas, 10 + 10 + 3 neuronas
    expect(countNodes(4, [{ units: 10, activation: 'relu' }, { units: 10, activation: 'relu' }, { units: 3, activation: 'softmax' }])).toBe(27)
    expect(MAX_STEP_NODES).toBe(64)
  })

  test('las fases: entrada, cada capa hacia delante, error, cada capa hacia atrás desde la salida y actualización', () => {
    expect(stepPhases(2)).toEqual([
      { kind: 'input' },
      { kind: 'forward', layer: 0 },
      { kind: 'forward', layer: 1 },
      { kind: 'loss' },
      { kind: 'backward', layer: 1 },
      { kind: 'backward', layer: 0 },
      { kind: 'update' },
    ])
  })
})

describe('networkFromModel: los pesos de un modelo de TF.js ya entrenado', () => {
  test('con sus pesos, el paso hacia delante da lo mismo que model.predict', async () => {
    const tf = await import('@tensorflow/tfjs')
    const { networkFromModel } = await import('@core/nn-utils/stepByStepModel')
    await tf.setBackend('cpu')
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [3], units: 4, activation: 'tanh' }),
        tf.layers.dense({ units: 2, activation: 'softmax' }),
      ],
    })
    const network = await networkFromModel(model)
    expect(network).not.toBeNull()
    expect(network!.inputs).toBe(3)
    expect(network!.layers).toEqual([{ units: 4, activation: 'tanh' }, { units: 2, activation: 'softmax' }])
    const expected = Array.from(await (model.predict(tf.tensor2d([INPUT])) as import('@tensorflow/tfjs').Tensor).data())
    forward(network!, INPUT).a.at(-1)!.forEach((value, k) => expect(value).toBeCloseTo(expected[k], 5))
  })

  test('una red que no es solo de capas densas no se puede enseñar así', async () => {
    const tf = await import('@tensorflow/tfjs')
    const { networkFromModel } = await import('@core/nn-utils/stepByStepModel')
    const model = tf.sequential({ layers: [tf.layers.flatten({ inputShape: [2, 2] }), tf.layers.dense({ units: 2 })] })
    expect(await networkFromModel(model)).toBeNull()
  })
})
