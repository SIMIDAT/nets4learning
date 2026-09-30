import type { IdOptimizer_t, LossMap_t, MetricMap_t } from "@/types/nn-types"

const TYPE_GRADIENTS = [
  { key: 'grad', label: 'grad' },
  { key: 'grads', label: 'grads' },
  { key: 'customGrad', label: 'customGrad' },
  { key: 'valueAndGrad', label: 'valueAndGrad' },
  { key: 'valueAndGrads', label: 'valueAndGrads' },
  { key: 'variableGrads', label: 'variableGrads' }
]

// Nombres que no siguen la regla general (la clave con la primera letra en mayúscula)
const SPECIAL_LABELS: Record<string, string> = { sgd: 'SGD', rmsprop: 'RMSProp' }

/**
 * Nombre legible de un optimizador, función de pérdida o métrica. La clave puede llevar prefijo
 * ("train-adam", "losses-logLoss", "metrics-recall"), como en los modelos generados.
 */
export function nnLabel(id: string): string {
  const key = id.replace(/^(train|losses|metrics)-/, '')
  return SPECIAL_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

const withLabels = <K extends string>(keys: K[]) => keys.map((key) => ({ key, label: nnLabel(key) }))

// Desactivado: 'momentum'
const TYPE_OPTIMIZER = withLabels<IdOptimizer_t>(['sgd', 'adagrad', 'adadelta', 'adam', 'adamax', 'rmsprop'])

// tf.losses.*
const TYPE_LOSSES = withLabels<keyof LossMap_t>([
  'absoluteDifference',
  'computeWeightedLoss',
  'cosineDistance',
  'hingeLoss',
  'huberLoss',
  'logLoss',
  'meanSquaredError',
  'sigmoidCrossEntropy',
  'softmaxCrossEntropy',
])

// tf.metrics.* — desactivadas: 'binaryAccuracy', 'binaryCrossentropy', 'recall', 'sparseCategoricalAccuracy'
const TYPE_METRICS = withLabels<keyof MetricMap_t>([
  'categoricalAccuracy',
  'categoricalCrossentropy',
  'cosineProximity',
  'meanAbsoluteError',
  'meanAbsolutePercentageError',
  'meanSquaredError',
  'precision',
  'accuracy',
])

const TYPE_ACTIVATION = [
  { key: 'sigmoid', label: 'Sigmoid' },
  { key: 'softmax', label: 'Softmax' },
  { key: 'elu', label: 'ELU' },
  { key: 'hardSigmoid', label: 'Hard Sigmoid' },
  { key: 'linear', label: 'Linear' },
  { key: 'relu', label: 'ReLU' },
  { key: 'relu6', label: 'ReLU6' },
  { key: 'selu', label: 'SeLU' },
  { key: 'softplus', label: 'SoftPlus' },
  { key: 'softsign', label: 'SoftSign' },
  { key: 'tanh', label: 'Tanh' },
  { key: 'swish', label: 'Swish' },
  { key: 'mish', label: 'Mish' },
]

const TYPE_CLASS = [
  { key: 'conv2d', label: 'Conv2D' },
  { key: 'maxPooling2d', label: 'MaxPooling2D' },
  { key: 'flatten', label: 'Flatten' },
  { key: 'dense', label: 'Dense' },
]

export {
  TYPE_GRADIENTS,
  TYPE_OPTIMIZER,
  TYPE_LOSSES,
  TYPE_METRICS,
  TYPE_ACTIVATION,
  TYPE_CLASS
}