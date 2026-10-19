import type * as tfjs from '@tensorflow/tfjs'

import type { StepNetwork_t } from './stepByStep'

/**
 * Los pesos de un modelo ya entrenado, para enseñarlo paso a paso (N4LStepByStep). Solo redes de capas densas: si
 * tiene otras (convolucionales, de agrupación…) no se puede dibujar así y da null. TF.js guarda el kernel como
 * [entradas][neuronas]; aquí va al revés, una fila de pesos por neurona. Lectura asíncrona: con WebGPU las síncronas
 * detienen la GPU.
 */
export async function networkFromModel(model: tfjs.LayersModel): Promise<StepNetwork_t | null> {
  const dense = model.layers.filter((layer) => layer.getClassName() !== 'InputLayer')
  if (dense.length === 0 || dense.some((layer) => layer.getClassName() !== 'Dense')) return null
  const layers: StepNetwork_t['layers'] = []
  const weights: number[][][] = []
  const biases: number[][] = []
  for (const layer of dense) {
    const [kernel, bias] = layer.getWeights()
    const matrix = await kernel.array() as number[][]
    const units = kernel.shape[1] ?? 0
    layers.push({ units, activation: String(layer.getConfig().activation ?? 'linear') })
    weights.push(Array.from({ length: units }, (_, j) => matrix.map((row) => row[j])))
    biases.push(bias === undefined ? new Array<number>(units).fill(0) : await bias.array() as number[])
  }
  return { inputs: dense[0].getWeights()[0].shape[0] ?? 0, layers, weights, biases }
}
