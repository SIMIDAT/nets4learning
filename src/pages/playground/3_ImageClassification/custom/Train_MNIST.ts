import * as tfvis from '@tensorflow/tfjs-vis'
import * as tfjs from '@tensorflow/tfjs'
import { MnistData } from '../models/MODEL_IMAGE_MNIST_Data'
import { createOptimizer, createLoss, createMetricsList } from '@core/nn-utils/ArchitectureHelper'
import { TAB_03_IMAGE_CLASSIFICATION } from '@/CONSTANTS'
import type { ParamsTrain_MNIST_t } from '../models/MODEL_IMAGE_MNIST'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t, Layer_t } from '@/types/nn-types'

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

async function showExamples(data: MnistData) {
  // Create a container in the visor
  const surface = tfvis.visor().surface({
    name: 'Data set: Examples',
    tab : TAB_03_IMAGE_CLASSIFICATION
  })

  // Get the examples
  const examples = data.nextTestBatch(20)
  const numExamples = examples.xs.shape[0]

  // Create a canvas element to render each example
  for (let i = 0; i < numExamples; i++) {
    const imageTensor: tfjs.Tensor2D = tfjs.tidy(() => {
      // Reshape the image to 28x28 px
      return examples.xs
        .slice([i, 0], [1, examples.xs.shape[1]])
        .reshape([28, 28, 1])
    })

    const canvas = document.createElement('canvas')
    canvas.width = 28
    canvas.height = 28
    canvas.style.margin = '4px'
    await tfjs.browser.toPixels(imageTensor, canvas)
    surface.drawArea.appendChild(canvas)

    imageTensor.dispose()
  }
}

/**
 * 
 * @param {tfjs.Sequential} model 
 * @param {MnistData} data 
 * @param {number} numberOfEpoch 
 * @returns 
 */
async function train(model: tfjs.Sequential, data: MnistData, numberOfEpoch: number) {
  const metrics = ['loss', 'val_loss', 'acc', 'val_acc']
  const container = {
    name: 'Training: Train Model',
    tab : TAB_03_IMAGE_CLASSIFICATION
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

  return await model.fit(trainXs, trainYs, {
    batchSize     : BATCH_SIZE,
    validationData: [testXs, testYs],
    epochs        : numberOfEpoch,
    shuffle       : true,
    callbacks     : fitCallbacks,
  })
}

function doPrediction(model: tfjs.Sequential, data: MnistData, testDataSize: number = 500): [tfjs.Tensor1D, tfjs.Tensor1D] {
  const IMAGE_WIDTH = 28
  const IMAGE_HEIGHT = 28
  const testData = data.nextTestBatch(testDataSize)
  const tests_reshape = testData.xs.reshape([
    testDataSize,
    IMAGE_WIDTH,
    IMAGE_HEIGHT,
    1,
  ])
  // TypeScript Fix
  const labels = testData.labels.argMax(-1) as tfjs.Tensor1D
  const predictions = model.predict(tests_reshape) as tfjs.Tensor1D
  const prediction = predictions.argMax(-1) as tfjs.Tensor1D

  tests_reshape.dispose()
  return [prediction, labels]
}

async function showAccuracy(model: tfjs.Sequential, data: MnistData) {
  const [preds, labels] = doPrediction(model, data)
  const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, preds)
  const container = { name: 'Evaluation: Accuracy', tab: TAB_03_IMAGE_CLASSIFICATION }
  await tfvis.show.perClassAccuracy(container, classAccuracy, classNames)

  labels.dispose()
}

async function showConfusion(model: tfjs.Sequential, data: MnistData) {
  const [preds, labels] = doPrediction(model, data)
  const confusionMatrix = await tfvis.metrics.confusionMatrix(labels, preds)
  const container = { name: 'Evaluation: Confusion Matrix', tab: TAB_03_IMAGE_CLASSIFICATION }
  await tfvis.render.confusionMatrix(container, {
    values    : confusionMatrix,
    tickLabels: classNames,
  })
  labels.dispose()
}

function getModel(layerList: Layer_t[], idOptimizer: IdOptimizer_t, idLoss: IdLoss_t, idMetrics_list: IdMetric_t[], learningRate: number) {
  const model = tfjs.sequential()
  const optimizer = createOptimizer(idOptimizer, { learningRate: (learningRate / 100), momentum: 0.99 })
  const loss = createLoss(idLoss, {})
  const metrics = createMetricsList(idMetrics_list, {})

  for (const layer of layerList) {
    switch (layer._class) {
      
      case 'conv2d': {
        const inputShape = layer._protected ? { inputShape: layer.inputShape } : {}
         if (layer.kernelSize === undefined || layer.filters === undefined) {
          console.error('Error, layer.kernelSize or layer.filters is undefined')
          throw new Error('Error, layer.kernelSize or layer.filters is undefined')
        }
        model.add(tfjs.layers.conv2d({
          ...inputShape,
          kernelSize: layer.kernelSize,
          filters   : layer.filters,
          activation: layer.activation as any,
        }))
        break
      }
      case 'maxPooling2d': {
        model.add(tfjs.layers.maxPooling2d({
          poolSize: layer.poolSize,
          strides : layer.strides
        }))
        break
      }
      case 'flatten': {
        model.add(tfjs.layers.flatten({}))
        break
      }
      case 'dense': {
        if (layer.units === undefined) {
          console.error('Error, layer.units is undefined')
          throw new Error('Error, layer.units is undefined')
        }
        model.add(tfjs.layers.dense({
          units     : layer.units as number,
          activation: layer.activation as any,
        }))
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

export async function MNIST_run(params_data: ParamsTrain_MNIST_t) {

  const {
    learningRate,
    numberEpochs,
    idOptimizer,
    idLoss,
    idMetricsList,
    layers,
  } = params_data

  tfvis.visor().open()

  const data = new MnistData()
  await data.load()
  await showExamples(data)

  const model = getModel(layers, idOptimizer, idLoss, idMetricsList, learningRate)
  await tfvis.show.modelSummary({
    name: 'Model summary',
    tab : TAB_03_IMAGE_CLASSIFICATION
  }, model)
  tfvis.visor().setActiveTab(TAB_03_IMAGE_CLASSIFICATION)

  const history = await train(model, data, numberEpochs)

  await showAccuracy(model, data)
  await showConfusion(model, data)
  return {
    model,
    history
  }
}
