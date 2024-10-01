import * as tfjs from '@tensorflow/tfjs'

export default class RegressionHelper {

  /**
   *
   * @param {Object[]} data
   * @param X_feature
   * @param Y_target
   * @return {{inputMax: Tensor<Rank>, inputs: Tensor<Rank>, inputMin: Tensor<Rank>, labelMax: Tensor<Rank>, labelMin: Tensor<Rank>, labels: Tensor<Rank>}}
   * @constructor
   */
  static ConvertToTensor (data, X_feature, Y_target) {
    return tfjs.tidy(() => {
      // Step 1. Shuffle the data
      tfjs.util.shuffle(data)

      // Step 2. Convert data to Tensor
      const inputs = data.map(d => d[X_feature])
      const labels = data.map(d => d[Y_target])

      const inputTensor = tfjs.tensor2d(inputs, [inputs.length, 1])
      const labelTensor = tfjs.tensor2d(labels, [labels.length, 1])

      //Step 3. Normalize the data to the range 0 - 1 using min-max scaling
      const inputMax = inputTensor.max()
      const inputMin = inputTensor.min()
      const labelMax = labelTensor.max()
      const labelMin = labelTensor.min()

      const normalizedInputs = inputTensor.sub(inputMin).div(inputMax.sub(inputMin))
      const normalizedLabels = labelTensor.sub(labelMin).div(labelMax.sub(labelMin))

      return {
        inputs: normalizedInputs,
        labels: normalizedLabels,
        inputMax,
        inputMin,
        labelMax,
        labelMin,
      }
    })
  }

  static CREATE_OPTIMIZER (idOptimizer, params) {
    // if (!isProduction()) console.debug('>> createOptimizer', { idOptimizer, params })
    const defaultParams = {
      'train-adam'    : { learningRate: 0.01 },   // -
      'train-sgd'     : { learningRate: 0.01 },   // -
      'train-adagrad' : { learningRate: 0.001 },  // -
      'train-adadelta': { learningRate: 0.001 },  // -
      'train-adamax'  : { learningRate: 0.001 },  // -
      'train-rmsprop' : { learningRate: 0.001 },  // -
      // 'train-momentum': {learningRate: 0.01 , momentum: 0.0},
    }
    const optimizerMap = {
      'train-adam'    : (params) => tfjs.train.adam(params.learningRate),
      'train-sgd'     : (params) => tfjs.train.sgd(params.learningRate),
      'train-adagrad' : (params) => tfjs.train.adagrad(params.learningRate),
      'train-adadelta': (params) => tfjs.train.adadelta(params.learningRate),
      'train-adamax'  : (params) => tfjs.train.adamax(params.learningRate),
      'train-rmsprop' : (params) => tfjs.train.rmsprop(params.learningRate),
      // 'train-momentum': (params) => tfjs.train.momentum(params.learningRate, params.momentum),
    }
    const { learningRate } = defaultParams[idOptimizer]
    const optimizerFunction = optimizerMap[idOptimizer]
    if (optimizerFunction) {
      return optimizerFunction({ learningRate })
    } else {
      console.warn('createOptimizer()', { idOptimizer, params })
      return tfjs.train.adam(params.learningRate)
    }
  }

  static CREATE_LOSS (idLoss) {
    // if (!isProduction()) console.debug('>> createLoss', { idLoss })
    const lossAndMetricFunctions = {
      'losses-absoluteDifference' : tfjs.losses.absoluteDifference,
      'losses-computeWeightedLoss': tfjs.losses.computeWeightedLoss,
      'losses-cosineDistance'     : tfjs.losses.cosineDistance,
      'losses-hingeLoss'          : tfjs.losses.hingeLoss,
      'losses-huberLoss'          : tfjs.losses.huberLoss,
      'losses-logLoss'            : tfjs.losses.logLoss,
      'losses-meanSquaredError'   : tfjs.losses.meanSquaredError,
      'losses-sigmoidCrossEntropy': tfjs.losses.sigmoidCrossEntropy,
      'losses-softmaxCrossEntropy': tfjs.losses.softmaxCrossEntropy,
    }

    return lossAndMetricFunctions[idLoss] || 'categoricalCrossentropy'
  }

  static CREATE_METRICS (idMetrics) {
    // if (!isProduction()) console.debug('>> createMetrics', { idMetrics })
    const metricMap = {
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

    return idMetrics.map((idMetric) => metricMap[idMetric] || 'accuracy')
  }
}