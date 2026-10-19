import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest'
import * as tfjs from '@tensorflow/tfjs'

import { builtinN4LPackage, n4lPackageByKey } from '@core/n4l/catalog'
import { exportN4LPackage, n4lFileName, n4lPackageFiles } from '@core/n4l/export'
import {
  importN4LPackage, listLocalPackages, localKey, localPackageName, MAX_IMPORT_BYTES, MemoryPackageStore, openLocalPackage,
  removeLocalPackage, setN4LPackageStore, setN4LTextsRegistry,
} from '@core/n4l/localPackages'
import { N4LZipSource, openN4LPackage, packN4L } from '@core/n4l/source'
import { loadN4LLayersModel } from '@core/n4l/tfjsModel'
import { n4lLayersModels } from '@core/n4l/format'
import { hasModel, loadModelClass } from '@core/models/modelRegistry'
import { createReviewModelInstance } from '@core/models/createReviewModelInstance'
import { MAP_TC_CLASSES } from '@pages/playground/0_TabularClassification/models'
import { trainedModelPackage } from '@core/n4l/exportTrained'
import { DataFrameApplyEncoders } from '@core/dataframe/DataFrameUtils'
import * as fs from 'fs'
import { keyT, n4lTabularModel, stubPublicFetch, toPublicPath } from '../helpers/n4l'

// En jsdom danfo descarga los CSV por XHR: se leen del disco (o del fichero, si viene de un .n4l)
vi.mock('danfojs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('danfojs')>()
  return {
    ...actual,
    readCSV: (source: string | File, options?: object) => actual.readCSV(
      typeof source === 'string' ? new File([fs.readFileSync(toPublicPath(source))], 'data.csv', { type: 'text/csv' }) : source,
      options,
    ),
  }
})

const iris = () => builtinN4LPackage(n4lPackageByKey('tabular-classification', 'IRIS')!.entry)

/** El iris de la aplicación en un .n4l, como lo descargaría el usuario */
async function irisFile(): Promise<ArrayBuffer> {
  return (await exportN4LPackage(iris(), 'uint8array')).buffer as ArrayBuffer
}

beforeAll(async () => {
  stubPublicFetch()
  await tfjs.setBackend('cpu')
})

// Los textos de los paquetes abiertos (en la aplicación, i18next)
const texts = new Map<string, Record<string, any>>()

beforeEach(() => {
  setN4LPackageStore(new MemoryPackageStore())
  texts.clear()
  setN4LTextsRegistry((language, namespace, bundle) => texts.set(`${language}|${namespace}`, bundle))
})

describe('Paquetes .n4l: descargar', () => {
  test('el .n4l lleva todo: manifiesto, textos, datos y el modelo con sus pesos', async () => {
    expect((await n4lPackageFiles(iris())).sort()).toStrictEqual([
      'data/iris.csv', 'data/iris.names', 'locales/en.json', 'locales/es.json', 'locales/ja.json',
      'manifest.json', 'models/mlp/model.json', 'models/mlp/model.weights.bin',
    ])
    expect(n4lFileName(iris().manifest)).toBe('iris-1.0.0.n4l')
  })
})

