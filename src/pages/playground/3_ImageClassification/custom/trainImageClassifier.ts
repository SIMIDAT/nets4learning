import * as tfvis from '@tensorflow/tfjs-vis'
import * as tfjs from '@tensorflow/tfjs'
import { createOptimizer, createLoss, createMetricsList } from '@core/nn-utils/ArchitectureHelper'
import { isActivation } from '@core/nn-utils/ArchitectureTypesHelper'
import { TAB_03_IMAGE_CLASSIFICATION } from '@/CONSTANTS'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import type { Layer_t } from '@/types/types'
import { SpriteImageDataset, type SpriteDatasetConfig_t } from '../models/SpriteImageDataset'

export type ParamsTrainImage_t = {
  learningRate : number,
  numberEpochs : number,
  testSize     : number,
  idLoss       : IdLoss_t,
  idOptimizer  : IdOptimizer_t,
  idMetricsList: IdMetric_t[],
  layers       : Layer_t[],
}

/** Progreso del entrenamiento: aviso al acabar cada época (desde 1) y petición de parar */
export type TrainProgress_t = {
  onEpochEnd?: (epoch: number, totalEpochs: number) => void
  shouldStop?: () => boolean
}

const IMAGE_WIDTH = 28
const IMAGE_HEIGHT = 28
const BATCH_SIZE = 512
// Imágenes que se usan en cada entrenamiento (se sacan barajadas del dataset)
const TRAIN_DATA_SIZE = 11000
const TEST_DATA_SIZE = 2000

async function showExamples(data: SpriteImageDataset) {
  const surface = tfvis.visor().surface({ name: 'Data set: Examples', tab: TAB_03_IMAGE_CLASSIFICATION })
  const examples = data.nextTestBatch(20)
  for (let i = 0; i < examples.xs.shape[0]; i++) {
    const imageTensor = tfjs.tidy(() => examples.xs.slice([i, 0], [1, examples.xs.shape[1]]).reshape([IMAGE_HEIGHT, IMAGE_WIDTH, 1])) as tfjs.Tensor3D
    const canvas = document.createElement('canvas')
    canvas.width = IMAGE_WIDTH
    canvas.height = IMAGE_HEIGHT
    canvas.style.margin = '4px'
    await tfjs.browser.toPixels(imageTensor, canvas)
    surface.drawArea.appendChild(canvas)
    imageTensor.dispose()
  }
}

