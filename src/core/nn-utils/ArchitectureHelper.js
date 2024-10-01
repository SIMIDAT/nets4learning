import { isProduction } from '@utils/utils'
import * as tfjs from '@tensorflow/tfjs'

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
 * @returns {Optimizer_t} optimizador
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
    'metrics-binaryAccuracy'             : tfjs.metrics.binaryAccuracy,
    'metrics-binaryCrossentropy'         : tfjs.metrics.binaryCrossentropy,
    'metrics-categoricalAccuracy'        : tfjs.metrics.categoricalAccuracy,
    'metrics-categoricalCrossentropy'    : tfjs.metrics.categoricalCrossentropy,
    'metrics-cosineProximity'            : tfjs.metrics.cosineProximity,
    'metrics-meanAbsoluteError'          : tfjs.metrics.meanAbsoluteError,
    'metrics-meanAbsolutePercentageError': tfjs.metrics.meanAbsolutePercentageError,
    'metrics-meanSquaredError'           : tfjs.metrics.meanSquaredError,
    'metrics-precision'                  : tfjs.metrics.precision,
    'metrics-recall'                     : tfjs.metrics.recall,
    'metrics-sparseCategoricalAccuracy'  : tfjs.metrics.sparseCategoricalAccuracy,
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
 * 4  => cosineProximity
 * 5  => meanAbsoluteError
 * 6  => meanAbsolutePercentageError
 * 7  => meanSquaredError
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
    'categoricalAccuracy'                : tfjs.metrics.categoricalAccuracy,
    'categoricalCrossentropy'            : tfjs.metrics.categoricalCrossentropy,
    'cosineProximity'                    : tfjs.metrics.cosineProximity,
    'meanAbsoluteError'                  : tfjs.metrics.meanAbsoluteError,
    'meanAbsolutePercentageError'        : tfjs.metrics.meanAbsolutePercentageError,
    'meanSquaredError'                   : tfjs.metrics.meanSquaredError,
    'precision'                          : tfjs.metrics.precision,
    'recall'                             : tfjs.metrics.recall,
    'sparseCategoricalAccuracy'          : tfjs.metrics.sparseCategoricalAccuracy,
    'metrics-binaryAccuracy'             : tfjs.metrics.binaryAccuracy,
    'metrics-binaryCrossentropy'         : tfjs.metrics.binaryCrossentropy,
    'metrics-categoricalAccuracy'        : tfjs.metrics.categoricalAccuracy,
    'metrics-categoricalCrossentropy'    : tfjs.metrics.categoricalCrossentropy,
    'metrics-cosineProximity'            : tfjs.metrics.cosineProximity,
    'metrics-meanAbsoluteError'          : tfjs.metrics.meanAbsoluteError,
    'metrics-meanAbsolutePercentageError': tfjs.metrics.meanAbsolutePercentageError,
    'metrics-meanSquaredError'           : tfjs.metrics.meanSquaredError,
    'metrics-precision'                  : tfjs.metrics.precision,
    'metrics-recall'                     : tfjs.metrics.recall,
    'metrics-sparseCategoricalAccuracy'  : tfjs.metrics.sparseCategoricalAccuracy,
    'accuracy'                           : 'accuracy' // Default TensorFlow.js metric
  }
  const addMetric = (metric) => metricMap[metric] || (console.warn('createMetrics()', { metric }), 'accuracy')

  if (typeof idMetrics === 'string') {
    return addMetric(idMetrics)
  } else if (Array.isArray(idMetrics)) {
    return idMetrics.forEach(addMetric)
  }
}

export function createMetricsList (idMetricsList, params) {
  if (!isProduction()) console.debug('>> createMetricsList', { idMetricsList, params })

  const metricMap = {
    'binaryAccuracy'             : tfjs.metrics.binaryAccuracy,
    'binaryCrossentropy'         : tfjs.metrics.binaryCrossentropy,
    'categoricalAccuracy'        : tfjs.metrics.categoricalAccuracy,
    'categoricalCrossentropy'    : tfjs.metrics.categoricalCrossentropy,
    'cosineProximity'            : tfjs.metrics.cosineProximity,
    'meanAbsoluteError'          : tfjs.metrics.meanAbsoluteError,
    'meanAbsolutePercentageError': tfjs.metrics.meanAbsolutePercentageError,
    'meanSquaredError'           : tfjs.metrics.meanSquaredError,
    'precision'                  : tfjs.metrics.precision,
    'recall'                     : tfjs.metrics.recall,
    'sparseCategoricalAccuracy'  : tfjs.metrics.sparseCategoricalAccuracy,
    'accuracy'                   : 'accuracy', // Default Tensorflow.js
  }

  const metrics = idMetricsList.map((idMetric) => metricMap[idMetric] || 'accuracy')
  if (!isProduction()) console.debug(metrics)
  return metrics
}

