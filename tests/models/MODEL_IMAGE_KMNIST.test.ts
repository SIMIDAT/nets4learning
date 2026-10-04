import { describe, test, expect, vi, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as tfjs from '@tensorflow/tfjs'
import type { TFunction } from 'i18next'

import MODEL_IMAGE_KMNIST, {
  KMNIST_PRETRAINED_TEST_ACCURACY,
  LIST_OF_IMAGES_KMNIST,
} from '../../src/pages/playground/3_ImageClassification/models/MODEL_IMAGE_KMNIST'
import { FEATURED_FORMS, KMNIST_CHARACTERS } from '../../src/pages/playground/3_ImageClassification/models/characterForms'
import fixture from './fixtures/kmnist-test-samples.json'

// Las URLs de la app (VITE_PATH + /models/...) se sirven desde public/
const toPublicPath = (url: string) => 'public' + url.replace(import.meta.env.VITE_PATH, '')

const toResponse = (url: string) => {
  const body = fs.readFileSync(toPublicPath(url.split('?')[0]))
  return new Response(body, { headers: { 'content-type': url.endsWith('.json') ? 'application/json' : 'application/octet-stream' } })
}

/** Imagen de KMNIST (trazo blanco sobre negro) como la ImageData opaca de un carácter oscuro sobre fondo claro. */
const toImageData = (base64: string): ImageData => {
  const pixels = Buffer.from(base64, 'base64')
  const data = new Uint8ClampedArray(pixels.length * 4)
  pixels.forEach((value, i) => {
    data.fill(255 - value, i * 4, i * 4 + 3)
    data[i * 4 + 3] = 255
  })
  return { data, width: 28, height: 28, colorSpace: 'srgb' } as ImageData
}

// Capas que sabe propagar la explicación con LRP (applyLRP)
const LRP_LAYERS = ['Conv2D', 'MaxPooling2D', 'Dropout', 'Flatten', 'Dense']

describe('MODEL_IMAGE_KMNIST — modelo preentrenado', () => {
  const t = ((key: string) => key) as unknown as TFunction<'translation', undefined>
  const iModelInstance = new MODEL_IMAGE_KMNIST(t)
  let model: tfjs.LayersModel

  beforeAll(async () => {
    vi.stubGlobal('fetch', async (input: string | URL | Request) => toResponse(input.toString()))
    await tfjs.setBackend('cpu')
    model = await iModelInstance.ENABLE_MODEL()
  }, 30_000)

  test('recibe imágenes de 28x28 y da una probabilidad por carácter, con capas que LRP sabe explicar', () => {
    expect(model.inputs[0].shape).toStrictEqual([null, 28, 28, 1])
    expect(model.outputs[0].shape).toStrictEqual([null, iModelInstance.CLASS_LABELS.length])
    expect(model.layers.map((layer) => layer.getClassName()).filter((name) => !LRP_LAYERS.includes(name))).toStrictEqual([])
  })

  test('la precisión que anuncia la descripción es la medida al entrenarlo, y es de al menos un 95 %', () => {
    const metadata = model.getUserDefinedMetadata() as { testAccuracy: number, classLabels: string[] }
    expect(KMNIST_PRETRAINED_TEST_ACCURACY).toBe(metadata.testAccuracy)
    expect(metadata.testAccuracy).toBeGreaterThanOrEqual(0.95)
    expect(metadata.classLabels).toStrictEqual(iModelInstance.CLASS_LABELS)
  })

  test('clasifica imágenes de test de KMNIST', async () => {
    let hits = 0
    for (const sample of fixture.samples) {
      const { index } = await iModelInstance.CLASSIFY(model, toImageData(sample.pixels))
      if (index === sample.label) hits++
    }
    expect(hits).toBeGreaterThanOrEqual(fixture.samples.length * 0.9)
  })

  test('existen las imágenes de ejemplo', () => {
    expect(LIST_OF_IMAGES_KMNIST.filter((image) => !fs.existsSync('public/assets/' + image))).toStrictEqual([])
  })

  test('cada carácter de hoy va con sus formas antiguas (hentaigana): cada una con su imagen y su kanji', () => {
    expect(KMNIST_CHARACTERS.map(({ char }) => char)).toStrictEqual(iModelInstance.CLASS_LABELS)
    expect(iModelInstance.CHARACTER_FORMS()).toBe(KMNIST_CHARACTERS)
    // Las 68 hentaigana de Unicode de estas diez sílabas, sin repetir
    const images = KMNIST_CHARACTERS.flatMap(({ old }) => old.map(({ image }) => image))
    expect(images).toHaveLength(68)
    expect(new Set(images).size).toBe(images.length)
    for (const { char, old } of KMNIST_CHARACTERS) {
      // Las de los ejemplos, de kanji distintos (お solo tiene tres, dos de 於)
      const featured = old.slice(0, FEATURED_FORMS).map(({ origin }) => origin)
      if (char !== 'お') expect(new Set(featured).size, char).toBe(FEATURED_FORMS)
      for (const { image, origin } of old) {
        expect(origin, image).toMatch(/^\p{Script=Han}$/u)
        // Del bloque de las hentaigana (U+1B000–U+1B12F), y de 112x112 (la cabecera IHDR del PNG: bytes 16 a 23)
        expect(Number.parseInt(image.match(/([0-9A-F]+)\.png$/)![1], 16), image).toBeGreaterThanOrEqual(0x1B000)
        const png = fs.readFileSync('public/assets/' + image)
        expect([png.readUInt32BE(16), png.readUInt32BE(20)], image).toStrictEqual([112, 112])
      }
    }
  })
})
