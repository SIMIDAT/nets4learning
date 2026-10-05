import * as tfvis from '@tensorflow/tfjs-vis'
import * as tfjs from '@tensorflow/tfjs'
import { TAB_03_IMAGE_CLASSIFICATION } from '@/CONSTANTS'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import { forwardProgress, type ClassificationEvaluation_t } from '@core/controller/trainDenseModel'
import type { ImageLayer_t } from '@/types/types'
import { getActiveTFBackend } from '@core/tfBackend'
import { showTrainingVisor } from '@core/nn-utils/trainingVisor'
import { ModelDefinitionError, buildImageModel, compileModel, modelFromArtifacts } from '@core/training/buildModels'
import { TrainingWorkerUnavailableError, trainInWorker } from '@core/training/trainingClient'
import { loadSpriteDataset, type SpriteImageDataset, type SpriteDatasetConfig_t } from '../models/SpriteImageDataset'

export type ParamsTrainImage_t = {
  learningRate : number,
  numberEpochs : number,
  testSize     : number,
  idLoss       : IdLoss_t,
  idOptimizer  : IdOptimizer_t,
  idMetricsList: IdMetric_t[],
  layers       : ImageLayer_t[],
}

/** Progreso del entrenamiento: aviso al acabar cada época (desde 1) y petición de parar */
export type TrainProgress_t = {
  onEpochEnd?: (epoch: number, totalEpochs: number) => void
  shouldStop?: () => boolean
}

const BATCH_SIZE = 512
// Imágenes que se usan en cada entrenamiento como mucho (se sacan barajadas del dataset)
const TRAIN_DATA_SIZE = 11000
const TEST_DATA_SIZE = 2000

/** Cuántas imágenes de entrenamiento y de validación se usan: como mucho las que tiene el conjunto */
const dataSizes = ({ numElements, numTrain }: SpriteDatasetConfig_t) => ({
  trainSize: Math.min(TRAIN_DATA_SIZE, numTrain),
  testSize : Math.min(TEST_DATA_SIZE, numElements - numTrain),
})

async function showExamples(data: SpriteImageDataset) {
  const surface = tfvis.visor().surface({ name: 'Data set: Examples', tab: TAB_03_IMAGE_CLASSIFICATION })
  const { width, height, channels } = data.image
  const examples = data.nextTestBatch(20)
  for (let i = 0; i < examples.xs.shape[0]; i++) {
    const imageTensor = tfjs.tidy(() => examples.xs.slice([i, 0], [1, examples.xs.shape[1]]).reshape([height, width, channels])) as tfjs.Tensor3D
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.style.margin = '4px'
    await tfjs.browser.toPixels(imageTensor, canvas)
    surface.drawArea.appendChild(canvas)
    imageTensor.dispose()
  }
}

/**
 * Entrena y devuelve, además del historial, la clase real y la predicha de cada imagen de validación (las mismas con las
 * que se calcula val_loss): son la matriz de confusión de la tabla de modelos.
 */
async function train(model: tfjs.Sequential, data: SpriteImageDataset, sizes: ReturnType<typeof dataSizes>, numberOfEpoch: number, progress: TrainProgress_t, fitCallbacks: VisCallbacks_t): Promise<{ history: tfjs.History, evaluation: ClassificationEvaluation_t }> {
  const { width, height, channels } = data.image
  const [trainXs, trainYs] = tfjs.tidy(() => {
    const d = data.nextTrainBatch(sizes.trainSize)
    return [d.xs.reshape([sizes.trainSize, height, width, channels]), d.labels]
  })
  const [testXs, testYs] = tfjs.tidy(() => {
    const d = data.nextTestBatch(sizes.testSize)
    return [d.xs.reshape([sizes.testSize, height, width, channels]), d.labels]
  })
  const progressCallbacks: tfjs.CustomCallbackArgs = {
    onBatchEnd: async () => {
      if (progress.shouldStop?.()) model.stopTraining = true
    },
    onEpochEnd: async (epoch) => {
      progress.onEpochEnd?.(epoch + 1, numberOfEpoch)
      if (progress.shouldStop?.()) model.stopTraining = true
    },
  }
  try {
    const history = await model.fit(trainXs, trainYs, {
      batchSize     : BATCH_SIZE,
      validationData: [testXs, testYs],
      epochs        : numberOfEpoch,
      shuffle       : true,
      callbacks     : [fitCallbacks, progressCallbacks],
    })
    const [labels, predictions] = tfjs.tidy((): [tfjs.Tensor, tfjs.Tensor] => [
      testYs.argMax(-1),
      (model.predict(testXs, { batchSize: BATCH_SIZE }) as tfjs.Tensor).argMax(-1),
    ])
    // Lecturas asíncronas: con WebGPU las síncronas detienen la GPU
    const evaluation = { labels: Array.from(await labels.data<'int32'>()), predictions: Array.from(await predictions.data<'int32'>()) }
    tfjs.dispose([labels, predictions])
    return { history, evaluation }
  } finally {
    // Las imágenes ya no hacen falta: el modelo guarda sus pesos y el historial guarda números
    tfjs.dispose([trainXs, trainYs, testXs, testYs])
  }
}

