// Decodificación de los sprites de imágenes (una imagen aplanada por fila del PNG: 784 px de ancho las de 28×28, 1024
// las de 32×32), común al worker y al camino del hilo principal.

/** Cómo es cada imagen del sprite: ancho y alto en píxeles y canales (1, gris; 3, color RGB) */
export type SpriteImage_t = { width: number, height: number, channels: number }

/** Valores de cada imagen (lo que recibe la red por imagen) */
export const spriteImageValues = ({ width, height, channels }: SpriteImage_t) => width * height * channels

// Filas del sprite que se leen de cada vez a través del canvas (un canvas no puede medir 65 000 px de alto)
export const CHUNK_SIZE = 5000

/**
 * Píxeles RGBA de un trozo del sprite → valores 0–1: en gris basta con el canal rojo; en color, R, G y B de cada píxel
 * seguidos (como los espera la red: alto, ancho y canal)
 */
export function copyChannels(rgba: Uint8ClampedArray, target: Float32Array, offset: number, channels: number) {
  const pixels = rgba.length / 4
  for (let j = 0; j < pixels; j++) {
    for (let c = 0; c < channels; c++) target[offset + j * channels + c] = rgba[j * 4 + c] / 255
  }
}

export type SpriteRows_t = { url: string, firstRow: number, numRows: number, image: SpriteImage_t }

/** Las filas [firstRow, firstRow + numRows) del sprite, decodificadas en un worker con OffscreenCanvas */
export async function decodeSpriteRows({ url, firstRow, numRows, image }: SpriteRows_t): Promise<Float32Array> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not load dataset images: ${url} (${response.status})`)
  const bitmap = await createImageBitmap(await response.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })
  try {
    const values = spriteImageValues(image)
    const images = new Float32Array(numRows * values)
    const canvas = new OffscreenCanvas(bitmap.width, Math.min(CHUNK_SIZE, numRows))
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (context === null) throw new Error('OffscreenCanvas 2D context not available')
    for (let row = 0; row < numRows; row += CHUNK_SIZE) {
      const rows = Math.min(CHUNK_SIZE, numRows - row)
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, 0, firstRow + row, bitmap.width, rows, 0, 0, bitmap.width, rows)
      copyChannels(context.getImageData(0, 0, bitmap.width, rows).data, images, row * values, image.channels)
    }
    return images
  } finally {
    bitmap.close()
  }
}
