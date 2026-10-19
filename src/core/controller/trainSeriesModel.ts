import * as tfjs from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'
import i18next from 'i18next'

import { FIT_CALLBACKS_METRICS_LABELS } from '@core/nn-utils/ArchitectureHelper'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import AlertHelper from '@utils/alertHelper'
import { getActiveTFBackend } from '@core/tfBackend'
import { showTrainingVisor } from '@core/nn-utils/trainingVisor'
import { ModelDefinitionError, buildSeriesModel, compileModel, modelFromArtifacts, seriesTensors, type SeriesLayer_t } from '@core/training/buildModels'
import { TrainingWorkerUnavailableError, trainInWorker } from '@core/training/trainingClient'
import { forwardProgress } from '@core/controller/trainDenseModel'
import type { PreparedSeries_t } from '@core/timeSeries/series'
import { shouldOpenVisor } from '@core/a11y/displaySettings'

export type TrainSeriesModelParams_t = {
  prepared     : PreparedSeries_t
  layerList    : SeriesLayer_t[]
  learningRate : number
  numberOfEpoch: number
  batchSize    : number
  idOptimizer  : IdOptimizer_t
  idLoss       : IdLoss_t
  idMetrics    : IdMetric_t[]
  /** Se llama al terminar cada época (contando desde 1) con el total de épocas */
  onEpochEnd?  : (epoch: number, totalEpochs: number) => void
  /** Si devuelve true, el entrenamiento se detiene al acabar el lote actual */
  shouldStop?  : () => boolean
}

const VISOR_TAB = 'Time series'

const flat = (rows: number[][]) => new Float32Array(rows.flat())

/**
 * Entrena la red de una serie temporal con sus ventanas: las de entrenamiento y, para la pérdida de validación, las de
 * prueba (las últimas de la serie). En el worker; si no se puede, aquí mismo. El progreso, en el visor de tfjs-vis
 */
export async function trainSeriesModel(params: TrainSeriesModelParams_t): Promise<{ model: tfjs.Sequential, history: tfjs.History }> {
  const { prepared, layerList } = params
  showTrainingVisor()
  let summaryModel: tfjs.Sequential
  try {
    summaryModel = buildSeriesModel(layerList, prepared.prep.window)
  } catch (error) {
    if (error instanceof ModelDefinitionError) void AlertHelper.alertError(error.message)
    throw error
  }
  await tfvis.show.modelSummary({ name: 'Model Summary', tab: VISOR_TAB }, summaryModel)
  summaryModel.dispose()
  tfvis.visor().setActiveTab(VISOR_TAB)
  // Se abre al crearlo: si se ha elegido en /settings, se cierra (sus gráficas siguen ahí, por si se abre a mano)
  if (!shouldOpenVisor()) tfvis.visor().close()
  const visCallbacks = tfvis.show.fitCallbacks({ name: 'Training', tab: VISOR_TAB }, FIT_CALLBACKS_METRICS_LABELS,
    { callbacks: ['onEpochBegin', 'onEpochEnd', 'onBatchBegin', 'onBatchEnd'], zoomToFitAccuracy: true })

  const request = {
    window       : prepared.prep.window,
    X            : flat(prepared.train.X),
    y            : new Float32Array(prepared.train.y),
    XTest        : flat(prepared.test.X),
    yTest        : new Float32Array(prepared.test.y),
    layerList    : layerList.map(({ _class, units, activation }) => ({ _class, units, activation })),
    compile      : { idOptimizer: params.idOptimizer, idLoss: params.idLoss, idMetrics: params.idMetrics, learningRate: params.learningRate },
    numberOfEpoch: params.numberOfEpoch,
    batchSize    : params.batchSize,
  }
  try {
    const result = await trainInWorker('trainSeries', { backend: getActiveTFBackend(), ...request }, {
      transfer  : [request.X.buffer, request.y.buffer, request.XTest.buffer, request.yTest.buffer],
      shouldStop: params.shouldStop,
      onProgress: forwardProgress(visCallbacks, params.onEpochEnd),
    })
    return { model: await modelFromArtifacts(result.artifacts), history: result.history as unknown as tfjs.History }
  } catch (error) {
    if (error instanceof ModelDefinitionError) {
      void AlertHelper.alertError(error.kind === 'compile' ? i18next.t('error.model-compile') : error.message)
      throw error
    }
    if (!(error instanceof TrainingWorkerUnavailableError)) throw error
    console.warn('Training in the main thread:', error.message)
  }

  // Sin worker: los datos se vuelven a preparar (los del worker se transfirieron)
  const tensors = seriesTensors({
    window: prepared.prep.window,
    X     : flat(prepared.train.X),
    y     : new Float32Array(prepared.train.y),
    XTest : flat(prepared.test.X),
    yTest : new Float32Array(prepared.test.y),
  })
  try {
    const model = buildSeriesModel(layerList, prepared.prep.window)
    compileModel(model, request.compile)
    const history = await model.fit(tensors.X, tensors.y, {
      batchSize     : params.batchSize,
      shuffle       : true,
      validationData: [tensors.XTest, tensors.yTest],
      epochs        : params.numberOfEpoch,
      callbacks     : [visCallbacks, {
        onBatchEnd: async () => { if (params.shouldStop?.()) model.stopTraining = true },
        onEpochEnd: async (epoch: number) => {
          params.onEpochEnd?.(epoch + 1, params.numberOfEpoch)
          if (params.shouldStop?.()) model.stopTraining = true
        },
      }],
    })
    return { model, history }
  } finally {
    tfjs.dispose(Object.values(tensors))
  }
}
