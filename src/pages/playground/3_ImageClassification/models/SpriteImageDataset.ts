/**
 * Basado en el cargador de MNIST de los ejemplos de TensorFlow.js
 * (Copyright 2018 Google LLC, Apache License 2.0), generalizado para cualquier sprite con el mismo formato.
 */
import * as tf from '@tensorflow/tfjs'

const IMAGE_SIZE = 28 * 28
const NUM_CLASSES = 10
// Filas del sprite que se leen de cada vez a través del canvas
const CHUNK_SIZE = 5000

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
  private trainImages = new Float32Array(0)
  private testImages = new Float32Array(0)
  private trainLabels = new Uint8Array(0)
  private testLabels = new Uint8Array(0)
  private trainIndices   : Uint32Array<ArrayBufferLike> = new Uint32Array(0)
  private testIndices    : Uint32Array<ArrayBufferLike> = new Uint32Array(0)
  private shuffledTrainIndex = 0
  private shuffledTestIndex = 0

  constructor(config: SpriteDatasetConfig_t) {
    this.config = config
  }

  async load() {
    const { numElements, numTrain } = this.config
    const [images, labels] = await Promise.all([this.loadImages(), this.loadLabels()])
    if (labels.length !== numElements * NUM_CLASSES) {
      throw new Error(`Labels file has ${labels.length} bytes, expected ${numElements * NUM_CLASSES}`)
    }
    this.trainIndices = tf.util.createShuffledIndices(numTrain)
    this.testIndices = tf.util.createShuffledIndices(numElements - numTrain)
    this.trainImages = images.slice(0, IMAGE_SIZE * numTrain)
    this.testImages = images.slice(IMAGE_SIZE * numTrain)
    this.trainLabels = labels.slice(0, NUM_CLASSES * numTrain)
    this.testLabels = labels.slice(NUM_CLASSES * numTrain)
  }

  // Lee el sprite por trozos en un canvas; al ser gris basta con el canal rojo (0-255 → 0-1)
  private loadImages(): Promise<Float32Array> {
    const { imagesUrl, numElements } = this.config
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = ''
      img.onerror = () => reject(new Error(`Could not load dataset images: ${imagesUrl}`))
      img.onload = () => {
        const images = new Float32Array(numElements * IMAGE_SIZE)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx === null) {
          reject(new Error('Canvas 2D context not available'))
          return
        }
        canvas.width = img.naturalWidth
        for (let row = 0; row < numElements; row += CHUNK_SIZE) {
          const rows = Math.min(CHUNK_SIZE, numElements - row)
          canvas.height = rows
          ctx.drawImage(img, 0, row, img.naturalWidth, rows, 0, 0, img.naturalWidth, rows)
          const { data } = ctx.getImageData(0, 0, canvas.width, rows)
          const offset = row * IMAGE_SIZE
          for (let j = 0; j < data.length / 4; j++) {
            images[offset + j] = data[j * 4] / 255
          }
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

// Un sprite por dataset y visita: el entrenamiento y el selector de imágenes de test comparten la descarga
const loadedDatasets = new Map<string, Promise<SpriteImageDataset>>()

/** El dataset ya cargado (lo descarga la primera vez). Si la descarga falla, la siguiente llamada lo vuelve a intentar */
export function loadSpriteDataset(config: SpriteDatasetConfig_t): Promise<SpriteImageDataset> {
  let loading = loadedDatasets.get(config.imagesUrl)
  if (loading === undefined) {
    const dataset = new SpriteImageDataset(config)
    loading = dataset.load().then(() => dataset)
    loading.catch(() => loadedDatasets.delete(config.imagesUrl))
    loadedDatasets.set(config.imagesUrl, loading)
  }
  return loading
}
