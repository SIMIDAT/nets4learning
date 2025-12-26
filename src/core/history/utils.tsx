import type { ReactNode } from 'react'
import type { IdLoss_t, IdLossAndMetric_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import * as tfjs from '@tensorflow/tfjs'


export const parseIDOptimizer = (id_optimizer: IdOptimizer_t) => {
  const trainMap: Record<IdOptimizer_t, ReactNode> = {
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

export const parseLoss = (id_loss: IdLoss_t) => {
  const lossMap: Record<IdLoss_t, ReactNode> = {
    // losses
    'absoluteDifference'        : <>AbsoluteDifference</>,
    'computeWeightedLoss'       : <>ComputeWeightedLoss</>,
    'cosineDistance'            : <>CosineDistance</>,
    'hingeLoss'                 : <>HingeLoss</>,
    'huberLoss'                 : <>HuberLoss</>,
    'logLoss'                   : <>LogLoss</>,
    'meanSquaredError'          : <>MeanSquaredError</>,
    'sigmoidCrossEntropy'       : <>SigmoidCrossEntropy</>,
    'softmaxCrossEntropy'       : <>SoftmaxCrossEntropy</>,
    'losses-absoluteDifference' : <>AbsoluteDifference</>,
    'losses-computeWeightedLoss': <>SoftmaxCrossEntropy</>,
    'losses-cosineDistance'     : <>SoftmaxCrossEntropy</>,
    'losses-hingeLoss'          : <>SoftmaxCrossEntropy</>,
    'losses-huberLoss'          : <>SoftmaxCrossEntropy</>,
    'losses-logLoss'            : <>SoftmaxCrossEntropy</>,
    'losses-meanSquaredError'   : <>SoftmaxCrossEntropy</>,
    'losses-sigmoidCrossEntropy': <>SoftmaxCrossEntropy</>,
    'losses-softmaxCrossEntropy': <>SoftmaxCrossEntropy</>,
  }

  const result = lossMap[id_loss]
  if (!result) {
    console.warn('parseLoss(id_loss)', { id_loss })
    return id_loss
  }
  return result
}

export const parseLossAndMetric = (id_loss_or_id_metric: IdLossAndMetric_t | IdLoss_t | IdMetric_t) => {
  const lossAndMetricMap: Record<IdLoss_t | IdMetric_t, any> = {
    'accuracy'                           : <>Accuracy</>,
    // losses
    'absoluteDifference'                 : <>AbsoluteDifference</>,
    'computeWeightedLoss'                : <>ComputeWeightedLoss</>,
    'cosineDistance'                     : <>CosineDistance</>,
    'hingeLoss'                          : <>HingeLoss</>,
    'huberLoss'                          : <>HuberLoss</>,
    'logLoss'                            : <>LogLoss</>,
    'meanSquaredError'                   : <>MeanSquaredError</>,
    'sigmoidCrossEntropy'                : <>SigmoidCrossEntropy</>,
    'softmaxCrossEntropy'                : <>SoftmaxCrossEntropy</>,
    // losses with prefix
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
    'binaryAccuracy'                     : <>BinaryAccuracy</>,
    'binaryCrossentropy'                 : <>BinaryCrossentropy</>,
    'categoricalAccuracy'                : <>CategoricalAccuracy</>,
    'categoricalCrossentropy'            : <>CategoricalCrossentropy</>,
    'cosineProximity'                    : <>CosineProximity</>,
    'meanAbsoluteError'                  : <>MeanAbsoluteError</>,
    'meanAbsolutePercentageError'        : <>MeanAbsolutePercentageError</>,
    'precision'                          : <>Precision</>,
    'recall'                             : <>Recall</>,
    'sparseCategoricalAccuracy'          : <>SparseCategoricalAccuracy</>,
    // metrics with prefix
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

  const result = lossAndMetricMap[id_loss_or_id_metric]
  if (!result) {
    console.warn('parseLossAndMetric(id_loss_or_id_metric)', { id_loss_or_id_metric })
    return id_loss_or_id_metric
  }
  return result
}

export const parseLogs = (logs: Array<number | string | tfjs.Tensor>) => {
  if (logs instanceof tfjs.Tensor) {
    console.log(logs.dataSync());
    return logs.dataSync()[logs.size - 1].toFixed(2)
  } 
  if (logs.length === 0) {
    console.log('logs is empty');
    return '0.00'
  }

  const last = logs[logs.length - 1]
  const value = typeof last === 'number' ? last : parseFloat(last.toString())

  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}
