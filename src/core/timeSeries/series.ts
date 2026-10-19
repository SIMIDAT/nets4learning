// Series temporales: de las filas de un fichero a lo que aprende la red (ventanas con los valores anteriores y el
// siguiente, que es lo que predice) y de lo que predice a valores de la serie, con sus errores y los de las predicciones
// más sencillas (las líneas base). Sin TF.js ni alias de importación: lo usan la página, sus pruebas y los scripts de
// Node que entrenan los modelos de los paquetes.

import type { N4LFrequency_t } from '../n4l/format'

export type Frequency_t = N4LFrequency_t

/** Una serie temporal: la fecha de cada valor (como viene en el fichero) y su valor, en orden */
export type Series_t = { dates: string[], values: number[] }

/** Cómo se prepara la serie para la red */
export type SeriesPrep_t = {
  /** Valores anteriores con los que se predice el siguiente */
  window    : number
  /** Porcentaje final de la serie que se aparta para probar: lo último, sin barajar */
  testSize  : number
  /** Predecir el cambio respecto al valor anterior en lugar del valor (quita la tendencia) */
  difference: boolean
}

/** Escalado min-max, calculado solo con los valores de entrenamiento (los de prueba no se miran) */
export type SeriesScale_t = { min: number, max: number }

/** Ejemplos para la red: cada ventana de valores anteriores y el que se predice, ya transformados */
export type SeriesWindows_t = {
  X      : number[][]
  y      : number[]
  /** La posición en la serie del valor que predice cada ejemplo */
  targets: number[]
}

export type PreparedSeries_t = {
  prep     : SeriesPrep_t
  scale    : SeriesScale_t
  /** La primera posición de la parte de prueba */
  testStart: number
  train    : SeriesWindows_t
  test     : SeriesWindows_t
}

/** Lo mínimo que tiene que quedar para entrenar y para probar */
export const MIN_TRAIN_WINDOWS = 10
export const MIN_TEST_VALUES = 2

/** Dónde empieza la parte de prueba: el porcentaje final de la serie (al menos un valor) */
export const testStartOf = (length: number, testSize: number) => length - Math.max(1, Math.round(length * testSize / 100))

/** Con la diferencia, el primer valor no tiene anterior: la serie transformada empieza en la posición 1 */
const offsetOf = ({ difference }: Pick<SeriesPrep_t, 'difference'>) => (difference ? 1 : 0)

/** La primera posición que se puede predecir: la primera con una ventana entera antes */
export const firstTarget = (prep: Pick<SeriesPrep_t, 'window' | 'difference'>) => prep.window + offsetOf(prep)

/** El valor transformado (sin escalar) de la posición i: el valor o, al diferenciar, lo que ha cambiado desde el anterior */
const transformedAt = (values: ArrayLike<number>, i: number, difference: boolean) => (difference ? values[i] - values[i - 1] : values[i])

/** El min-max de los valores transformados de la parte de entrenamiento (si todos son iguales, un rango de 1) */
export function fitScale(values: ArrayLike<number>, testStart: number, difference: boolean): SeriesScale_t {
  let min = Infinity
  let max = -Infinity
  for (let i = difference ? 1 : 0; i < testStart; i++) {
    const value = transformedAt(values, i, difference)
    if (value < min) min = value
    if (value > max) max = value
  }
  if (!Number.isFinite(min)) return { min: 0, max: 1 }
  return { min, max: max > min ? max : min + 1 }
}

export const scaleValue = (value: number, { min, max }: SeriesScale_t) => (value - min) / (max - min)
export const unscaleValue = (value: number, { min, max }: SeriesScale_t) => value * (max - min) + min

/** La entrada de la red para predecir la posición t: los `window` valores anteriores, transformados y escalados */
export function windowAt(values: ArrayLike<number>, t: number, prep: Pick<SeriesPrep_t, 'window' | 'difference'>, scale: SeriesScale_t): number[] {
  const window = new Array<number>(prep.window)
  for (let k = 0; k < prep.window; k++) window[k] = scaleValue(transformedAt(values, t - prep.window + k, prep.difference), scale)
  return window
}

/** Lo que aprende la red: las ventanas de entrenamiento (que predicen valores anteriores a la prueba) y las de prueba */
export function prepareSeries(values: number[], prep: SeriesPrep_t): PreparedSeries_t {
  const testStart = testStartOf(values.length, prep.testSize)
  const scale = fitScale(values, testStart, prep.difference)
  const windows = (from: number, to: number): SeriesWindows_t => {
    const X: number[][] = []
    const y: number[] = []
    const targets: number[] = []
    for (let t = from; t < to; t++) {
      X.push(windowAt(values, t, prep, scale))
      y.push(scaleValue(transformedAt(values, t, prep.difference), scale))
      targets.push(t)
    }
    return { X, y, targets }
  }
  const first = firstTarget(prep)
  return { prep, scale, testStart, train: windows(first, testStart), test: windows(Math.max(first, testStart), values.length) }
}

