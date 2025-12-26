import * as tfjs from '@tensorflow/tfjs';

// Train Map -> Optimizers
export type TrainMap_t = {
    "sgd"           : tfjs.SGDOptimizer;
    "momentum"      : tfjs.MomentumOptimizer;
    "adagrad"       : tfjs.AdagradOptimizer;
    "adadelta"      : tfjs.AdadeltaOptimizer;
    "adamax"        : tfjs.AdamaxOptimizer;
    "adam"          : tfjs.AdamOptimizer;
    "rmsprop"       : tfjs.RMSPropOptimizer;
    "train-sgd"     : tfjs.SGDOptimizer;
    "train-momentum": tfjs.MomentumOptimizer;
    "train-adagrad" : tfjs.AdagradOptimizer;
    "train-adadelta": tfjs.AdadeltaOptimizer;
    "train-adamax"  : tfjs.AdamaxOptimizer;
    "train-adam"    : tfjs.AdamOptimizer;
    "train-rmsprop" : tfjs.RMSPropOptimizer;
}
export type IdOptimizer_t = keyof TrainMap_t
// Losses and Metrics
export type LossAndMetricMap_t = {
    // Losses
    "losses-absoluteDifference"          : "absoluteDifference" | typeof tfjs.losses.absoluteDifference
    "losses-computeWeightedLoss"         : "computeWeightedLoss" | typeof tfjs.losses.computeWeightedLoss
    "losses-cosineDistance"              : "cosineDistance" | typeof tfjs.losses.cosineDistance
    "losses-hingeLoss"                   : "hingeLoss" | typeof tfjs.losses.hingeLoss
    "losses-huberLoss"                   : "huberLoss" | typeof tfjs.losses.huberLoss
    "losses-logLoss"                     : "logLoss" | typeof tfjs.losses.logLoss
    "losses-meanSquaredError"            : "meanSquaredError" | typeof tfjs.losses.meanSquaredError
    "losses-sigmoidCrossEntropy"         : "sigmoidCrossEntropy" | typeof tfjs.losses.sigmoidCrossEntropy
    "losses-softmaxCrossEntropy"         : "softmaxCrossEntropy" | typeof tfjs.losses.softmaxCrossEntropy
    "accuracy"                           : "accuracy"
    "metrics-accuracy"                   : "accuracy"
    "metrics-binaryAccuracy"             : "binaryAccuracy" | typeof tfjs.metrics.binaryAccuracy
    "metrics-binaryCrossentropy"         : "binaryCrossentropy" | typeof tfjs.metrics.binaryCrossentropy
    "metrics-categoricalAccuracy"        : "categoricalAccuracy" | typeof tfjs.metrics.categoricalAccuracy
    "metrics-categoricalCrossentropy"    : "categoricalCrossentropy" | typeof tfjs.metrics.categoricalCrossentropy
    "metrics-cosineProximity"            : "cosineProximity" | typeof tfjs.metrics.cosineProximity
    "metrics-meanAbsoluteError"          : "meanAbsoluteError" | typeof tfjs.metrics.meanAbsoluteError
    "metrics-meanAbsolutePercentageError": "meanAbsolutePercentageError" | typeof tfjs.metrics.meanAbsolutePercentageError
    "metrics-meanSquaredError"           : "meanSquaredError" | typeof tfjs.metrics.meanSquaredError
    "metrics-precision"                  : "precision" | typeof tfjs.metrics.precision
    "metrics-recall"                     : "recall" | typeof tfjs.metrics.recall
    "metrics-sparseCategoricalAccuracy"  : "sparseCategoricalAccuracy" | typeof tfjs.metrics.sparseCategoricalAccuracy
}
export type IdLossAndMetric_t = keyof LossAndMetricMap_t
export type LossMap_t = {
    "absoluteDifference"        : "absoluteDifference" // | typeof tfjs.losses.absoluteDifference
    "computeWeightedLoss"       : "computeWeightedLoss" // | typeof tfjs.losses.computeWeightedLoss
    "cosineDistance"            : "cosineDistance" // | typeof tfjs.losses.cosineDistance
    "hingeLoss"                 : "hingeLoss" // | typeof tfjs.losses.hingeLoss
    "huberLoss"                 : "huberLoss" // | typeof tfjs.losses.huberLoss
    "logLoss"                   : "logLoss" // | typeof tfjs.losses.logLoss
    "meanSquaredError"          : "meanSquaredError" // | typeof tfjs.losses.meanSquaredError
    "sigmoidCrossEntropy"       : "sigmoidCrossEntropy" // | typeof tfjs.losses.sigmoidCrossEntropy
    "softmaxCrossEntropy"       : "softmaxCrossEntropy" // | typeof tfjs.losses.softmaxCrossEntropy
    "losses-absoluteDifference" : "absoluteDifference" // | typeof tfjs.losses.absoluteDifference
    "losses-computeWeightedLoss": "computeWeightedLoss" // | typeof tfjs.losses.computeWeightedLoss
    "losses-cosineDistance"     : "cosineDistance" // | typeof tfjs.losses.cosineDistance
    "losses-hingeLoss"          : "hingeLoss" // | typeof tfjs.losses.hingeLoss
    "losses-huberLoss"          : "huberLoss" // | typeof tfjs.losses.huberLoss
    "losses-logLoss"            : "logLoss" // | typeof tfjs.losses.logLoss
    "losses-meanSquaredError"   : "meanSquaredError" // | typeof tfjs.losses.meanSquaredError
    "losses-sigmoidCrossEntropy": "sigmoidCrossEntropy" // | typeof tfjs.losses.sigmoidCrossEntropy
    "losses-softmaxCrossEntropy": "softmaxCrossEntropy" // | typeof tfjs.losses.softmaxCrossEntropy
}

