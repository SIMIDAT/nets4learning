import * as tfjs from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'
import { trainTestSplit } from '@utils/trainTestSplit'
import { createLoss, createMetrics, createOptimizer, FIT_CALLBACKS_METRICS_LABELS } from '@core/nn-utils/ArchitectureHelper'
import * as _Types from '@core/types'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import i18next from 'i18next'
import AlertHelper from '@utils/alertHelper'
import { isActivation } from '@core/nn-utils/ArchitectureTypesHelper'

type DenseLayer_t = Pick<_Types.Layer_t, 'units' | 'activation'>


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

/**
 * Entrena una red de capas dense sobre `dataset_processed.data_processed` (X numérica, y ya preparada:
 * one-hot en clasificación, un número por fila en regresión) mostrando el progreso en el visor.
 *
 * @throws {Error} si el dataset no está procesado, alguna capa no tiene activación o el modelo no compila
 */
/** Clase real y predicha de cada ejemplo de validación (índices de clase); solo en clasificación */
export type ClassificationEvaluation_t = { labels: number[], predictions: number[] }

export async function trainDenseModel(params: TrainDenseModelParams_t): Promise<{ model: tfjs.Sequential, history: tfjs.History, evaluation?: ClassificationEvaluation_t }> {
  const {
    dataset_processed,
    name_model,
    layerList,
    learningRate,
    momentum = 0,
    testSize,
    numberOfEpoch,
    idOptimizer,
    idLoss,
    idMetrics,
    seed,
    fitCallbacks,
    onEpochEnd,
    shouldStop,
  } = params
  tfvis.visor().open()

  const { data_processed } = dataset_processed
  if (!data_processed) {
    console.error('data_processed is undefined', { dataset_processed })
    throw new Error('Data processed is undefined')
  }
  const { X, y } = data_processed
  // Cada fila de y es un número (regresión) o un vector one-hot (clasificación)
  const [XTrain, XTest, yTrain, yTest] = trainTestSplit(X.values as number[][], y.values as Array<number | number[]>, testSize, seed)
  const XTrain_tensor = tfjs.tensor(XTrain)
  const XTest_tensor = tfjs.tensor(XTest)
  const yTrain_tensor = tfjs.tensor(yTrain as number[] | number[][])
  const yTest_tensor = tfjs.tensor(yTest as number[] | number[][])

  const model = tfjs.sequential()
  for (const [index, layer] of layerList.entries()) {
    if (layer.activation === null || !isActivation(layer.activation)) {
      const message = `Layer ${index + 1} activation is not valid (${layer.activation}). Please select an activation function.`
      AlertHelper.alertError(message)
      throw new Error(message)
    }
    model.add(tfjs.layers.dense({
      units     : layer.units,
      activation: layer.activation,
      ...(index === 0) && {
        inputShape: [X.shape[1]],
      },
    }))
  }

  const optimizer = createOptimizer(idOptimizer, { learningRate, momentum })
  const loss = createLoss(idLoss, {})
  const metrics = createMetrics(idMetrics, {})

  try {
    model.summary()
    model.compile({ optimizer, loss, metrics })
  } catch (error) {
    console.error('model.compile()', { error, idOptimizer, idLoss, idMetrics })
    AlertHelper.alertError(i18next.t('error.model-compile'))
    throw error
  }

  await tfvis.show.modelSummary({ name: 'Model Summary', tab: name_model }, model)
  tfvis.visor().setActiveTab(name_model)

  const fitCallbackHandlers = tfvis.show.fitCallbacks({ name: 'Training', tab: name_model }, FIT_CALLBACKS_METRICS_LABELS, fitCallbacks)
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
    callbacks     : [fitCallbackHandlers, progressCallbacks],
  })

  // En clasificación (y en one-hot) se guarda la predicción de cada ejemplo de validación para la matriz de confusión
  let evaluation: ClassificationEvaluation_t | undefined
  if (yTest_tensor.rank === 2 && yTest_tensor.shape[0] > 0) {
    const [labels, predictions] = tfjs.tidy(() => [
      yTest_tensor.argMax(-1),
      (model.predict(XTest_tensor) as tfjs.Tensor).argMax(-1),
    ])
    evaluation = { labels: Array.from(labels.dataSync()), predictions: Array.from(predictions.dataSync()) }
    labels.dispose()
    predictions.dispose()
  }
  // Los datos ya no hacen falta: el modelo guarda sus pesos y el historial guarda números
  tfjs.dispose([XTrain_tensor, XTest_tensor, yTrain_tensor, yTest_tensor])

  return { model, history, evaluation }
}
