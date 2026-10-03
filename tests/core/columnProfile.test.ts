import { describe, test, expect } from 'vitest'
import * as dfd from 'danfojs'
import { profileColumns } from '@core/dataframe/columnProfile'

describe('profileColumns: cómo es cada columna para el formulario de procesamiento', () => {
  test('tipo, valores distintos, ejemplos y, en las numéricas, rango y media', () => {
    const dataframe = new dfd.DataFrame({
      buying: ['low', 'med', 'low', 'high', 'vhigh', 'med'],
      doors : [2, 4, 4, 3, 2, 5],
      price : [1.5, 2.5, 3, 4, 5.5, 1.5],
    })
    const [buying, doors, price] = profileColumns(dataframe)
    expect(buying).toEqual({ name: 'buying', type: 'string', numeric: false, distinct: 4, sample: ['low', 'med', 'high', 'vhigh'] })
    expect(doors).toMatchObject({ type: 'int32', numeric: true, distinct: 4, min: 2, max: 5, mean: 20 / 6 })
    expect(price).toMatchObject({ type: 'float32', numeric: true, distinct: 5, min: 1.5, max: 5.5 })
    // Como mucho 4 ejemplos, en el orden en que aparecen
    expect(price.sample).toEqual(['1.5', '2.5', '3', '4'])
  })

  test('los valores vacíos no cuentan', () => {
    const dataframe = new dfd.DataFrame({ a: ['x', null, 'y', ''], b: [1, NaN, 3, 5] })
    const [a, b] = profileColumns(dataframe)
    expect(a.distinct).toBe(2)
    expect(b).toMatchObject({ distinct: 3, min: 1, max: 5, mean: 3 })
  })
})
