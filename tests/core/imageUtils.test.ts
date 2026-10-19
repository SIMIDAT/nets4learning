import { describe, test, expect } from 'vitest'
import {
  grayscaleToImageData,
  imageDataToMnistTensor4d,
  resampleImageData,
  thresholdImageData,
} from '../../src/pages/playground/3_ImageClassification/utils/utils'
import { SpriteImageDataset } from '../../src/pages/playground/3_ImageClassification/models/SpriteImageDataset'

/** ImageData de width × height con todos los píxeles a [r, g, b, a]. */
function solid(width: number, height: number, rgba: [number, number, number, number]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let p = 0; p < data.length; p += 4) data.set(rgba, p)
  return { data, width, height, colorSpace: 'srgb' } as ImageData
}

describe('utilidades de imagen (clasificación de imágenes)', () => {

  test('resampleImageData reduce al tamaño pedido y conserva un color uniforme', () => {
    const out = resampleImageData(solid(56, 56, [10, 20, 30, 255]), 28, 28)
    expect(out.width).toBe(28)
    expect(out.height).toBe(28)
    expect(Array.from(out.data.slice(0, 4))).toStrictEqual([10, 20, 30, 255])
  })

  test('resampleImageData no produce NaN en zonas transparentes', () => {
    const out = resampleImageData(solid(56, 56, [0, 0, 0, 0]), 28, 28)
    expect(Array.from(out.data).every((v) => v === 0)).toBe(true)
  })

  test('las funciones no modifican la imagen de entrada', () => {
    const input = solid(4, 4, [150, 150, 150, 255])
    const copy = Array.from(input.data)
    resampleImageData(input, 2, 2)
    thresholdImageData(input, 200)
    expect(Array.from(input.data)).toStrictEqual(copy)
  })

  test('thresholdImageData lleva el color a blanco o negro y respeta el alfa', () => {
    expect(Array.from(thresholdImageData(solid(1, 1, [99, 99, 99, 128])).data)).toStrictEqual([0, 0, 0, 128])
    expect(Array.from(thresholdImageData(solid(1, 1, [100, 100, 100, 7])).data)).toStrictEqual([255, 255, 255, 7])
  })

  test('imageDataToMnistTensor4d: trazo dibujado (negro opaco) → 1, fondo transparente → 0, fondo blanco → 0', () => {
    const values = (rgba: [number, number, number, number]) =>
      Array.from(imageDataToMnistTensor4d(solid(28, 28, rgba)).dataSync())
    expect(values([0, 0, 0, 255]).every((v) => v === 1)).toBe(true)
    expect(values([0, 0, 0, 0]).every((v) => v === 0)).toBe(true)
    expect(values([255, 255, 255, 255]).every((v) => v === 0)).toBe(true)
    expect(imageDataToMnistTensor4d(solid(28, 28, [0, 0, 0, 255])).shape).toStrictEqual([1, 28, 28, 1])
  })
})

describe('grayscaleToImageData', () => {

  test('una imagen del dataset llega al modelo con los mismos valores (trazo oscuro sobre fondo claro, opaca)', async () => {
    const pixels = Float32Array.from({ length: 28 * 28 }, (_, i) => (i % 7) / 6)
    const imageData = grayscaleToImageData(pixels, 28, 28)
    expect(Array.from(imageData.data.slice(0, 8))).toEqual([255, 255, 255, 255, 212, 212, 212, 255])
    const tensor = imageDataToMnistTensor4d(imageData)
    const values = await tensor.data()
    tensor.dispose()
    values.forEach((value, i) => expect(value).toBeCloseTo(pixels[i], 2))
  })
})

describe('SpriteImageDataset: imágenes de test', () => {

  test('cuenta las imágenes de test y da la clase y los píxeles de cada una', () => {
    const dataset = new SpriteImageDataset({ name: 'TEST', imagesUrl: '', labelsUrl: '', numElements: 3, numTrain: 1, numClasses: 10, image: { width: 28, height: 28, channels: 1 } })
    const oneHot = (label: number) => Array.from({ length: 10 }, (_, i) => (i === label ? 1 : 0))
    // Lo que deja load(): las dos imágenes de test y sus etiquetas en one-hot
    Object.assign(dataset, {
      testImages: Float32Array.from({ length: 2 * 784 }, (_, i) => (i < 784 ? 0 : 1)),
      testLabels: Uint8Array.from([...oneHot(7), ...oneHot(2)]),
    })
    expect(dataset.numTest).toBe(2)
    expect(dataset.testClasses()).toEqual([7, 2])
    const { pixels, label } = dataset.testExample(1)
    expect(label).toBe(2)
    expect(pixels).toHaveLength(784)
    expect(pixels.every((value) => value === 1)).toBe(true)
  })
})
