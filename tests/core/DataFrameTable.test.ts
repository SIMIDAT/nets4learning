import { describe, test, expect } from 'vitest'
import * as dfd from 'danfojs'

import {
  CELL_HEIGHT,
  DataFrameDescribeTable,
  TABLE_PALETTE,
  TARGET_COLOR,
  buildDataFrameTable,
  resolveTableTarget,
} from '@core/dataframe/DataFrameTable'

const iris = () => new dfd.DataFrame({
  'sepal length': [5.1, 4.9, 7.0, 6.3],
  'petal width' : [0.2, 0.2, 1.4, 2.5],
  'class'       : ['Iris-setosa', 'Iris-setosa', 'Iris-versicolor', 'Iris-virginica'],
})

type Trace_t = {
  header: { values: string[][], fill: { color: string[] }, font: { color: string[] }, align: string[] }
  cells : { values: unknown[][], fill: { color: string[][] }, font: { color: Array<string | string[]> }, format: string[], align: string[] }
}
const traceOf = (table: ReturnType<typeof buildDataFrameTable>) => table.data as unknown as Trace_t

describe('resolveTableTarget', () => {

  test('por defecto la última columna; null o una que no existe, ninguna', () => {
    expect(resolveTableTarget(iris(), {})).toBe('class')
    expect(resolveTableTarget(iris(), { target: 'petal width' })).toBe('petal width')
    expect(resolveTableTarget(iris(), { target: null })).toBeNull()
    expect(resolveTableTarget(iris(), { target: 'species' })).toBeNull()
  })
})

describe('buildDataFrameTable', () => {

  test('la columna objetivo con su color en la cabecera y las celdas teñidas', () => {
    const table = buildDataFrameTable(iris(), { target: 'class' })
    const trace = traceOf(table)
    // [#, sepal length, petal width, class]
    expect(trace.header.fill.color).toEqual([TABLE_PALETTE.light.header, TABLE_PALETTE.light.header, TABLE_PALETTE.light.header, TARGET_COLOR])
    expect(trace.header.font.color[3]).toBe('#ffffff')
    expect(trace.cells.fill.color[3]).toEqual([
      TABLE_PALETTE.light.target, TABLE_PALETTE.light.targetStripe, TABLE_PALETTE.light.target, TABLE_PALETTE.light.targetStripe,
    ])
    // El resto, filas alternas
    expect(trace.cells.fill.color[1]).toEqual([
      TABLE_PALETTE.light.cell, TABLE_PALETTE.light.stripe, TABLE_PALETTE.light.cell, TABLE_PALETTE.light.stripe,
    ])
    expect(trace.cells.font.color[3]).toBe(TABLE_PALETTE.light.targetText)
  })

  test('sin objetivo no se resalta nada', () => {
    const trace = traceOf(buildDataFrameTable(iris(), { target: null }))
    expect(trace.header.fill.color).not.toContain(TARGET_COLOR)
  })

  test('índice de filas, tipo bajo cada nombre, números a la derecha con 4 decimales como mucho y textos a la izquierda', () => {
    const trace = traceOf(buildDataFrameTable(iris(), { subtitles: 'dtype' }))
    expect(trace.cells.values[0]).toEqual(['<b>0</b>', '<b>1</b>', '<b>2</b>', '<b>3</b>'])
    expect(trace.header.values[1][0]).toContain('<b>sepal length</b><br>')
    expect(trace.header.values[1][0]).toContain('float32')
    expect(trace.header.values[3][0]).toContain('string')
    expect(trace.cells.format).toEqual(['', '.4~f', '.4~f', ''])
    expect(trace.cells.align).toEqual(['left', 'right', 'right', 'left'])
  })

  test('los textos se escapan: Plotly interpreta algo de HTML', () => {
    const dataframe = new dfd.DataFrame({ '<b>x</b>': ['a<br>b', 'c'], y: [1, 2] })
    const trace = traceOf(buildDataFrameTable(dataframe, { index: false }))
    expect(trace.header.values[0][0]).toBe('<b>&lt;b&gt;x&lt;/b&gt;</b>')
    expect(trace.cells.values[0]).toEqual(['a&lt;br&gt;b', 'c'])
  })

  test('altura justa para las filas visibles: sin hueco debajo y con desplazamiento a partir de maxRows', () => {
    const small = buildDataFrameTable(iris(), {})
    expect(small.layout.height).toBe(34 + 4 * CELL_HEIGHT + 4)
    const many = new dfd.DataFrame({ a: Array.from({ length: 100 }, (_, i) => i) })
    expect(buildDataFrameTable(many, { maxRows: 10 }).layout.height).toBe(34 + 10 * CELL_HEIGHT + 4)
  })

  test('colores del tema oscuro y ancho mínimo para que las columnas no se aplasten', () => {
    const table = buildDataFrameTable(iris(), { theme: 'dark', target: null })
    expect(traceOf(table).header.fill.color[1]).toBe(TABLE_PALETTE.dark.header)
    expect(table.layout.font.color).toBe(TABLE_PALETTE.dark.text)
    expect(table.minWidth).toBeGreaterThanOrEqual(3 * 96)
  })

  test('con el objetivo en una fila (describe), se tiñe esa fila entera', () => {
    const describe = DataFrameDescribeTable(new dfd.DataFrame({ a: [1, 2, 3], target: [10, 20, 30] }))!
    const trace = traceOf(buildDataFrameTable(describe, { target: 'target', targetAxis: 'row' }))
    const targetRow = 1
    for (const column of trace.cells.fill.color) {
      expect([TABLE_PALETTE.light.target, TABLE_PALETTE.light.targetStripe]).toContain(column[targetRow])
      expect([TABLE_PALETTE.light.target, TABLE_PALETTE.light.targetStripe]).not.toContain(column[0])
    }
    expect((trace.cells.font.color[1] as string[])[targetRow]).toBe(TABLE_PALETTE.light.targetText)
  })
})

describe('DataFrameDescribeTable', () => {

  test('una fila por columna numérica, con los estadísticos redondeados', () => {
    const describe = DataFrameDescribeTable(iris())!
    expect(describe.index).toEqual(['sepal length', 'petal width'])
    expect(describe.columns).toContain('mean')
    const mean = describe.column('mean').values as number[]
    expect(mean[0]).toBe(5.825)
    expect(mean[1]).toBe(1.075)
  })

  test('sin columnas numéricas, null', () => {
    expect(DataFrameDescribeTable(new dfd.DataFrame({ a: ['x', 'y'] }))).toBeNull()
  })
})
