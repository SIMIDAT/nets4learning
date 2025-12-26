import * as tfjs from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'
import * as dfd from 'danfojs'
import * as sk from 'scikitjs'

import * as _Types from '@core/types'
import { createLoss, createMetrics, createOptimizer, FIT_CALLBACKS_METRICS_LABELS } from '@core/nn-utils/ArchitectureHelper'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import AlertHelper from '@utils/alertHelper'

sk.setBackend(dfd.tensorflow)

/**
 * @typedef {Object} CustomRegression_DatasetParams_t
 * @property {_Types.DatasetProcessed_t} dataset_processed
 * @property {string} [name_model = 'Regression']
 * @property {Array<_Types.Layer_t>} layerList
 * @property {number} [learningRate = 0.01] Rango [0 - 1]
 * @property {number} [momentum = 0]
 * @property {number} [testSize = 0.1]
 * @property {number} numberOfEpoch
 * @property {IdOptimizer_t} idOptimizer
 * @property {IdLoss_t} idLoss
 * @property {IdMetric_t|IdMetric_t[]} idMetrics
 */
type CustomRegression_DatasetParams_t = {
  dataset_processed: _Types.DatasetProcessed_t,
  name_model?      : string,
  layerList        : _Types.Layer_t[] | _Types.CustomParamsLayerModel_t[],
  learningRate?    : number,
  momentum?        : number,
  testSize?        : number,
  numberOfEpoch    : number,
  idOptimizer      : IdOptimizer_t,
  idLoss           : IdLoss_t,
  idMetrics        : IdMetric_t[],
}
/**
 *
 * @param {CustomRegression_DatasetParams_t} params
 * @returns {Promise<{ model: tfjs.Sequential, history: tfjs.History }>}
 */
export async function createRegressionCustomModel(params: CustomRegression_DatasetParams_t) {
  const {
    dataset_processed,
    name_model = 'Regression',
    layerList,
    learningRate = 0.01,
    momentum = 0,
    testSize = 0.1,
    numberOfEpoch,
    idOptimizer,
    idLoss,
    idMetrics,
  } = params
  tfvis.visor().open()
  // console.log({ tfjs_backend: tfjs.getBackend() })

  const { data_processed } = dataset_processed
  if (!data_processed) {
    throw new Error('Data processed is undefined')
  }
  const { X, y } = data_processed

  // @ts-ignore
  const [XTrain, XTest, yTrain, yTest] = sk.trainTestSplit(X.values, y.values, testSize, 0.99 - testSize, 42)
  const XTrain_tensor = tfjs.tensor(XTrain)
  const XTest_tensor = tfjs.tensor(XTest)
  const yTrain_tensor = tfjs.tensor(yTrain)
  const yTest_tensor = tfjs.tensor(yTest)

  const model = new tfjs.Sequential()
  for (const [index, layer] of layerList.entries()) {
    if (layer.activation === null) {
      AlertHelper.alertError(`Layer ${index + 1} activation is null. Please select an activation function.`)
      return
    }
    const _layer = tfjs.layers.dense({
      units     : layer.units,
      activation: layer.activation as any,
      ...(index === 0) && {
        inputShape: [X.shape[1]],
      },
    })
    model.add(_layer)
  }

  const optimizer = createOptimizer(idOptimizer, { learningRate, momentum })
  const loss = createLoss(idLoss, {})
  const metrics = createMetrics(idMetrics, {})

  console.debug({ optimizer, loss, metrics })

  try {
    model.summary()
    model.compile({
      optimizer,
      loss,
      metrics: metrics,
    })
  } catch (error) {
    console.error('Model compilation error', { error })
    AlertHelper.alertError("Error compiling the model. See console for details.")
    throw error
  }

  // @ts-ignore
  await tfvis.show.modelSummary({
    name: 'Model Summary',
    tab : name_model
  }, model)
  tfvis.visor().setActiveTab(name_model)


  const fit_callbacks_metrics_labels = FIT_CALLBACKS_METRICS_LABELS
  const fit_callbacks_container = {
    name: 'Training',
    tab : name_model,
  }
  const fitCallbackHandlers = tfvis.show.fitCallbacks(fit_callbacks_container, fit_callbacks_metrics_labels, {
    zoomToFitAccuracy: true,
    callbacks        : [
      'onEpochBegin',
      'onEpochEnd',
      'onBatchBegin',
      'onBatchEnd',
      // 'onTrainBegin',
      // 'onTrainEnd',
    ]
  })
  const history = await model.fit(XTrain_tensor, yTrain_tensor, {
    batchSize     : 32,
    shuffle       : true,
    validationData: [XTest_tensor, yTest_tensor],
    epochs        : numberOfEpoch + 1,
    callbacks     : fitCallbackHandlers,
  })

  return {
    model,
    history
  }
}