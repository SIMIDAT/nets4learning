/**
 * Basado en el cargador de MNIST de los ejemplos de TensorFlow.js
 * (Copyright 2018 Google LLC, Apache License 2.0), generalizado para cualquier sprite con el mismo formato.
 */
import * as tf from '@tensorflow/tfjs'
import { createWorkerClient } from '@core/workers/workerClient'
import { CHUNK_SIZE, IMAGE_SIZE, copyRedChannel } from './spriteDecode'
import type { SpriteWorkerApi_t } from './sprite.worker'

const NUM_CLASSES = 10

/**
 * Dataset de imágenes de 28x28 en escala de grises guardado como sprite:
 * - `imagesUrl`: PNG con una imagen por fila (784 px de ancho), primero las de entrenamiento.
 * - `labelsUrl`: etiquetas en one-hot, NUM_CLASSES bytes por imagen, en el mismo orden.
 */
export type SpriteDatasetConfig_t = {
  name       : string
  imagesUrl  : string
  labelsUrl  : string
  numElements: number
  numTrain   : number
}

export const MNIST_DATASET: SpriteDatasetConfig_t = {
  name       : 'MNIST',
  imagesUrl  : 'https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png',
  labelsUrl  : 'https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8',
  numElements: 65000,
  numTrain   : 55000,
}

// Generado con Scripts/build_kmnist_sprite.py: 2.000 imágenes por carácter para entrenar y 500 para test
export const KMNIST_DATASET: SpriteDatasetConfig_t = {
  name       : 'KMNIST',
  imagesUrl  : import.meta.env.VITE_PATH + '/datasets/03-image-classification/kmnist/kmnist_images.png',
  labelsUrl  : import.meta.env.VITE_PATH + '/datasets/03-image-classification/kmnist/kmnist_labels_uint8',
  numElements: 25000,
  numTrain   : 20000,
}

/** Descarga el sprite y las etiquetas y devuelve lotes barajados de entrenamiento y de test. */
export class SpriteImageDataset {
  private readonly config: SpriteDatasetConfig_t
  private trainImages    : Float32Array<ArrayBufferLike> = new Float32Array(0)
  private testImages     : Float32Array<ArrayBufferLike> = new Float32Array(0)
  private trainLabels    : Uint8Array<ArrayBufferLike> = new Uint8Array(0)
  private testLabels     : Uint8Array<ArrayBufferLike> = new Uint8Array(0)
  private trainIndices   : Uint32Array<ArrayBufferLike> = new Uint32Array(0)
  private testIndices    : Uint32Array<ArrayBufferLike> = new Uint32Array(0)
  private shuffledTrainIndex = 0
  private shuffledTestIndex = 0

  constructor(config: SpriteDatasetConfig_t) {
    this.config = config
  }

  /** Todo el conjunto o, con `testOnly`, solo las imágenes de test (las de entrenamiento no se decodifican) */
  async load({ testOnly = false } = {}) {
    const { numElements, numTrain } = this.config
    const firstRow = testOnly ? numTrain : 0
    const [images, labels] = await Promise.all([this.loadImages(firstRow, numElements - firstRow), this.loadLabels()])
    if (labels.length !== numElements * NUM_CLASSES) {
      throw new Error(`Labels file has ${labels.length} bytes, expected ${numElements * NUM_CLASSES}`)
    }
    // subarray y no slice: comparten memoria en vez de copiarla (MNIST entero son 204 MB de Float32Array)
    const trainRows = numTrain - firstRow
    this.trainIndices = tf.util.createShuffledIndices(Math.max(trainRows, 0))
    this.testIndices = tf.util.createShuffledIndices(numElements - numTrain)
    this.trainImages = images.subarray(0, IMAGE_SIZE * Math.max(trainRows, 0))
    this.testImages = images.subarray(IMAGE_SIZE * Math.max(trainRows, 0))
    this.trainLabels = labels.subarray(firstRow * NUM_CLASSES, NUM_CLASSES * numTrain)
    this.testLabels = labels.subarray(NUM_CLASSES * numTrain)
  }

  /**
   * Las filas [firstRow, firstRow + numRows) del sprite. En un worker (decodificar MNIST bloqueaba el hilo principal
   * ~320 ms); si no se puede (sin workers u OffscreenCanvas), aquí mismo
   */
  private async loadImages(firstRow: number, numRows: number): Promise<Float32Array> {
    const url = new URL(this.config.imagesUrl, document.baseURI).href
    const worker = createWorkerClient<SpriteWorkerApi_t>(() => new Worker(new URL('./sprite.worker.ts', import.meta.url), { type: 'module' }))
    try {
      return await worker.call('decode', { url, firstRow, numRows })
    } catch (error) {
      console.warn('Sprite decoded in the main thread:', error)
      return this.loadImagesInMainThread(firstRow, numRows)
    } finally {
      worker.terminate()
    }
  }

