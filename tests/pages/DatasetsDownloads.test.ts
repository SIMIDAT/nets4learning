import { describe, test, expect } from 'vitest'
import * as fs from 'fs'
import { TASK_DATASET_OPTIONS, type TaskOption_t } from '../../src/TASK_OPTIONS'
import { EXTRA_DATASETS } from '../../src/pages/datasets/extraDatasets'
import { DATASET_VARIABLES, N4L_VARIABLES, variableTables } from '../../src/pages/datasets/datasetVariables'
import { datasetKey } from '../../src/pages/analyze/projectDatasets'

// La página de datasets descarga los mismos CSV que usan los modelos, más algunos extra: todos deben existir en public/
describe('Datasets — enlaces de descarga', () => {
  test('los ficheros de los datasets de los modelos existen', () => {
    const files = Object.values(TASK_DATASET_OPTIONS as Record<string, TaskOption_t[]>)
      .flat()
      .flatMap((option) => option.info?.files ?? [])
    expect(files.length).toBeGreaterThan(0)
    expect(files.filter((file) => !fs.existsSync('public/' + file))).toStrictEqual([])
  })

  test('los ficheros extra existen', () => {
    const files = Object.values(EXTRA_DATASETS).flat().map(({ file }) => file)
    expect(files.length).toBeGreaterThan(0)
    expect(files.filter((file) => !fs.existsSync('public/' + file))).toStrictEqual([])
  })

  test('cada dataset tabular tiene su tabla de variables', () => {
    const files = [
      ...Object.values(TASK_DATASET_OPTIONS as Record<string, TaskOption_t[]>).flat().flatMap((option) => option.info?.files ?? []),
      ...Object.values(EXTRA_DATASETS).flat().map(({ file }) => file),
    ]
    // Las de los paquetes .n4l, de su manifiesto
    expect(files.filter((file) => variableTables([file]).length === 0)).toStrictEqual([])
  })

  test('las variables coinciden con las columnas y los valores ausentes de los CSV', () => {
    for (const table of [...DATASET_VARIABLES, ...N4L_VARIABLES]) {
      const columns = table.variables.map(() => ({ missing: 0 }))
      for (const file of table.files) {
        const [header, ...rows] = fs.readFileSync('public/' + file, 'utf-8').trim().split(/\r?\n/).map((line) => line.split(','))
        expect(header.map((name) => name.trim()), file).toStrictEqual(table.variables.map(({ name }) => name))
        rows.forEach((row) => header.forEach((_, i) => { if (['', '?', 'NA', 'NaN', 'nan'].includes((row[i] ?? '').trim())) columns[i].missing++ }))
      }
      expect(columns.map(({ missing }) => missing), table.files[0]).toStrictEqual(table.variables.map(({ missing }) => missing))
    }
  })

  test('cada dataset de los modelos tiene su fuente original', () => {
    const missing = Object.values(TASK_DATASET_OPTIONS as Record<string, TaskOption_t[]>)
      .flat()
      .filter((option) => option.info !== undefined && option.info.source === undefined)
    expect(missing).toStrictEqual([])
  })

  test('las clases de los conjuntos de práctica son las de su columna objetivo', () => {
    for (const { file, classes } of Object.values(EXTRA_DATASETS).flat().filter(({ classes }) => classes !== undefined)) {
      const target = variableTables([file])[0].variables.find(({ role }) => role === 'Target')!.name
      const [header, ...rows] = fs.readFileSync('public/' + file, 'utf-8').trim().split(/\r?\n/).map((line) => line.split(','))
      const column = header.map((name) => name.trim()).indexOf(target)
      expect(new Set(rows.map((row) => row[column].trim())).size, file).toBe(classes)
    }
  })

  test('cada conjunto tiene su frase en /datasets, en todos los idiomas', () => {
    const lookup = (translation: unknown, key: string) =>
      key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], translation)
    const keys = [
      ...(['tabular-classification', 'regression', 'image-classification', 'clustering'] as const).flatMap((task) =>
        (TASK_DATASET_OPTIONS as Record<string, TaskOption_t[]>)[task].filter(({ info }) => info !== undefined)
          .map(({ value, summary }) => summary ?? `datasets.summary.${task}.${value}`)),
      ...Object.values(EXTRA_DATASETS).flat().map(({ file, summary }) => summary ?? `datasets.summary.extra.${datasetKey(file)}`),
    ]
    // n4l-<id>:clave está en los textos del paquete (public/n4l/<id>.n4l/locales/); el resto, en los de la aplicación
    const text = (language: string, key: string) => {
      const [, id, packageKey] = key.match(/^n4l-(.+):(.+)$/) ?? []
      return id === undefined
        ? lookup(JSON.parse(fs.readFileSync(`public/locales/${language}/translation.json`, 'utf-8')), key)
        : lookup(JSON.parse(fs.readFileSync(`public/n4l/${id}.n4l/locales/${language}.json`, 'utf-8')), packageKey)
    }
    for (const language of ['es', 'en', 'ja']) {
      expect(keys.filter((key) => typeof text(language, key) !== 'string'), language).toStrictEqual([])
    }
  })
})
