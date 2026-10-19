import { describe, test, expect, beforeAll, beforeEach } from 'vitest'
import * as fs from 'fs'
import * as tfjs from '@tensorflow/tfjs'

import { builtinN4LPackage, n4lPackageByKey } from '@core/n4l/catalog'
import { isImageDataset, n4lLayersModels } from '@core/n4l/format'
import { n4lImageExamples, n4lImageRuntime } from '@core/n4l/imageClassification'
import { loadModelClass } from '@core/models/modelRegistry'
import { trainedModelPackage } from '@core/n4l/exportTrained'
import { importN4LPackage, listLocalPackages, MemoryPackageStore, openLocalPackage, setN4LPackageStore, setN4LTextsRegistry } from '@core/n4l/localPackages'
import { packN4L } from '@core/n4l/source'
import { loadN4LLayersModel } from '@core/n4l/tfjsModel'
import { buildImageModel } from '@core/training/buildModels'
import { MAP_IC_CLASSES } from '@pages/playground/3_ImageClassification/models'
import type MODEL_N4L from '@pages/playground/3_ImageClassification/models/MODEL_N4L'
import { FEATURED_FORMS } from '@pages/playground/3_ImageClassification/models/characterForms'
import { imageLayersOf, n4lLayersOf } from '@pages/playground/3_ImageClassification/models/n4lLayers'
import { keyT, stubPublicFetch } from '../helpers/n4l'
import mnistFixture from './fixtures/mnist-test-samples.json'
import kmnistFixture from './fixtures/kmnist-test-samples.json'
import cifar10Fixture from './fixtures/cifar10-test-samples.json'

// Los paquetes de clasificación de imágenes de public/n4l/: MNIST, KMNIST y CIFAR-10 (un modelo de TF.js con su
// sprite) e ImageNet (MobileNet, que descarga la librería). Sus modelos, abiertos como en la página del modelo, aciertan
// con imágenes de prueba que no vieron al entrenar.

/**
 * Imagen de prueba como la ImageData opaca que clasifica la página: en gris (trazo blanco sobre negro), con el trazo
 * oscuro sobre fondo claro, como el lienzo; en color (alto, ancho, RGB), tal cual
 */
const toImageData = (base64: string, { width, height, channels }: { width: number, height: number, channels: number }): ImageData => {
  const pixels = Buffer.from(base64, 'base64')
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    for (let c = 0; c < 3; c++) data[i * 4 + c] = channels === 1 ? 255 - pixels[i] : pixels[i * 3 + c]
    data[i * 4 + 3] = 255
  }
  return { data, width, height, colorSpace: 'srgb' } as ImageData
}

/** El tamaño de un PNG, de su cabecera (IHDR): ancho y alto en los bytes 16 a 23 */
const pngSize = (file: string) => {
  const png = fs.readFileSync(file)
  return [png.readUInt32BE(16), png.readUInt32BE(20)]
}

// Capas que sabe propagar la explicación con LRP (applyLRP)
const LRP_LAYERS = ['Conv2D', 'MaxPooling2D', 'Dropout', 'Flatten', 'Dense']

const entryOf = (key: string) => n4lPackageByKey('image-classification', key)!.entry
const dirOf = (key: string) => `public/${entryOf(key).path}/`

beforeAll(async () => {
  stubPublicFetch()
  await tfjs.setBackend('cpu')
})