export type IdLoss_t = keyof LossMap_t
// Metrics
export type MetricMap_t = {
    "binaryAccuracy"                     : "binaryAccuracy" | typeof tfjs.metrics.binaryAccuracy
    "binaryCrossentropy"                 : "binaryCrossentropy" | typeof tfjs.metrics.binaryCrossentropy
    "categoricalAccuracy"                : "categoricalAccuracy" | typeof tfjs.metrics.categoricalAccuracy
    "categoricalCrossentropy"            : "categoricalCrossentropy" | typeof tfjs.metrics.categoricalCrossentropy
    "cosineProximity"                    : "cosineProximity" | typeof tfjs.metrics.cosineProximity
    "meanAbsoluteError"                  : "meanAbsoluteError" | typeof tfjs.metrics.meanAbsoluteError
    "meanAbsolutePercentageError"        : "meanAbsolutePercentageError" | typeof tfjs.metrics.meanAbsolutePercentageError
    "meanSquaredError"                   : "meanSquaredError" | typeof tfjs.metrics.meanSquaredError
    "precision"                          : "precision" | typeof tfjs.metrics.precision
    "recall"                             : "recall" | typeof tfjs.metrics.recall
    "sparseCategoricalAccuracy"          : "sparseCategoricalAccuracy" | typeof tfjs.metrics.sparseCategoricalAccuracy
    // TODO
    "accuracy"                           : "accuracy"
    "metrics-accuracy"                   : "accuracy"
    "metrics-binaryAccuracy"             : "binaryAccuracy" | typeof tfjs.metrics.binaryAccuracy
    "metrics-binaryCrossentropy"         : "binaryCrossentropy" | typeof tfjs.metrics.binaryCrossentropy
    "metrics-categoricalAccuracy"        : "categoricalAccuracy" | typeof tfjs.metrics.categoricalAccuracy
    "metrics-categoricalCrossentropy"    : "categoricalCrossentropy" | typeof tfjs.metrics.categoricalCrossentropy
    "metrics-cosineProximity"            : "cosineProximity" | typeof tfjs.metrics.cosineProximity
    "metrics-meanAbsoluteError"          : "mae" | "meanAbsoluteError" | typeof tfjs.metrics.meanAbsoluteError
    "metrics-meanAbsolutePercentageError": "meanAbsolutePercentageError" | typeof tfjs.metrics.meanAbsolutePercentageError
    "metrics-meanSquaredError"           : "mse" | "meanSquaredError" | typeof tfjs.metrics.meanSquaredError
    "metrics-precision"                  : "precision" | typeof tfjs.metrics.precision
    "metrics-recall"                     : "recall" | typeof tfjs.metrics.recall
    "metrics-sparseCategoricalAccuracy"  : "sparseCategoricalAccuracy" | typeof tfjs.metrics.sparseCategoricalAccuracy

}
export type IdMetric_t = keyof MetricMap_t

export type Layer_t = {
    _class            : string;
    _protected        : boolean;
    units?            : number;
    // if _class === Conv2D
    kernelSize?       : number;
    inputShape?       : number[];
    filters?          : number;
    strides?          : number;
    activation?       : string;
    kernelInitializer?: string;
    poolSize?         : number;
}

