import * as _Types from '@core/types'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import { trainDenseModel, type TrainDenseModelParams_t } from '@core/controller/trainDenseModel'

type CustomRegression_DatasetParams_t = Pick<TrainDenseModelParams_t, 'onEpochEnd' | 'shouldStop'> & {
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
 * Entrena el modelo de regresión. `data_processed.y` es la columna objetivo (un número por fila);
 * la división entrenamiento/test usa una semilla fija para poder comparar modelos.
 */
export async function createRegressionCustomModel(params: CustomRegression_DatasetParams_t) {
  const { name_model = 'Regression', learningRate = 0.01, testSize = 0.1, ...rest } = params
  return trainDenseModel({
    ...rest,
    name_model,
    learningRate,
    testSize,
    seed        : 42,
    fitCallbacks: { callbacks: ['onEpochBegin', 'onEpochEnd', 'onBatchBegin', 'onBatchEnd'], zoomToFitAccuracy: true },
  })
}
