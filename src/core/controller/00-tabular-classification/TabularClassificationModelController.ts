import * as tfjs from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'
// import * as dfd from 'danfojs'
import * as sk from 'scikitjs'
import { createLoss, createMetrics, createOptimizer, FIT_CALLBACKS_METRICS_LABELS } from '@core/nn-utils/ArchitectureHelper'
import * as _Types from '@core/types'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
// sk.setBackend(dfd.tensorflow)
import AlertHelper from '@utils/alertHelper'
/**
 * @typedef {Object} CustomTabularClassification_DatasetParams_t
 * @property {_Types.DatasetProcessed_t} dataset_processed
 * @property {string} [name_model]
 * @property {Array<_Types.Layer_t>} layerList
 * @property {number} learningRate
 * @property {number} [momentum=0]
 * @property {number} testSize
 * @property {number} numberOfEpoch
 * @property {string} idOptimizer
 * @property {string} idLoss
 * @property {string} idMetrics
 */
type CustomTabularClassification_DatasetParams_t = {
  dataset_processed: _Types.DatasetProcessed_t,
  name_model?      : string,
  layerList        : _Types.Layer_t[],
  learningRate     : number,
  momentum?        : number,
  testSize         : number,
  numberOfEpoch    : number,
  idOptimizer      : IdOptimizer_t,
  idLoss           : IdLoss_t,
  idMetrics        : IdMetric_t,
}

/**
 *
 * @param {CustomTabularClassification_DatasetParams_t} params
 * @returns {Promise<{model: tfjs.Sequential, history: tfjs.History}>}
 */
export async function createTabularClassificationCustomModel(params: CustomTabularClassification_DatasetParams_t) {
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
  console.log('Creating Tabular Classification Custom Model...', params)
  const { data_processed } = dataset_processed
  if (!data_processed) {
    console.error('data_processed is undefined', { dataset_processed })
    throw new Error('Data processed is undefined')
  }
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
    const units = layer.units
    // FIX
    // TypeScript Error
    const activation = layer.activation as any
    const _layer = tfjs.layers.dense({
      units     : units,
      activation: activation,
      ...(index === 0) && {
        inputShape: [X.shape[1]],
      },
    })
    model.add(_layer)
  }

  const optimizer = createOptimizer(idOptimizer, { learningRate, momentum })
  const loss = createLoss(idLoss, {})
  const metrics = createMetrics(idMetrics, {})

  console.log({ optimizer, loss, metrics })

  try {
    model.summary()
    model.compile({
      optimizer: optimizer,
      loss     : loss,
      metrics  : metrics,
    })
  } catch (error) {
    console.error('model.compile()', { error, idOptimizer, idLoss, idMetrics })
    AlertHelper.alertError("Error compiling the model. See console for details.")
    throw error
  }

  await tfvis.show.modelSummary({
    name: 'Model Summary',
    tab : name_model,
  }, model)
  tfvis.visor().setActiveTab(name_model)

  const fit_callbacks_metrics_labels = FIT_CALLBACKS_METRICS_LABELS
  const fit_callbacks_container = {
    name: 'Training',
    tab : name_model,
  }
  const fitCallbackHandlers = tfvis.show.fitCallbacks(fit_callbacks_container, fit_callbacks_metrics_labels, {
    // zoomToFitAccuracy: true,
    callbacks: [
      // 'onEpochBegin',
      'onEpochEnd',
      // 'onBatchBegin',
      'onBatchEnd',
      // 'onTrainBegin',
      // 'onTrainEnd',
    ]
  })
  const history = await model.fit(XTrain_tensor, yTrain_tensor, {
    batchSize     : 32,
    shuffle       : true,
    validationData: [XTest_tensor, yTest_tensor],
    epochs        : numberOfEpoch,
    callbacks     : fitCallbackHandlers,
  })

  return {
    model,
    history
  }
}