describe('Paquetes .n4l: abrir los del usuario', () => {
  test('lo descargado se abre, se guarda y sale en el menú de su tarea con su nombre en cada idioma', async () => {
    const info = await importN4LPackage(await irisFile())
    expect(info).toMatchObject({ id: 'iris', version: '1.0.0', tasks: [{ task: 'tabular-classification' }] })
    // El agrupamiento todavía no se puede usar con un paquete: no sale
    expect(info.tasks.map(({ task }) => task)).not.toContain('clustering')
    expect(localPackageName(info, 'tabular-classification', 'es')).toBe('Clasificación de flor iris')
    // En un idioma que no tiene, el inglés
    expect(localPackageName(info, 'tabular-classification', 'fr')).toBe('Iris classification')
    expect((await listLocalPackages('tabular-classification')).map(({ id }) => id)).toStrictEqual(['iris'])
    expect(await listLocalPackages('regression')).toStrictEqual([])
  })

  test('abierto, sus textos van a i18next aparte de los de la aplicación, y su modelo se carga', async () => {
    await importN4LPackage(await irisFile())
    const pkg = await openLocalPackage('iris')
    expect(pkg.namespace).toBe('n4l-local-iris')
    expect(pkg.source.url('manifest.json')).toBeNull()
    expect(texts.get('es|n4l-local-iris')!.tasks['tabular-classification'].name).toBe('Clasificación de flor iris')
    expect([...texts.keys()].sort()).toStrictEqual(['en|n4l-local-iris', 'es|n4l-local-iris', 'ja|n4l-local-iris'])
    const model = await loadN4LLayersModel(pkg.source, n4lLayersModels(pkg.manifest.tasks[0])[0].path)
    expect(model.outputs[0].shape).toStrictEqual([null, 3])
  })

  test('el registro de modelos resuelve local-<id>: la página del modelo lo abre como uno de la aplicación', async () => {
    await importN4LPackage(await irisFile())
    expect(hasModel(MAP_TC_CLASSES, localKey('iris'))).toBe(true)
    const ModelClass = await loadModelClass(MAP_TC_CLASSES, localKey('iris'))
    const instance = new ModelClass(keyT, () => {})
    expect(instance.TITLE).toBe('n4l-local-iris:tasks.tabular-classification.title')
    expect(instance.N4L_PACKAGE()?.manifest.id).toBe('iris')

    // Uno que ya no está guardado: como una clave que no existe
    await removeLocalPackage('iris')
    const navigate = vi.fn()
    expect(await createReviewModelInstance(MAP_TC_CLASSES, localKey('iris'), (Model) => new Model(keyT, () => {}), navigate)).toBeNull()
    expect(navigate).toHaveBeenCalledWith('/404')
  })

  test('se rechaza lo que no se puede usar, diciendo por qué', async () => {
    // Uno no válido
    const broken = await packN4L({ 'manifest.json': JSON.stringify({ ...iris().manifest, version: 'uno' }) }, 'uint8array')
    await expect(importN4LPackage(broken.buffer as ArrayBuffer)).rejects.toMatchObject({ problems: ['version: semver (1.0.0)'] })
    // Uno solo de agrupamiento (todavía sin motor para paquetes)
    const files = Object.fromEntries(await Promise.all((await n4lPackageFiles(iris())).map(async (file) => [file, await iris().source.readBytes(file)] as const)))
    const manifest = { ...iris().manifest, tasks: iris().manifest.tasks.filter(({ task }) => task === 'clustering') }
    const clustering = await packN4L({ ...files, 'manifest.json': JSON.stringify(manifest) }, 'uint8array')
    await expect(importN4LPackage(clustering.buffer as ArrayBuffer)).rejects.toMatchObject({ problems: [expect.stringMatching(/ninguna de sus tareas \(clustering\)/)] })
    // Uno que no es un ZIP, o sin manifiesto
    await expect(importN4LPackage(new TextEncoder().encode('hola').buffer as ArrayBuffer)).rejects.toMatchObject({ problems: ['no es un fichero .n4l (un ZIP)'] })
    const empty = await packN4L({ 'leeme.txt': 'hola' }, 'uint8array')
    await expect(importN4LPackage(empty.buffer as ArrayBuffer)).rejects.toMatchObject({ problems: ['falta manifest.json'] })
    // Uno demasiado grande
    await expect(importN4LPackage(new ArrayBuffer(MAX_IMPORT_BYTES + 1))).rejects.toMatchObject({ problems: ['ocupa más de 100 MB'] })
    expect(await listLocalPackages()).toStrictEqual([])
  })

  test('volver a abrir uno con el mismo id lo sustituye', async () => {
    await importN4LPackage(await irisFile())
    const pkg = await openN4LPackage(await N4LZipSource.open(await irisFile()))
    const files = Object.fromEntries(await Promise.all((await n4lPackageFiles(pkg)).map(async (file) => [file, await pkg.source.readBytes(file)] as const)))
    const newer = await packN4L({ ...files, 'manifest.json': JSON.stringify({ ...pkg.manifest, version: '1.1.0' }) }, 'uint8array')
    await importN4LPackage(newer.buffer as ArrayBuffer)
    expect((await listLocalPackages()).map(({ id, version }) => `${id}@${version}`)).toStrictEqual(['iris@1.1.0'])
  })
})

