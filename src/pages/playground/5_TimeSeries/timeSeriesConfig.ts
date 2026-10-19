import type * as tfjs from '@tensorflow/tfjs'

import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import type { N4LForecast_t, N4LLayer_t } from '@core/n4l/format'
import type { TrainingHistory_t } from '@core/training/buildModels'
import { canPrepare, DEFAULT_SEASONS, firstTarget, MIN_TRAIN_WINDOWS, testStartOf, type Frequency_t, type PreparedSeries_t, type Series_t, type SeriesPrep_t } from '@core/timeSeries/series'
import type { SeriesEvaluation_t } from '@core/timeSeries/seriesModel'
import { SERIES_OUTPUT_LAYER, type SeriesLayer_t } from '@core/timeSeries/seriesLayers'
import { chartColor } from '@core/chartColors'
import type { Theme_t } from '@core/theme'
import type { TFunction } from 'i18next'

export const prefix = 'pages.playground.time-series.'

// Los mismos colores en toda la página: la red al entrenar en azul y con los datos de prueba en naranja (como las
// curvas de entrenamiento y validación) y el futuro en morado
/** El resumen de la serie en una frase (para anunciarlo al cargarla): cuántos valores, desde cuándo y cada cuánto */
export const seriesSummary = (t: TFunction, series: LoadedSeries_t) => [
  t(prefix + 'data.summary', { count: series.values.length, first: series.dates[0], last: series.dates[series.dates.length - 1] }),
  ...(series.frequency !== undefined ? [t(prefix + 'frequency.' + series.frequency)] : []),
  t(prefix + 'data.value-column', { column: series.valueColumn }),
].join(', ')

export const seriesColors = (theme: Theme_t) => ({ train: chartColor('blue', theme), test: chartColor('orange', theme), future: chartColor('purple', theme) })

/** La serie con la que se trabaja: sus valores, de qué columna salen y cada cuánto hay uno */
export type LoadedSeries_t = Series_t & {
  /** El nombre del fichero o la clave del nombre del conjunto */
  name       : string
  valueColumn: string
  frequency? : Frequency_t
  /** Filas sin un número, que no entran en la serie */
  dropped    : number
  /** Si venía desordenada y se ha ordenado por fecha */
  sorted     : boolean
}

/** Cómo se entrena (además de las capas y la preparación de la serie) */
export type SeriesHyper_t = {
  learningRate: number
  epochs      : number
  batchSize   : number
  optimizer   : IdOptimizer_t
  loss        : IdLoss_t
}

/** Se mide el error absoluto medio en cada época (con los valores escalados) */
export const SERIES_METRICS: IdMetric_t[] = ['metrics-meanAbsoluteError']

export const DEFAULT_HYPER: SeriesHyper_t = { learningRate: 0.01, epochs: 50, batchSize: 32, optimizer: 'train-adam', loss: 'losses-meanSquaredError' }
export const DEFAULT_LAYERS: SeriesLayer_t[] = [{ _class: 'dense', units: 32, activation: 'relu' }, SERIES_OUTPUT_LAYER]
export const DEFAULT_TEST_SIZE = 20

/** Un modelo entrenado en la página: con qué se entrenó, su historial y, cuando se calcula, cómo predice */
export type TrainedSeriesModel_t = {
  model     : tfjs.LayersModel
  history   : TrainingHistory_t
  layers    : SeriesLayer_t[]
  prep      : SeriesPrep_t
  hyper     : SeriesHyper_t
  prepared  : PreparedSeries_t
  evaluation: SeriesEvaluation_t | null
}

/** Lo que necesita «Predecir» de un modelo: él, su preparación y cómo predice (también los ya entrenados de los paquetes) */
export type ForecastModel_t = Pick<TrainedSeriesModel_t, 'model' | 'prepared' | 'evaluation'>

/** Lo que se guarda en el navegador de cada modelo (además del modelo) */
export type StoredSeriesModel_t = Pick<TrainedSeriesModel_t, 'history' | 'layers' | 'prep' | 'hyper'>

/** Las capas del manifiesto como las edita la página; la salida, protegida */
export function seriesLayersOf(layers: N4LLayer_t[]): SeriesLayer_t[] {
  return layers.flatMap((layer): SeriesLayer_t[] => {
    const locked = layer.locked === true ? { is_disabled: true } : {}
    switch (layer.class) {
      case 'dense':
        return [{ _class: 'dense', units: layer.units, activation: layer.activation, ...locked }]
      case 'simpleRNN':
      case 'lstm':
      case 'gru':
        return [{ _class: layer.class, units: layer.units, activation: layer.activation ?? 'tanh', ...locked }]
      default:
        return []
    }
  })
}

/**
 * La preparación con la que se empieza: la del paquete o, al subir una serie, una ventana de una estación (según su
 * frecuencia; sin ella, 12 valores). Si no hay datos suficientes para esa ventana, una más corta
 */
export function initialPrep(length: number, frequency: Frequency_t | undefined, forecast?: N4LForecast_t): { prep: SeriesPrep_t, season?: number } {
  const season = forecast !== undefined ? forecast.season : frequency !== undefined ? DEFAULT_SEASONS[frequency] : undefined
  const prep: SeriesPrep_t = {
    window    : forecast?.window ?? Math.min(Math.max(season ?? 12, 4), 60),
    testSize  : forecast?.testSize ?? DEFAULT_TEST_SIZE,
    difference: forecast?.difference ?? false,
  }
  while (prep.window > 1 && !canPrepare(length, prep)) prep.window = Math.max(1, Math.floor(prep.window / 2))
  return { prep, season }
}

/** La ventana más grande que deja ejemplos para entrenar */
export const maxWindow = (length: number, prep: SeriesPrep_t) =>
  Math.max(1, testStartOf(length, prep.testSize) - firstTarget({ ...prep, window: 0 }) - MIN_TRAIN_WINDOWS)
