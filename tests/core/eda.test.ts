import { describe, test, expect } from 'vitest'
import * as dfd from 'danfojs'

import {
  binCenters,
  binCounts,
  boxStats,
  columnKind,
  correlationMatrix,
  extent,
  dataWarnings,
  histogram,
  isMissing,
  pearson,
  problemType,
  profileColumn,
  profileDataFrame,
  quantile,
  toNumbers,
  topValues,
  countValues,
  valueCounts,
} from '@core/dataframe/eda'
import { dataframeToCSV, preprocessDataFrame } from '@core/dataframe/preprocess'

describe('valores ausentes y tipo de columna', () => {

  test('vacío, "?", NaN, null y undefined son ausentes; 0 y "0" no', () => {
    expect(['', ' ? ', NaN, null, undefined, 'NA'].every(isMissing)).toBe(true)
    expect([0, '0', 'a', false].some(isMissing)).toBe(false)
  })

  test('una columna de texto con números y "?" es numérica (Bare_Nuclei de breast-cancer-wisconsin)', () => {
    expect(columnKind(['1', '10', '?', '2'], 'string')).toBe('numeric')
    expect(columnKind(['a', '10'], 'string')).toBe('categorical')
    expect(columnKind([1.5, 2], 'float32')).toBe('numeric')
    expect(toNumbers(['1', '?', 2.5, 'x'])).toEqual([1, NaN, 2.5, NaN])
  })
})

describe('estadísticos', () => {

  test('cuantiles con interpolación lineal, como pandas', () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5)
    expect(quantile([1, 2, 3, 4], 0.25)).toBe(1.75)
    expect(quantile([], 0.5)).toBeNaN()
  })

  test('mínimo y máximo de un millón de valores sin desbordar la pila (Math.min(...valores) falla)', () => {
    const values = Array.from({ length: 1_000_000 }, (_, i) => (i * 7919) % 1_000_003 - 500)
    const expected = values.reduce(([min, max], value) => [Math.min(min, value), Math.max(max, value)], [Infinity, -Infinity])
    expect(extent(values)).toEqual(expected)
    expect(histogram(values).counts.reduce((a, b) => a + b, 0)).toBe(1_000_000)
  })

  test('recuentos por intervalo con los bordes de otro histograma (los de cada clase se comparan)', () => {
    const { edges } = histogram([0, 10], 5)
    expect(binCounts([0, 1.9, 2, 9.99, 10, 11, NaN], edges)).toEqual([2, 1, 0, 0, 2])
    expect(binCenters(edges)).toEqual({ centers: [1, 3, 5, 7, 9], width: 2 })
  })

  test('diagrama de caja calculado: cuartiles, bigotes, media y atípicos (como mucho los pedidos)', () => {
    const stats = boxStats([1, 2, 3, 4, 5, 6, 7, 8, 100, NaN])!
    expect(stats).toMatchObject({ q1: 3, median: 5, q3: 7, lowerfence: 1, upperfence: 8, count: 9, outliers: [100] })
    expect(stats.mean).toBeCloseTo(136 / 9)
    // 10 000 valores entre 0 y 1 y 200 muy alejados: 200 atípicos, de los que se dibujan 50 (de todo su rango)
    const many = boxStats([...Array.from({ length: 10000 }, (_, i) => i / 10000), ...Array.from({ length: 200 }, (_, i) => 1000 + i)], 50)!
    expect(many.outliers).toHaveLength(50)
    expect(many.outliers[0]).toBe(1000)
    expect(many.outliers[49]).toBeGreaterThan(1190)
    expect(boxStats([NaN])).toBeNull()
  })

  test('histograma: un intervalo por entero si hay pocos; si no, Sturges', () => {
    expect(histogram([1, 2, 2, 3])).toEqual({ edges: [0.5, 1.5, 2.5, 3.5], counts: [1, 2, 1] })
    const continuous = histogram(Array.from({ length: 100 }, (_, i) => i / 10))
    expect(continuous.counts.length).toBe(8)
    expect(continuous.counts.reduce((a, b) => a + b, 0)).toBe(100)
    expect(histogram([5, 5, 5], 10)).toEqual({ edges: [4.5, 5.5], counts: [3] })
  })

  test('frecuencias de más a menos, sin contar ausentes', () => {
    expect(valueCounts(['b', 'a', 'b', '?', 'c', 'a', 'b'])).toEqual([
      { value: 'b', count: 3 }, { value: 'a', count: 2 }, { value: 'c', count: 1 },
    ])
  })

  test('los más frecuentes sin ordenar todo dan lo mismo que ordenar todo (empates en orden natural)', () => {
    // Valores con muchos empates de frecuencia y números que se ordenan mal como texto ("10" antes que "2")
    const values = Array.from({ length: 5000 }, (_, i) => String((i * 7919) % 613 % 97))
    const all = valueCounts(values)
    expect(topValues(countValues(values), 10)).toEqual(all.slice(0, 10))
    expect(valueCounts(values, 30)).toEqual(all.slice(0, 30))
    expect(valueCounts(['10', '2', '2', '10', '1'], 2)).toEqual([{ value: '2', count: 2 }, { value: '10', count: 2 }])
  })

  test('perfil de una columna numérica: ausentes, distintos, media, desviación típica muestral y atípicos', () => {
    const profile = profileColumn('x', [1, 2, 3, 4, 100, NaN], 'float32')
    expect(profile).toMatchObject({ kind: 'numeric', count: 5, missing: 1, distinct: 5 })
    expect(profile.numeric!.mean).toBe(22)
    expect(profile.numeric!.median).toBe(3)
    expect(profile.numeric!.std).toBeCloseTo(43.6, 1)
    expect(profile.numeric!.outliers).toBe(1)
  })

  test('perfil de una columna categórica: valores más frecuentes', () => {
    const profile = profileColumn('color', ['rojo', 'azul', 'rojo', ''], 'string')
    expect(profile).toMatchObject({ kind: 'categorical', count: 3, missing: 1, distinct: 2 })
    expect(profile.numeric).toBeUndefined()
    expect(profile.top[0]).toEqual({ value: 'rojo', count: 2 })
  })

  test('Pearson con las filas completas de las dos columnas', () => {
    expect(pearson([1, 2, 3, NaN], [2, 4, 6, 100])).toBeCloseTo(1)
    expect(pearson([1, 2, 3], [3, 2, 1])).toBeCloseTo(-1)
    expect(pearson([1, 1, 1], [1, 2, 3])).toBeNaN()
    const { names, matrix } = correlationMatrix([{ name: 'a', values: [1, 2, 3] }, { name: 'b', values: [1, 2, 4] }])
    expect(names).toEqual(['a', 'b'])
    expect(matrix[0][0]).toBe(1)
    expect(matrix[0][1]).toBeCloseTo(0.98, 2)
  })
})