describe.each([
  { key: 'IMAGE-MNIST', fixture: mnistFixture, minAccuracy: 0.98, image: { width: 28, height: 28, channels: 1 }, exampleSize: 280 },
  { key: 'IMAGE-KMNIST', fixture: kmnistFixture, minAccuracy: 0.95, image: { width: 28, height: 28, channels: 1 }, exampleSize: 280 },
  { key: 'IMAGE-CIFAR10', fixture: cifar10Fixture, minAccuracy: 0.85, image: { width: 32, height: 32, channels: 3 }, exampleSize: 128 },
])('Paquete .n4l de $key', ({ key, fixture, minAccuracy, image, exampleSize }) => {
  let instance: MODEL_N4L
  let model: tfjs.LayersModel

  beforeAll(async () => {
    const ModelClass = await loadModelClass(MAP_IC_CLASSES, key)
    instance = new ModelClass(keyT) as MODEL_N4L
    model = await instance.ENABLE_MODEL()
  }, 30_000)

  test('su modelo recibe sus imágenes y da una probabilidad por clase, con capas que LRP sabe explicar', () => {
    expect(instance.IMAGE).toStrictEqual(image)
    // Las de gris se pueden dibujar; las de color, no (se sube una foto)
    expect(instance.DRAWABLE).toBe(image.channels === 1)
    expect(instance.TEST_IMAGES).toBe(true)
    expect(model.inputs[0].shape).toStrictEqual([null, image.height, image.width, image.channels])
    expect(model.outputs[0].shape).toStrictEqual([null, instance.CLASS_IDS.length])
    expect(model.layers.map((layer) => layer.getClassName()).filter((name) => !LRP_LAYERS.includes(name))).toStrictEqual([])
  })

  test('sus métricas son de las imágenes de prueba de su conjunto (las que siguen a las de entrenamiento)', () => {
    const { section, dataset } = n4lImageRuntime(entryOf(key)) as Extract<ReturnType<typeof n4lImageRuntime>, { kind: 'sprite' }>
    const [{ metrics }] = n4lLayersModels(section)
    expect(metrics!.test_images).toBe(dataset.rows - dataset.train)
    expect(metrics!.test_accuracy).toBeGreaterThanOrEqual(minAccuracy)
  })

  test('clasifica imágenes de prueba como la página del modelo', async () => {
    let hits = 0
    for (const sample of fixture.samples) {
      const { index } = await instance.CLASSIFY(model, toImageData(sample.pixels, image))
      if (index === sample.label) hits++
    }
    expect(hits).toBeGreaterThanOrEqual(fixture.samples.length * 0.9)
  })

  test('su sprite: tantas imágenes y clases como dice el manifiesto', async () => {
    const sprite = await instance.SPRITE()
    const entry = entryOf(key)
    const dataset = entry.datasets.find(isImageDataset)!
    expect(sprite).toMatchObject({ numElements: dataset.rows, numTrain: dataset.train, numClasses: instance.CLASS_IDS.length, image })
    expect(pngSize(dirOf(key) + dataset.file)).toStrictEqual([image.width * image.height, dataset.rows])
    expect(fs.statSync(dirOf(key) + dataset.labels).size).toBe(dataset.rows * instance.CLASS_IDS.length)
  })

  test('una imagen de ejemplo por clase (las de los dígitos y los caracteres, escritas con una fuente)', () => {
    const examples = n4lImageExamples(n4lImageRuntime(entryOf(key)).section).filter(({ old }) => old !== true)
    expect(examples.map(({ expected }) => expected)).toStrictEqual(instance.CLASS_IDS)
    expect(instance.LIST_IMAGES_EXAMPLES()).toHaveLength(instance.CLASS_IDS.length)
    for (const { file } of examples) expect(pngSize(dirOf(key) + file), file).toStrictEqual([exampleSize, exampleSize])
  })

  test('su red por defecto: la primera capa recibe las imágenes y no se puede quitar; la última da una salida por clase', () => {
    const layers = instance.DEFAULT_LAYERS()
    expect(layers[0]).toMatchObject({ _class: 'conv2d', _protected: true, inputShape: [image.height, image.width, image.channels] })
    expect(layers.at(-1)).toMatchObject({ _class: 'dense', units: instance.CLASS_IDS.length, activation: 'softmax' })
    // Y de vuelta al manifiesto (al guardar un modelo entrenado en un .n4l), igual
    expect(n4lLayersOf(layers)).toStrictEqual(entryOf(key).tasks[0].training!.layers)
    expect(imageLayersOf(n4lLayersOf(layers), instance.IMAGE)).toStrictEqual(layers)
  })
})