async function train(model: tfjs.Sequential, data: SpriteImageDataset, numberOfEpoch: number, progress: TrainProgress_t) {
  const fitCallbacks = tfvis.show.fitCallbacks(
    { name: 'Training: Train Model', tab: TAB_03_IMAGE_CLASSIFICATION },
    ['loss', 'val_loss', 'acc', 'val_acc'],
  )
  const [trainXs, trainYs] = tfjs.tidy(() => {
    const d = data.nextTrainBatch(TRAIN_DATA_SIZE)
    return [d.xs.reshape([TRAIN_DATA_SIZE, IMAGE_HEIGHT, IMAGE_WIDTH, 1]), d.labels]
  })
  const [testXs, testYs] = tfjs.tidy(() => {
    const d = data.nextTestBatch(TEST_DATA_SIZE)
    return [d.xs.reshape([TEST_DATA_SIZE, IMAGE_HEIGHT, IMAGE_WIDTH, 1]), d.labels]
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
  return await model.fit(trainXs, trainYs, {
    batchSize     : BATCH_SIZE,
    validationData: [testXs, testYs],
    epochs        : numberOfEpoch,
    shuffle       : true,
    callbacks     : [fitCallbacks, progressCallbacks],
  })
}

function doPrediction(model: tfjs.Sequential, data: SpriteImageDataset, testDataSize = 500): [tfjs.Tensor1D, tfjs.Tensor1D] {
  const testData = data.nextTestBatch(testDataSize)
  const testXs = testData.xs.reshape([testDataSize, IMAGE_HEIGHT, IMAGE_WIDTH, 1])
  const labels = testData.labels.argMax(-1) as tfjs.Tensor1D
  const prediction = (model.predict(testXs) as tfjs.Tensor).argMax(-1) as tfjs.Tensor1D
  testXs.dispose()
  return [prediction, labels]
}

async function showEvaluation(model: tfjs.Sequential, data: SpriteImageDataset, classNames: string[]) {
  const [preds, labels] = doPrediction(model, data)
  const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, preds)
  await tfvis.show.perClassAccuracy({ name: 'Evaluation: Accuracy', tab: TAB_03_IMAGE_CLASSIFICATION }, classAccuracy, classNames)
  const confusionMatrix = await tfvis.metrics.confusionMatrix(labels, preds)
  await tfvis.render.confusionMatrix({ name: 'Evaluation: Confusion Matrix', tab: TAB_03_IMAGE_CLASSIFICATION }, {
    values    : confusionMatrix,
    tickLabels: classNames,
  })
  labels.dispose()
  preds.dispose()
}

function getModel(layerList: Layer_t[], idOptimizer: IdOptimizer_t, idLoss: IdLoss_t, idMetrics_list: IdMetric_t[], learningRate: number) {
  const model = tfjs.sequential()
  const optimizer = createOptimizer(idOptimizer, { learningRate, momentum: 0.99 })
  const loss = createLoss(idLoss, {})
  const metrics = createMetricsList(idMetrics_list, {})

  for (const [index, layer] of layerList.entries()) {
    const activation = layer.activation ?? undefined
    if (activation !== undefined && !isActivation(activation)) {
      throw new Error(`Layer ${index + 1} activation is not valid (${activation})`)
    }
    switch (layer._class) {
      case 'conv2d': {
        if (layer.kernelSize === undefined || layer.filters === undefined) {
          throw new Error(`Layer ${index + 1}: conv2d needs kernelSize and filters`)
        }
        model.add(tfjs.layers.conv2d({
          ...(layer._protected ? { inputShape: layer.inputShape } : {}),
          kernelSize: layer.kernelSize,
          filters   : layer.filters,
          activation,
        }))
        break
      }
      case 'maxPooling2d': {
        model.add(tfjs.layers.maxPooling2d({ poolSize: layer.poolSize, strides: layer.strides }))
        break
      }
      case 'flatten': {
        model.add(tfjs.layers.flatten({}))
        break
      }
      case 'dense': {
        if (layer.units === undefined) {
          throw new Error(`Layer ${index + 1}: dense needs units`)
        }
        model.add(tfjs.layers.dense({ units: layer.units, activation }))
        break
      }
      default: {
        console.error('Error, layer not valid', { layer })
        break
      }
    }
  }
  model.compile({ optimizer, loss, metrics })
  return model
}

/**
 * Entrena una red convolucional con un dataset de imágenes de 28x28 guardado como sprite (MNIST, KMNIST…)
 * y muestra en el visor ejemplos, el entrenamiento y la evaluación por clase.
 */
export async function trainImageClassifier(dataset: SpriteDatasetConfig_t, classNames: string[], params: ParamsTrainImage_t, progress: TrainProgress_t = {}) {
  const { learningRate, numberEpochs, idOptimizer, idLoss, idMetricsList, layers } = params

  tfvis.visor().open()
  const data = new SpriteImageDataset(dataset)
  await data.load()
  await showExamples(data)

  const model = getModel(layers, idOptimizer, idLoss, idMetricsList, learningRate)
  await tfvis.show.modelSummary({ name: 'Model summary', tab: TAB_03_IMAGE_CLASSIFICATION }, model)
  tfvis.visor().setActiveTab(TAB_03_IMAGE_CLASSIFICATION)

  const history = await train(model, data, numberEpochs, progress)
  await showEvaluation(model, data, classNames)
  return { model, history }
}
