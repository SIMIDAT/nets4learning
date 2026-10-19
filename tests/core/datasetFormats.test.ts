import { describe, test, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

import { datasetFileToCSV, datasetFormat, parseARFF, parseJSON, parseJSONL, parseParquet, readFileText, tableToCSV } from '@core/dataframe/datasetFormats'

const FIXTURES = path.resolve(__dirname, '../../e2e/files')
const fixture = (name: string) => fs.readFileSync(path.join(FIXTURES, name))
const IRIS_COLUMNS = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'class']
const IRIS_FIRST = [5.1, 3.5, 1.4, 0.2, 'Setosa']

/** Iris en otro formato pasado a CSV: la misma cabecera, 150 filas y la primera igual que en iris.csv */
async function expectIrisCSV(name: string) {
  const csv = await datasetFileToCSV(new File([fixture(name)], name))
  expect(csv.name).toBe(name.replace(/\.[^.]+$/, '') + '.csv')
  const lines = (await readFileText(csv)).trim().split('\n')
  expect(lines[0]).toBe(IRIS_COLUMNS.join(','))
  expect(lines).toHaveLength(151)
  expect(lines[1]).toBe(IRIS_FIRST.join(','))
}

describe('formatos de conjuntos de datos', () => {

  test('el formato sale de la extensión', () => {
    expect(datasetFormat('datos.CSV')).toBe('csv')
    expect(datasetFormat('iris.arff')).toBe('arff')
    expect(datasetFormat('a.json')).toBe('json')
    expect(datasetFormat('a.jsonl')).toBe('jsonl')
    expect(datasetFormat('a.ndjson')).toBe('jsonl')
    expect(datasetFormat('a.parquet')).toBe('parquet')
    expect(datasetFormat('a.xlsx')).toBeNull()
  })

  test.each(['iris.arff', 'iris.json', 'iris-pandas.json', 'iris.jsonl', 'iris.parquet', 'iris-zstd.parquet'])('%s se convierte en el mismo CSV que iris.csv', async (name) => {
    await expectIrisCSV(name)
  })

  test('un CSV se queda tal cual', async () => {
    const file = new File(['a;b\n1;2\n'], 'datos.csv')
    expect(await datasetFileToCSV(file)).toBe(file)
  })
})

describe('ARFF', () => {

  test('nombres con comillas, nominales, ausentes ("?"), comentarios y el peso de la instancia', () => {
    const table = parseARFF([
      '% comentario',
      '@RELATION tiempo',
      "@ATTRIBUTE 'outlook type' {sunny, overcast, 'light rain'}",
      '@attribute temperature REAL',
      '@attribute note string',
      '@attribute day date "yyyy-MM-dd"',
      '@data',
      "sunny, 85, 'hot, dry', 2024-01-01",
      "'light rain', ?, \"it's wet\", 2024-01-02, {2}",
    ].join('\n'))
    expect(table.columns).toEqual(['outlook type', 'temperature', 'note', 'day'])
    expect(table.rows).toEqual([
      ['sunny', 85, 'hot, dry', '2024-01-01'],
      ['light rain', null, "it's wet", '2024-01-02'],
    ])
  })

  test('filas dispersas: lo que falta es 0 (o el primer valor nominal)', () => {
    const table = parseARFF([
      '@relation dispersa',
      '@attribute a numeric',
      '@attribute b numeric',
      '@attribute c {no, yes}',
      '@attribute d string',
      '@data',
      "{1 3.5, 3 'x y'}",
      '{2 yes}',
    ].join('\n'))
    expect(table.rows).toEqual([[0, 3.5, 'no', 'x y'], [0, 0, 'yes', '']])
  })

  test('una fila con más o menos valores que atributos es un error claro', () => {
    expect(() => parseARFF('@attribute a numeric\n@attribute b numeric\n@data\n1,2,3')).toThrow('expected 2 values but found 3')
    expect(() => parseARFF('@relation vacio\n@data\n1')).toThrow('no @attribute')
  })
})

describe('JSON y JSONL', () => {

  test('registros con claves que faltan o sobran: todas las columnas, en el orden en que aparecen', () => {
    expect(parseJSON('[{"a": 1, "b": "x"}, {"b": "y", "c": true}]')).toEqual({ columns: ['a', 'b', 'c'], rows: [[1, 'x', undefined], [undefined, 'y', true]] })
  })

  test('las formas de pandas: split, index y list', () => {
    expect(parseJSON('{"columns": ["a", "b"], "index": [0, 1], "data": [[1, 2], [3, 4]]}')).toEqual({ columns: ['a', 'b'], rows: [[1, 2], [3, 4]] })
    expect(parseJSON('{"0": {"a": 1, "b": 2}, "1": {"a": 3, "b": 4}}')).toEqual({ columns: ['a', 'b'], rows: [[1, 2], [3, 4]] })
    expect(parseJSON('{"a": [1, 3], "b": [2, 4]}')).toEqual({ columns: ['a', 'b'], rows: [[1, 2], [3, 4]] })
    expect(parseJSON('{"data": [{"a": 1}]}')).toEqual({ columns: ['a'], rows: [[1]] })
  })

  test('una lista de listas con cabecera', () => {
    expect(parseJSON('[["a", "b"], [1, 2]]')).toEqual({ columns: ['a', 'b'], rows: [[1, 2]] })
  })

  test('JSONL: una línea mal escrita dice cuál es', () => {
    expect(parseJSONL('{"a": 1}\n\n{"a": 2}\n')).toEqual({ columns: ['a'], rows: [[1], [2]] })
    expect(() => parseJSONL('{"a": 1}\n{a: 2}')).toThrow('line 2')
  })
})

describe('Parquet y CSV', () => {

  test('Parquet: columnas del esquema y valores', async () => {
    // Con el ArrayBuffer del entorno de la prueba (el del Buffer de Node es de otro "realm" y no pasa el instanceof)
    const bytes = fixture('iris.parquet')
    const buffer = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(buffer).set(bytes)
    const table = await parseParquet(buffer)
    expect(table.columns).toEqual(IRIS_COLUMNS)
    expect(table.rows).toHaveLength(150)
    expect(table.rows[0]).toEqual(IRIS_FIRST)
  })

  test('la tabla como CSV: comillas cuando hacen falta, vacío para lo que falta y los objetos como JSON', () => {
    const csv = tableToCSV({ columns: ['texto', 'n', 'otro'], rows: [['a, "b"', 1.5, null], [' x', Number.NaN, { k: 1 }]] })
    expect(csv).toBe('texto,n,otro\n"a, ""b""",1.5,\n" x",,"{""k"":1}"\n')
  })
})
