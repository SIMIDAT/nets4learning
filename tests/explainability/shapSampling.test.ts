import { describe, test, expect } from 'vitest'
import {
  dataframeRowsToNumbers,
  sampleRowsWithoutReplacement,
  dataframeRowsWithDisplay,
  buildShapBackground,
  minShapSamples,
} from '../../src/core/explainability/shapSampling'

describe('shapSampling — utilidades de muestreo para explicabilidad SHAP', () => {

  describe('dataframeRowsToNumbers', () => {
    test('convierte celdas string y number a número (datasets categóricos)', () => {
      const input = [['5.1', 3, '2'], ['1', '0', 4]]
      expect(dataframeRowsToNumbers(input)).toStrictEqual([[5.1, 3, 2], [1, 0, 4]])
    })

    test('descarta las filas con celdas no numéricas', () => {
      const input = [['5.1', 3], ['setosa', 1], [2, 4]]
      expect(dataframeRowsToNumbers(input)).toStrictEqual([[5.1, 3], [2, 4]])
    })

    test('devuelve [] si la entrada no es un array', () => {
      expect(dataframeRowsToNumbers(null)).toStrictEqual([])
      expect(dataframeRowsToNumbers(undefined)).toStrictEqual([])
      expect(dataframeRowsToNumbers('x')).toStrictEqual([])
    })
  })

  describe('dataframeRowsWithDisplay', () => {
    test('filtra las filas no numéricas en las dos tablas a la vez (siguen alineadas)', () => {
      const scaled = [[0.1, 0.2], ['x', 0.5], [0.9, 1]]
      const original = [[10, 'a'], [20, 'b'], [90, 'c']]
      expect(dataframeRowsWithDisplay(scaled, original)).toStrictEqual({
        rows   : [[0.1, 0.2], [0.9, 1]],
        display: [[10, 'a'], [90, 'c']],
      })
    })

    test('sin valores legibles o con otro nº de filas, display es null', () => {
      expect(dataframeRowsWithDisplay([[1]], null).display).toBeNull()
      expect(dataframeRowsWithDisplay([[1], [2]], [[1]]).display).toBeNull()
    })
  })

  describe('sampleRowsWithoutReplacement', () => {
    const pool = [[1], [2], [3], [4], [5]]

    test('devuelve exactamente n filas cuando n <= pool.length', () => {
      expect(sampleRowsWithoutReplacement(pool, 3)).toHaveLength(3)
    })

    test('no devuelve más filas que las del pool', () => {
      expect(sampleRowsWithoutReplacement(pool, 10)).toHaveLength(5)
    })

    test('las filas devueltas son distintas y pertenecen al pool (sin reemplazo)', () => {
      const sample = sampleRowsWithoutReplacement(pool, 4)
      const values = sample.map((r) => r[0])
      expect(new Set(values).size).toBe(values.length) // sin repetidos
      values.forEach((v) => expect([1, 2, 3, 4, 5]).toContain(v)) // del pool
    })
  })

  describe('buildShapBackground', () => {
    test('muestrea del pool filtrando filas con el nº correcto de features', () => {
      const pool = [[1, 2], [3, 4], [5, 6, 7]] // la 3ª tiene 3 columnas → se descarta
      const bg = buildShapBackground(pool, 2)
      expect(bg.length).toBe(2)
      bg.forEach((row) => expect(row).toHaveLength(2))
    })

    test('cae a un background de ceros si el pool está vacío', () => {
      const bg = buildShapBackground([], 3, 5)
      expect(bg).toHaveLength(5)
      bg.forEach((row) => expect(row).toStrictEqual([0, 0, 0]))
    })

    test('cae a ceros si ninguna fila tiene el nº de features pedido', () => {
      const bg = buildShapBackground([[1, 2, 3]], 2, 4)
      expect(bg).toHaveLength(4)
      bg.forEach((row) => expect(row).toStrictEqual([0, 0]))
    })

    test('nunca muestrea más de nRows filas', () => {
      const pool = Array.from({ length: 100 }, (_, i) => [i, i])
      expect(buildShapBackground(pool, 2, 10)).toHaveLength(10)
    })
  })

  describe('minShapSamples', () => {
    test('garantiza al menos 2·segmentos + 2 muestras', () => {
      expect(minShapSamples(36, 50)).toBe(74)
      expect(minShapSamples(14, 150)).toBe(150)
    })
  })
})
