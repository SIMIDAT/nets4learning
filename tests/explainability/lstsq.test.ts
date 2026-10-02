import { describe, test, expect } from 'vitest'
import { matrix } from 'mathjs'
import { lstsq } from '../../src/core/explainability/webshap/explainer/lstsq'

// Mínimos cuadrados ponderados: (X'WX)⁻¹ X'WY. Con datos sin ruido, la solución es exacta sea cual sea el peso
const X = [[1, 0], [0, 1], [1, 1], [2, 1], [1, 3]]
const beta = [2, -1]
const Y = X.map((row) => [row[0] * beta[0] + row[1] * beta[1]])

describe('lstsq (KernelSHAP)', () => {

  test('con un peso por muestra (W diagonal) recupera los coeficientes', () => {
    const w = matrix([[1], [2], [0.5], [3], [1]])
    const result = lstsq(matrix(X), matrix(Y), w).toArray() as number[][]
    expect(result[0][0]).toBeCloseTo(2, 10)
    expect(result[1][0]).toBeCloseTo(-1, 10)
  })

  test('con W completa da lo mismo que con su diagonal', () => {
    const weights = [1, 2, 0.5, 3, 1]
    const full = weights.map((value, i) => weights.map((_, j) => (i === j ? value : 0)))
    const fromVector = lstsq(matrix(X), matrix(Y), matrix(weights.map((value) => [value]))).toArray() as number[][]
    const fromMatrix = lstsq(matrix(X), matrix(Y), matrix(full)).toArray() as number[][]
    fromVector.forEach(([value], i) => expect(fromMatrix[i][0]).toBeCloseTo(value, 10))
  })

  test('con ruido, el peso decide qué muestras pesan más', () => {
    // La última muestra se aleja de la recta; con poco peso apenas mueve la solución
    const noisyY = [...Y.slice(0, 4), [Y[4][0] + 10]]
    const light = lstsq(matrix(X), matrix(noisyY), matrix([[1], [1], [1], [1], [0.001]])).toArray() as number[][]
    const heavy = lstsq(matrix(X), matrix(noisyY), matrix([[1], [1], [1], [1], [100]])).toArray() as number[][]
    expect(Math.abs(light[1][0] - beta[1])).toBeLessThan(Math.abs(heavy[1][0] - beta[1]))
  })
})
