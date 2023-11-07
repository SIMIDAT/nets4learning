import * as tfvis from '@tensorflow/tfjs-vis'
import * as tf from '@tensorflow/tfjs'
import { MnistData } from '../models/MODEL_IMAGE_MNIST_Data'
import { createOptimizer, createLoss, createMetricsList } from '@core/nn-utils/ArchitectureHelper'

const classNames = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
]

async function showExamples (data) {
  // Create a container in the visor
  const surface = tfvis
    .visor()
    .surface({ name: 'Examples', tab: 'Data set' })

  // Get the examples
  const examples = data.nextTestBatch(20)
  const numExamples = examples.xs.shape[0]

  // Create a canvas element to render each example
  for (let i = 0; i < numExamples; i++) {
    const imageTensor = tf.tidy(() => {
      // Reshape the image to 28x28 px
      return examples.xs
        .slice([i, 0], [1, examples.xs.shape[1]])
        .reshape([28, 28, 1])
    })

    const canvas = document.createElement('canvas')
    canvas.width = 28
    canvas.height = 28
    canvas.style.margin = '4px'
    await tf.browser.toPixels(imageTensor, canvas)
    surface.drawArea.appendChild(canvas)

    imageTensor.dispose()
  }
}

async function train (model, data, numberOfEpoch) {
  const metrics = ['loss', 'val_loss', 'acc', 'val_acc']
  const container = {
    name: 'Train Model',
    tab : 'Training'
  }
  const fitCallbacks = tfvis.show.fitCallbacks(container, metrics)

  const BATCH_SIZE = 512
  const TRAIN_DATA_SIZE = 11000
  const TEST_DATA_SIZE = 2000

  const [trainXs, trainYs] = tf.tidy(() => {
    const d = data.nextTrainBatch(TRAIN_DATA_SIZE)
    return [d.xs.reshape([TRAIN_DATA_SIZE, 28, 28, 1]), d.labels]
  })

  const [testXs, testYs] = tf.tidy(() => {
    const d = data.nextTestBatch(TEST_DATA_SIZE)
    return [d.xs.reshape([TEST_DATA_SIZE, 28, 28, 1]), d.labels]
  })

  return model.fit(trainXs, trainYs, {
    batchSize     : BATCH_SIZE,
    validationData: [testXs, testYs],
    epochs        : numberOfEpoch,
    shuffle       : true,
    callbacks     : fitCallbacks,
  })
}

function doPrediction (model, data, testDataSize = 500) {
  const IMAGE_WIDTH = 28
  const IMAGE_HEIGHT = 28
  const testData = data.nextTestBatch(testDataSize)
  const tests_reshape = testData.xs.reshape([
    testDataSize,
    IMAGE_WIDTH,
    IMAGE_HEIGHT,
    1,
  ])
  const labels = testData.labels.argMax(-1)
  const prediction = model.predict(tests_reshape).argMax(-1)

  tests_reshape.dispose()
  return [prediction, labels]
}

async function showAccuracy (model, data) {
  const [preds, labels] = doPrediction(model, data)
  const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, preds)
  const container = { name: 'Accuracy', tab: 'Evaluation' }
  await tfvis.show.perClassAccuracy(container, classAccuracy, classNames)

  labels.dispose()
}

async function showConfusion (model, data) {
  const [preds, labels] = doPrediction(model, data)
  const confusionMatrix = await tfvis.metrics.confusionMatrix(labels, preds)
  const container = { name: 'Confusion Matrix', tab: 'Evaluation' }
  await tfvis.render.confusionMatrix(container, {
    values    : confusionMatrix,
    tickLabels: classNames,
  })
  labels.dispose()
}

function getModel (layerList, idOptimizer, idLoss, idMetrics_list, learningRate) {
  const model = tf.sequential()
  const optimizer = createOptimizer(idOptimizer, { learningRate: (learningRate / 100), momentum: 0.99 })
  const loss = createLoss(idLoss, {})
  const metrics = createMetricsList(idMetrics_list, {})

  for (const layer of layerList) {
    switch (layer._class) {
      case 'conv2d': {
        const inputShape = layer._protected ? { inputShape: layer.inputShape } : {}
        model.add(tf.layers.conv2d({
          ...inputShape,
          kernelSize: layer.kernelSize,
          filters   : layer.filters,
          activation: layer.activation
        }))
        break
      }
      case 'maxPooling2d': {
        model.add(tf.layers.maxPooling2d({ poolSize: layer.poolSize, strides: layer.strides }))
        break
      }
      case 'flatten': {
        model.add(tf.layers.flatten({}))
        break
      }
      case 'dense': {
        model.add(tf.layers.dense({ units: layer.units, activation: layer.activation }))
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

export async function MNIST_run (params_data) {

  const {
    learningRate,
    numberOfEpoch,
    idOptimizer,
    idLoss,
    idMetricsList,
    layerList,
  } = params_data

  const data = new MnistData()
  await data.load()
  await showExamples(data)

  const model = getModel(layerList, idOptimizer, idLoss, idMetricsList, learningRate)
  await tfvis.show.modelSummary({ name: 'Model summary', tab: 'Model' }, model)

  await train(model, data, numberOfEpoch)

  await showAccuracy(model, data)
  await showConfusion(model, data)
  return model
}
