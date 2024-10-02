import * as _tfjs from '@tensorflow/tfjs'
/**
 * 
 * @param {string} id_optimizer 
 * @returns {JSX.Element | string}
 */
export const parseIDOptimizer = (id_optimizer) => {
  const trainMap = {
    // without prefix
    'sgd'           : <>SGD</>,
    'momentum'      : <>Momentum</>,
    'adagrad'       : <>Adagrad</>,
    'adadelta'      : <>Adadelta</>,
    'adamax'        : <>Adamax</>,
    'adam'          : <>Adam</>,
    'rmsprop'       : <>RMSProp</>,
    // with prefix
    'train-sgd'     : <>SGD</>,
    'train-momentum': <>Momentum</>,
    'train-adagrad' : <>Adagrad</>,
    'train-adadelta': <>Adadelta</>,
    'train-adamax'  : <>Adamax</>,
    'train-adam'    : <>Adam</>,
    'train-rmsprop' : <>RMSProp</>,
  }

  const result = trainMap[id_optimizer] 
  if (!result) {
    console.warn('parseIDOptimizer(id_optimizer)', { id_optimizer })
    return id_optimizer
  }
  return result
}

/**
 * 
 * @param {string} id_loss 
 * @returns {JSX.Element | string}
 */
export const parseLossAndMetric = (id_loss) => {
  const lossAndMetricMap = {
    'accuracy'                           : <>Accuracy</>,
    // losses
    'losses-absoluteDifference'          : <>AbsoluteDifference</>,
    'losses-computeWeightedLoss'         : <>ComputeWeightedLoss</>,
    'losses-cosineDistance'              : <>CosineDistance</>,
    'losses-hingeLoss'                   : <>HingeLoss</>,
    'losses-huberLoss'                   : <>HuberLoss</>,
    'losses-logLoss'                     : <>LogLoss</>,
    'losses-meanSquaredError'            : <>MeanSquaredError</>,
    'losses-sigmoidCrossEntropy'         : <>SigmoidCrossEntropy</>,
    'losses-softmaxCrossEntropy'         : <>SoftmaxCrossEntropy</>,
    // metrics
    'metrics-accuracy'                   : <>Accuracy</>,
    'metrics-binaryAccuracy'             : <>BinaryAccuracy</>,
    'metrics-binaryCrossentropy'         : <>BinaryCrossentropy</>,
    'metrics-categoricalAccuracy'        : <>CategoricalAccuracy</>,
    'metrics-categoricalCrossentropy'    : <>CategoricalCrossentropy</>,
    'metrics-cosineProximity'            : <>CosineProximity</>,
    'metrics-meanAbsoluteError'          : <>MeanAbsoluteError</>,
    'metrics-meanAbsolutePercentageError': <>MeanAbsolutePercentageError</>,
    'metrics-meanSquaredError'           : <>MeanSquaredError</>,
    'metrics-precision'                  : <>Precision</>,
    'metrics-recall'                     : <>Recall</>,
    'metrics-sparseCategoricalAccuracy'  : <>SparseCategoricalAccuracy</>,
  }

  const result = lossAndMetricMap[id_loss] 
  if (!result) {
    console.warn('parseLossAndMetric(id_loss)', { id_loss })
    return id_loss
  }
  return result
}
/**
 * 
 * @param {Array} logs 
 * @returns 
 */
export const parseLogs = (logs) => {
  return parseFloat(logs.at(-1)).toFixed(2)
}