describe('Paquete .n4l de KMNIST: cada carácter de hoy con sus formas antiguas', () => {
  test('cada clase es un carácter con cómo se lee y el kanji del que viene; sus formas antiguas, las hentaigana de Unicode', async () => {
    const ModelClass = await loadModelClass(MAP_IC_CLASSES, 'IMAGE-KMNIST')
    const instance = new ModelClass(keyT)
    const forms = instance.CHARACTER_FORMS()!
    expect(forms.map(({ char }) => char)).toStrictEqual(instance.CLASS_IDS)
    expect(forms.map(({ reading }) => reading)).toStrictEqual(['o', 'ki', 'su', 'tsu', 'na', 'ha', 'ma', 'ya', 're', 'wo'])
    // Los ejemplos: el de hoy de cada uno, sin las formas antiguas (que van con su carácter)
    expect(instance.LIST_IMAGES_EXAMPLES()).toStrictEqual(forms.map(({ modern }) => modern))
    // Las 68 hentaigana de Unicode de estas diez sílabas, sin repetir
    const images = forms.flatMap(({ old }) => old.map(({ image }) => image))
    expect(images).toHaveLength(68)
    expect(new Set(images).size).toBe(images.length)
    for (const { char, old } of forms) {
      // Las de los ejemplos, de kanji distintos (お solo tiene tres, dos de 於)
      const featured = old.slice(0, FEATURED_FORMS).map(({ origin }) => origin)
      if (char !== 'お') expect(new Set(featured).size, char).toBe(FEATURED_FORMS)
      for (const { image, origin } of old) {
        expect(origin, image).toMatch(/^\p{Script=Han}$/u)
        // Del bloque de las hentaigana (U+1B000–U+1B12F), y de 112x112
        expect(Number.parseInt(image.match(/([0-9A-F]+)\.png$/)![1], 16), image).toBeGreaterThanOrEqual(0x1B000)
        expect(pngSize('public' + image.replace(import.meta.env.VITE_PATH, '')), image).toStrictEqual([112, 112])
      }
    }
  })

  test('MNIST no tiene formas antiguas', async () => {
    const ModelClass = await loadModelClass(MAP_IC_CLASSES, 'IMAGE-MNIST')
    expect(new ModelClass(keyT).CHARACTER_FORMS()).toBeNull()
  })
})

describe('Paquete .n4l de CIFAR-10: fotos en color', () => {
  test('cada clase, con su nombre en el idioma de la página (las que no lo tienen, como en el conjunto)', async () => {
    // Como i18next: el texto del paquete en español o, si no está, el valor por defecto
    const texts = (id: string) => JSON.parse(fs.readFileSync(`${dirOf(`IMAGE-${id.toUpperCase()}`)}locales/es.json`, 'utf8'))
    const t = ((key: string, options?: { defaultValue?: string }) => {
      const [namespace, path] = key.split(':')
      const value = path.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], texts(namespace.replace('n4l-', '')))
      return typeof value === 'string' ? value : options?.defaultValue ?? key
    }) as unknown as typeof keyT
    const cifar = new (await loadModelClass(MAP_IC_CLASSES, 'IMAGE-CIFAR10'))(t)
    expect(cifar.CLASS_IDS).toStrictEqual(['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck'])
    expect(cifar.CLASS_LABELS).toStrictEqual(['avión', 'automóvil', 'pájaro', 'gato', 'ciervo', 'perro', 'rana', 'caballo', 'barco', 'camión'])
    const mnist = new (await loadModelClass(MAP_IC_CLASSES, 'IMAGE-MNIST'))(t)
    expect(mnist.CLASS_LABELS).toStrictEqual(mnist.CLASS_IDS)
  })

  test('propone con qué empezar a entrenar (con los valores de la aplicación apenas aprendería con 5.000 fotos)', async () => {
    const cifar = new (await loadModelClass(MAP_IC_CLASSES, 'IMAGE-CIFAR10'))(keyT)
    expect(cifar.DEFAULT_TRAINING()).toStrictEqual({ learningRate: 0.001, epochs: 20 })
    const mnist = new (await loadModelClass(MAP_IC_CLASSES, 'IMAGE-MNIST'))(keyT)
    expect(mnist.DEFAULT_TRAINING()).toStrictEqual({ learningRate: undefined, epochs: undefined })
  })
})

