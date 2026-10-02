// Decodificación de los sprites de imágenes de 28×28 (una imagen por fila del PNG, 784 px de ancho), común al
// worker y al camino del hilo principal.

export const IMAGE_SIZE = 28 * 28
// Filas del sprite que se leen de cada vez a través del canvas (un canvas no puede medir 65 000 px de alto)
export const CHUNK_SIZE = 5000

/** Píxeles RGBA de un trozo del sprite → valores 0–1 (al ser gris basta con el canal rojo) */
export function copyRedChannel(rgba: Uint8ClampedArray, target: Float32Array, offset: number) {
  const pixels = rgba.length / 4
  for (let j = 0; j < pixels; j++) target[offset + j] = rgba[j * 4] / 255
}

export type SpriteRows_t = { url: string, firstRow: number, numRows: number }

/** Las filas [firstRow, firstRow + numRows) del sprite, decodificadas en un worker con OffscreenCanvas */
export async function decodeSpriteRows({ url, firstRow, numRows }: SpriteRows_t): Promise<Float32Array> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not load dataset images: ${url} (${response.status})`)
  const bitmap = await createImageBitmap(await response.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })
  try {
    const images = new Float32Array(numRows * IMAGE_SIZE)
    const canvas = new OffscreenCanvas(bitmap.width, Math.min(CHUNK_SIZE, numRows))
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (context === null) throw new Error('OffscreenCanvas 2D context not available')
    for (let row = 0; row < numRows; row += CHUNK_SIZE) {
      const rows = Math.min(CHUNK_SIZE, numRows - row)
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, 0, firstRow + row, bitmap.width, rows, 0, 0, bitmap.width, rows)
      copyRedChannel(context.getImageData(0, 0, bitmap.width, rows).data, images, row * IMAGE_SIZE)
    }
    return images
  } finally {
    bitmap.close()
  }
}
