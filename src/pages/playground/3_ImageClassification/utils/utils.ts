import * as tfjs from '@tensorflow/tfjs'

import type { SpriteImage_t } from '../models/spriteDecode'

export const UTILS_image = {
  failed                        : (event: Event) => console.error(event),
  /**
   * Redimensiona `canvas` para que la imagen quepa en 200×200 manteniendo su proporción y la
   * dibuja. No modifica la imagen.
   */
  drawImageInCanvasWithContainer: (image: HTMLImageElement, canvas: HTMLCanvasElement) => {
    const MAX_SIDE = 200
    const ratio = image.naturalWidth / image.naturalHeight
    canvas.width = ratio > 1 ? MAX_SIDE : MAX_SIDE * ratio
    canvas.height = ratio > 1 ? MAX_SIDE / ratio : MAX_SIDE
    const canvas_ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    canvas_ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  },
}

/** ImageData vacía; fuera del navegador (tests) devuelve un objeto con la misma forma. */
function createImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  return typeof ImageData !== 'undefined'
    ? new ImageData(data, width, height)
    : ({ data, width, height, colorSpace: 'srgb' } as ImageData)
}

/**
 * Devuelve la ImageData de `source` redimensionada a `width × height`, usando un canvas
 * auxiliar fuera del DOM: no dibuja nada en los canvas visibles.
 */
export function toImageData(source: CanvasImageSource, width: number, height: number): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
  ctx.drawImage(source, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

/** Todo el contenido de un canvas como ImageData (sin modificarlo). */
export function canvasToImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

/**
 * Reduce `source` a `width × height` con un filtro Hermite, más nítido que `drawImage` al
 * reducir mucho (p. ej. el lienzo de 600×600 a 28×28). El color se pondera por el alfa para que
 * los píxeles transparentes no oscurezcan los bordes. Función pura: devuelve una ImageData nueva.
 */
export function resampleImageData(source: ImageData, width: number, height: number): ImageData {
  width = Math.round(width)
  height = Math.round(height)
  const { data, width: sourceWidth, height: sourceHeight } = source
  const result = createImageData(width, height)
  const out = result.data

  const ratioW = sourceWidth / width
  const ratioH = sourceHeight / height
  const ratioWHalf = Math.ceil(ratioW / 2)
  const ratioHHalf = Math.ceil(ratioH / 2)

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      let weightsColor = 0
      let weightsAlpha = 0
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      const centerY = (j + 0.5) * ratioH
      const centerX = (i + 0.5) * ratioW
      for (let yy = Math.floor(j * ratioH); yy < Math.ceil((j + 1) * ratioH); yy++) {
        const dy = Math.abs(centerY - (yy + 0.5)) / ratioHHalf
        for (let xx = Math.floor(i * ratioW); xx < Math.ceil((i + 1) * ratioW); xx++) {
          const dx = Math.abs(centerX - (xx + 0.5)) / ratioWHalf
          const w = Math.sqrt(dy * dy + dx * dx)
          if (w >= 1) continue // píxel fuera del filtro
          const weight = 2 * w * w * w - 3 * w * w + 1 // filtro Hermite
          const pos = 4 * (xx + yy * sourceWidth)
          a += weight * data[pos + 3]
          weightsAlpha += weight
          const weightColor = weight * (data[pos + 3] / 255)
          r += weightColor * data[pos]
          g += weightColor * data[pos + 1]
          b += weightColor * data[pos + 2]
          weightsColor += weightColor
        }
      }
      const idx = (i + j * width) * 4
      out[idx] = weightsColor > 0 ? r / weightsColor : 0
      out[idx + 1] = weightsColor > 0 ? g / weightsColor : 0
      out[idx + 2] = weightsColor > 0 ? b / weightsColor : 0
      out[idx + 3] = weightsAlpha > 0 ? a / weightsAlpha : 0
    }
  }
  return result
}

/**
 * Lleva el color de cada píxel a negro o blanco según su canal rojo (imagen en escala de grises);
 * el alfa no cambia. Función pura: devuelve una ImageData nueva.
 */
