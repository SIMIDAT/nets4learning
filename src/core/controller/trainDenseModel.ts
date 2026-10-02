import * as tfjs from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'
import { trainTestSplit } from '@utils/trainTestSplit'
import { FIT_CALLBACKS_METRICS_LABELS } from '@core/nn-utils/ArchitectureHelper'
import * as _Types from '@core/types'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import i18next from 'i18next'
import AlertHelper from '@utils/alertHelper'
import { getActiveTFBackend } from '@core/tfBackend'
import { showTrainingVisor } from '@core/nn-utils/trainingVisor'
import { ModelDefinitionError, buildDenseModel, compileModel, modelFromArtifacts, type DenseLayer_t } from '@core/training/buildModels'
import { TrainingWorkerUnavailableError, trainInWorker } from '@core/training/trainingClient'
import type { ClassificationEvaluation_t, TrainingProgress_t } from '@core/training/trainingTypes'

export type { ClassificationEvaluation_t } from '@core/training/trainingTypes'

export type TrainDenseModelParams_t = {
  dataset_processed: _Types.DatasetProcessed_t
  /** Pestaña del visor de tfjs-vis donde se muestra el entrenamiento */
  name_model       : string
  layerList        : DenseLayer_t[]
  learningRate     : number
  momentum?        : number
  testSize         : number
  numberOfEpoch    : number
  idOptimizer      : IdOptimizer_t
  idLoss           : IdLoss_t
  idMetrics        : IdMetric_t | IdMetric_t[]
  /** Semilla de la división entrenamiento/test; sin ella la división cambia en cada entrenamiento */
  seed?            : number
  /** Opciones de las gráficas de entrenamiento del visor */
  fitCallbacks     : { callbacks: string[], zoomToFitAccuracy?: boolean }
  /** Se llama al terminar cada época (contando desde 1) con el total de épocas, para enseñar el progreso */
  onEpochEnd?      : (epoch: number, totalEpochs: number) => void
  /** Si devuelve true, el entrenamiento se detiene al acabar el lote actual (el modelo se queda como esté) */
  shouldStop?      : () => boolean
}

type DenseTrainingResult_t = { model: tfjs.Sequential, history: tfjs.History, evaluation?: ClassificationEvaluation_t }
type VisCallbacks_t = ReturnType<typeof tfvis.show.fitCallbacks>

/** Avisa al usuario de un error en la arquitectura (activación sin elegir, pérdida o métrica que no compila) */
function alertDefinitionError(error: ModelDefinitionError) {
  void AlertHelper.alertError(error.kind === 'compile' ? i18next.t('error.model-compile') : error.message)
}

/**
 * Entrena una red de capas dense sobre `dataset_processed.data_processed` (X numérica, y ya preparada:
 * one-hot en clasificación, un número por fila en regresión) mostrando el progreso en el visor (en el móvil se dibuja
 * cerrado: showTrainingVisor).
 *
 * Entrena en un worker (TODO-worker.md), así la página no se bloquea; si no se puede (sin workers o sin el backend
 * elegido en el worker), aquí mismo.
 *
 * @throws {Error} si el dataset no está procesado, alguna capa no tiene activación o el modelo no compila
 */
export async function trainDenseModel(params: TrainDenseModelParams_t): Promise<DenseTrainingResult_t> {
  const { dataset_processed, name_model, layerList, fitCallbacks } = params
  showTrainingVisor()

  const { data_processed } = dataset_processed
  if (!data_processed) {
    console.error('data_processed is undefined', { dataset_processed })
    throw new Error('Data processed is undefined')
  }
  const { X } = data_processed

  // El resumen del visor con la misma red (sin entrenar) antes de empezar
  let summaryModel: tfjs.Sequential
  try {
    summaryModel = buildDenseModel(layerList, X.shape[1])
  } catch (error) {
    if (error instanceof ModelDefinitionError) alertDefinitionError(error)
    throw error
  }
  await tfvis.show.modelSummary({ name: 'Model Summary', tab: name_model }, summaryModel)
  summaryModel.dispose()
  tfvis.visor().setActiveTab(name_model)
  const visCallbacks = tfvis.show.fitCallbacks({ name: 'Training', tab: name_model }, FIT_CALLBACKS_METRICS_LABELS, fitCallbacks)

  try {
    return await trainDenseInWorker(params, visCallbacks)
  } catch (error) {
    if (error instanceof ModelDefinitionError) {
      alertDefinitionError(error)
      throw error
    }
    if (!(error instanceof TrainingWorkerUnavailableError)) throw error
    console.warn('Training in the main thread:', error.message)
  }
  return trainDenseModelInMainThread(params, visCallbacks)
}