describe('Paquete .n4l de ImageNet: MobileNet', () => {
  test('lo descarga la librería (MobileNet V2) y sus fotos de ejemplo están en el paquete', async () => {
    const runtime = n4lImageRuntime(entryOf('IMAGE-MOBILENET'))
    expect(runtime).toMatchObject({ kind: 'mobilenet', model: { format: 'tfjs-mobilenet', version: 2, alpha: 1 } })
    const ModelClass = await loadModelClass(MAP_IC_CLASSES, 'IMAGE-MOBILENET')
    const instance = new ModelClass(keyT)
    expect(instance.DRAWABLE).toBe(false)
    const examples = instance.LIST_IMAGES_EXAMPLES()
    expect(examples).toHaveLength(9)
    expect(examples.filter((url) => !fs.existsSync('public' + url.replace(import.meta.env.VITE_PATH, '')))).toStrictEqual([])
  })

  test('un paquete que no se sabe usar dice por qué', () => {
    const entry = entryOf('IMAGE-MNIST')
    const big = { ...entry, datasets: entry.datasets.map((dataset) => ({ ...dataset, image: { width: 128, height: 128, channels: 3 } })) }
    expect(() => n4lImageRuntime(big)).toThrow(/hasta 64×64/)
    const rgba = { ...entry, datasets: entry.datasets.map((dataset) => ({ ...dataset, image: { width: 28, height: 28, channels: 4 } })) }
    expect(() => n4lImageRuntime(rgba)).toThrow(/channels 3/)
    expect(() => n4lImageRuntime(builtinN4LPackage(n4lPackageByKey('tabular-classification', 'IRIS')!.entry).manifest)).toThrow(/image-classification/)
  })
})

describe('Paquete .n4l de imágenes: un modelo entrenado en la aplicación, en su propio .n4l', () => {
  beforeEach(() => {
    setN4LPackageStore(new MemoryPackageStore())
    setN4LTextsRegistry(() => {})
  })

  test('lleva el conjunto, sus ejemplos y su red; se abre después como un paquete más', async () => {
    const ModelClass = await loadModelClass(MAP_IC_CLASSES, 'IMAGE-KMNIST')
    const instance = new ModelClass(keyT) as MODEL_N4L
    const layers = instance.DEFAULT_LAYERS()
    const { manifest, files } = await trainedModelPackage(builtinN4LPackage(entryOf('IMAGE-KMNIST')), 'image-classification', {
      model  : buildImageModel(layers),
      layers : n4lLayersOf(layers),
      classes: instance.CLASS_IDS,
      number : 3,
      metrics: { acc: 0.5 },
    }, (_language, name) => `${name} (#3)`)
    expect(manifest).toMatchObject({ id: 'kmnist-model-3', version: '1.0.0' })
    const [section] = manifest.tasks
    // Sin «input»: las imágenes las recibe como están en su conjunto
    expect(section.models).toStrictEqual([{ id: 'trained', format: 'tfjs-layers', path: 'models/trained/model.json', dataset: 'kmnist', metrics: { acc: 0.5 } }])
    expect(section.training!.layers).toStrictEqual(entryOf('IMAGE-KMNIST').tasks[0].training!.layers)
    expect(n4lImageExamples(section)).toHaveLength(78)
    expect(Object.keys(files)).toEqual(expect.arrayContaining(['data/kmnist_images.png', 'data/kmnist_labels_uint8', 'examples/0.png', 'examples/forms/1B09E.png']))
    expect(Object.keys(files).filter((file) => file.startsWith('models/')).sort()).toStrictEqual(['models/trained/model.json', 'models/trained/model.weights.bin'])

    await importN4LPackage((await packN4L(files, 'uint8array')).buffer as ArrayBuffer)
    expect((await listLocalPackages('image-classification')).map(({ id }) => id)).toStrictEqual(['kmnist-model-3'])
    const pkg = await openLocalPackage('kmnist-model-3')
    const runtime = n4lImageRuntime(pkg.manifest)
    expect(runtime.kind).toBe('sprite')
    const model = await loadN4LLayersModel(pkg.source, n4lLayersModels(runtime.section)[0].path)
    expect(model.outputs[0].shape).toStrictEqual([null, 10])
  }, 60_000)
})
