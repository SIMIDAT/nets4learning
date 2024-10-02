import * as tfjs from '@tensorflow/tfjs'
import { isProduction } from '@utils/utils'

tfjs.metrics
/**
 * tf.train.
 * sgd
 * momentum
 * adadelta
 * adagrad
 * rmsprop
 * adamax
 * adam
 *
 * @typedef {Object} Optimizer_t
 *
 *
 * @param {string} idOptimizer
 * @param {{ learningRate: number, momentum: number }} params
 * @returns {Optimizer_t}
 */
export function createOptimizer (idOptimizer, params) {
  if (!isProduction()) console.debug('>> createOptimizer', { idOptimizer, params })

  let { learningRate = 0.01, momentum = 0.99 } = params
  const trainMap = {
    'sgd'           : tfjs.train.sgd(learningRate),
    'momentum'      : tfjs.train.momentum(learningRate, momentum),
    'adagrad'       : tfjs.train.adagrad(learningRate),
    'adadelta'      : tfjs.train.adadelta(learningRate),
    'adamax'        : tfjs.train.adamax(learningRate),
    'adam'          : tfjs.train.adam(learningRate),
    'rmsprop'       : tfjs.train.rmsprop(learningRate),
    'train-sgd'     : tfjs.train.sgd(learningRate),
    'train-momentum': tfjs.train.momentum(learningRate, momentum),
    'train-adagrad' : tfjs.train.adagrad(learningRate),
    'train-adadelta': tfjs.train.adadelta(learningRate),
    'train-adamax'  : tfjs.train.adamax(learningRate),
    'train-adam'    : tfjs.train.adam(learningRate),
    'train-rmsprop' : tfjs.train.rmsprop(learningRate),
  }
  const trainer = trainMap[idOptimizer]
  if (!trainer) {
    console.warn('createOptimizer()', { idOptimizer, params })
    return tfjs.train.adam(learningRate)
  }
  return trainer
}

/**
 * tf.losses.{}
 *
 * absoluteDifference
 * computeWeightedLoss
 * cosineDistance
 * hingeLoss
 * huberLoss
 * logLoss
 * meanSquaredError
 * sigmoidCrossEntropy
 * softmaxCrossEntropy
 *
 * @typedef {Object} Loss_t
 *
 *
 * @param {string} idLoss
 * @param {any} params
 * @returns {Loss_t} loss
 */
export function createLoss (idLoss, params) {
  if (!isProduction()) console.debug('>> createLoss', { idLoss, params })
  //
  // https://github.com/tensorflow/tfjs/issues/1315
  const lossAndMetricMap = {
    // losses
    'losses-absoluteDifference'          : tfjs.losses.absoluteDifference,
    'losses-computeWeightedLoss'         : tfjs.losses.computeWeightedLoss,
    'losses-cosineDistance'              : tfjs.losses.cosineDistance,
    'losses-hingeLoss'                   : tfjs.losses.hingeLoss,
    'losses-huberLoss'                   : tfjs.losses.huberLoss,
    'losses-logLoss'                     : tfjs.losses.logLoss,
    'losses-meanSquaredError'            : tfjs.losses.meanSquaredError,
    'losses-sigmoidCrossEntropy'         : tfjs.losses.sigmoidCrossEntropy,
    'losses-softmaxCrossEntropy'         : tfjs.losses.softmaxCrossEntropy,
    // metrics
    'metrics-binaryAccuracy'             : 'binaryAccuracy',
    'metrics-binaryCrossentropy'         : 'binaryCrossentropy',
    'metrics-categoricalAccuracy'        : 'categoricalAccuracy',
    'metrics-categoricalCrossentropy'    : 'categoricalCrossentropy',
    'metrics-cosineProximity'            : 'cosine',
    'metrics-meanAbsoluteError'          : 'mae',
    'metrics-meanAbsolutePercentageError': 'mape',
    'metrics-meanSquaredError'           : 'mse',
    'metrics-precision'                  : 'precision',
    'metrics-recall'                     : 'recall',
    'metrics-sparseCategoricalAccuracy'  : 'sparseCategoricalAccuracy',
  }
  
  const result = lossAndMetricMap[idLoss]
  if (!result) {
    console.warn('createLossOrMetric()', { idLoss })
    return 'categoricalCrossentropy' // Default fallback
  }
  return result
}

