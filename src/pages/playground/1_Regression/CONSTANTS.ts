import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from "@/types/nn-types"

// 0 - 1 --> 0 - 100
const DEFAULT_LEARNING_RATE = 0.01
// 1 - Inf(1000)
const DEFAULT_NUMBER_OF_EPOCHS = (import.meta.env.VITE_ENVIRONMENT === 'development') ? 5 : 50
// 0 - 1 --> 0 - 100
const DEFAULT_TEST_SIZE = 10
// TYPE_OPTIMIZER.key
const DEFAULT_ID_OPTIMIZER: IdOptimizer_t = 'train-rmsprop'
// TYPE_LOSSES.key
const DEFAULT_ID_LOSS: IdLoss_t = 'losses-meanSquaredError'
// TYPE_METRICS.key
const DEFAULT_ID_METRICS: IdMetric_t[] = ['metrics-meanAbsoluteError', 'metrics-meanSquaredError']
// 
const DEFAULT_LAYERS = [
  { is_disabled: false, units: 20, activation: 'sigmoid' },
  { is_disabled: false, units: 20, activation: 'sigmoid' },
  { is_disabled: true,  units: 1,  activation: 'linear'  },
]

export {
  DEFAULT_LEARNING_RATE,
  DEFAULT_NUMBER_OF_EPOCHS,
  DEFAULT_TEST_SIZE,

  DEFAULT_ID_OPTIMIZER,
  DEFAULT_ID_LOSS,
  DEFAULT_ID_METRICS,

  DEFAULT_LAYERS,
}