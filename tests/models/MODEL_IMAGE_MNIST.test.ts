import { describe, test, expect } from 'vitest'
import * as fs from 'fs'

import { LIST_OF_IMAGES_MNIST } from '../../src/pages/playground/3_ImageClassification/models/MODEL_IMAGE_MNIST'

describe('MODEL_IMAGE_MNIST — imágenes de ejemplo', () => {
  test('un dígito por clase, escrito con una fuente: de 280x280, como los ejemplos de KMNIST', () => {
    expect(LIST_OF_IMAGES_MNIST).toStrictEqual(Array.from({ length: 10 }, (_, digit) => `mnist/${digit}.png`))
    for (const image of LIST_OF_IMAGES_MNIST) {
      // El tamaño, en la cabecera del PNG (IHDR): ancho y alto en los bytes 16 a 23
      const png = fs.readFileSync('public/assets/' + image)
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], image).toStrictEqual([280, 280])
    }
  })
})