/** Si con esa preparación hay datos suficientes: ventanas para entrenar y valores para probar */
export function canPrepare(length: number, prep: SeriesPrep_t): boolean {
  const testStart = testStartOf(length, prep.testSize)
  return testStart - firstTarget(prep) >= MIN_TRAIN_WINDOWS && length - testStart >= MIN_TEST_VALUES
}

/** De lo que predice la red (escalado) al valor de la serie; al diferenciar, se suma el cambio al valor anterior */
export const toValue = (predicted: number, previous: number, prep: Pick<SeriesPrep_t, 'difference'>, scale: SeriesScale_t) => {
  const value = unscaleValue(predicted, scale)
  return prep.difference ? previous + value : value
}

/** Predicciones a un paso: cada valor, con los valores reales de antes */
export function oneStepValues(values: ArrayLike<number>, targets: number[], predicted: ArrayLike<number>, prep: Pick<SeriesPrep_t, 'difference'>, scale: SeriesScale_t): number[] {
  return targets.map((t, i) => toValue(predicted[i], values[t - 1], prep, scale))
}

/**
 * Predicción recursiva: desde `start`, `steps` valores seguidos, cada uno con los anteriores (los reales hasta `start` y
 * después los ya predichos). Así se predice el futuro, y los errores se van acumulando. `predict` recibe la ventana
 * (transformada y escalada) y devuelve lo que predice la red, escalado
 */
export async function recursiveForecast(
  values: ArrayLike<number>, start: number, steps: number, prep: Pick<SeriesPrep_t, 'window' | 'difference'>, scale: SeriesScale_t,
  predict: (window: number[]) => number | Promise<number>,
): Promise<number[]> {
  const history = Array.from(values).slice(0, start)
  const forecast: number[] = []
  for (let step = 0; step < steps; step++) {
    const t = history.length
    const value = toValue(await predict(windowAt(history, t, prep, scale)), history[t - 1], prep, scale)
    history.push(value)
    forecast.push(value)
  }
  return forecast
}

// region Errores y líneas base

/** Error absoluto medio (MAE) y raíz del error cuadrático medio (RMSE), en las unidades de la serie */
export type ForecastErrors_t = { mae: number, rmse: number }

export function forecastErrors(actual: ArrayLike<number>, predicted: ArrayLike<number>): ForecastErrors_t {
  const count = Math.min(actual.length, predicted.length)
  if (count === 0) return { mae: NaN, rmse: NaN }
  let absolute = 0
  let squared = 0
  for (let i = 0; i < count; i++) {
    const error = actual[i] - predicted[i]
    absolute += Math.abs(error)
    squared += error * error
  }
  return { mae: absolute / count, rmse: Math.sqrt(squared / count) }
}

/** Ingenua a un paso: cada valor, el anterior */
export const naiveOneStep = (values: ArrayLike<number>, targets: number[]) => targets.map((t) => values[t - 1])

/** Estacional a un paso: cada valor, el de hace una estación (sin tanta historia, el anterior) */
export const seasonalOneStep = (values: ArrayLike<number>, targets: number[], season: number) =>
  targets.map((t) => (t - season >= 0 ? values[t - season] : values[t - 1]))

/** Ingenua desde `start`: el último valor conocido, repetido */
export const naiveMultiStep = (values: ArrayLike<number>, start: number, steps: number) => new Array<number>(steps).fill(values[start - 1])

/** Estacional desde `start`: la última estación conocida, repetida (sin una estación entera antes, la ingenua) */
export const seasonalMultiStep = (values: ArrayLike<number>, start: number, steps: number, season: number) =>
  (start < season ? naiveMultiStep(values, start, steps) : Array.from({ length: steps }, (_value, step) => values[start - season + (step % season)]))

/** Los errores de las líneas base en la parte de prueba: a un paso y desde el final del entrenamiento */
export type BaselineErrors_t = {
  oneStep  : { naive: ForecastErrors_t, seasonal?: ForecastErrors_t }
  recursive: { naive: ForecastErrors_t, seasonal?: ForecastErrors_t }
}

/** Cuánto se equivocan con la prueba la predicción ingenua y, si hay estación, la estacional */
export function baselineErrors(values: ArrayLike<number>, { test }: Pick<PreparedSeries_t, 'test'>, season?: number): BaselineErrors_t {
  const actual = test.targets.map((t) => values[t])
  const start = test.targets[0]
  const steps = test.targets.length
  const hasSeason = season !== undefined && season > 1
  return {
    oneStep: {
      naive: forecastErrors(actual, naiveOneStep(values, test.targets)),
      ...(hasSeason && { seasonal: forecastErrors(actual, seasonalOneStep(values, test.targets, season)) }),
    },
    recursive: {
      naive: forecastErrors(actual, naiveMultiStep(values, start, steps)),
      ...(hasSeason && { seasonal: forecastErrors(actual, seasonalMultiStep(values, start, steps, season)) }),
    },
  }
}

// endregion

// region Leer la serie, su frecuencia y las fechas siguientes

