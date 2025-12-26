import * as tfvis from '@tensorflow/tfjs-vis'
import * as tfjs from '@tensorflow/tfjs'
import { KmnistData } from '../models/MODEL_IMAGE_KMNIST_Data'
import { createOptimizer, createLoss, createMetricsList } from '@core/nn-utils/ArchitectureHelper'
import type { ParamsTrain_KMNIST_t } from '../models/MODEL_IMAGE_KMNIST'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t as IdOptimizer_t } from '@/types/nn-types'

const classNames = [
  'お',
  'き',
  'す',
  'つ',
  'な',
  'は',
  'ま',
  'や',
  'れ',
  'を',
]

async function showExamples(data: KmnistData) {
  // Create a container in the visor
  const surface = tfvis
    .visor()
    .surface({ name: 'Examples', tab: 'Data set' })

  // Get the examples
  const examples = data.nextTestBatch(20)
  const numExamples = examples.xs.shape[0]

  // Create a canvas element to render each example
  for (let i = 0; i < numExamples; i++) {
    // FIX 
    // TypeScript Error
    const imageTensor = tfjs.tidy(() => {
      // Reshape the image to 28x28 px
      return examples.xs
        .slice([i, 0], [1, examples.xs.shape[1]])
        .reshape([28, 28, 1])
    }) as tfjs.Tensor3D

    const canvas = document.createElement('canvas')
    canvas.width = 28
    canvas.height = 28
    canvas.style.margin = '4px'
    await tfjs.browser.toPixels(imageTensor, canvas)
    surface.drawArea.appendChild(canvas)

    imageTensor.dispose()
  }
}

async function train(model: tfjs.LayersModel, data: KmnistData, numberEpochs: number) {
  const metrics = ['loss', 'val_loss', 'acc', 'val_acc']
  const container = {
    name: 'Train Model',
    tab : 'Training'
  }
  const fitCallbacks = tfvis.show.fitCallbacks(container, metrics)

  const BATCH_SIZE = 512
  const TRAIN_DATA_SIZE = 11000
  const TEST_DATA_SIZE = 2000

  const [trainXs, trainYs] = tfjs.tidy(() => {
    const d = data.nextTrainBatch(TRAIN_DATA_SIZE)
    return [d.xs.reshape([TRAIN_DATA_SIZE, 28, 28, 1]), d.labels]
  })

  const [testXs, testYs] = tfjs.tidy(() => {
    const d = data.nextTestBatch(TEST_DATA_SIZE)
    return [d.xs.reshape([TEST_DATA_SIZE, 28, 28, 1]), d.labels]
  })

  return model.fit(trainXs, trainYs, {
    batchSize     : BATCH_SIZE,
    validationData: [testXs, testYs],
    epochs        : numberEpochs,
    shuffle       : true,
    callbacks     : fitCallbacks,
  })
}

function doPrediction(model: tfjs.LayersModel, data: KmnistData, testDataSize: number = 500): [tfjs.Tensor1D, tfjs.Tensor1D] {
  const IMAGE_WIDTH = 28
  const IMAGE_HEIGHT = 28
  const testData = data.nextTestBatch(testDataSize)
  const tests_reshape = testData.xs.reshape([
    testDataSize,
    IMAGE_WIDTH,
    IMAGE_HEIGHT,
    1,
  ])
  // FIX 
  // TypeScript Error
  const labels = testData.labels.argMax(-1) as tfjs.Tensor1D
  const prediction = model.predict(tests_reshape) as tfjs.Tensor
  const predictionArgMax = prediction.argMax(-1) as tfjs.Tensor1D

  tests_reshape.dispose()
  return [predictionArgMax, labels]
}

async function showAccuracy(model: tfjs.LayersModel, data: KmnistData) {
  const [preds, labels] = doPrediction(model, data)
  const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, preds)
  const container = { name: 'Accuracy', tab: 'Evaluation' }
  await tfvis.show.perClassAccuracy(container, classAccuracy, classNames)

  labels.dispose()
}

async function showConfusion(model: tfjs.LayersModel, data: KmnistData) {
  const [preds, labels] = doPrediction(model, data)
  const confusionMatrix = await tfvis.metrics.confusionMatrix(labels, preds)
  const container = { name: 'Confusion Matrix', tab: 'Evaluation' }
  await tfvis.render.confusionMatrix(container, {
    values    : confusionMatrix,
    tickLabels: classNames,
  })
  labels.dispose()
}

// TODO
function getModel(layers: any[], idOptimizer: IdOptimizer_t, idLoss: IdLoss_t, idMetrics_list: IdMetric_t[], learningRate: number) {
  const model = tfjs.sequential()
  const optimizer = createOptimizer(idOptimizer, { learningRate: (learningRate / 100), momentum: 0.99 })
  const loss = createLoss(idLoss, {})
  const metrics = createMetricsList(idMetrics_list, {})

  for (const layer of layers) {
    switch (layer._class) {
      case 'conv2d': {
        const inputShape = layer._protected ? { inputShape: layer.inputShape } : {}
        model.add(tfjs.layers.conv2d({
          ...inputShape,
          kernelSize: layer.kernelSize,
          filters   : layer.filters,
          activation: layer.activation
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
        model.add(tfjs.layers.dense({ units: layer.units, activation: layer.activation }))
        break
      }
      default: {
        console.error('Error, layer not valid')
        break
      }
    }
  }
  model.compile({
    optimizer: optimizer,
    loss     : loss,
    metrics  : metrics,
  })

  return model
}

export async function KMNIST_run(params_data: ParamsTrain_KMNIST_t) {

  const {
    learningRate,
    numberEpochs,
    idOptimizer,
    idLoss,
    idMetricsList,
    layers,
  } = params_data

  const data = new KmnistData()
  await data.load()
  await showExamples(data)

  const model = getModel(layers, idOptimizer, idLoss, idMetricsList, learningRate)
  await tfvis.show.modelSummary({ name: 'Model summary', tab: 'Model' }, model)

  const history = await train(model, data, numberEpochs)

  await showAccuracy(model, data)
  await showConfusion(model, data)
  return { 
    model,
    history,
  }
}
