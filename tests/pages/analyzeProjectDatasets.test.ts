import { describe, test, expect } from 'vitest'
import * as fs from 'fs'

import { PROJECT_DATASETS, datasetKey, datasetVariables, defaultTarget, fileName, projectDatasetByKey } from '@pages/analyze/projectDatasets'

describe('Conjuntos de datos de /analyze', () => {

  test('cada CSV tiene su clave para la dirección (/analyze?dataset=…) y no se repiten', () => {
    const keys = PROJECT_DATASETS.map(({ file }) => datasetKey(file))
    expect(new Set(keys).size).toBe(keys.length)
    expect(datasetKey('models/00-tabular-classification/iris/iris.csv')).toBe('iris')
    expect(projectDatasetByKey('iris')?.file).toBe('models/00-tabular-classification/iris/iris.csv')
    expect(projectDatasetByKey('no-existe')).toBeUndefined()
    expect(projectDatasetByKey(null)).toBeUndefined()
  })

  test('todos los CSV existen en public/ y no se repiten', () => {
    const files = PROJECT_DATASETS.map(({ file }) => file)
    expect(new Set(files).size).toBe(files.length)
    for (const file of files) expect(fs.existsSync('public/' + file), file).toBe(true)
  })

  test('cada CSV tiene su ficha de variables, con las mismas columnas y un objetivo', () => {
    for (const { file } of PROJECT_DATASETS) {
      const variables = datasetVariables(file)
      expect(variables, file).toBeDefined()
      const header = fs.readFileSync('public/' + file, 'utf8').split(/\r?\n/)[0].split(',').map((name) => name.replace(/^"|"$/g, '').trim())
      expect(variables!.map(({ name }) => name), file).toEqual(header)
      expect(variables!.some(({ role }) => role === 'Target'), file).toBe(true)
    }
  })

  test('el objetivo por defecto es el de la ficha y, sin ficha, la última columna', () => {
    // En california-housing el objetivo no es la última: así se ve que no se toma la última sin más
    expect(defaultTarget(['class', 'a', 'b'], [{ name: 'class', role: 'Target', type: 'Categorical', missing: 0 }])).toBe('class')
    expect(defaultTarget(['a', 'b'])).toBe('b')
    expect(defaultTarget([])).toBeNull()
    expect(fileName('datasets/01-regression/auto-mpg/auto-mpg.csv')).toBe('auto-mpg.csv')
  })
})