/** El instante de una fecha; NaN si no lo es. Tiene que llevar el año con cuatro cifras: Date.parse('1') da enero de 2001 */
export const parseDate = (text: string) => (/\d{4}/.test(text) ? Date.parse(text) : NaN)

/**
 * La serie de un fichero: los valores de una columna y, si se elige, la fecha de otra (sin ella, 1, 2, 3…). Se quitan
 * las filas sin un número y, si todas las fechas se entienden, se ordena por fecha
 */
export function readSeries(columns: string[], rows: unknown[][], valueColumn: string, dateColumn: string | null): Series_t & { dropped: number, sorted: boolean } {
  const valueIndex = columns.indexOf(valueColumn)
  const dateIndex = dateColumn === null ? -1 : columns.indexOf(dateColumn)
  let points = rows.map((row, index) => ({
    date : dateIndex === -1 ? String(index + 1) : String(row[dateIndex] ?? '').trim(),
    value: row[valueIndex] === '' || row[valueIndex] === null || row[valueIndex] === undefined ? NaN : Number(row[valueIndex]),
  }))
  const dropped = points.filter(({ value }) => !Number.isFinite(value)).length
  points = points.filter(({ value }) => Number.isFinite(value))
  let sorted = false
  if (dateIndex !== -1) {
    const times = points.map(({ date }) => parseDate(date))
    const ordered = times.every((time, i) => i === 0 || time >= times[i - 1])
    if (!ordered && times.every(Number.isFinite)) {
      points = points.map((point, i) => ({ point, time: times[i] })).sort((a, b) => a.time - b.time).map(({ point }) => point)
      sorted = true
    }
  }
  return { dates: points.map(({ date }) => date), values: points.map(({ value }) => value), dropped, sorted }
}

const HOUR = 3_600_000
const DAY = 24 * HOUR

/** Cada cuánto hay un valor, por lo que hay normalmente entre dos fechas seguidas; sin fechas que se entiendan, undefined */
export function inferFrequency(dates: string[]): Frequency_t | undefined {
  const times = dates.map(parseDate)
  if (times.length < 3 || !times.every(Number.isFinite)) return undefined
  const gaps = times.slice(1).map((time, i) => time - times[i]).sort((a, b) => a - b)
  const median = gaps[Math.floor(gaps.length / 2)]
  const days = median / DAY
  if (median >= 0.5 * HOUR && median <= 1.5 * HOUR) return 'hour'
  if (days >= 0.75 && days <= 1.5) return 'day'
  if (days >= 6 && days <= 8) return 'week'
  if (days >= 27 && days <= 32) return 'month'
  if (days >= 88 && days <= 93) return 'quarter'
  if (days >= 360 && days <= 370) return 'year'
  return undefined
}

/** La estación más habitual de cada frecuencia: un día de horas, una semana de días, un año de meses… */
export const DEFAULT_SEASONS: Record<Frequency_t, number | undefined> = { hour: 24, day: 7, week: 52, month: 12, quarter: 4, year: undefined }

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

/**
 * Las fechas de los `count` valores que siguen a `last`, con su mismo formato (1960-12 → 1961-01, 1990-12-31 →
 * 1991-01-01…). Si la fecha o la frecuencia no se conocen, +1, +2…
 */
export function nextDates(last: string, frequency: Frequency_t | undefined, count: number): string[] {
  const relative = () => Array.from({ length: count }, (_value, i) => `+${i + 1}`)
  if (frequency === undefined) return relative()
  const months = frequency === 'month' ? 1 : frequency === 'quarter' ? 3 : frequency === 'year' ? 12 : 0
  let match = /^(\d{4})$/.exec(last)
  if (match !== null && frequency === 'year') return Array.from({ length: count }, (_value, i) => String(Number(match![1]) + i + 1))
  match = /^(\d{4})-(\d{2})$/.exec(last)
  if (match !== null && months > 0) {
    const start = Number(match[1]) * 12 + Number(match[2]) - 1
    return Array.from({ length: count }, (_value, i) => {
      const month = start + (i + 1) * months
      return `${Math.floor(month / 12)}-${pad(month % 12 + 1)}`
    })
  }
  match = /^(\d{4})-(\d{2})-(\d{2})(?:([T ])(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(last)
  if (match === null) return relative()
  const [, year, month, day, separator, hours, minutes, seconds] = match
  const time = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hours ?? 0), Number(minutes ?? 0), Number(seconds ?? 0))
  return Array.from({ length: count }, (_value, i) => {
    const date = new Date(time)
    if (months > 0) date.setUTCMonth(date.getUTCMonth() + (i + 1) * months)
    else date.setTime(time + (i + 1) * (frequency === 'hour' ? HOUR : frequency === 'week' ? 7 * DAY : DAY))
    const text = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
    if (separator === undefined) return text
    return `${text}${separator}${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}${seconds !== undefined ? ':' + pad(date.getUTCSeconds()) : ''}`
  })
}

// endregion
