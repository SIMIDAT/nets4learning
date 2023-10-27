import * as tf from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'
import * as dfd from 'danfojs'
import * as sk from 'scikitjs'
import { createLoss, createMetrics, createOptimizer } from '@core/nn-utils/ArchitectureHelper'

sk.setBackend(dfd.tensorflow)

/**
 * @typedef {Object} CustomDatasetParams_t
 * @property {DatasetProcessed_t} dataset_processed
 * @property {Array} layerList
 * @property {number} learningRate
 * @property {number} testSize
 * @property {number} numberOfEpoch
 * @property {string} idOptimizer
 * @property {string} idLoss
 * @property {string} idMetrics
 */

/**
 *
 * @param {CustomDatasetParams_t} params
 * @param {i18n.t} t
 * @returns {Promise<tf.Sequential>}
 */
export async function createTabularClassificationCustomModel (params, t) {
  const {
    dataset_processed,

    layerList,
    learningRate,
    testSize,
    numberOfEpoch,
    idOptimizer,
    idLoss,
    idMetrics,

  } = params

  tfvis.visor().open()

  const { data_processed } = dataset_processed
  const { X, y } = data_processed
  const [XTrain, XTest, yTrain, yTest] = sk.trainTestSplit(X.values, y.values, testSize)

  const XTrain_tensor = tf.tensor(XTrain)
  const XTest_tensor = tf.tensor(XTest)
  const yTrain_tensor = tf.tensor(yTrain)
  const yTest_tensor = tf.tensor(yTest)

  // region Define model
  const model = tf.sequential()
  for (const layer of layerList) {
    const index = layerList.indexOf(layer)
    const _layer = tf.layers.dense({
      units     : layer.units,
      activation: layer.activation.toLowerCase(),
      ...(index === 0) && {
        inputShape: [X.shape[1]],
      },
    })
    model.add(_layer)
  }

  const optimizer = createOptimizer(idOptimizer, { learningRate })
  const loss = createLoss(idLoss, {})
  const metrics = createMetrics(idMetrics, {})

  model.compile({ optimizer, loss, metrics })
  await tfvis.show.modelSummary({
    name: 'Model Summary',
    tab : 'Model Summary',
  }, model)
  // endregion

  const fit_callbacks_metrics_labels = ['loss', 'val_loss', 'acc', 'val_acc']
  const fit_callbacks_container = {
    name: 'Training',
    tab : 'Training',
  }
  const fitCallbacks = tfvis.show.fitCallbacks(fit_callbacks_container, fit_callbacks_metrics_labels, { callbacks: [/* 'onBatchEnd', */ 'onEpochEnd'] })
  await model.fit(XTrain_tensor, yTrain_tensor, {
    // batchSize     : 32,
    shuffle       : true,
    validationData: [XTest_tensor, yTest_tensor],
    epochs        : numberOfEpoch,
    callbacks     : fitCallbacks,
  })

  // TODO
  // const example = X.values[X.values.length - 1]
  // console.log({ X, example })
  //
  // const predict = model.predict(tf.tensor([example]))
  // console.log({ predict: predict.dataSync() })
  // Lo que espera
  // const labels = tf.tensor1d([0, 0, 1, 1, 2, 2, 3, 3])
  // Lo que se predice
  // const predictions = tf.tensor1d([0, 0, 1, 1, 2, 2, 3, 3])

  // const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, predictions)
  // const container = {
  //   name: 'Evaluation',
  //   tab : 'Evaluation',
  // }
  // const classNames = Object.keys(encoders[column_name_target].encoder.$labels)
  // await tfvis.show.perClassAccuracy(container, classAccuracy, classNames)

  return model
}
