import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import i18next from 'i18next'

import { layersGuide } from '@pages/playground/3_ImageClassification/layersGuide'
import { trainerGuide } from '@components/guide/trainerGuide'
import type { ImageLayer_t } from '@/types/types'

const LANGUAGES = ['es', 'en', 'ja'] as const
const resources = Object.fromEntries(LANGUAGES.map((language) => [language, {
  translation: JSON.parse(readFileSync(path.resolve(__dirname, `../../public/locales/${language}/translation.json`), 'utf8')),
}]))
const translator = async (language: string) => {
  const instance = i18next.createInstance()
  await instance.init({ lng: language, resources, interpolation: { escapeValue: false } })
  return instance.t
}

// Las capas por defecto de MNIST y KMNIST
const LAYERS: ImageLayer_t[] = [
  { _class: 'conv2d', _protected: true, inputShape: [28, 28, 1], kernelSize: 3, filters: 16, activation: 'relu' },
  { _class: 'maxPooling2d', poolSize: 2, strides: 2 },
  { _class: 'conv2d', kernelSize: 3, filters: 32, activation: 'relu' },
  { _class: 'maxPooling2d', poolSize: 2, strides: 2 },
  { _class: 'conv2d', kernelSize: 3, filters: 32, activation: 'relu' },
  { _class: 'flatten' },
  { _class: 'dense', units: 64, activation: 'relu' },
  { _class: 'dense', units: 10, activation: 'softmax' },
]

describe('layersGuide: un paso de la guía por cada capa de la red de imágenes', () => {
  test.each(LANGUAGES.flatMap((language) => ['IMAGE-MNIST', 'IMAGE-KMNIST'].map((dataset) => ({ language, dataset }))))(
    '$language / $dataset: cada capa, en su paso y con sus números', async ({ language, dataset }) => {
      const t = await translator(language)
      const steps = layersGuide(t, language, dataset, LAYERS)
      expect(steps.map(({ target }) => target)).toEqual(LAYERS.map((_layer, index) => `[data-guide="layer-${index}"]`))
      for (const { title, content } of steps) {
        // Todo interpolado y con texto de verdad (no la clave)
        expect(title + content).not.toMatch(/{{|}}|guide\.train/)
        expect(content.length).toBeGreaterThan(60)
      }
      // La primera convolución recibe la imagen de 28×28 y saca 16 mapas de 26×26
      expect(steps[0].content).toContain('28×28')
      expect(steps[0].content).toContain('26×26')
      // La salida habla de dígitos o de caracteres, según el conjunto de datos
      const className = t(`guide.train.3-image-classification.${dataset}.layer.class-name`)
      expect(steps.at(-1)!.content).toContain(className)
    })

  test('los pesos con el formato del idioma, y una capa que no encaja lo dice', async () => {
    const t = await translator('es')
    const steps = layersGuide(t, 'es', 'IMAGE-MNIST', LAYERS)
    // La segunda convolución, 3·3·16·32 + 32 pesos; la densa de 64 recibe 3×3×32 = 288 valores: 288·64 + 64
    expect(steps[2].content).toContain('4640 pesos')
    expect(steps[6].content).toContain('288 valores')
    expect(steps[6].content).toContain('18.496 pesos')
    const broken = layersGuide(t, 'es', 'IMAGE-MNIST', [LAYERS[0], { _class: 'dense', units: 10, activation: 'softmax' }])
    expect(broken[1].title).toBe('Capa 2: no encaja')
  })

  test('van justo detrás del paso de las capas', async () => {
    const t = await translator('es')
    const layerSteps = layersGuide(t, 'es', 'IMAGE-KMNIST', LAYERS)
    const targets = trainerGuide(t as never, '3-image-classification', 'IMAGE-KMNIST', { upload: false, datasetTable: false, testSize: 'hp-test-size', stepByStep: false, layerSteps })
      .map(({ target }) => target)
    const at = targets.indexOf('[data-guide="layers"]')
    expect(targets.slice(at + 1, at + 1 + LAYERS.length)).toEqual(layerSteps.map(({ target }) => target))
    expect(targets[at + 1 + LAYERS.length]).toBe('[data-guide="layers-add"]')
  })
})