describe('conjunto de datos', () => {

  const iris = () => new dfd.DataFrame({
    sepal_length: [5.1, 4.9, 7.0, 6.4, 6.3, 5.8, 5.1],
    petal_length: [1.4, 1.4, 4.7, 4.5, 6.0, 5.1, 1.4],
    class       : ['Iris-setosa', 'Iris-setosa', 'Iris-versicolor', 'Iris-versicolor', 'Iris-virginica', 'Iris-virginica', 'Iris-setosa'],
  })

  test('filas, columnas, celdas vacías y filas repetidas', () => {
    const profile = profileDataFrame(iris())
    expect(profile).toMatchObject({ rows: 7, columns: 3, missingCells: 0, duplicateRows: 1 })
    expect(profile.profiles.map(({ kind }) => kind)).toEqual(['numeric', 'numeric', 'categorical'])
  })

  test('tipo de problema: texto o pocos enteros, clasificación; números continuos, regresión', () => {
    expect(problemType(profileColumn('class', ['a', 'b'], 'string'))).toBe('classification')
    expect(problemType(profileColumn('lymph', [1, 2, 3, 4, 2], 'int32'))).toBe('classification')
    expect(problemType(profileColumn('mpg', [18, 15.5, 24, 30.2], 'float32'))).toBe('regression')
  })

  test('avisos: repetidas, ausentes, constantes, identificadores, desequilibrio y atributos casi iguales', () => {
    const rows = 40
    const dataframe = new dfd.DataFrame({
      id      : Array.from({ length: rows }, (_, i) => i + 1000),
      a       : Array.from({ length: rows }, (_, i) => i),
      b       : Array.from({ length: rows }, (_, i) => 2 * i + 1),
      constant: Array.from({ length: rows }, () => 7),
      class   : Array.from({ length: rows }, (_, i) => (i < 38 ? 'yes' : 'no')),
    })
    const profile = profileDataFrame(dataframe)
    const correlations = correlationMatrix(['id', 'a', 'b'].map((name) => ({ name, values: toNumbers(dataframe[name].values as unknown[]) })))
    const types = dataWarnings(profile, 'class', correlations).map((warning) => ('column' in warning ? `${warning.type}:${warning.column}` : warning.type))
    expect(types).toContain('constant:constant')
    expect(types).toContain('identifier:id')
    expect(types).toContain('imbalance:class')
    expect(types).toContain('correlation:a')
    expect(types).not.toContain('identifier:class')
  })
})

describe('preprocesado', () => {

  const raw = () => new dfd.DataFrame({
    size : [1, 2, NaN, 4, 1],
    color: ['red', 'blue', 'red', '?', 'red'],
    id   : [10, 11, 12, 13, 10],
    class: ['a', 'b', 'a', 'b', 'a'],
  })

  test('codifica el texto, descarta columnas y deja el objetivo sin escalar', () => {
    const result = preprocessDataFrame(raw(), {
      columns   : { size: 'keep', color: 'label-encoder', id: 'drop', class: 'label-encoder' },
      missing   : 'keep',
      duplicates: false,
      scaler    : 'min-max',
      target    : 'class',
    })
    expect(result.dataframe.columns).toEqual(['size', 'color', 'class'])
    expect(result.encodings.color).toEqual(['red', 'blue'])
    expect(result.dataframe.column('color').values).toEqual([0, 1, 0, NaN, 0])
    expect(result.dataframe.column('class').values).toEqual([0, 1, 0, 1, 0])
    expect(result.dataframe.column('size').values).toEqual([0, 1 / 3, NaN, 1, 0])
    expect(result.applied.size).toBe('float32 · min-max')
  })

  test('quita filas repetidas o incompletas, o rellena los ausentes con la media y el valor más frecuente', () => {
    const base = { columns: {}, scaler: 'none' as const, target: 'class' }
    const dropped = preprocessDataFrame(raw(), { ...base, missing: 'drop-rows', duplicates: true })
    expect(dropped.removedRows).toEqual({ duplicates: 1, missing: 2 })
    expect(dropped.dataframe.shape[0]).toBe(2)
    const imputed = preprocessDataFrame(raw(), { ...base, missing: 'impute', duplicates: false })
    expect(imputed.imputed).toEqual({ size: 2, color: 'red' })
    expect(imputed.dataframe.column('size').values).toEqual([1, 2, 2, 4, 1])
  })

  test('el CSV descargado se puede volver a leer: comillas donde hay comas', () => {
    const csv = dataframeToCSV(new dfd.DataFrame({ name: ['a,b', 'c'], value: [1, NaN] }))
    expect(csv).toBe('name,value\n"a,b",1\nc,\n')
  })
})
