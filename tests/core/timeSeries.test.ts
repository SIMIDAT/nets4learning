import { describe, test, expect } from 'vitest'

import {
  baselineErrors,
  canPrepare,
  fitScale,
  forecastErrors,
  inferFrequency,
  naiveMultiStep,
  naiveOneStep,
  nextDates,
  oneStepValues,
  prepareSeries,
  readSeries,
  recursiveForecast,
  seasonalMultiStep,
  seasonalOneStep,
  testStartOf,
  unscaleValue,
} from '@core/timeSeries/series'
import { initialPrep, seriesLayersOf } from '@pages/playground/5_TimeSeries/timeSeriesConfig'

const range = (length: number, f: (i: number) => number = (i) => i) => Array.from({ length }, (_value, i) => f(i))

describe('Series temporales: de la serie a las ventanas', () => {
  test('cada ejemplo son los valores anteriores y el siguiente; la prueba es lo último, sin barajar', () => {
    const values = range(20, (i) => 10 + i)
    const prepared = prepareSeries(values, { window: 3, testSize: 20, difference: false })
    expect(prepared.testStart).toBe(16)
    expect(prepared.train.targets).toEqual(range(13, (i) => 3 + i))
    expect(prepared.test.targets).toEqual([16, 17, 18, 19])
    // Escalado con el entrenamiento (10…25): la prueba (26…29) se sale de 0–1
    expect(prepared.scale).toEqual({ min: 10, max: 25 })
    expect(prepared.train.X[0]).toEqual([0, 1 / 15, 2 / 15])
    expect(prepared.train.y[0]).toBeCloseTo(3 / 15)
    expect(prepared.test.y.at(-1)).toBeCloseTo(19 / 15)
  })

  test('al diferenciar, la red ve y predice cambios; con lo que predice se vuelve a los valores', () => {
    const values = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78, 91, 105, 120]
    const prep = { window: 2, testSize: 20, difference: true }
    const prepared = prepareSeries(values, prep)
    // El primero que se puede predecir es el 3: necesita dos cambios antes (el 1.º valor no tiene anterior)
    expect(prepared.train.targets[0]).toBe(3)
    expect(prepared.scale).toEqual(fitScale(values, prepared.testStart, true))
    // Si la red acertara (lo que predice es su objetivo), se recuperan los valores reales
    const recovered = oneStepValues(values, prepared.test.targets, prepared.test.y, prep, prepared.scale)
    prepared.test.targets.forEach((t, i) => expect(recovered[i]).toBeCloseTo(values[t]))
    expect(unscaleValue(prepared.train.y[0], prepared.scale)).toBeCloseTo(values[3] - values[2])
  })

  test('la predicción recursiva usa lo ya predicho: una red que siempre predice «+1» sigue la recta', async () => {
    const values = range(30)
    const prep = { window: 4, testSize: 20, difference: true }
    const { scale } = prepareSeries(values, prep)
    // Todos los cambios del entrenamiento valen 1: el escalado lo deja en 0 (min = 1, max = 2)
    const seen: number[][] = []
    const forecast = await recursiveForecast(values, 30, 5, prep, scale, (window) => {
      seen.push(window)
      return 0
    })
    expect(forecast).toEqual([30, 31, 32, 33, 34])
    expect(seen).toHaveLength(5)
  })

  test('si no quedan ventanas para entrenar o valores para probar, no se puede preparar', () => {
    expect(canPrepare(144, { window: 24, testSize: 20, difference: false })).toBe(true)
    expect(canPrepare(30, { window: 24, testSize: 20, difference: false })).toBe(false)
    expect(testStartOf(10, 1)).toBe(9)
  })
})

describe('Series temporales: errores y líneas base', () => {
  const values = [10, 12, 14, 11, 13, 15, 12, 14, 16]

  test('MAE y RMSE en las unidades de la serie', () => {
    expect(forecastErrors([1, 2, 3], [2, 2, 1])).toEqual({ mae: 1, rmse: Math.sqrt(5 / 3) })
    expect(forecastErrors([], []).mae).toBeNaN()
  })

  test('la ingenua repite el anterior y la estacional el de hace una estación', () => {
    expect(naiveOneStep(values, [6, 7, 8])).toEqual([15, 12, 14])
    expect(seasonalOneStep(values, [6, 7, 8], 3)).toEqual([11, 13, 15])
    expect(naiveMultiStep(values, 6, 3)).toEqual([15, 15, 15])
    expect(seasonalMultiStep(values, 6, 4, 3)).toEqual([11, 13, 15, 11])
    // Sin una estación entera antes, la ingenua
    expect(seasonalMultiStep(values, 2, 2, 3)).toEqual([12, 12])
  })

  test('con la prueba de la preparación: a un paso y seguidas; sin estación, solo la ingenua', () => {
    const prepared = prepareSeries(range(40, (i) => i % 4), { window: 4, testSize: 20, difference: false })
    const errors = baselineErrors(range(40, (i) => i % 4), prepared, 4)
    expect(errors.oneStep.seasonal?.mae).toBe(0)
    expect(errors.recursive.seasonal?.mae).toBe(0)
    expect(errors.oneStep.naive.mae).toBeGreaterThan(0)
    expect(baselineErrors(range(40), prepared).oneStep.seasonal).toBeUndefined()
  })
})

