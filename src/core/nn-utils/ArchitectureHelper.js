import * as tf from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";
import { getClassesFromDataSet, trainTestSplit } from "./ClassificationHelper";
import { isProduction } from "../../utils/utils";
import * as dfd from "danfojs";
import * as sk from "scikitjs";

sk.setBackend(dfd.tensorflow);

export async function createTabularClassificationCustomDataSet_upload(params, t) {

  const {
    learningRate,
    testSize,
    numberOfEpoch,
    layerList,
    idOptimizer,
    idLoss,
    idMetrics,

    dataProcessed,
  } = params;

  const model = tf.sequential();
  for (const layer_data of layerList) {
    const index = layerList.indexOf(layer_data);
    const layer = {
      units     : layer_data.units,
      activation: layer_data.activation,
      ...(index === 0) && {
        inputShape: [dataProcessed.X.shape[1]],
      },
    };
    model.add(tf.layers.dense(layer));
  }


  const optimizer = createOptimizer(idOptimizer, { learningRate });
  const loss = createLoss(idLoss, {});
  const metrics = createMetrics(idMetrics, {});



  // Compilamos el modelo
  model.compile({
    optimizer: optimizer,
    loss     : loss,
    metrics  : metrics,
  });

  // Creamos las métricas que van a aparecer en los gráficos
  const fit_callbacks_metrics_labels = ["loss", "val_loss", "acc", "val_acc"];
  const fit_callbacks_container = {
    name  : t("pages.playground.0-tabular-classification.generator.models.history-train"),
    tab   : t("pages.playground.0-tabular-classification.generator.models.train"),
    styles: { height: "1000px" },
  };
  const fitCallbacks = tfvis.show.fitCallbacks(fit_callbacks_container, fit_callbacks_metrics_labels, {
    callbacks: [
      // 'onBatchEnd',
      "onEpochEnd",
    ],
  });

  const X = dataProcessed.X;
  let y = dataProcessed.y;
  const oneHotEncoder = new dfd.OneHotEncoder();
  oneHotEncoder.fit(y.values);
  let y_onehot_values = oneHotEncoder.transform(y.values);
  const scaler = dataProcessed.scaler;

  let [XTrain, XTest, yTrain, yTest] = sk.trainTestSplit(X.values, y_onehot_values, testSize);
  scaler.fit(XTrain);
  XTrain = scaler.transform(XTrain);
  XTest = scaler.transform(XTest);

  const Xtrain_tensor = tf.tensor(XTrain);
  const XTest_tensor = tf.tensor(XTest);
  const yTrain_tensor = tf.tensor(yTrain);
  const yTest_tensor = tf.tensor(yTest);
  await model.fit(Xtrain_tensor, yTrain_tensor, {
    // batchSize      : 32,
    // shuffle        : true,
    validationData: [XTest_tensor, yTest_tensor],
    epochs        : numberOfEpoch,
    callbacks     : fitCallbacks,
  });

  return model;
}