describe('Paquetes .n4l: un modelo entrenado en la aplicación', () => {
  test('se descarga con su conjunto y se abre después: recibe la entrada escalada, como al entrenarlo', async () => {
    // Entrenar como el entrenador: con la entrada preparada (codificada y escalada) y el objetivo en one-hot
    const trainer = n4lTabularModel('IRIS')
    const [dataset] = await trainer.DATASETS()
    const { X, y, classes } = dataset.data_processed!
    const model = tfjs.sequential({ layers: [
      tfjs.layers.dense({ inputShape: [4], units: 10, activation: 'relu' }),
      tfjs.layers.dense({ units: 3, activation: 'softmax' }),
    ] })
    model.compile({ optimizer: tfjs.train.adam(0.05), loss: 'categoricalCrossentropy', metrics: ['accuracy'] })
    await model.fit(tfjs.tensor2d(X.values as number[][]), tfjs.tensor2d(y.values as number[][]), { epochs: 60, verbose: 0 })

    const { manifest, files } = await trainedModelPackage(iris(), 'tabular-classification', {
      model, classes: classes!, number : 2, metrics: { acc: 0.9 }, input  : 'scaled',
      layers : [{ class: 'dense', units: 10, activation: 'relu' }, { class: 'dense', units: 3, activation: 'softmax' }],
    }, (_language, name) => `${name} (#2)`)
    expect(manifest).toMatchObject({ id: 'iris-model-2', version: '1.0.0' })
    const section = manifest.tasks.find(({ task }) => task === 'tabular-classification')!
    expect(section.models).toStrictEqual([{ id: 'trained', format: 'tfjs-layers', path: 'models/trained/model.json', dataset: 'iris', input: 'scaled', metrics: { acc: 0.9 } }])
    expect(section.training!.layers).toHaveLength(2)
    expect(section.classes!.map(({ id }) => id)).toStrictEqual(classes)
    // Sin el modelo que traía el paquete
    expect(Object.keys(files).filter((file) => file.startsWith('models/')).sort()).toStrictEqual(['models/trained/model.json', 'models/trained/model.weights.bin'])

    const bytes = await packN4L(files, 'uint8array')
    await importN4LPackage(bytes.buffer as ArrayBuffer)
    const [info] = await listLocalPackages('tabular-classification')
    expect(localPackageName(info, 'tabular-classification', 'es')).toBe('Clasificación de flor iris (#2)')

    const ModelClass = await loadModelClass(MAP_TC_CLASSES, localKey('iris-model-2'))
    const opened = new ModelClass(keyT, () => {})
    expect(opened.MODEL_INPUT()).toBe('scaled')
    const loaded = (await opened.LOAD_LAYERS_MODEL({}))!
    const [prepared] = await opened.DATASETS()
    // Como la página del modelo: codificar y, por ser «scaled», escalar
    const predict = (values: Record<string, string | number>) => {
      const encoded = DataFrameApplyEncoders(prepared.data_processed!.encoders, values, opened.DATA_DEFAULT_KEYS).map((value) => parseFloat(value.toString()))
      const scaled = prepared.data_processed!.scaler.transform(encoded) as number[]
      const output = (loaded.predict(tfjs.tensor2d([scaled])) as tfjs.Tensor).dataSync()
      return output.indexOf(Math.max(...output))
    }
    const hits = opened.LIST_EXAMPLES.filter((values, index) => predict(values) === opened.CLASS_INDEX(opened.LIST_EXAMPLES_RESULTS[index])).length
    expect(hits).toBe(opened.LIST_EXAMPLES.length)
  }, 60_000)
})
