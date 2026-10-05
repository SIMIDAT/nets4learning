/**
 * Basado en el cargador de MNIST de los ejemplos de TensorFlow.js
 * (Copyright 2018 Google LLC, Apache License 2.0), generalizado para cualquier sprite con el mismo formato.
 */
import * as tf from '@tensorflow/tfjs'
import { createWorkerClient } from '@core/workers/workerClient'
import { CHUNK_SIZE, copyChannels, spriteImageValues, type SpriteImage_t } from './spriteDecode'
import type { SpriteWorkerApi_t } from './sprite.worker'

/**
 * Dataset de imágenes guardado como sprite (el de un paquete .n4l, kind image-sprite), en gris o en color (`image`):
 * - `imagesUrl`: PNG con una imagen aplanada por fila (784 px de ancho las de 28×28), primero las de entrenamiento.
 * - `labelsUrl`: etiquetas en one-hot, `numClasses` bytes por imagen, en el mismo orden.
 */
export type SpriteDatasetConfig_t = {
  name       : string
  imagesUrl  : string
  labelsUrl  : string
  numElements: number
  numTrain   : number
  numClasses : number
  image      : SpriteImage_t
}

/** Descarga el sprite y las etiquetas y devuelve lotes barajados de entrenamiento y de test. */
export class SpriteImageDataset {
  private readonly config    : SpriteDatasetConfig_t
  private readonly numClasses: number
  /** Valores de cada imagen */
  private readonly imageSize : number
  private trainImages        : Float32Array<ArrayBufferLike> = new Float32Array(0)
  private testImages         : Float32Array<ArrayBufferLike> = new Float32Array(0)
  private trainLabels        : Uint8Array<ArrayBufferLike> = new Uint8Array(0)
  private testLabels         : Uint8Array<ArrayBufferLike> = new Uint8Array(0)
  private trainIndices       : Uint32Array<ArrayBufferLike> = new Uint32Array(0)
  private testIndices        : Uint32Array<ArrayBufferLike> = new Uint32Array(0)
  private shuffledTrainIndex = 0
  private shuffledTestIndex = 0

  constructor(config: SpriteDatasetConfig_t) {
    this.config = config
    this.numClasses = config.numClasses
    this.imageSize = spriteImageValues(config.image)
  }

  /** Cómo son sus imágenes */
  get image(): SpriteImage_t {
    return this.config.image
  }

  /** Todo el conjunto o, con `testOnly`, solo las imágenes de test (las de entrenamiento no se decodifican) */
  async load({ testOnly = false } = {}) {
    const { numElements, numTrain } = this.config
    const firstRow = testOnly ? numTrain : 0
    const [images, labels] = await Promise.all([this.loadImages(firstRow, numElements - firstRow), this.loadLabels()])
    if (labels.length !== numElements * this.numClasses) {
      throw new Error(`Labels file has ${labels.length} bytes, expected ${numElements * this.numClasses}`)
    }
    // subarray y no slice: comparten memoria en vez de copiarla (MNIST entero son 204 MB de Float32Array)
    const trainRows = numTrain - firstRow
    this.trainIndices = tf.util.createShuffledIndices(Math.max(trainRows, 0))
    this.testIndices = tf.util.createShuffledIndices(numElements - numTrain)
    this.trainImages = images.subarray(0, this.imageSize * Math.max(trainRows, 0))
    this.testImages = images.subarray(this.imageSize * Math.max(trainRows, 0))
    this.trainLabels = labels.subarray(firstRow * this.numClasses, this.numClasses * numTrain)
    this.testLabels = labels.subarray(this.numClasses * numTrain)
  }

  /**
   * Las filas [firstRow, firstRow + numRows) del sprite. En un worker (decodificar MNIST bloqueaba el hilo principal
   * ~320 ms); si no se puede (sin workers u OffscreenCanvas), aquí mismo
   */
  private async loadImages(firstRow: number, numRows: number): Promise<Float32Array> {
    const url = new URL(this.config.imagesUrl, document.baseURI).href
    const worker = createWorkerClient<SpriteWorkerApi_t>(() => new Worker(new URL('./sprite.worker.ts', import.meta.url), { type: 'module' }))
    try {
      return await worker.call('decode', { url, firstRow, numRows, image: this.config.image })
    } catch (error) {
      console.warn('Sprite decoded in the main thread:', error)
      return this.loadImagesInMainThread(firstRow, numRows)
    } finally {
      worker.terminate()
    }
  }

  // Lee el sprite por trozos en un canvas (0-255 → 0-1; en gris basta con el canal rojo)
  private loadImagesInMainThread(firstRow: number, numRows: number): Promise<Float32Array> {
    const { imagesUrl, image } = this.config
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = ''
      img.onerror = () => reject(new Error(`Could not load dataset images: ${imagesUrl}`))
      img.onload = () => {
        const images = new Float32Array(numRows * this.imageSize)
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
          copyChannels(ctx.getImageData(0, 0, canvas.width, rows).data, images, row * this.imageSize, image.channels)
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
    return this.testLabels.length / this.numClasses
  }

  /** Clase de cada imagen de test */
  testClasses(): number[] {
    return Array.from({ length: this.numTest }, (_, index) => this.classOf(this.testLabels, index))
  }

  /** Una imagen de test: sus valores (0–1; en gris, 0 fondo y 1 trazo) y su clase */
  testExample(index: number): { pixels: Float32Array, label: number } {
    return {
      pixels: this.testImages.slice(index * this.imageSize, (index + 1) * this.imageSize),
      label : this.classOf(this.testLabels, index),
    }
  }

  // Las etiquetas están en one-hot
  private classOf(labels: Uint8Array, index: number) {
    const oneHot = labels.subarray(index * this.numClasses, (index + 1) * this.numClasses)
    return oneHot.indexOf(Math.max(...oneHot))
  }

  private nextBatch(batchSize: number, images: Float32Array, labels: Uint8Array, index: () => number) {
    const batchImages = new Float32Array(batchSize * this.imageSize)
    const batchLabels = new Uint8Array(batchSize * this.numClasses)
    for (let i = 0; i < batchSize; i++) {
      const idx = index()
      batchImages.set(images.subarray(idx * this.imageSize, (idx + 1) * this.imageSize), i * this.imageSize)
      batchLabels.set(labels.subarray(idx * this.numClasses, (idx + 1) * this.numClasses), i * this.numClasses)
    }
    return {
      xs    : tf.tensor2d(batchImages, [batchSize, this.imageSize]),
      labels: tf.tensor2d(batchLabels, [batchSize, this.numClasses]),
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
