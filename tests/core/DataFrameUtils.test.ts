import { describe, test, expect } from 'vitest'
import * as fs from 'fs'
import * as dfd from 'danfojs'
import {
  DataFrameDescribeNumeric,
  DataFrameEncoder,
  DataFrameFixMixedColumns,
  DataFrameReadCSV,
  LabelEncoderClasses,
} from '../../src/core/dataframe/DataFrameUtils'

const CAR_CSV = 'public/models/00-tabular-classification/car/car.csv'
const csvFile = (path: string) => new File([fs.readFileSync(path, 'utf8')], 'data.csv', { type: 'text/csv' })
const dtypeOf = (df: dfd.DataFrame, column: string) => df.dtypes[df.columns.indexOf(column)]

describe('DataFrameUtils — columnas con tipos mezclados', () => {

  test('danfojs tipa "Doors" de car.csv como int32 aunque contenga "5more" (motivo del arreglo)', async () => {
    const df = await dfd.readCSV(csvFile(CAR_CSV))
    expect(dtypeOf(df, 'Doors')).toBe('int32')
    expect(() => df.describe()).toThrow(/5more/)
  })

  test('DataFrameReadCSV lee "Doors" como texto', async () => {
    const df = await DataFrameReadCSV(csvFile(CAR_CSV))
    expect(dtypeOf(df, 'Doors')).toBe('string')
    expect(df.column('Doors').unique().values).toEqual(expect.arrayContaining(['2', '3', '4', '5more']))
  })

  test('la codificación del LabelEncoder no cambia al pasar la columna a texto', async () => {
    const transforms = [{ column_name: 'Doors', column_transform: 'label-encoder' as const }]
    const before = DataFrameEncoder(await dfd.readCSV(csvFile(CAR_CSV)), transforms as never)
    const after = DataFrameEncoder(await DataFrameReadCSV(csvFile(CAR_CSV)), transforms as never)
    const encode = (map: typeof before) => map.Doors.encoder.transform(['2', '3', '4', '5more'])
    expect(encode(after)).toStrictEqual(encode(before))
  })

  test('DataFrameEncoder etiqueta cada encoder con su tipo', () => {
    const df = new dfd.DataFrame({ A: ['x', 'y', 'x'], B: ['p', 'q', 'q'] })
    const encoders = DataFrameEncoder(df, [
      { column_name: 'A', column_transform: 'label-encoder' },
      { column_name: 'B', column_transform: 'one-hot-encoder' },
    ] as never)
    expect(encoders.A.type).toBe('label-encoder')
    expect(encoders.B.type).toBe('one-hot-encoder')
    expect(encoders.B.encoder).toBeInstanceOf(dfd.OneHotEncoder)
  })

  test('DataFrameFixMixedColumns no toca columnas numéricas ni la entrada', () => {
    const df = new dfd.DataFrame({ A: [1, 2, 3], B: [1.5, 2.5, 3.5] })
    const fixed = DataFrameFixMixedColumns(df)
    expect(fixed.dtypes).toStrictEqual(['int32', 'float32'])
    const mixed = new dfd.DataFrame({ Doors: [...Array(600).fill(2), '5more'] })
    expect(DataFrameFixMixedColumns(mixed).dtypes).toStrictEqual(['string'])
    expect(mixed.dtypes).toStrictEqual(['int32']) // la entrada no se modifica
  })

  test('DataFrameDescribeNumeric devuelve null si no hay columnas numéricas', async () => {
    const categorical = await DataFrameReadCSV(csvFile(CAR_CSV))
    expect(DataFrameDescribeNumeric(categorical)).toBeNull()
    const numeric = new dfd.DataFrame({ A: [1, 2, 3], B: ['x', 'y', 'z'] })
    expect(DataFrameDescribeNumeric(numeric)?.columns).toStrictEqual(['A'])
  })
})

describe('DataFrameUtils — clases del LabelEncoder', () => {

  test('siguen el orden de los índices y de las columnas del OneHotEncoder, también con clases numéricas', () => {
    const target = new dfd.Series([3, 2, 4, 1, 3, 2])
    const classes = LabelEncoderClasses(new dfd.LabelEncoder().fit(target.values))
    // Object.keys(encoder.classes) daría ['1', '2', '3', '4']
    expect(classes).toStrictEqual(['3', '2', '4', '1'])
    const oneHot = new dfd.OneHotEncoder().fit(target).transform(target) as dfd.DataFrame
    const decoded = (oneHot.values as number[][]).map((row) => classes[row.indexOf(1)])
    expect(decoded).toStrictEqual(['3', '2', '4', '1', '3', '2'])
  })
})
