import { describe, test, expect } from 'vitest'
import * as fs from 'fs'
import { TASK_DATASET_OPTIONS, type TaskOption_t } from '../../src/TASK_OPTIONS'
import { EXTRA_DATASETS } from '../../src/pages/datasets/extraDatasets'
import { DATASET_VARIABLES } from '../../src/pages/datasets/datasetVariables'

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
    const covered = DATASET_VARIABLES.flatMap((table) => table.files)
    expect(files.filter((file) => !covered.includes(file))).toStrictEqual([])
  })

  test('las variables coinciden con las columnas y los valores ausentes de los CSV', () => {
    for (const table of DATASET_VARIABLES) {
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
})