export async function createTabularClassificationCustomDataSet(params, t) {
  const {
    learningRate,
    testSize,
    numberOfEpoch,
    layerList,
    dataset_JSON,
    idOptimizer,
    idLoss,
    idMetrics,
  } = params;
  const [DATA, ARRAY_TARGETS, DATA_SET_CLASSES] = getClassesFromDataSet(dataset_JSON);
  const [xTrain, yTrain, xTest, yTest] = trainTestSplit(DATA, ARRAY_TARGETS, testSize);
  // Modo secuencial
  if (!isProduction()) console.debug("createTabularClassificationCustomDataSet", params);
  if (!isProduction()) console.debug("getClassesFromDataSet", { DATA, ARRAY_TARGETS, DATA_SET_CLASSES });
  if (!isProduction()) console.debug("trainTestSplit", { xTrain, yTrain, xTest, yTest });


  const model = tf.sequential();
  // Agregamos las capas
  for (const layer of layerList) {
    const index = layerList.indexOf(layer);
    model.add(tf.layers.dense({
      units     : layer.units,
      activation: layer.activation.toLowerCase(),
      ...(index === 0) && {
        inputShape: [xTrain.shape[1]],
      },
    }));
  }

  const optimizer = createOptimizer(idOptimizer, { learningRate });
  const loss = createLoss(idLoss, {});
  const metrics = createMetrics(idMetrics, {});

  // Compilamos el modelo
  model.compile({
    optimizer: optimizer,
    loss     : loss,
    metrics  : metrics,
  });

  // Creamos las métricas que van a aparecer en los gráficos
  const fit_callbacks_metrics_labels = ["loss", "val_loss", "acc", "val_acc"];
  const fit_callbacks_container = {
    name  : t("pages.playground.0-tabular-classification.generator.models.history-train"),
    tab   : t("pages.playground.0-tabular-classification.generator.models.train"),
    styles: { height: "1000px" },
  };
  const fitCallbacks = tfvis.show.fitCallbacks(fit_callbacks_container, fit_callbacks_metrics_labels, {
    callbacks: [
      // 'onBatchEnd',
      "onEpochEnd",
    ],
  });

  await model.fit(xTrain, yTrain, {
    epochs        : numberOfEpoch,
    validationData: [xTest, yTest],
    callbacks     : fitCallbacks,
  });

  return Promise.resolve([model, ARRAY_TARGETS, DATA_SET_CLASSES]);
}

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
export function createOptimizer(idOptimizer, params) {
  if (!isProduction()) console.debug(">> createOptimizer", { idOptimizer, params });

  let { learningRate = 0.01 } = params;
  switch (idOptimizer) {
    case "sgd":
      return tf.train.sgd(learningRate);
    case "momentum":
      let { momentum = 0.99 } = params;
      return tf.train.momentum(learningRate, momentum);
    case "adagrad":
      return tf.train.adagrad(learningRate);
    case "adadelta":
      return tf.train.adadelta(learningRate);
    case "adam":
      return tf.train.adam(learningRate);
    case "adamax":
      return tf.train.adamax(learningRate);
    case "rmsprop":
      return tf.train.rmsprop(learningRate);

    default:
      console.warn("createOptimizer()", { idOptimizer, params });
      return tf.train.adam(learningRate);
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
export function createLoss(idLoss, params) {
  if (!isProduction()) console.debug(">> createLoss", { idLoss, params });
  //
  // https://github.com/tensorflow/tfjs/issues/1315
  switch (idLoss) {
    // Losses
    case "losses-absoluteDifference":
      return tf.losses.absoluteDifference;
    case "losses-computeWeightedLoss":
      return tf.losses.computeWeightedLoss;
    case "losses-cosineDistance":
      return tf.losses.cosineDistance;
    case "losses-hingeLoss":
      return tf.losses.hingeLoss;
    case "losses-huberLoss":
      return tf.losses.huberLoss;
    case "losses-logLoss":
      return tf.losses.logLoss;
    case "losses-meanSquaredError":
      return tf.losses.meanSquaredError;
    case "losses-sigmoidCrossEntropy":
      return tf.losses.sigmoidCrossEntropy;
    case "losses-softmaxCrossEntropy":
      return tf.losses.softmaxCrossEntropy;
    // Metric
    case "metrics-binaryAccuracy":
      return tf.metrics.binaryAccuracy;
    case "metrics-binaryCrossentropy":
      return tf.metrics.binaryCrossentropy;
    case "metrics-categoricalAccuracy":
      return tf.metrics.categoricalAccuracy;
    case "metrics-categoricalCrossentropy":
      return tf.metrics.categoricalCrossentropy;
    case "metrics-cosineProximity":
      return tf.metrics.cosineProximity;
    case "metrics-meanAbsoluteError":
      return tf.metrics.meanAbsoluteError;
    case "metrics-meanAbsolutePercentageError":
      return tf.metrics.meanAbsolutePercentageError;
    case "metrics-meanSquaredError":
      return tf.metrics.meanSquaredError;
    case "metrics-precision":
      return tf.metrics.precision;
    case "metrics-recall":
      return tf.metrics.recall;
    case "metrics-sparseCategoricalAccuracy":
      return tf.metrics.sparseCategoricalAccuracy;

    default:
      console.warn("createLoss()", { idLoss });
      return "categoricalCrossentropy";
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
export function createMetrics(idMetrics, params) {
  if (!isProduction()) console.debug(">> createMetrics", { idMetrics, params });

  switch (idMetrics) {
    case "binaryAccuracy":
      return [tf.metrics.binaryAccuracy];
    case "binaryCrossentropy":
      return [tf.metrics.binaryCrossentropy];
    case "categoricalAccuracy":
      return [tf.metrics.categoricalAccuracy];
    case "categoricalCrossentropy":
      return [tf.metrics.categoricalCrossentropy];
    case "cosineProximity":
      return [tf.metrics.cosineProximity];
    case "meanAbsoluteError":
      return [tf.metrics.meanAbsoluteError];
    case "meanAbsolutePercentageError":
      return [tf.metrics.meanAbsolutePercentageError];
    case "meanSquaredError":
      return [tf.metrics.meanSquaredError];
    case "precision":
      return [tf.metrics.precision];
    case "recall":
      return [tf.metrics.recall];
    case "sparseCategoricalAccuracy":
      return [tf.metrics.sparseCategoricalAccuracy];
    // DEFAULT Tensorflow js
    case "accuracy":
      return ["accuracy"];

    default:
      console.warn("createMetrics()", { idMetrics });
      return ["accuracy"];
  }
}