  // Lee el sprite por trozos en un canvas; al ser gris basta con el canal rojo (0-255 → 0-1)
  private loadImagesInMainThread(firstRow: number, numRows: number): Promise<Float32Array> {
    const { imagesUrl } = this.config
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = ''
      img.onerror = () => reject(new Error(`Could not load dataset images: ${imagesUrl}`))
      img.onload = () => {
        const images = new Float32Array(numRows * IMAGE_SIZE)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx === null) {
          reject(new Error('Canvas 2D context not available'))
          return
        }
        canvas.width = img.naturalWidth
        for (let row = 0; row < numRows; row += CHUNK_SIZE) {
          const rows = Math.min(CHUNK_SIZE, numRows - row)
          canvas.height = rows
          ctx.drawImage(img, 0, firstRow + row, img.naturalWidth, rows, 0, 0, img.naturalWidth, rows)
          copyRedChannel(ctx.getImageData(0, 0, canvas.width, rows).data, images, row * IMAGE_SIZE)
        }
        resolve(images)
      }
      img.src = imagesUrl
    })
  }

  private async loadLabels(): Promise<Uint8Array> {
    const response = await fetch(this.config.labelsUrl)
    if (!response.ok) throw new Error(`Could not load dataset labels: ${this.config.labelsUrl} (${response.status})`)
    return new Uint8Array(await response.arrayBuffer())
  }

  nextTrainBatch(batchSize: number) {
    return this.nextBatch(batchSize, this.trainImages, this.trainLabels, () => {
      this.shuffledTrainIndex = (this.shuffledTrainIndex + 1) % this.trainIndices.length
      return this.trainIndices[this.shuffledTrainIndex]
    })
  }

  nextTestBatch(batchSize: number) {
    return this.nextBatch(batchSize, this.testImages, this.testLabels, () => {
      this.shuffledTestIndex = (this.shuffledTestIndex + 1) % this.testIndices.length
      return this.testIndices[this.shuffledTestIndex]
    })
  }

  /** Imágenes de test: las que nunca se usan para entrenar (de ellas sale la validación) */
  get numTest() {
    return this.testLabels.length / NUM_CLASSES
  }

  /** Clase de cada imagen de test */
  testClasses(): number[] {
    return Array.from({ length: this.numTest }, (_, index) => this.classOf(this.testLabels, index))
  }

  /** Una imagen de test: sus 784 píxeles (0 fondo, 1 trazo) y su clase */
  testExample(index: number): { pixels: Float32Array, label: number } {
    return {
      pixels: this.testImages.slice(index * IMAGE_SIZE, (index + 1) * IMAGE_SIZE),
      label : this.classOf(this.testLabels, index),
    }
  }

  // Las etiquetas están en one-hot
  private classOf(labels: Uint8Array, index: number) {
    const oneHot = labels.subarray(index * NUM_CLASSES, (index + 1) * NUM_CLASSES)
    return oneHot.indexOf(Math.max(...oneHot))
  }

  private nextBatch(batchSize: number, images: Float32Array, labels: Uint8Array, index: () => number) {
    const batchImages = new Float32Array(batchSize * IMAGE_SIZE)
    const batchLabels = new Uint8Array(batchSize * NUM_CLASSES)
    for (let i = 0; i < batchSize; i++) {
      const idx = index()
      batchImages.set(images.subarray(idx * IMAGE_SIZE, (idx + 1) * IMAGE_SIZE), i * IMAGE_SIZE)
      batchLabels.set(labels.subarray(idx * NUM_CLASSES, (idx + 1) * NUM_CLASSES), i * NUM_CLASSES)
    }
    return {
      xs    : tf.tensor2d(batchImages, [batchSize, IMAGE_SIZE]),
      labels: tf.tensor2d(batchLabels, [batchSize, NUM_CLASSES]),
    }
  }
}

// Un sprite por dataset y visita: el entrenamiento y el selector de imágenes de test comparten la descarga. Se guarda
// el conjunto entero y, aparte, el de solo test (el selector de la página del modelo no necesita las de entrenamiento)
const loadedDatasets = new Map<string, Promise<SpriteImageDataset>>()

/**
 * El dataset ya cargado (lo descarga la primera vez). Con `testOnly` basta con las imágenes de test y, si el entero
 * ya está, se usa ese. Si la descarga falla, la siguiente llamada lo vuelve a intentar
 */
export function loadSpriteDataset(config: SpriteDatasetConfig_t, { testOnly = false } = {}): Promise<SpriteImageDataset> {
  const fullKey = config.imagesUrl + '#all'
  const key = testOnly ? config.imagesUrl + '#test' : fullKey
  let loading = loadedDatasets.get(key) ?? (testOnly ? loadedDatasets.get(fullKey) : undefined)
  if (loading === undefined) {
    const dataset = new SpriteImageDataset(config)
    loading = dataset.load({ testOnly }).then(() => dataset)
    loading.catch(() => loadedDatasets.delete(key))
    loadedDatasets.set(key, loading)
  }
  return loading
}
