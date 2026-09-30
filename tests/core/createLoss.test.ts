import { describe, test, expect } from 'vitest'
import * as tfjs from '@tensorflow/tfjs'
import { createLoss } from '../../src/core/nn-utils/ArchitectureHelper'
import { TYPE_LOSSES } from '../../src/core/nn-utils/ArchitectureTypesHelper'

describe('createLoss', () => {

  // model.compile() lanza "Unknown loss" si el nombre no está en el lossesMap de tfjs-layers
  test.each(TYPE_LOSSES.map(({ key }) => key))('tfjs-layers compila la pérdida %s del selector', (key) => {
    const model = tfjs.sequential({ layers: [tfjs.layers.dense({ units: 2, inputShape: [3], activation: 'softmax' })] })
    expect(() => model.compile({ optimizer: 'adam', loss: createLoss(`losses-${key}`, {}) })).not.toThrow()
  })

  test('acepta el identificador con o sin prefijo', () => {
    expect(createLoss('losses-meanSquaredError', {})).toBe('meanSquaredError')
    expect(createLoss('categoricalCrossentropy', {})).toBe('categoricalCrossentropy')
  })
})
