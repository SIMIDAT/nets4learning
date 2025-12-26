import type { IdLoss_t, IdMetric_t } from '@/types/nn-types'
import * as _Types from '@core/types'

const DEFAULT_LEARNING_RATE = 1
const DEFAULT_NUMBER_EPOCHS = 10
const DEFAULT_TEST_SIZE = 10
const DEFAULT_ID_OPTIMIZATION = 'adam'
// TypeScript change: DEFAULT_ID_LOSS old metrics-categoricalCrossentropy
const DEFAULT_ID_LOSS: IdLoss_t = 'losses-meanSquaredError'
// TypeScript change: DEFAULT_ID_METRICS old accuracy
const DEFAULT_ID_METRICS: IdMetric_t = 'metrics-binaryAccuracy'
const DEFAULT_START_LAYER_UNITS = 10
const DEFAULT_START_LAYER_ACTIVATION = 'sigmoid'
const DEFAULT_END_LAYER_UNITS = 10
const DEFAULT_END_LAYER_ACTIVATION = 'softmax'
/**
 * @type {Array<_Types.Layer_t>} layerList
 */
const DEFAULT_LAYERS: _Types.Layer_t[] = [
  { _class: 'dense', units: DEFAULT_START_LAYER_UNITS, activation: DEFAULT_START_LAYER_ACTIVATION },
  { _class: 'dense', units: DEFAULT_END_LAYER_UNITS, activation: DEFAULT_END_LAYER_ACTIVATION },
]
// Por defecto dejamos la configuración óptima para el modelo del titanic
const DEFAULT_LAYERS_UPLOAD: _Types.Layer_t[] = [
  { _class: 'dense', units: 124, activation: 'relu' },
  { _class: 'dense', units: 64, activation: 'relu' },
  { _class: 'dense', units: 32, activation: 'relu' },
  { _class: 'dense', units: 2, activation: 'softmax' },
]

export {
  DEFAULT_LEARNING_RATE,
  DEFAULT_NUMBER_EPOCHS,
  DEFAULT_TEST_SIZE,
  DEFAULT_ID_OPTIMIZATION,
  DEFAULT_ID_LOSS,
  DEFAULT_ID_METRICS,
  DEFAULT_START_LAYER_UNITS,
  DEFAULT_START_LAYER_ACTIVATION,
  DEFAULT_END_LAYER_UNITS,
  DEFAULT_END_LAYER_ACTIVATION,
  DEFAULT_LAYERS,
  DEFAULT_LAYERS_UPLOAD
}