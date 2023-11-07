import { isProduction } from '@utils/utils'
import * as tf from '@tensorflow/tfjs'

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
 * @param idOptimizer
 * @param params
 * @returns {Optimizer_t} optimizador
 */
export function createOptimizer (idOptimizer, params) {
  if (!isProduction()) console.debug('>> createOptimizer', { idOptimizer, params })

  let { learningRate = 0.01 } = params
  switch (idOptimizer) {
    case 'sgd':
      return tf.train.sgd(learningRate)
    case 'momentum':
      const { momentum = 0.99 } = params
      return tf.train.momentum(learningRate, momentum)
    case 'adagrad':
      return tf.train.adagrad(learningRate)
    case 'adadelta':
      return tf.train.adadelta(learningRate)
    case 'adam':
      return tf.train.adam(learningRate)
    case 'adamax':
      return tf.train.adamax(learningRate)
    case 'rmsprop':
      return tf.train.rmsprop(learningRate)

    default:
      console.warn('createOptimizer()', { idOptimizer, params })
      return tf.train.adam(learningRate)
  }
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
 * @param idLoss
 * @param params
 * @returns {Loss_t} loss
 */
export function createLoss (idLoss, params) {
  if (!isProduction()) console.debug('>> createLoss', { idLoss, params })
  //
  // https://github.com/tensorflow/tfjs/issues/1315
  switch (idLoss) {
    // Losses
    case 'losses-absoluteDifference':
      return tf.losses.absoluteDifference
    case 'losses-computeWeightedLoss':
      return tf.losses.computeWeightedLoss
    case 'losses-cosineDistance':
      return tf.losses.cosineDistance
    case 'losses-hingeLoss':
      return tf.losses.hingeLoss
    case 'losses-huberLoss':
      return tf.losses.huberLoss
    case 'losses-logLoss':
      return tf.losses.logLoss
    case 'losses-meanSquaredError':
      return tf.losses.meanSquaredError
    case 'losses-sigmoidCrossEntropy':
      return tf.losses.sigmoidCrossEntropy
    case 'losses-softmaxCrossEntropy':
      return tf.losses.softmaxCrossEntropy
    // Metric
    case 'metrics-binaryAccuracy':
      return tf.metrics.binaryAccuracy
    case 'metrics-binaryCrossentropy':
      return tf.metrics.binaryCrossentropy
    case 'metrics-categoricalAccuracy':
      return tf.metrics.categoricalAccuracy
    case 'metrics-categoricalCrossentropy':
      return tf.metrics.categoricalCrossentropy
    case 'metrics-cosineProximity':
      return tf.metrics.cosineProximity
    case 'metrics-meanAbsoluteError':
      return tf.metrics.meanAbsoluteError
    case 'metrics-meanAbsolutePercentageError':
      return tf.metrics.meanAbsolutePercentageError
    case 'metrics-meanSquaredError':
      return tf.metrics.meanSquaredError
    case 'metrics-precision':
      return tf.metrics.precision
    case 'metrics-recall':
      return tf.metrics.recall
    case 'metrics-sparseCategoricalAccuracy':
      return tf.metrics.sparseCategoricalAccuracy

    default:
      console.warn('createLoss()', { idLoss })
      return 'categoricalCrossentropy'
  }
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
 * @param idMetrics
 * @param params
 * @returns {Metric_t} metric
 */
export function createMetrics (idMetrics, params) {
  if (!isProduction()) console.debug('>> createMetrics', { idMetrics, params })

  switch (idMetrics) {
    case 'binaryAccuracy':
      return [tf.metrics.binaryAccuracy]
    case 'binaryCrossentropy':
      return [tf.metrics.binaryCrossentropy]
    case 'categoricalAccuracy':
      return [tf.metrics.categoricalAccuracy]
    case 'categoricalCrossentropy':
      return [tf.metrics.categoricalCrossentropy]
    case 'cosineProximity':
      return [tf.metrics.cosineProximity]
    case 'meanAbsoluteError':
      return [tf.metrics.meanAbsoluteError]
    case 'meanAbsolutePercentageError':
      return [tf.metrics.meanAbsolutePercentageError]
    case 'meanSquaredError':
      return [tf.metrics.meanSquaredError]
    case 'precision':
      return [tf.metrics.precision]
    case 'recall':
      return [tf.metrics.recall]
    case 'sparseCategoricalAccuracy':
      return [tf.metrics.sparseCategoricalAccuracy]
    // DEFAULT Tensorflow js
    case 'accuracy':
      return ['accuracy']

    default:
      console.warn('createMetrics()', { idMetrics })
      return ['accuracy']
  }
}

export function createMetricsList (idMetricsList, params) {
  if (!isProduction()) console.debug('>> createMetricsList', { idMetricsList, params })

  const metricMap = {
    'binaryAccuracy'             : tf.metrics.binaryAccuracy,
    'binaryCrossentropy'         : tf.metrics.binaryCrossentropy,
    'categoricalAccuracy'        : tf.metrics.categoricalAccuracy,
    'categoricalCrossentropy'    : tf.metrics.categoricalCrossentropy,
    'cosineProximity'            : tf.metrics.cosineProximity,
    'meanAbsoluteError'          : tf.metrics.meanAbsoluteError,
    'meanAbsolutePercentageError': tf.metrics.meanAbsolutePercentageError,
    'meanSquaredError'           : tf.metrics.meanSquaredError,
    'precision'                  : tf.metrics.precision,
    'recall'                     : tf.metrics.recall,
    'sparseCategoricalAccuracy'  : tf.metrics.sparseCategoricalAccuracy,
    'accuracy'                   : 'accuracy', // DEFAULT Tensorflow js
  }

  const metrics = idMetricsList.map((idMetric) => metricMap[idMetric] || 'accuracy')
  if (!isProduction()) console.debug(metrics)
  return metrics
}

