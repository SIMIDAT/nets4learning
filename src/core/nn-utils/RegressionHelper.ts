import type { IdOptimizer_t, IdMetric_t, MetricMap_t } from '@/types/nn-types'
import * as tfjs from '@tensorflow/tfjs'

export type DefaultParamsMap = {
  [key in IdOptimizer_t]: { learningRate: number, momentum?: number }
}
export type OptimizerMap = {
  [key in IdOptimizer_t]?: (params: any) => tfjs.Optimizer
}

export default class RegressionHelper {

  
  static CREATE_OPTIMIZER(idOptimizer: IdOptimizer_t, params: { learningRate: number }) {
    // if (!isProduction()) console.debug('>> createOptimizer', { idOptimizer, params })
    const defaultParams: Partial<DefaultParamsMap> = {
      'train-adam'    : { learningRate: 0.01 },   // -
      'train-sgd'     : { learningRate: 0.01 },   // -
      'train-adagrad' : { learningRate: 0.001 },  // -
      'train-adadelta': { learningRate: 0.001 },  // -
      'train-adamax'  : { learningRate: 0.001 },  // -
      'train-rmsprop' : { learningRate: 0.001 },  // -
      'train-momentum': { learningRate: 0.01 , momentum: 0.0 }, // -
    }
    const optimizerMap: OptimizerMap = {
      'train-adam'    : (params) => tfjs.train.adam(params.learningRate),
      'train-sgd'     : (params) => tfjs.train.sgd(params.learningRate),
      'train-adagrad' : (params) => tfjs.train.adagrad(params.learningRate),
      'train-adadelta': (params) => tfjs.train.adadelta(params.learningRate),
      'train-adamax'  : (params) => tfjs.train.adamax(params.learningRate),
      'train-rmsprop' : (params) => tfjs.train.rmsprop(params.learningRate),
      'train-momentum': (params) => tfjs.train.momentum(params.learningRate, params.momentum),
    }
    const defaultParam = defaultParams[idOptimizer]
    // Validamos que no sea undefined
    if (!defaultParam) {
      console.warn('createOptimizer()', { idOptimizer, params })
      return tfjs.train.adam(params.learningRate)
    }
    const { learningRate } = defaultParam 
    const optimizerFunction = optimizerMap[idOptimizer]
    // Validamos que no sea undefined
    if (!optimizerFunction) {
      console.warn('createOptimizer()', { idOptimizer, params })
      return tfjs.train.adam(params.learningRate)
    }

    return optimizerFunction({ learningRate })
  }

  // static CREATE_LOSS(idLoss: IdLoss_t) {
  //   // if (!isProduction()) console.debug('>> createLoss', { idLoss })
  //   // const lossAndMetricFunctions: LossAndMetricMap_t = {
  //   //   'losses-absoluteDifference' : tfjs.losses.absoluteDifference,
  //   //   'losses-computeWeightedLoss': tfjs.losses.computeWeightedLoss,
  //   //   'losses-cosineDistance'     : tfjs.losses.cosineDistance,
  //   //   'losses-hingeLoss'          : tfjs.losses.hingeLoss,
  //   //   'losses-huberLoss'          : tfjs.losses.huberLoss,
  //   //   'losses-logLoss'            : tfjs.losses.logLoss,
  //   //   'losses-meanSquaredError'   : tfjs.losses.meanSquaredError,
  //   //   'losses-sigmoidCrossEntropy': tfjs.losses.sigmoidCrossEntropy,
  //   //   'losses-softmaxCrossEntropy': tfjs.losses.softmaxCrossEntropy,
  //   // }
  //   const lossAndMetricFunctions: Partial<LossAndMetricMap_t>  = {
  //     'losses-absoluteDifference' : "absoluteDifference",
  //     'losses-computeWeightedLoss': "computeWeightedLoss",
  //     'losses-cosineDistance'     : "cosineDistance",
  //     'losses-hingeLoss'          : "hingeLoss",
  //     'losses-huberLoss'          : "huberLoss",
  //     'losses-logLoss'            : "logLoss",
  //     'losses-meanSquaredError'   : "meanSquaredError",
  //     'losses-sigmoidCrossEntropy': "sigmoidCrossEntropy",
  //     'losses-softmaxCrossEntropy': "softmaxCrossEntropy",
  //   }

  //   return lossAndMetricFunctions[idLoss] || 'categoricalCrossentropy'
  // }

  static CREATE_METRICS(idMetrics: IdMetric_t[]) {
    // if (!isProduction()) console.debug('>> createMetrics', { idMetrics })
    // const metricMap: MetricMap_t = {
    //   'metrics-binaryAccuracy'             : tfjs.metrics.binaryAccuracy,
    //   'metrics-binaryCrossentropy'         : tfjs.metrics.binaryCrossentropy,
    //   'metrics-categoricalAccuracy'        : tfjs.metrics.categoricalAccuracy,
    //   'metrics-categoricalCrossentropy'    : tfjs.metrics.categoricalCrossentropy,
    //   'metrics-cosineProximity'            : tfjs.metrics.cosineProximity,
    //   'metrics-meanAbsoluteError'          : tfjs.metrics.meanAbsoluteError,
    //   'metrics-meanAbsolutePercentageError': tfjs.metrics.meanAbsolutePercentageError,
    //   'metrics-meanSquaredError'           : tfjs.metrics.meanSquaredError,
    //   'metrics-precision'                  : tfjs.metrics.precision,
    //   'metrics-recall'                     : tfjs.metrics.recall,
    //   'metrics-sparseCategoricalAccuracy'  : tfjs.metrics.sparseCategoricalAccuracy,
    // }
    const metricMap: Partial<MetricMap_t> = {
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

    return idMetrics.map((idMetric) => metricMap[idMetric] || 'accuracy')
  }
}