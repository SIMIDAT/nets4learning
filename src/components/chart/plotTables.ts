import type { Data } from 'plotly.js'

import type { ChartDataCell_t } from '@components/chart/N4LChartData'
import type { PlotTable_t } from '@components/dataframe/N4LPlot'

type BarTrace_t = { type?: string, name?: string, x?: ArrayLike<ChartDataCell_t>, y?: ArrayLike<ChartDataCell_t> }
type BoxTrace_t = { type?: string, name?: string, q1?: number[], median?: number[], q3?: number[], mean?: number[], lowerfence?: number[], upperfence?: number[] }

/**
 * La tabla de unas barras de Plotly (un histograma, unas frecuencias): una fila por cada valor del eje X y una
 * columna por serie (cada clase, o el total si no hay clases)
 */
export function barTracesTable(traces: Data[], xLabel: string, valueLabel: string): PlotTable_t {
  const bars = (traces as BarTrace_t[]).filter(({ type }) => type === undefined || type === 'bar')
  const xs = Array.from(bars[0]?.x ?? [])
  return {
    columns: [xLabel, ...bars.map(({ name }, index) => (bars.length === 1 || name === undefined ? valueLabel : name ?? String(index + 1)))],
    rows   : xs.map((x, row) => [x, ...bars.map(({ y }) => (y === undefined ? null : y[row]))]),
  }
}

/** La tabla de unos diagramas de caja de Plotly: cada grupo con sus cuartiles, su media y sus límites */
export function boxTracesTable(traces: Data[], columns: { group: string, lower: string, q1: string, median: string, q3: string, upper: string, mean: string }): PlotTable_t {
  const boxes = (traces as BoxTrace_t[]).filter(({ type }) => type === 'box')
  return {
    columns: [columns.group, columns.lower, columns.q1, columns.median, columns.q3, columns.upper, columns.mean],
    rows   : boxes.map(({ name, q1, median, q3, mean, lowerfence, upperfence }) =>
      [name ?? '', lowerfence?.[0], q1?.[0], median?.[0], q3?.[0], upperfence?.[0], mean?.[0]]),
  }
}
