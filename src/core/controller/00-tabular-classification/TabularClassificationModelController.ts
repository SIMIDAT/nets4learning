import * as _Types from '@core/types'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import { trainDenseModel } from '@core/controller/trainDenseModel'

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
 * Entrena el modelo de clasificación tabular. `data_processed.y` está en one-hot (una columna por clase).
 */
export async function createTabularClassificationCustomModel(params: CustomTabularClassification_DatasetParams_t) {
  const { name_model = 'Tabular classification', ...rest } = params
  return trainDenseModel({
    ...rest,
    name_model,
    fitCallbacks: { callbacks: ['onEpochEnd', 'onBatchEnd'] },
  })
}