/**
 * 0  => binaryAccuracy
 * 1  => binaryCrossentropy
 * 2  => categoricalAccuracy
 * 3  => categoricalCrossentropy
 * 4  => cosineProximity             ==> cosine
 * 5  => meanAbsoluteError           ==> mae
 * 6  => meanAbsolutePercentageError ==> mape
 * 7  => meanSquaredError            ==> mse
 * 8  => precision
 * 9  => recall
 * 10 => sparseCategoricalAccuracy
 * 11 => accuracy
 *
 * @typedef {Object} Metric_t
 *
 *
 * @param {string|string[]} idMetrics
 * @param params
 * @returns {Metric_t} metric
 */export function createMetrics(idMetrics, params) {
  if (!isProduction()) {
    console.debug('>> createMetrics', { idMetrics, params })
  }
  const metricMap = {
    'binaryAccuracy'                     : tfjs.metrics.binaryAccuracy,
    'binaryCrossentropy'                 : tfjs.metrics.binaryCrossentropy,
    'categoricalAccuracy'                : 'categoricalAccuracy',
    'categoricalCrossentropy'            : 'categoricalCrossentropy',
    'cosineProximity'                    : 'cosine',
    'meanAbsoluteError'                  : 'mae',
    'meanAbsolutePercentageError'        : 'mape',
    'meanSquaredError'                   : 'mse',
    'precision'                          : 'precision',
    'recall'                             : tfjs.metrics.recall,
    'sparseCategoricalAccuracy'          : tfjs.metrics.sparseCategoricalAccuracy,
    'accuracy'                           : 'accuracy', // Default TensorFlow.js metric
    'metrics-binaryAccuracy'             : tfjs.metrics.binaryAccuracy,
    'metrics-binaryCrossentropy'         : tfjs.metrics.binaryCrossentropy,
    'metrics-categoricalAccuracy'        : 'categoricalAccuracy',
    'metrics-categoricalCrossentropy'    : 'categoricalCrossentropy',
    'metrics-cosineProximity'            : 'cosine',
    'metrics-meanAbsoluteError'          : 'mae',
    'metrics-meanAbsolutePercentageError': 'mape',
    'metrics-meanSquaredError'           : 'mse',
    'metrics-precision'                  : 'precision',
    'metrics-recall'                     : tfjs.metrics.recall,
    'metrics-sparseCategoricalAccuracy'  : tfjs.metrics.sparseCategoricalAccuracy,
    'metrics-accuracy'                   : 'accuracy',
  }
  const addMetric = (metric) => metricMap[metric] || (console.warn('createMetrics()', { metric }), 'accuracy')

  if (typeof idMetrics === 'string') {
    return addMetric(idMetrics)
  } else if (Array.isArray(idMetrics)) {
    return idMetrics.map(addMetric)
  }
}

export function createMetricsList (idMetricsList, params) {
  if (!isProduction()) console.debug('>> createMetricsList', { idMetricsList, params })

  const metricMap = {
    'binaryAccuracy'             : tfjs.metrics.binaryAccuracy,
    'binaryCrossentropy'         : tfjs.metrics.binaryCrossentropy,
    'categoricalAccuracy'        : 'categoricalAccuracy',
    'categoricalCrossentropy'    : 'categoricalCrossentropy',
    'cosineProximity'            : 'cosine',
    'meanAbsoluteError'          : 'mae',
    'meanAbsolutePercentageError': 'mape',
    'meanSquaredError'           : 'mse',
    'precision'                  : 'precision',
    'recall'                     : tfjs.metrics.recall,
    'sparseCategoricalAccuracy'  : tfjs.metrics.sparseCategoricalAccuracy,
    'accuracy'                   : 'accuracy', // Default Tensorflow.js
  }

  const metrics = idMetricsList.map((idMetric) => metricMap[idMetric] || 'accuracy')
  if (!isProduction()) console.debug(metrics)
  return metrics
}


export const FIT_CALLBACKS_METRICS_LABELS = [
// Always
'loss',
'val_loss',

// Function
'accuracy',
'val_accuracy',
// Macro 
'acc',
'val_acc',

// TODO
'binaryAccuracy',
'val_binaryAccuracy',

// TODO
'binaryCrossentropy',
'val_binaryCrossentropy',

// Macro And Function
'categoricalAccuracy',
'val_categoricalAccuracy',
// Macro And Function
'categoricalCrossentropy',
'val_categoricalCrossentropy',

// Function
'cosineProximity',
'val_cosineProximity',
// Macro
'cosine',
'val_cosine',

// Function
'meanAbsoluteError', 
'val_meanAbsoluteError', 
// Macro
'mae',
'val_mae', 

// Function
'meanAbsolutePercentageError',
'val_meanAbsolutePercentageError',
// Macro
'mape',
'val_mape',

// Function
'meanSquaredError',
'val_meanSquaredError',
// Macro
'mse',
'val_mse',

// Macro And Function
'precision',
'val_precision',

// Function
'recall',
'val_recall',

]