export function thresholdImageData(image: ImageData, threshold = 100): ImageData {
  const result = createImageData(image.width, image.height)
  result.data.set(image.data)
  for (let p = 0; p < result.data.length; p += 4) {
    const value = result.data[p] < threshold ? 0 : 255
    result.data[p] = value
    result.data[p + 1] = value
    result.data[p + 2] = value
  }
  return result
}

/**
 * Imagen de un dataset de 28×28 (valores 0 fondo, 1 trazo) como ImageData opaca con el trazo oscuro sobre fondo
 * claro, como los dibujos: `imageDataToMnistTensor4d` la vuelve a dar exactamente con esos valores.
 */
export function grayscaleToImageData(pixels: Float32Array, width: number, height: number): ImageData {
  const result = createImageData(width, height)
  for (let i = 0; i < pixels.length; i++) {
    const value = Math.round(255 * (1 - pixels[i]))
    result.data.set([value, value, value, 255], i * 4)
  }
  return result
}

/**
 * Imagen de un sprite (sus valores 0–1) como ImageData opaca: en gris, con el trazo oscuro sobre fondo claro, como los
 * dibujos (grayscaleToImageData); en color, tal cual. `imageDataToTensor4d` la vuelve a dar exactamente
 */
export function spriteToImageData(pixels: Float32Array, { width, height, channels }: SpriteImage_t): ImageData {
  if (channels === 1) return grayscaleToImageData(pixels, width, height)
  const result = createImageData(width, height)
  for (let i = 0; i < width * height; i++) {
    for (let c = 0; c < 3; c++) result.data[i * 4 + c] = Math.round(255 * pixels[i * channels + Math.min(c, channels - 1)])
    result.data[i * 4 + 3] = 255
  }
  return result
}

/**
 * Entrada de una red en color (1×alto×ancho×3): RGB entre 0 y 1. Lo transparente cuenta como blanco (sobre el fondo
 * blanco de la página)
 */
export function imageDataToRgbTensor4d(imageData: ImageData): tfjs.Tensor4D {
  const { data, width, height } = imageData
  const values = new Float32Array(width * height * 3)
  for (let i = 0, p = 0; p < data.length; i++, p += 4) {
    const alpha = data[p + 3] / 255
    for (let c = 0; c < 3; c++) values[i * 3 + c] = (data[p + c] / 255) * alpha + (1 - alpha)
  }
  return tfjs.tensor4d(values, [1, height, width, 3])
}

/** Entrada de una red de imágenes según sus canales: en gris, como MNIST; en color, RGB */
export const imageDataToTensor4d = (imageData: ImageData, channels: number): tfjs.Tensor4D =>
  (channels === 1 ? imageDataToMnistTensor4d(imageData) : imageDataToRgbTensor4d(imageData))

/** ImageData ampliada (sin suavizar) como data URL, p. ej. para la imagen base de la explicación */
export function imageDataToDataUrl(imageData: ImageData, size: number): string {
  const source = document.createElement('canvas')
  source.width = imageData.width
  source.height = imageData.height
  source.getContext('2d')?.putImageData(imageData, 0, 0)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(source, 0, 0, size, size)
  return canvas.toDataURL()
}

/**
 * Entrada de los modelos MNIST/KMNIST (1×28×28×1), sin modificar `imageData`.
 * El modelo espera el trazo en blanco (1) sobre fondo negro (0): valor = (1 − rojo) · alfa.
 * - Imagen opaca con dígito oscuro sobre fondo claro → 1 − rojo.
 * - Dibujo en el lienzo (trazo negro sobre fondo transparente) → alfa.
 */
export function imageDataToMnistTensor4d(imageData: ImageData): tfjs.Tensor4D {
  const { data, width, height } = imageData
  const values = new Float32Array(width * height)
  for (let i = 0, p = 0; p < data.length; i++, p += 4) {
    values[i] = ((255 - data[p]) / 255) * (data[p + 3] / 255)
  }
  return tfjs.tensor4d(values, [1, height, width, 1])
}
