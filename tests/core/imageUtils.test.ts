import { describe, test, expect } from 'vitest'
import {
  imageDataToMnistTensor4d,
  resampleImageData,
  thresholdImageData,
} from '../../src/pages/playground/3_ImageClassification/utils/utils'

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
