import { describe, test, expect } from 'vitest'
import * as dfd from 'danfojs'
import { parseDataFrameQuery } from '../../src/core/dataframe/DataFrameQueryParser'

const df = new dfd.DataFrame({
  'Longitud sepalo': [4, 6, 7, 5],
  'Longitud petalo': [1, 6, 3, 7],
  'Especie'        : ['setosa', 'virginica', 'versicolor', 'virginica'],
})
const rows = (query: dfd.Series) => df.query(query).values

describe('parseDataFrameQuery', () => {

  test('aplica la condición sobre la columna seleccionada', () => {
    expect(rows(parseDataFrameQuery(df, 'Longitud sepalo', '.gt(5)'))).toEqual([
      [6, 6, 'virginica'],
      [7, 3, 'versicolor'],
    ])
  })

  test('admite encadenar con df["columna"] como en el placeholder', () => {
    const query = parseDataFrameQuery(df, 'Longitud sepalo', '.gt(4).and(df["Longitud petalo"].gt(5))')
    expect(rows(query)).toEqual([
      [6, 6, 'virginica'],
      [5, 7, 'virginica'],
    ])
  })

  test('admite strings, comillas simples, decimales y espacios', () => {
    expect(rows(parseDataFrameQuery(df, 'Especie', ' .eq( \'setosa\' ) '))).toEqual([[4, 1, 'setosa']])
    expect(rows(parseDataFrameQuery(df, 'Longitud petalo', '.le(3.5).or(df[\'Especie\'].eq("virginica"))'))).toHaveLength(4)
  })

  test.each([
    ['', /expected a condition/],
    ['.gt(5); alert(1)', /unexpected/],
    ['.constructor("alert(1)")', /method not allowed "constructor"/],
    ['.toString(1)', /method not allowed "toString"/],
    ['.gt(window.x)', /expected a number/],
    ['.gt(df["No existe"])', /unknown column "No existe"/],
    ['.eq("sin cerrar)', /unterminated string/],
  ])('rechaza la consulta %j', (query, message) => {
    expect(() => parseDataFrameQuery(df, 'Longitud sepalo', query)).toThrow(message)
  })
})