describe('Series temporales: leer la serie, su frecuencia y las fechas siguientes', () => {
  test('sin las filas sin número, ordenada por fecha y, sin fecha, numerada', () => {
    const rows = [['1949-03', '132'], ['1949-01', '112'], ['1949-02', ''], ['1949-04', 'x'], ['1949-05', 121]]
    expect(readSeries(['Month', 'Passengers'], rows, 'Passengers', 'Month')).toEqual({
      dates: ['1949-01', '1949-03', '1949-05'], values: [112, 132, 121], dropped: 2, sorted: true,
    })
    expect(readSeries(['a', 'b'], [[1, 5], [2, 6]], 'b', null)).toEqual({ dates: ['1', '2'], values: [5, 6], dropped: 0, sorted: false })
  })

  test('la frecuencia sale de lo que hay entre dos fechas', () => {
    expect(inferFrequency(['1949-01', '1949-02', '1949-03', '1949-04'])).toBe('month')
    expect(inferFrequency(['1981-01-01', '1981-01-02', '1981-01-03'])).toBe('day')
    expect(inferFrequency(['2024-01-01 10:00', '2024-01-01 11:00', '2024-01-01 12:00'])).toBe('hour')
    expect(inferFrequency(['1749', '1750', '1751'])).toBe('year')
    // Números de fila, no fechas
    expect(inferFrequency(['1', '2', '3'])).toBeUndefined()
    expect(inferFrequency(['a', 'b', 'c'])).toBeUndefined()
  })

  test('las fechas que siguen, con el mismo formato; si no se sabe, +1, +2…', () => {
    expect(nextDates('1960-11', 'month', 3)).toEqual(['1960-12', '1961-01', '1961-02'])
    expect(nextDates('1990-12-30', 'day', 3)).toEqual(['1990-12-31', '1991-01-01', '1991-01-02'])
    expect(nextDates('2024-02-28', 'week', 1)).toEqual(['2024-03-06'])
    expect(nextDates('2023-12', 'quarter', 2)).toEqual(['2024-03', '2024-06'])
    expect(nextDates('2024-01-01T23:00', 'hour', 2)).toEqual(['2024-01-02T00:00', '2024-01-02T01:00'])
    expect(nextDates('1983', 'year', 2)).toEqual(['1984', '1985'])
    expect(nextDates('144', undefined, 2)).toEqual(['+1', '+2'])
  })
})

describe('Series temporales: con qué se empieza', () => {
  test('la preparación del paquete o, al subir una serie, una ventana de una estación según su frecuencia', () => {
    expect(initialPrep(144, 'month', { window: 24, season: 12 })).toEqual({ prep: { window: 24, testSize: 20, difference: false }, season: 12 })
    expect(initialPrep(500, 'day')).toEqual({ prep: { window: 7, testSize: 20, difference: false }, season: 7 })
    expect(initialPrep(500, undefined)).toEqual({ prep: { window: 12, testSize: 20, difference: false }, season: undefined })
    // Con pocos datos, una ventana más corta
    expect(initialPrep(25, 'month').prep.window).toBe(6)
  })

  test('las capas del manifiesto: la salida, protegida; las recurrentes, con tanh si no dicen otra', () => {
    expect(seriesLayersOf([
      { class: 'lstm', units: 16 },
      { class: 'dense', units: 8, activation: 'relu' },
      { class: 'dense', units: 1, activation: 'linear', locked: true },
    ])).toEqual([
      { _class: 'lstm', units: 16, activation: 'tanh' },
      { _class: 'dense', units: 8, activation: 'relu' },
      { _class: 'dense', units: 1, activation: 'linear', is_disabled: true },
    ])
  })
})
