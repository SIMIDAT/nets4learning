import { describe, test, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as tfjs from '@tensorflow/tfjs'

import { N4L_CATALOG, n4lDatasetByFile, n4lPackageByKey, n4lPublicFile } from '@core/n4l/catalog'
import { isTableDataset, n4lLabelKey, n4lLayersModels, n4lTableView, N4L_FORMAT_VERSION, type N4LDataset_t } from '@core/n4l/format'
import { upgradeManifest } from '@core/n4l/migrate'
import { manifestProblems, N4LError, validateManifest } from '@core/n4l/validate'
import { N4LZipSource, openN4LPackage, packN4L } from '@core/n4l/source'
import { loadN4LLayersModel } from '@core/n4l/tfjsModel'
import { taskOptions } from '@/TASK_OPTIONS'
import { readN4LCatalog } from '../../vite/n4lPackages'

const IRIS_DIR = 'public/n4l/iris.n4l'
const iris = () => JSON.parse(fs.readFileSync(`${IRIS_DIR}/manifest.json`, 'utf-8'))

/** Los ficheros de una carpeta, con su ruta dentro de ella */
const filesOf = (dir: string, base = dir): Record<string, Uint8Array> => Object.assign({}, ...fs.readdirSync(dir, { withFileTypes: true })
  .map((entry) => (entry.isDirectory()
    ? filesOf(path.join(dir, entry.name), base)
    : { [path.relative(base, path.join(dir, entry.name))]: new Uint8Array(fs.readFileSync(path.join(dir, entry.name))) })))

describe('Formato .n4l: el manifiesto', () => {
  test('los paquetes de public/n4l/ son válidos y su carpeta se llama como su id', () => {
    expect(N4L_CATALOG.map(({ id }) => id)).toEqual(expect.arrayContaining(['car', 'iris', 'lymphography']))
    for (const entry of N4L_CATALOG) {
      expect(manifestProblems(entry), entry.id).toStrictEqual([])
      expect(entry.path).toBe(`n4l/${entry.id}.n4l`)
    }
  })

  test('cada problema dice dónde está, y se dicen todos a la vez', () => {
    const manifest = iris()
    manifest.version = '1.0'
    manifest.datasets[0].columns[0].role = 'Input'
    manifest.tasks[0].models[0].dataset = 'otro'
    manifest.tasks[0].preprocessing.push({ op: 'min-max', columns: 'todas' }, { op: 'label-encoder', columns: ['class', 'color'] })
    expect(manifestProblems(manifest)).toStrictEqual([
      'version: semver (1.0.0)',
      'datasets[0].columns[0].role: uno de Feature, Target, ID, Other',
      'tasks[0].preprocessing[2].columns: "categorical", "features" o una lista de columnas',
      'tasks[0].preprocessing[3].columns: no están en el conjunto: color',
      'tasks[0].models[0].dataset: uno de los conjuntos del paquete',
    ])
    expect(() => validateManifest(manifest)).toThrow(N4LError)
  })

  test('las rutas no pueden salir del paquete', () => {
    const manifest = iris()
    manifest.datasets[0].file = '../../models/x.csv'
    manifest.tasks[0].models[0].path = '/models/x.json'
    expect(manifestProblems(manifest)).toStrictEqual(['datasets[0].file: ruta dentro del paquete', 'tasks[0].models[0].path: ruta dentro del paquete'])
  })

  test('los ejemplos tienen que ser de una de las clases (por su id o uno de sus nombres)', () => {
    const manifest = iris()
    manifest.tasks[0].prediction.examples[0].expected = 'Rosa'
    manifest.tasks[0].prediction.examples[1].expected = 'Iris-versicolor'
    expect(manifestProblems(manifest)).toStrictEqual(['tasks[0].prediction.examples[0].expected: una de las clases'])
  })

  test('una sección por tarea, con un conjunto del paquete', () => {
    const manifest = iris()
    manifest.tasks.push({ ...manifest.tasks[1], datasets: ['flores'], listed: 'no' })
    expect(manifestProblems(manifest)).toStrictEqual([
      'tasks[2].task: clustering ya tiene su sección',
      'tasks[2].datasets: al menos uno, de los conjuntos del paquete',
      'tasks[2].listed: true o false',
    ])
    expect(manifestProblems({ ...iris(), tasks: [] })).toStrictEqual(['tasks: al menos una tarea'])
  })

  test('las claves de columnas y clases en los textos: sin «.» ni «:» (separadores de i18next)', () => {
    expect(n4lLabelKey('bl. of lymph. c')).toBe('bl_ of lymph_ c')
    expect(n4lLabelKey('a:b')).toBe('a_b')
    for (const entry of N4L_CATALOG) {
      for (const language of entry.locales) {
        const texts = JSON.parse(fs.readFileSync(`public/${entry.path}/locales/${language}.json`, 'utf-8'))
        // Los de cada tarea: su nombre en los menús y su frase en /datasets
        for (const { task } of entry.tasks) {
          for (const key of ['name', 'summary']) expect(typeof texts.tasks[task]?.[key], `${entry.id} ${language} ${task}.${key}`).toBe('string')
        }
        // Las columnas de todas sus tablas y, si alguna de sus tareas con tablas las tiene, sus clases. Las de las
        // imágenes pueden tener nombre («avión») o enseñarse tal cual («7», «お»), pero no a medias
        const columns = new Set(entry.datasets.filter(isTableDataset).flatMap(({ columns: list }) => list.map(({ name }) => n4lLabelKey(name))))
        expect(Object.keys(texts.columns ?? {}).sort(), `${entry.id} ${language}`).toStrictEqual([...columns].sort())
        const classesOf = (sections: typeof entry.tasks) => sections.flatMap((section) => section.classes ?? []).map(({ id }) => n4lLabelKey(id))
        const tableClasses = classesOf(entry.tasks.filter((section) => n4lTableView(entry, section.task) !== undefined))
        const imageClasses = classesOf(entry.tasks.filter((section) => n4lTableView(entry, section.task) === undefined))
        const named = Object.keys(texts.classes ?? {})
        const expected = named.some((key) => imageClasses.includes(key)) ? [...tableClasses, ...imageClasses] : tableClasses
        expect(named.sort(), `${entry.id} ${language}`).toStrictEqual([...new Set(expected)].sort())
      }
    }
  })
})

describe('Formato .n4l: versiones', () => {
  test('uno de una versión más nueva del formato se rechaza: hay que actualizar la aplicación', () => {
    expect(() => upgradeManifest({ ...iris(), formatVersion: N4L_FORMAT_VERSION + 1 })).toThrow(/actualízala/)
  })

  test('uno de una versión anterior se sube de versión en versión hasta la actual', () => {
    // Un formato 3 imaginario: la 2 renombró «key» a «slug» y la 3 pasó «locales» a un objeto
    const migrations = {
      1: (manifest: Record<string, unknown>) => {
        const { key, ...rest } = manifest
        return { ...rest, slug: key }
      },
      2: (manifest: Record<string, unknown>) => ({ ...manifest, locales: { languages: manifest.locales } }),
    }
    const upgraded = upgradeManifest({ ...iris(), key: 'IRIS' }, migrations, 3)
    expect(upgraded).toMatchObject({ formatVersion: 3, slug: 'IRIS', locales: { languages: ['es', 'en', 'ja'] } })
    expect(upgraded).not.toHaveProperty('key')
    expect(() => upgradeManifest(iris(), { 1: migrations[1] }, 3)).toThrow(/no hay migración de la versión 2/)
  })

  test('sin el formato n4l no es un paquete', () => {
    expect(() => upgradeManifest({ id: 'x' })).toThrow(/format/)
  })
})

describe('Formato .n4l: el plugin que reúne los paquetes', () => {
  test('lee las carpetas <id>.n4l de public/n4l y comprueba que estén sus ficheros', () => {
    const tmp = fs.mkdtempSync(path.join(fs.realpathSync('/tmp'), 'n4l-'))
    const dir = path.join(tmp, 'n4l', 'iris.n4l')
    fs.cpSync(IRIS_DIR, dir, { recursive: true })
    expect(readN4LCatalog(tmp).map(({ id, path: where }) => [id, where])).toStrictEqual([['iris', 'n4l/iris.n4l']])

    fs.rmSync(path.join(dir, 'locales', 'ja.json'))
    expect(() => readN4LCatalog(tmp)).toThrow(/falta el fichero locales\/ja\.json/)
    fs.cpSync(IRIS_DIR, dir, { recursive: true })
    fs.renameSync(dir, path.join(tmp, 'n4l', 'flores.n4l'))
    expect(() => readN4LCatalog(tmp)).toThrow(/la carpeta se tiene que llamar iris\.n4l/)
    fs.rmSync(tmp, { recursive: true })
  })
})

describe('Formato .n4l: un fichero .n4l (ZIP)', () => {
  beforeAll(async () => { await tfjs.setBackend('cpu') })

  test('la carpeta comprimida se abre igual: su manifiesto, sus textos y su modelo', async () => {
    const pkg = await openN4LPackage(await N4LZipSource.open(await packN4L(filesOf(IRIS_DIR), 'uint8array')))
    expect(pkg.manifest.id).toBe('iris')
    expect(pkg.source.url('manifest.json')).toBeNull()
    expect(JSON.parse(await pkg.source.readText('locales/es.json')).tasks['tabular-classification'].title).toContain('IRIS')
    const model = await loadN4LLayersModel(pkg.source, n4lLayersModels(pkg.manifest.tasks[0])[0].path)
    expect(model.inputs[0].shape).toStrictEqual([null, 4])
  })

  test('también si todo va dentro de su carpeta (al comprimir la carpeta entera)', async () => {
    const files = Object.fromEntries(Object.entries(filesOf(IRIS_DIR)).map(([file, data]) => [`iris.n4l/${file}`, data]))
    const pkg = await openN4LPackage(await N4LZipSource.open(await packN4L(files, 'uint8array')))
    expect(pkg.manifest.tasks.map(({ task, key }) => `${task}/${key}`)).toStrictEqual(['tabular-classification/IRIS', 'clustering/IRIS'])
    await expect(pkg.source.readText('no-existe.json')).rejects.toThrow(/no tiene no-existe\.json/)
  })
})

describe('Formato .n4l: en la aplicación', () => {
  test('los menús y /datasets toman sus modelos y conjuntos del catálogo', () => {
    expect(taskOptions('tabular-classification', 'model').map(({ value }) => value)).toStrictEqual(['CAR', 'IRIS', 'LYMPHOGRAPHY'])
    const iris = taskOptions('tabular-classification', 'dataset').find(({ value }) => value === 'IRIS')!
    expect(iris).toMatchObject({
      i18n   : 'n4l-iris:tasks.tabular-classification.name',
      summary: 'n4l-iris:tasks.tabular-classification.summary',
      info   : { files: ['n4l/iris.n4l/data/iris.csv'], rows: [150], features: 4, classes: 3 },
    })
  })

  test('el iris se comparte: un solo CSV para clasificar y para agrupar', () => {
    const classification = taskOptions('tabular-classification', 'dataset').find(({ value }) => value === 'IRIS')!
    const clustering = taskOptions('clustering', 'dataset').find(({ value }) => value === 'IRIS')!
    expect(clustering).toMatchObject({ i18n: 'n4l-iris:tasks.clustering.name', info: { classes: 3 } })
    expect(clustering.info!.files).toStrictEqual(classification.info!.files)
  })

  test('un fichero de un paquete lleva a su paquete y su conjunto', () => {
    const { entry, dataset } = n4lPackageByKey('tabular-classification', 'CAR')!
    const file = n4lPublicFile(entry, (dataset as N4LDataset_t).file)
    expect(n4lDatasetByFile(file)).toMatchObject({ entry: { id: 'car' }, dataset: { rows: 1728 } })
    expect(n4lDatasetByFile('datasets/ecoli.csv')).toBeUndefined()
  })
})
