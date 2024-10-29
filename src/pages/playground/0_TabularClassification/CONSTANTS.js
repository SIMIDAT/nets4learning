import * as _Types from '@core/types'

const DEFAULT_LEARNING_RATE = 1
const DEFAULT_NUMBER_EPOCHS = 10
const DEFAULT_TEST_SIZE = 10
const DEFAULT_ID_OPTIMIZATION = 'adam'
const DEFAULT_ID_LOSS = 'metrics-categoricalCrossentropy'
const DEFAULT_ID_METRICS = 'accuracy'
const DEFAULT_START_LAYER_UNITS = 10
const DEFAULT_START_LAYER_ACTIVATION = 'sigmoid'
const DEFAULT_END_LAYER_UNITS = 10
const DEFAULT_END_LAYER_ACTIVATION = 'softmax'
/**
 * @type {Array<_Types.Layer_t>} layerList
 */
const DEFAULT_LAYERS = [
  { units: DEFAULT_START_LAYER_UNITS, activation: DEFAULT_START_LAYER_ACTIVATION },
  { units: DEFAULT_END_LAYER_UNITS, activation: DEFAULT_END_LAYER_ACTIVATION },
]
// Por defecto dejamos la configuración óptima para el modelo del titanic
const DEFAULT_LAYERS_UPLOAD = [
  { units: 124, activation: 'relu' },
  { units: 64, activation: 'relu' },
  { units: 32, activation: 'relu' },
  { units: 2, activation: 'softmax' },
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