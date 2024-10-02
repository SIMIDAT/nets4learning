const TYPE_GRADIENTS = [
  { key: 'grad', label: 'grad' },
  { key: 'grads', label: 'grads' },
  { key: 'customGrad', label: 'customGrad' },
  { key: 'valueAndGrad', label: 'valueAndGrad' },
  { key: 'valueAndGrads', label: 'valueAndGrads' },
  { key: 'variableGrads', label: 'variableGrads' }
]

const TYPE_OPTIMIZER = [
  { key: 'sgd', label: 'SGD' },
  { key: 'adagrad', label: 'Adagrad' },
  { key: 'adadelta', label: 'Adadelta' },
  { key: 'adam', label: 'Adam' },
  { key: 'adamax', label: 'Adamax' },
  { key: 'rmsprop', label: 'RMSProp' },
  // { key: 'momentum', label: 'Momentum' },
]

// tf.losses.absoluteDifference
// tf.losses.computeWeightedLoss
// tf.losses.cosineDistance
// tf.losses.hingeLoss
// tf.losses.huberLoss
// tf.losses.logLoss
// tf.losses.meanSquaredError
// tf.losses.sigmoidCrossEntropy
// tf.losses.softmaxCrossEntropy
const TYPE_LOSSES = [
  { key: 'absoluteDifference', label: 'AbsoluteDifference' },
  { key: 'computeWeightedLoss', label: 'ComputeWeightedLoss' },
  { key: 'cosineDistance', label: 'CosineDistance' },
  { key: 'hingeLoss', label: 'HingeLoss' },
  { key: 'huberLoss', label: 'HuberLoss' },
  { key: 'logLoss', label: 'LogLoss' },
  { key: 'meanSquaredError', label: 'MeanSquaredError' },
  { key: 'sigmoidCrossEntropy', label: 'SigmoidCrossEntropy' },
  { key: 'softmaxCrossEntropy', label: 'SoftmaxCrossEntropy' },
// Metrics
  { key: 'categoricalCrossentropy', label: 'CategoricalCrossentropy' }
]

// Metrics
// tf.metrics.binaryAccuracy
// tf.metrics.binaryCrossentropy
// tf.metrics.categoricalAccuracy
// tf.metrics.categoricalCrossentropy
// tf.metrics.cosineProximity
// tf.metrics.meanAbsoluteError
// tf.metrics.meanAbsolutePercentageError
// tf.metrics.meanSquaredError
// tf.metrics.precision
// tf.metrics.recall
// tf.metrics.sparseCategoricalAccuracy
const TYPE_METRICS = [
  // { key: 'binaryAccuracy', label: 'BinaryAccuracy' },
  // { key: 'binaryCrossentropy', label: 'BinaryCrossentropy' },
  { key: 'categoricalAccuracy', label: 'CategoricalAccuracy' },
  { key: 'categoricalCrossentropy', label: 'CategoricalCrossentropy' },
  { key: 'cosineProximity', label: 'CosineProximity' },
  { key: 'meanAbsoluteError', label: 'MeanAbsoluteError' },
  { key: 'meanAbsolutePercentageError', label: 'MeanAbsolutePercentageError' },
  { key: 'meanSquaredError', label: 'MeanSquaredError' },
  { key: 'precision', label: 'Precision' },
  // { key: 'recall', label: 'Recall' },
  // { key: 'sparseCategoricalAccuracy', label: 'SparseCategoricalAccuracy' },
  { key: 'accuracy', label: 'Accuracy' }
]

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