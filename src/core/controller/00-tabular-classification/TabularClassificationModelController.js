import * as tfjs from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'
// import * as dfd from 'danfojs'
import * as sk from 'scikitjs'
import { createLoss, createMetrics, createOptimizer } from '@core/nn-utils/ArchitectureHelper'
import * as _Types from '@core/types'
// sk.setBackend(dfd.tensorflow)

/**
 * @typedef {Object} CustomTabularClassification_DatasetParams_t
 * @property {_Types.DatasetProcessed_t} dataset_processed
 * @property {string} [name_model]
 * @property {Array} layerList
 * @property {number} learningRate
 * @property {number} [momentum=0]
 * @property {number} testSize
 * @property {number} numberOfEpoch
 * @property {string} idOptimizer
 * @property {string} idLoss
 * @property {string} idMetrics
 */

/**
 *
 * @param {CustomTabularClassification_DatasetParams_t} params
 * @returns {Promise<{model: tfjs.Sequential, history: tfjs.History}>}
 */
export async function createTabularClassificationCustomModel (params) {
  const {
    dataset_processed,
    name_model = 'Tabular classification',
    layerList,
    learningRate,
    momentum = 0,
    testSize,
    numberOfEpoch,
    idOptimizer,
    idLoss,
    idMetrics,
  } = params
  tfvis.visor().open()

  const { data_processed } = dataset_processed
  const { X, y } = data_processed
  // @ts-ignore
  const [XTrain, XTest, yTrain, yTest] = sk.trainTestSplit(X.values, y.values, testSize)
  const XTrain_tensor = tfjs.tensor(XTrain)
  const XTest_tensor = tfjs.tensor(XTest)
  const yTrain_tensor = tfjs.tensor(yTrain)
  const yTest_tensor = tfjs.tensor(yTest)

  const model = tfjs.sequential()
  for (const layer of layerList) {
    const index = layerList.indexOf(layer)
    const _layer = tfjs.layers.dense({
      units     : layer.units,
      activation: layer.activation.toLowerCase(),
      ...(index === 0) && {
        inputShape: [X.shape[1]],
      },
    })
    model.add(_layer)
  }

  const optimizer = createOptimizer(idOptimizer, { learningRate, momentum })
  const loss = createLoss(idLoss, {})
  const metrics = createMetrics(idMetrics, {})

  model.compile({ optimizer, loss, metrics })

  // @ts-ignore
  await tfvis.show.modelSummary({ name: 'Model Summary', tab: name_model }, model)

  const fit_callbacks_metrics_labels = ['loss', 'val_loss', 'acc', 'val_acc']
  const fit_callbacks_container = {
    name: 'Training',
    tab : name_model,
  }
  const fitCallbacks = tfvis.show.fitCallbacks(fit_callbacks_container, fit_callbacks_metrics_labels, { 
    callbacks: [
      'onBatchEnd', 
      'onEpochEnd'
    ]
  })
  const history = await model.fit(XTrain_tensor, yTrain_tensor, {
    batchSize     : 32,
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

  return {
    model,
    history
  }
}