/** Lo que el visor y la página enseñan con cada aviso del worker */
export function forwardProgress(visCallbacks: VisCallbacks_t, onEpochEnd?: (epoch: number, totalEpochs: number) => void) {
  return (progress: TrainingProgress_t) => {
    if (progress.kind === 'batch') {
      void visCallbacks.onBatchEnd?.(progress.batch, progress.logs)
    } else {
      void visCallbacks.onEpochEnd?.(progress.epoch, progress.logs)
      onEpochEnd?.(progress.epoch + 1, progress.totalEpochs)
    }
  }
}

async function trainDenseInWorker(params: TrainDenseModelParams_t, visCallbacks: VisCallbacks_t): Promise<DenseTrainingResult_t> {
  const { dataset_processed, layerList, learningRate, momentum, testSize, numberOfEpoch, idOptimizer, idLoss, idMetrics, seed, onEpochEnd, shouldStop } = params
  const { X, y } = dataset_processed.data_processed!
  const [rows, features] = X.shape as [number, number]
  const XValues = new Float32Array((X.values as number[][]).flat())
  const yRows = y.values as Array<number | number[]>
  const yShape = Array.isArray(yRows[0]) ? [rows, (yRows[0] as number[]).length] : [rows]
  const yValues = new Float32Array((yRows as Array<number | number[]>).flat() as number[])

  const result = await trainInWorker('trainDense', {
    backend  : getActiveTFBackend(),
    X        : XValues,
    rows,
    features,
    y        : yValues,
    yShape,
    // Solo lo que necesita la red (las capas del editor llevan más campos)
    layerList: layerList.map(({ units, activation }) => ({ units, activation })),
    compile  : { idOptimizer, idLoss, idMetrics, learningRate, momentum },
    testSize,
    seed,
    numberOfEpoch,
  }, {
    transfer  : [XValues.buffer, yValues.buffer],
    shouldStop,
    onProgress: forwardProgress(visCallbacks, onEpochEnd),
  })
  return {
    model     : await modelFromArtifacts(result.artifacts),
    // Los valores del historial ya son números (lo que la página lee de History)
    history   : result.history as unknown as tfjs.History,
    evaluation: result.evaluation,
  }
}

async function trainDenseModelInMainThread(params: TrainDenseModelParams_t, visCallbacks: VisCallbacks_t): Promise<DenseTrainingResult_t> {
  const { dataset_processed, layerList, learningRate, momentum = 0, testSize, numberOfEpoch, idOptimizer, idLoss, idMetrics, seed, onEpochEnd, shouldStop } = params
  const { X, y } = dataset_processed.data_processed!
  // Cada fila de y es un número (regresión) o un vector one-hot (clasificación)
  const [XTrain, XTest, yTrain, yTest] = trainTestSplit(X.values as number[][], y.values as Array<number | number[]>, testSize, seed)
  const XTrain_tensor = tfjs.tensor(XTrain)
  const XTest_tensor = tfjs.tensor(XTest)
  const yTrain_tensor = tfjs.tensor(yTrain as number[] | number[][])
  const yTest_tensor = tfjs.tensor(yTest as number[] | number[][])

  const model = buildDenseModel(layerList, X.shape[1])
  try {
    compileModel(model, { idOptimizer, idLoss, idMetrics, learningRate, momentum })
  } catch (error) {
    console.error('model.compile()', { error, idOptimizer, idLoss, idMetrics })
    if (error instanceof ModelDefinitionError) alertDefinitionError(error)
    throw error
  }

  const progressCallbacks: tfjs.CustomCallbackArgs = {
    onBatchEnd: async () => {
      if (shouldStop?.()) model.stopTraining = true
    },
    onEpochEnd: async (epoch) => {
      onEpochEnd?.(epoch + 1, numberOfEpoch)
      if (shouldStop?.()) model.stopTraining = true
    },
  }
  const history = await model.fit(XTrain_tensor, yTrain_tensor, {
    batchSize     : 32,
    shuffle       : true,
    validationData: [XTest_tensor, yTest_tensor],
    epochs        : numberOfEpoch,
    callbacks     : [visCallbacks, progressCallbacks],
  })

  // En clasificación (y en one-hot) se guarda la predicción de cada ejemplo de validación para la matriz de confusión
  let evaluation: ClassificationEvaluation_t | undefined
  if (yTest_tensor.rank === 2 && yTest_tensor.shape[0] > 0) {
    const [labels, predictions] = tfjs.tidy(() => [
      yTest_tensor.argMax(-1),
      (model.predict(XTest_tensor) as tfjs.Tensor).argMax(-1),
    ])
    // Lectura asíncrona: dataSync detiene el hilo principal hasta que la GPU termina
    const [labelValues, predictionValues] = await Promise.all([labels.data(), predictions.data()])
    evaluation = { labels: Array.from(labelValues), predictions: Array.from(predictionValues) }
    labels.dispose()
    predictions.dispose()
  }
  // Los datos ya no hacen falta: el modelo guarda sus pesos y el historial guarda números
  tfjs.dispose([XTrain_tensor, XTest_tensor, yTrain_tensor, yTest_tensor])

  return { model, history, evaluation }
}
