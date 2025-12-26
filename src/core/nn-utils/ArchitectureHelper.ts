import type { IdLoss_t, IdLossAndMetric_t, IdMetric_t, IdOptimizer_t, LossAndMetricMap_t, LossMap_t, MetricMap_t, TrainMap_t } from '@/types/nn-types';
import * as tfjs from '@tensorflow/tfjs'
import { isProduction } from '@utils/utils'

type Params_t = {
  learningRate?: number;
  momentum?    : number;
}
const DEFAULT_PARAMS: Params_t = {
  learningRate: 0.01,
  momentum    : 0.99,
}


/**
 *
 * @param {IdOptimizer_t} idOptimizer
 * @param {{ learningRate: number, momentum: number }} params
 * @returns {Optimizer_t}
 */
export function createOptimizer(idOptimizer: IdOptimizer_t, params: Params_t = DEFAULT_PARAMS): tfjs.Optimizer {
  if (!isProduction()) console.debug('>> createOptimizer', { idOptimizer, params })

  const { learningRate, momentum } = params
  if (learningRate === undefined) {
    throw new Error('createOptimizer(): learningRate is undefined')
  }
  if (momentum === undefined) {
    throw new Error('createOptimizer(): momentum is undefined')
  }
  const trainMap: TrainMap_t = {
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
 *
 * @param {string} idLoss
 * @param {any} params
 * @returns {Loss_t} loss
 */
export function createLoss(idLoss: IdLoss_t, params: any) {
  if (!isProduction()) console.debug('>> createLoss', { idLoss, params })
  //

  // https://github.com/tensorflow/tfjs/issues/1315
  const lossMap: LossMap_t = {
    // losses
    // 'losses-absoluteDifference'          : tfjs.losses.absoluteDifference,
    // 'losses-computeWeightedLoss'         : tfjs.losses.computeWeightedLoss,
    // 'losses-cosineDistance'              : tfjs.losses.cosineDistance,
    // 'losses-hingeLoss'                   : tfjs.losses.hingeLoss,
    // 'losses-huberLoss'                   : tfjs.losses.huberLoss,
    // 'losses-logLoss'                     : tfjs.losses.logLoss,
    // 'losses-meanSquaredError'            : tfjs.losses.meanSquaredError,
    // 'losses-sigmoidCrossEntropy'         : tfjs.losses.sigmoidCrossEntropy,
    // 'losses-softmaxCrossEntropy'         : tfjs.losses.softmaxCrossEntropy,
    'absoluteDifference'        : 'absoluteDifference',
    'computeWeightedLoss'       : 'computeWeightedLoss',
    'cosineDistance'            : 'cosineDistance',
    'hingeLoss'                 : 'hingeLoss',
    'huberLoss'                 : 'huberLoss',
    'logLoss'                   : 'logLoss',
    'meanSquaredError'          : 'meanSquaredError',
    'sigmoidCrossEntropy'       : 'sigmoidCrossEntropy',
    'softmaxCrossEntropy'       : 'softmaxCrossEntropy',
    'losses-absoluteDifference' : 'absoluteDifference',
    'losses-computeWeightedLoss': 'computeWeightedLoss',
    'losses-cosineDistance'     : 'cosineDistance',
    'losses-hingeLoss'          : 'hingeLoss',
    'losses-huberLoss'          : 'huberLoss',
    'losses-logLoss'            : 'logLoss',
    'losses-meanSquaredError'   : 'meanSquaredError',
    'losses-sigmoidCrossEntropy': 'sigmoidCrossEntropy',
    'losses-softmaxCrossEntropy': 'softmaxCrossEntropy',

  }

  const result = lossMap[idLoss]
  if (!result) {
    console.warn('createLoss()', { idLoss })
    return 'categoricalCrossentropy' // Default fallback
  }
  return result
}

/**
 *
 * @param {string} idLoss
 * @param {any} params
 * @returns {Loss_t} loss
 */
export function createLossAndMetrics(idLossAndMetric_t: IdLossAndMetric_t, params: any) {
  if (!isProduction()) console.debug('>> createLossAndMetrics', { idLossAndMetric_t, params })
  //

  // https://github.com/tensorflow/tfjs/issues/1315
  const lossAndMetricMap: LossAndMetricMap_t = {
    // losses
    // 'losses-absoluteDifference'          : tfjs.losses.absoluteDifference,
    // 'losses-computeWeightedLoss'         : tfjs.losses.computeWeightedLoss,
    // 'losses-cosineDistance'              : tfjs.losses.cosineDistance,
    // 'losses-hingeLoss'                   : tfjs.losses.hingeLoss,
    // 'losses-huberLoss'                   : tfjs.losses.huberLoss,
    // 'losses-logLoss'                     : tfjs.losses.logLoss,
    // 'losses-meanSquaredError'            : tfjs.losses.meanSquaredError,
    // 'losses-sigmoidCrossEntropy'         : tfjs.losses.sigmoidCrossEntropy,
    // 'losses-softmaxCrossEntropy'         : tfjs.losses.softmaxCrossEntropy,

    'losses-absoluteDifference'          : 'absoluteDifference',
    'losses-computeWeightedLoss'         : 'computeWeightedLoss',
    'losses-cosineDistance'              : 'cosineDistance',
    'losses-hingeLoss'                   : 'hingeLoss',
    'losses-huberLoss'                   : 'huberLoss',
    'losses-logLoss'                     : 'logLoss',
    'losses-meanSquaredError'            : 'meanSquaredError',
    'losses-sigmoidCrossEntropy'         : 'sigmoidCrossEntropy',
    'losses-softmaxCrossEntropy'         : 'softmaxCrossEntropy',
    // metrics
    'accuracy'                           : 'accuracy',
    'metrics-accuracy'                   : 'accuracy',
    'metrics-binaryAccuracy'             : 'binaryAccuracy',
    'metrics-binaryCrossentropy'         : 'binaryCrossentropy',
    'metrics-categoricalAccuracy'        : 'categoricalAccuracy',
    'metrics-categoricalCrossentropy'    : 'categoricalCrossentropy',
    'metrics-cosineProximity'            : 'cosineProximity',
    'metrics-meanAbsoluteError'          : 'meanAbsoluteError',
    'metrics-meanAbsolutePercentageError': 'meanAbsolutePercentageError',
    'metrics-meanSquaredError'           : 'meanSquaredError',
    'metrics-precision'                  : 'precision',
    'metrics-recall'                     : 'recall',
    'metrics-sparseCategoricalAccuracy'  : 'sparseCategoricalAccuracy',
  }

  const result = lossAndMetricMap[idLossAndMetric_t]
  if (!result) {
    console.warn('createLossAndMetrics()', { idLossAndMetric_t })
    return 'categoricalCrossentropy' // Default fallback
  }
  return result
}


/**
 *
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
 */

/**
 * @param {IdMetric_t|IdMetric_t[]} idMetrics
 * @param params
 * @returns {Metric_t} metric
 */
export function createMetrics(idMetrics: IdMetric_t | IdMetric_t[], params: any) {
  if (!isProduction()) {
    console.debug('>> createMetrics', { idMetrics, params })
  }
  const metricMap: MetricMap_t = {
    'binaryAccuracy'                     : "binaryAccuracy",
    'binaryCrossentropy'                 : "binaryCrossentropy",
    'categoricalAccuracy'                : 'categoricalAccuracy',
    'categoricalCrossentropy'            : 'categoricalCrossentropy',
    'cosineProximity'                    : 'cosineProximity',
    'meanAbsoluteError'                  : 'meanAbsoluteError',
    'meanAbsolutePercentageError'        : 'meanAbsolutePercentageError',
    'meanSquaredError'                   : 'meanSquaredError',
    'precision'                          : 'precision',
    'recall'                             : "recall",
    'sparseCategoricalAccuracy'          : "sparseCategoricalAccuracy",
    'accuracy'                           : "accuracy",
    'metrics-accuracy'                   : 'accuracy',
    'metrics-binaryAccuracy'             : "binaryAccuracy",
    'metrics-binaryCrossentropy'         : "binaryCrossentropy",
    'metrics-categoricalAccuracy'        : 'categoricalAccuracy',
    'metrics-categoricalCrossentropy'    : 'categoricalCrossentropy',
    'metrics-cosineProximity'            : 'cosineProximity',
    'metrics-meanAbsoluteError'          : 'mae',
    'metrics-meanAbsolutePercentageError': tfjs.metrics.meanAbsolutePercentageError,
    'metrics-meanSquaredError'           : 'mse',
    'metrics-precision'                  : 'precision',
    'metrics-recall'                     : "recall",
    'metrics-sparseCategoricalAccuracy'  : "sparseCategoricalAccuracy",
  }
  if (!idMetrics) {
    console.warn('createMetrics()', { idMetrics })
    return ['binaryCrossentropy']
  }
  const addMetric = (metric: IdMetric_t) => metricMap[metric] || 'categoricalAccuracy'

  if (Array.isArray(idMetrics)) {
    return idMetrics.map((idMetric: IdMetric_t) => addMetric(idMetric))
  }
  return addMetric(idMetrics)
}

export function createMetricsList(idMetricsList: IdMetric_t[], params: any) {
  if (!isProduction()) console.debug('>> createMetricsList', { idMetricsList, params })

  const metricMap: Partial<MetricMap_t> = {
    'binaryAccuracy'             : "binaryAccuracy",
    'binaryCrossentropy'         : "binaryCrossentropy",
    'categoricalAccuracy'        : 'categoricalAccuracy',
    'categoricalCrossentropy'    : 'categoricalCrossentropy',
    'cosineProximity'            : 'cosineProximity',
    'meanAbsoluteError'          : 'meanAbsoluteError',
    'meanAbsolutePercentageError': 'meanAbsolutePercentageError',
    'meanSquaredError'           : 'meanSquaredError',
    'precision'                  : 'precision',
    'recall'                     : "recall",
    'sparseCategoricalAccuracy'  : "sparseCategoricalAccuracy",
  }

  const metrics = idMetricsList.map((idMetric: IdMetric_t) => metricMap[idMetric] || 'categoricalAccuracy')
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