import { describe, test, expect } from 'vitest'
import * as tfjs from '@tensorflow/tfjs'
import { createMetrics, createMetricsList } from '../../src/core/nn-utils/ArchitectureHelper'
import { TYPE_METRICS } from '../../src/core/nn-utils/ArchitectureTypesHelper'
import type { IdMetric_t } from '../../src/types/nn-types'

const compile = (metrics: string | string[]) => {
  const model = tfjs.sequential({ layers: [tfjs.layers.dense({ units: 2, inputShape: [3], activation: 'softmax' })] })
  model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics })
}

describe('createMetrics', () => {
  // model.compile() lanza "Unknown metric" si el nombre no es uno de los que reconoce tfjs-layers
  test.each(TYPE_METRICS.map(({ key }) => key))('tfjs-layers compila la métrica %s, con y sin prefijo', (key) => {
    expect(() => compile(createMetrics(key as IdMetric_t, {}))).not.toThrow()
    expect(() => compile(createMetrics(`metrics-${key}` as IdMetric_t, {}))).not.toThrow()
    expect(() => compile(createMetricsList([key as IdMetric_t], {}))).not.toThrow()
  })

  test('traduce los nombres largos a los de tfjs-layers', () => {
    expect(createMetrics(['metrics-meanAbsoluteError', 'meanSquaredError'], {})).toStrictEqual(['mae', 'mse'])
  })
})
