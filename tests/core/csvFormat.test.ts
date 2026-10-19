import { describe, test, expect } from 'vitest'

import { detectCSVFormat, isDecimalCommaColumn, parseDecimalComma } from '@core/dataframe/csvFormat'
import fs from 'node:fs'
import { columnDtypes, convertDecimalComma, dropEmptyColumns, readDatasetRows, textMixedColumns } from '@core/dataframe/datasetReader'

// Las primeras filas de AirQualityUCI.csv (UCI) en sus dos formas: la original (";" y coma decimal) y la "alineada"
// por un editor (comas con espacios como separador y la coma decimal pegada a los números)
const SEMICOLON = [
  'Date;Time;CO(GT);PT08.S1(CO);C6H6(GT);T;RH;AH;;',
  '10/03/2004;18.00.00;2,6;1360;11,9;13,6;48,9;0,7578;;',
  '10/03/2004;19.00.00;2;1292;9,4;13,3;47,7;0,7255;;',
  ';;;;;;;;;',
].join('\r\n')

const ALIGNED = [
  'Date      , Time    , CO(GT), PT08.S1(CO), T   , AH    , , ',
  '10/03/2004, 18.00.00, 2,6   , 1360       , 13,6, 0,7578, , ',
  '10/03/2004, 19.00.00, 2     , 1292       , 13,3, 0,7255, , ',
].join('\r\n')

describe('formato de un CSV subido', () => {

  test('con comas, como siempre', () => {
    const text = 'sepal_length,sepal_width,class\n5.1,3.5,Iris-setosa\n4.9,3,Iris-setosa\n'
    expect(detectCSVFormat(text)).toEqual({ delimiter: ',', decimalComma: false, text })
  })

  test('las comas entre comillas no cuentan', () => {
    const text = 'name,price\n"Laptop, 15 inch",999\n"Mouse",19\n'
    expect(detectCSVFormat(text).delimiter).toBe(',')
  })

  test('con ";" (Excel en español): coma decimal', () => {
    expect(detectCSVFormat(SEMICOLON)).toEqual({ delimiter: ';', decimalComma: true, text: SEMICOLON })
  })

  test('con tabuladores', () => {
    expect(detectCSVFormat('a\tb\tc\n1\t2\t3\n4\t5\t6').delimiter).toBe('\t')
  })

  test('alineado: las comas con espacios son el separador y las pegadas a cifras, decimales', () => {
    const format = detectCSVFormat(ALIGNED)
    expect(format.decimalComma).toBe(true)
    const rows = format.text.split('\r\n').map((line) => line.split(format.delimiter).map((field) => field.trim()))
    expect(rows[0]).toEqual(['Date', 'Time', 'CO(GT)', 'PT08.S1(CO)', 'T', 'AH', '', ''])
    expect(rows[1]).toEqual(['10/03/2004', '18.00.00', '2,6', '1360', '13,6', '0,7578', '', ''])
  })

  test('si ningún separador cuadra, la coma (papaparse dirá qué fila falla)', () => {
    expect(detectCSVFormat('a,b\n1,2,3\n4\n5,6,7,8').delimiter).toBe(',')
    expect(detectCSVFormat('').delimiter).toBe(',')
  })

  test('números con coma decimal', () => {
    expect(parseDecimalComma('2,6')).toBe(2.6)
    expect(parseDecimalComma(' -0,7578 ')).toBe(-0.7578)
    expect(parseDecimalComma(1360)).toBe(1360)
    expect(parseDecimalComma('')).toBeNull()
    expect(isDecimalCommaColumn(['2,6', 2, null, '11,9'])).toBe(true)
    // Sin ninguna coma decimal no hace falta tocarla; con texto no es numérica
    expect(isDecimalCommaColumn([2, 3])).toBe(false)
    expect(isDecimalCommaColumn(['2,6', '18.00.00'])).toBe(false)
    expect(isDecimalCommaColumn(['10/03/2004'])).toBe(false)
  })
})