/** Precisión por clase y matriz de confusión en el visor, con las mismas imágenes de validación */
async function showEvaluation({ labels, predictions }: ClassificationEvaluation_t, classNames: string[]) {
  const labelsTensor = tfjs.tensor1d(labels, 'int32')
  const predictionsTensor = tfjs.tensor1d(predictions, 'int32')
  try {
    const classAccuracy = await tfvis.metrics.perClassAccuracy(labelsTensor, predictionsTensor, classNames.length)
    await tfvis.show.perClassAccuracy({ name: 'Evaluation: Accuracy', tab: TAB_03_IMAGE_CLASSIFICATION }, classAccuracy, classNames)
    const confusionMatrix = await tfvis.metrics.confusionMatrix(labelsTensor, predictionsTensor, classNames.length)
    await tfvis.render.confusionMatrix({ name: 'Evaluation: Confusion Matrix', tab: TAB_03_IMAGE_CLASSIFICATION }, {
      values    : confusionMatrix,
      tickLabels: classNames,
    })
  } finally {
    tfjs.dispose([labelsTensor, predictionsTensor])
  }
}

type VisCallbacks_t = ReturnType<typeof tfvis.show.fitCallbacks>

/** La red de las capas del editor, compilada (momento de 0,99 en el optimizador, como siempre en imágenes) */
function getModel(layerList: ImageLayer_t[], idOptimizer: IdOptimizer_t, idLoss: IdLoss_t, idMetrics_list: IdMetric_t[], learningRate: number) {
  const model = buildImageModel(layerList)
  compileModel(model, { idOptimizer, idLoss, idMetrics: idMetrics_list, learningRate, momentum: 0.99 })
  return model
}

/**
 * Entrena una red convolucional con un dataset de imágenes guardado como sprite (MNIST, KMNIST, CIFAR-10…)
 * y muestra en el visor ejemplos, el entrenamiento y la evaluación por clase. Devuelve también la clase real y la
 * predicha de cada imagen de validación.
 */
export async function trainImageClassifier(dataset: SpriteDatasetConfig_t, classNames: string[], params: ParamsTrainImage_t, progress: TrainProgress_t = {}) {
  const { layers } = params

  // Abierto en escritorio; en el móvil se dibuja cerrado (se abre con "Abrir visor")
  showTrainingVisor()
  // Los ejemplos del visor salen de las imágenes de test (el conjunto entero lo decodifica quien entrena)
  await showExamples(await loadSpriteDataset(dataset, { testOnly: true }))

  // El resumen del visor con la misma red (sin entrenar) antes de empezar
  const summaryModel = buildImageModel(layers)
  await tfvis.show.modelSummary({ name: 'Model summary', tab: TAB_03_IMAGE_CLASSIFICATION }, summaryModel)
  summaryModel.dispose()
  tfvis.visor().setActiveTab(TAB_03_IMAGE_CLASSIFICATION)
  const fitCallbacks = tfvis.show.fitCallbacks(
    { name: 'Training: Train Model', tab: TAB_03_IMAGE_CLASSIFICATION },
    ['loss', 'val_loss', 'acc', 'val_acc'],
  )

  let result: { model: tfjs.Sequential, history: tfjs.History, evaluation: ClassificationEvaluation_t } | null = null
  try {
    result = await trainImageClassifierInWorker(dataset, params, progress, fitCallbacks)
  } catch (error) {
    if (error instanceof ModelDefinitionError || !(error instanceof TrainingWorkerUnavailableError)) throw error
    console.warn('Training in the main thread:', error.message)
  }
  result ??= await trainImageClassifierInMainThread(dataset, params, progress, fitCallbacks)
  await showEvaluation(result.evaluation, classNames)
  return result
}

/**
 * En un worker (TODO-worker.md): descarga y decodifica el sprite y entrena allí, así la página no se bloquea. El
 * progreso llega por mensajes al visor y a la página
 */
async function trainImageClassifierInWorker(dataset: SpriteDatasetConfig_t, params: ParamsTrainImage_t, progress: TrainProgress_t, fitCallbacks: VisCallbacks_t) {
  const { learningRate, numberEpochs, idOptimizer, idLoss, idMetricsList, layers } = params
  const result = await trainInWorker('trainImages', {
    backend      : getActiveTFBackend(),
    imagesUrl    : new URL(dataset.imagesUrl, document.baseURI).href,
    labelsUrl    : new URL(dataset.labelsUrl, document.baseURI).href,
    numElements  : dataset.numElements,
    numTrain     : dataset.numTrain,
    numClasses   : dataset.numClasses,
    image        : dataset.image,
    layers,
    compile      : { idOptimizer, idLoss, idMetrics: idMetricsList, learningRate, momentum: 0.99 },
    numberOfEpoch: numberEpochs,
    ...dataSizes(dataset),
    batchSize    : BATCH_SIZE,
  }, {
    shouldStop: progress.shouldStop,
    onProgress: forwardProgress(fitCallbacks, progress.onEpochEnd),
  })
  if (result.evaluation === undefined) throw new Error('The worker did not return the evaluation')
  return {
    model     : await modelFromArtifacts(result.artifacts),
    history   : result.history as unknown as tfjs.History,
    evaluation: result.evaluation,
  }
}

/** Sin worker: todo aquí, como antes */
async function trainImageClassifierInMainThread(dataset: SpriteDatasetConfig_t, params: ParamsTrainImage_t, progress: TrainProgress_t, fitCallbacks: VisCallbacks_t) {
  const { learningRate, numberEpochs, idOptimizer, idLoss, idMetricsList, layers } = params
  const data = await loadSpriteDataset(dataset)
  const model = getModel(layers, idOptimizer, idLoss, idMetricsList, learningRate)
  const { history, evaluation } = await train(model, data, dataSizes(dataset), numberEpochs, progress, fitCallbacks)
  return { model, history, evaluation }
}
