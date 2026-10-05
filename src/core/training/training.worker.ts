// Worker de entrenamiento: entrena las redes de los tres entrenadores (clasificación tabular, regresión y clasificación
// de imágenes) fuera del hilo principal, con el backend de TF.js elegido en la página. Manda el progreso de cada lote
// y cada época, para cuando se le pide y devuelve el modelo serializado, el historial y la evaluación.
import * as tfjs from '@tensorflow/tfjs'
import { exposeWorker } from '@core/workers/exposeWorker'
import type { WorkerTaskContext_t } from '@core/workers/workerProtocol'
import { activateTFBackend, type TFBackend_t } from '@core/tfBackend'
import { trainTestSplit } from '@utils/trainTestSplit'
import { decodeSpriteRows, spriteImageValues } from '@pages/playground/3_ImageClassification/models/spriteDecode'
import { ModelDefinitionError, buildDenseModel, buildImageModel, compileModel, historyData, modelArtifacts } from './buildModels'
import {
  BACKEND_ERROR_PREFIX,
  DEFINITION_ERROR_PREFIX,
  type ClassificationEvaluation_t,
  type DenseTrainingRequest_t,
  type ImageTrainingRequest_t,
  type TrainingProgress_t,
  type TrainingResult_t,
} from './trainingTypes'

let backendInUse: TFBackend_t | null = null

/** El mismo backend que la página (si el worker no puede usarlo, quien llama entrena en el hilo principal) */
async function ensureBackend(backend: TFBackend_t) {
  if (backendInUse === backend && tfjs.getBackend() === backend) return
  if (!await activateTFBackend(backend)) throw new Error(BACKEND_ERROR_PREFIX + backend)
  backendInUse = backend
}

/** Avisos de progreso y parada a petición (se comprueba al acabar cada lote) */
function progressCallbacks(model: tfjs.Sequential, context: WorkerTaskContext_t, totalEpochs: number): tfjs.CustomCallbackArgs {
  const send = (progress: TrainingProgress_t) => context.progress(progress)
  return {
    onBatchEnd: async (batch, logs) => {
      send({ kind: 'batch', batch, logs: logs ?? {} })
      if (context.cancelled()) model.stopTraining = true
    },
    onEpochEnd: async (epoch, logs) => {
      send({ kind: 'epoch', epoch, totalEpochs, logs: logs ?? {} })
      if (context.cancelled()) model.stopTraining = true
    },
  }
}

/** Clase real y predicha de cada ejemplo de validación (para la matriz de confusión) */
async function evaluate(model: tfjs.Sequential, xs: tfjs.Tensor, ys: tfjs.Tensor, batchSize?: number): Promise<ClassificationEvaluation_t> {
  const [labels, predictions] = tfjs.tidy(() => [
    ys.argMax(-1),
    (model.predict(xs, batchSize ? { batchSize } : undefined) as tfjs.Tensor).argMax(-1),
  ])
  try {
    return { labels: Array.from(await labels.data()), predictions: Array.from(await predictions.data()) }
  } finally {
    tfjs.dispose([labels, predictions])
  }
}

/** Los errores de la arquitectura se distinguen de los del worker: el usuario los puede corregir */
async function withDefinitionErrors<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (error instanceof ModelDefinitionError) throw new Error(`${DEFINITION_ERROR_PREFIX}${error.kind}:${error.message}`)
    throw error
  }
}