describe('columnas de un CSV subido', () => {

  test('las de coma decimal pasan a ser numéricas, sin cambiar el orden de las columnas', () => {
    const table = convertDecimalComma({
      columns: ['Date', 'CO(GT)', '2004', 'AH'],
      rows   : [['10/03/2004', '2,6', 1360, '0,7578'], ['10/03/2004', 2, 1292, '0,7255']],
    })
    expect(table.columns).toEqual(['Date', 'CO(GT)', '2004', 'AH'])
    expect(table.rows).toEqual([['10/03/2004', 2.6, 1360, 0.7578], ['10/03/2004', 2, 1292, 0.7255]])
  })

  test('se quitan las columnas vacías sin nombre (los ";;" del final de cada fila), no las que tienen nombre', () => {
    const table = dropEmptyColumns({ columns: ['T', '', '_1', 'notas'], rows: [[1, null, null, null], [2, null, '', null]] })
    expect(table).toEqual({ columns: ['T', 'notas'], rows: [[1, null], [2, null]] })
  })

  test('una columna con números y textos pasa a ser de texto (los ausentes se quedan)', () => {
    const table = textMixedColumns({ columns: ['Doors', 'n'], rows: [[2, 1], [3, 2], [null, 3], ['5more', 4]] })
    expect(table.rows).toEqual([['2', 1], ['3', 2], [null, 3], ['5more', 4]])
  })
})

describe('leer un fichero subido (lo que hace el worker)', () => {

  test.each([
    ['";" y coma decimal', SEMICOLON],
    ['alineado con comas', ALIGNED],
  ])('%s: columnas, números y sin las columnas vacías del final', async (_name, text) => {
    const { columns, rows } = await readDatasetRows(new File([text], 'aire.csv'))
    expect(columns.slice(0, 4)).toEqual(['Date', 'Time', 'CO(GT)', 'PT08.S1(CO)'])
    expect(columns).not.toContain('')
    expect(rows).toHaveLength(2)
    expect(rows[0].slice(0, 4)).toEqual(['10/03/2004', '18.00.00', 2.6, 1360])
    expect(rows[1].at(-1)).toBe(0.7255)
  })

  test('el tipo de cada columna sigue las reglas de danfo, mirando todas las filas', async () => {
    const dtypesOf = async (file: string) => (await readDatasetRows(new File([fs.readFileSync(file, 'utf8')], 'datos.csv'))).dtypes
    expect(await dtypesOf('public/n4l/iris.n4l/data/iris.csv')).toEqual(['float32', 'float32', 'float32', 'float32', 'string'])
    // "displacement" tiene un solo decimal (97.5, en la fila 58) y "mpg" el primero en la fila 186: decimales
    expect(await dtypesOf('public/n4l/auto-mpg.n4l/data/auto-mpg.csv'))
      .toEqual(['int32', 'float32', 'int32', 'int32', 'float32', 'int32', 'float32'])
    // Con texto más allá de las 500 primeras filas danfo diría int32; aquí es texto (lo que arreglaba FixMixedColumns)
    const rows = Array.from({ length: 600 }, (_, i) => (i === 599 ? '5more' : String(2 + (i % 3))))
    const late = await readDatasetRows(new File(['doors\n' + rows.join('\n')], 'puertas.csv'))
    expect(late.dtypes).toEqual(['string'])
    expect(columnDtypes({ columns: ['a', 'b', 'c'], rows: [[1, 1.5, true], [null, 2, false]] })).toEqual(['float32', 'float32', 'boolean'])
  })

  test('los errores de papaparse llegan como los daba danfo', async () => {
    await expect(readDatasetRows(new File(['a,b\n1,2,3\n'], 'mal.csv'))).rejects.toThrow('CSV parsing errors: Too many fields')
    await expect(readDatasetRows(new File(['a,b\n'], 'vacio.csv'))).rejects.toThrow('No data found')
  })
})
