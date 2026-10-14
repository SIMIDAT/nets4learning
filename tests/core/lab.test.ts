import { describe, expect, test } from 'vitest'

import {
  boundaryGrid, createLabNetwork, evaluate, makeDataset, seededRandom, splitDataset, trainEpoch,
  type LabConfig_t, type LabDataset_t,
} from '@core/learning/lab'

const BASE: LabConfig_t = { features: ['x', 'y'], hidden: [], activation: 'tanh', learningRate: 0.1, batchSize: 10 }

/** Entrena `epochs` épocas y devuelve cómo va con los de entrenamiento y los de prueba en cada una */
function train(kind: LabDataset_t, config: LabConfig_t, { epochs = 300, noise = 0.1, count = 200 } = {}) {
  const { train: points, test } = splitDataset(makeDataset(kind, { count, noise, seed: 1 }))
  let network = createLabNetwork(config, 1)
  const random = seededRandom(101)
  const history: Array<{ train: ReturnType<typeof evaluate>, test: ReturnType<typeof evaluate> }> = []
  for (let epoch = 0; epoch < epochs; epoch++) {
    network = trainEpoch(network, points, config, random)
    history.push({ train: evaluate(network, points, config.features), test: evaluate(network, test, config.features) })
  }
  return { network, history, last: history.at(-1)! }
}

describe('el laboratorio 2D', () => {
  test('los conjuntos: la mitad de cada clase, dentro del plano y siempre iguales con la misma semilla', () => {
    for (const kind of ['blobs', 'circles', 'xor', 'spiral'] as const) {
      const points = makeDataset(kind, { count: 200, noise: 0.3, seed: 7 })
      expect(points).toHaveLength(200)
      expect(points.filter(({ label }) => label === 1)).toHaveLength(100)
      expect(points.every(({ x, y }) => Math.abs(x) <= 1 && Math.abs(y) <= 1)).toBe(true)
      expect(makeDataset(kind, { count: 200, noise: 0.3, seed: 7 })).toEqual(points)
    }
  })

  test('la rejilla de la frontera: una probabilidad por celda, de 0 a 1', () => {
    const grid = boundaryGrid(createLabNetwork({ ...BASE, hidden: [3] }), ['x', 'y'], 10)
    expect(grid).toHaveLength(100)
    expect([...grid].every((value) => value >= 0 && value <= 1)).toBe(true)
  })

  // Lo que enseña cada «Prueba esto» de la página
  test('XOR sin capas ocultas: una recta no lo separa; con una capa de 4 neuronas, sí', () => {
    expect(train('xor', BASE).last.test.accuracy).toBeLessThan(0.7)
    expect(train('xor', { ...BASE, hidden: [4] }).last.test.accuracy).toBeGreaterThan(0.9)
  })

  test('círculos: sin capas no se separan con x e y, pero sí con x² e y²', () => {
    expect(train('circles', BASE, { epochs: 200 }).last.test.accuracy).toBeLessThan(0.7)
    expect(train('circles', { ...BASE, features: ['x2', 'y2'] }, { epochs: 200 }).last.test.accuracy).toBeGreaterThan(0.95)
  })

  test('la espiral: con más características, dos capas de 8 y paciencia', () => {
    const { last } = train('spiral', { ...BASE, features: ['x', 'y', 'x2', 'y2', 'xy'], hidden: [8, 8] }, { count: 400, epochs: 700 })
    expect(last.test.accuracy).toBeGreaterThan(0.9)
  })

  test('una tasa de aprendizaje enorme hace que la pérdida vaya a saltos', () => {
    const rises = (history: ReturnType<typeof train>['history']) =>
      history.slice(1).filter(({ train: now }, index) => now.loss > history[index].train.loss * 1.2).length
    expect(rises(train('xor', { ...BASE, hidden: [4], learningRate: 3 }).history)).toBeGreaterThan(10)
    expect(rises(train('xor', { ...BASE, hidden: [4] }).history)).toBeLessThan(3)
  })

  test('pocos puntos, mucho ruido y una red grande: se los aprende de memoria (sobreajuste)', () => {
    const { history, last } = train('circles', { ...BASE, hidden: [8, 8, 8], activation: 'relu' }, { noise: 0.45, count: 60, epochs: 800 })
    const bestTest = Math.min(...history.map(({ test }) => test.loss))
    expect(last.train.accuracy).toBeGreaterThan(0.95)
    expect(last.test.loss).toBeGreaterThan(2 * bestTest)
  })
})
