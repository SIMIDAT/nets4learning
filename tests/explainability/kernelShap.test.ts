import { describe, test, expect, beforeAll } from 'vitest'
import * as tfjs from '@tensorflow/tfjs'
import { KernelSHAP } from '../../src/core/explainability/webshap'

// Modelo lineal con dos salidas: para un modelo lineal y un background de una fila,
// el valor SHAP exacto de cada variable es w_i · (x_i − bg_i).
const W = [
  [2, -1, 0.5, 3],
  [-1, 4, 1, 0],
]
const B = [0.5, -2]
const linear = async (x: number[][]): Promise<number[][]> =>
  x.map((row) => W.map((w, k) => w.reduce((acc, wi, i) => acc + wi * row[i], B[k])))

describe('KernelSHAP (copia local de webshap)', () => {

  beforeAll(async () => {
    await tfjs.setBackend('cpu')
  })

  test('recupera los valores SHAP exactos de un modelo lineal', async () => {
    const background = [[0, 0, 0, 0]]
    const instance = [1, 2, -1, 0.5]
    const explainer = new KernelSHAP(linear, background, 0.2022)
    const shap = await explainer.explainOneInstance(instance, 64)

    W.forEach((w, k) => {
      w.forEach((wi, i) => expect(shap[k][i]).toBeCloseTo(wi * (instance[i] - background[0][i]), 4))
    })
  })

  test('la suma de los valores SHAP es f(x) − f(background) (eficiencia)', async () => {
    const background = [[1, 1, 1, 1]]
    const instance = [3, -2, 0, 5]
    const explainer = new KernelSHAP(linear, background, 0.2022)
    const shap = await explainer.explainOneInstance(instance, 64)
    const [fx] = await linear([instance])
    const [fb] = await linear(background)

    shap.forEach((values, k) => {
      expect(values.reduce((a, b) => a + b, 0)).toBeCloseTo(fx[k] - fb[k], 4)
    })
  })
})