async function trainDense(request: DenseTrainingRequest_t, context: WorkerTaskContext_t): Promise<TrainingResult_t> {
  await ensureBackend(request.backend)
  const { X, rows, features, y, yShape, layerList, compile, testSize, seed, numberOfEpoch } = request
  const XRows = Array.from({ length: rows }, (_, row) => Array.from(X.subarray(row * features, (row + 1) * features)))
  const outputs = yShape[1] ?? 1
  const yRows = yShape.length === 1
    ? Array.from(y)
    : Array.from({ length: rows }, (_, row) => Array.from(y.subarray(row * outputs, (row + 1) * outputs)))
  const [XTrain, XTest, yTrain, yTest] = trainTestSplit(XRows, yRows as Array<number | number[]>, testSize, seed)
  const tensors = [tfjs.tensor(XTrain), tfjs.tensor(XTest), tfjs.tensor(yTrain as number[] | number[][]), tfjs.tensor(yTest as number[] | number[][])]
  const [XTrainTensor, XTestTensor, yTrainTensor, yTestTensor] = tensors
  try {
    const model = await withDefinitionErrors(async () => {
      const built = buildDenseModel(layerList, features)
      compileModel(built, compile)
      return built
    })
    const history = await model.fit(XTrainTensor, yTrainTensor, {
      batchSize     : 32,
      shuffle       : true,
      validationData: [XTestTensor, yTestTensor],
      epochs        : numberOfEpoch,
      callbacks     : progressCallbacks(model, context, numberOfEpoch),
    })
    // En clasificación (y en one-hot) se guarda la predicción de cada ejemplo de validación para la matriz de confusión
    const evaluation = yTestTensor.rank === 2 && yTestTensor.shape[0] > 0 ? await evaluate(model, XTestTensor, yTestTensor) : undefined
    const artifacts = await modelArtifacts(model)
    model.dispose()
    return { artifacts, history: historyData(history), evaluation }
  } finally {
    tfjs.dispose(tensors)
  }
}

async function fetchLabels(url: string): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not load dataset labels: ${url} (${response.status})`)
  return new Uint8Array(await response.arrayBuffer())
}

async function trainImages(request: ImageTrainingRequest_t, context: WorkerTaskContext_t): Promise<TrainingResult_t> {
  await ensureBackend(request.backend)
  const { imagesUrl, labelsUrl, numElements, numTrain, numClasses, image, layers, compile, numberOfEpoch, trainSize, testSize, batchSize } = request
  const [images, labels] = await Promise.all([
    decodeSpriteRows({ url: imagesUrl, firstRow: 0, numRows: numElements, image }),
    fetchLabels(labelsUrl),
  ])
  const size = spriteImageValues(image)
  // Imágenes barajadas: las de entrenamiento salen de las primeras numTrain y las de validación del resto
  const batch = (indices: Uint32Array, offset: number, count: number) => {
    const xs = new Float32Array(count * size)
    const ys = new Uint8Array(count * numClasses)
    for (let i = 0; i < count; i++) {
      const index = offset + indices[i % indices.length]
      xs.set(images.subarray(index * size, (index + 1) * size), i * size)
      ys.set(labels.subarray(index * numClasses, (index + 1) * numClasses), i * numClasses)
    }
    return [tfjs.tensor4d(xs, [count, image.height, image.width, image.channels]), tfjs.tensor2d(ys, [count, numClasses])]
  }
  const [trainXs, trainYs] = batch(tfjs.util.createShuffledIndices(numTrain), 0, trainSize)
  const [testXs, testYs] = batch(tfjs.util.createShuffledIndices(numElements - numTrain), numTrain, testSize)
  try {
    const model = await withDefinitionErrors(async () => {
      const built = buildImageModel(layers)
      compileModel(built, compile)
      return built
    })
    const history = await model.fit(trainXs, trainYs, {
      batchSize,
      validationData: [testXs, testYs],
      epochs        : numberOfEpoch,
      shuffle       : true,
      callbacks     : progressCallbacks(model, context, numberOfEpoch),
    })
    const evaluation = await evaluate(model, testXs, testYs, batchSize)
    const artifacts = await modelArtifacts(model)
    model.dispose()
    return { artifacts, history: historyData(history), evaluation }
  } finally {
    tfjs.dispose([trainXs, trainYs, testXs, testYs])
  }
}

export const trainingWorkerApi = { trainDense, trainImages }
export type TrainingWorkerApi_t = typeof trainingWorkerApi

exposeWorker(trainingWorkerApi)
