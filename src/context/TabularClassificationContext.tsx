import { createContext, useState } from 'react'
import type * as tfjs from '@tensorflow/tfjs'

import type * as _Types from '@core/types'
import type I_MODEL_TABULAR_CLASSIFICATION from '@pages/playground/0_TabularClassification/models/_model'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import {
  DEFAULT_LEARNING_RATE,
  DEFAULT_NUMBER_EPOCHS,
  DEFAULT_TEST_SIZE,
  DEFAULT_ID_OPTIMIZATION,
  DEFAULT_ID_LOSS,
  DEFAULT_ID_METRICS,
  DEFAULT_LAYERS,
} from '@pages/playground/0_TabularClassification/CONSTANTS'

type State<T> = [T, React.Dispatch<React.SetStateAction<T>>]

export type TabularDatasets_t = { index: number, datasets: _Types.DatasetProcessed_t[] }

const DEFAULT_PREDICTION_BAR: _Types.TabularClassificationPredictionBar_t = { classes: [], labels: [], data: [] }

/** Estado compartido de la página de entrenamiento de clasificación tabular */
export type TabularClassificationContext_t = {
  // La clase del modelo (o del CSV subido); null mientras se carga
  iModelInstance         : I_MODEL_TABULAR_CLASSIFICATION | null
  setIModelInstance      : State<I_MODEL_TABULAR_CLASSIFICATION | null>[1]
  datasets               : TabularDatasets_t
  setDatasets            : State<TabularDatasets_t>[1]
  // Arquitectura e hiperparámetros del modelo que se va a entrenar
  layers                 : _Types.Layer_t[]
  setLayers              : State<_Types.Layer_t[]>[1]
  learningRate           : number
  setLearningRate        : State<number>[1]
  numberEpochs           : number
  setNumberEpochs        : State<number>[1]
  testSize               : number
  setTestSize            : State<number>[1]
  idOptimizer            : IdOptimizer_t
  setIdOptimizer         : State<IdOptimizer_t>[1]
  idLoss                 : IdLoss_t
  setIdLoss              : State<IdLoss_t>[1]
  idMetrics              : IdMetric_t
  setIdMetrics           : State<IdMetric_t>[1]
  // Modelos entrenados y el que se usa para predecir
  isTraining             : boolean
  setIsTraining          : State<boolean>[1]
  generatedModels        : _Types.TabularClassificationGeneratedModel_t[]
  setGeneratedModels     : State<_Types.TabularClassificationGeneratedModel_t[]>[1]
  generatedModelsIndex   : number
  setGeneratedModelsIndex: State<number>[1]
  model                  : tfjs.Sequential | null
  setModel               : State<tfjs.Sequential | null>[1]
  // Predicción
  inputDataToPredict     : _Types.N4LDataFrameType[]
  setInputDataToPredict  : State<_Types.N4LDataFrameType[]>[1]
  inputVectorToPredict   : _Types.N4LDataFrameType[]
  setInputVectorToPredict: State<_Types.N4LDataFrameType[]>[1]
  predictionBar          : _Types.TabularClassificationPredictionBar_t
  setPredictionBar       : State<_Types.TabularClassificationPredictionBar_t>[1]
}

// null fuera del Provider: se accede a través de useTabularClassificationContext(), que avisa del error
const TabularClassificationContext = createContext<TabularClassificationContext_t | null>(null)

export function TabularClassificationProvider({ children }: { children: React.ReactNode }) {
  const [iModelInstance, setIModelInstance] = useState<I_MODEL_TABULAR_CLASSIFICATION | null>(null)
  const [datasets, setDatasets] = useState<TabularDatasets_t>({ index: -1, datasets: [] })
  const [layers, setLayers] = useState<_Types.Layer_t[]>(DEFAULT_LAYERS)
  const [learningRate, setLearningRate] = useState(DEFAULT_LEARNING_RATE)
  const [numberEpochs, setNumberEpochs] = useState(DEFAULT_NUMBER_EPOCHS)
  const [testSize, setTestSize] = useState(DEFAULT_TEST_SIZE)
  const [idOptimizer, setIdOptimizer] = useState<IdOptimizer_t>(DEFAULT_ID_OPTIMIZATION)
  const [idLoss, setIdLoss] = useState<IdLoss_t>(DEFAULT_ID_LOSS)
  const [idMetrics, setIdMetrics] = useState<IdMetric_t>(DEFAULT_ID_METRICS)
  const [isTraining, setIsTraining] = useState(false)
  const [generatedModels, setGeneratedModels] = useState<_Types.TabularClassificationGeneratedModel_t[]>([])
  const [generatedModelsIndex, setGeneratedModelsIndex] = useState(-1)
  const [model, setModel] = useState<tfjs.Sequential | null>(null)
  const [inputDataToPredict, setInputDataToPredict] = useState<_Types.N4LDataFrameType[]>([])
  const [inputVectorToPredict, setInputVectorToPredict] = useState<_Types.N4LDataFrameType[]>([])
  const [predictionBar, setPredictionBar] = useState(DEFAULT_PREDICTION_BAR)

  return (
    <TabularClassificationContext.Provider value={{
      iModelInstance, setIModelInstance,
      datasets, setDatasets,
      layers, setLayers,
      learningRate, setLearningRate,
      numberEpochs, setNumberEpochs,
      testSize, setTestSize,
      idOptimizer, setIdOptimizer,
      idLoss, setIdLoss,
      idMetrics, setIdMetrics,
      isTraining, setIsTraining,
      generatedModels, setGeneratedModels,
      generatedModelsIndex, setGeneratedModelsIndex,
      model, setModel,
      inputDataToPredict, setInputDataToPredict,
      inputVectorToPredict, setInputVectorToPredict,
      predictionBar, setPredictionBar,
    }}>
      {children}
    </TabularClassificationContext.Provider>
  )
}

export default TabularClassificationContext
