import * as dfd from 'danfojs'
import { DataFrameTransform } from '@core/dataframe/DataFrameUtils'

describe('DataFrame', () => {
  test('DataFrame Dates', () => {
    let data = [
      ['Alice', 2, new Date('2029-01-01 01:00:00')],
      ['Bob', 5, new Date('2019-01-02')],
      ['Charlie', 30, new Date('2020-01-03 01:00:20')],
      ['Dennis', 89, new Date('2022-02-04 02:16:00')]
    ]
    let columns = ['Name', 'Count', 'Date']
    let df = new dfd.DataFrame(data, { columns: columns })
    expect(df['Date'].dt.hours().values).toStrictEqual([1, 0, 1, 2])
    // expect([5,5]).toStrictEqual([6,5]);
  })
})
