import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import type { Plugin } from 'chart.js'
import { useTranslation } from 'react-i18next'

import { useTheme } from '@hooks/useTheme'
import N4LChartData from '@components/chart/N4LChartData'

import { prefix, seriesColors } from './timeSeriesConfig'

/** Unos valores predichos y la posición en la serie de cada uno */
export type SeriesLine_t = { label: string, targets: number[], values: number[] }

type TimeSeriesChartProps = {
  /** La fecha de cada valor y, después, las del futuro */
  labels      : string[]
  values      : number[]
  valueLabel  : string
  /** Dónde empieza la prueba: una línea vertical con su nombre */
  split?      : { index: number, label: string }
  train?      : SeriesLine_t
  test?       : SeriesLine_t
  /** Lo que sigue al último valor */
  future?     : { label: string, values: number[] }
  /** Desde qué posición se enseña (para ver de cerca la prueba y el futuro) */
  from?       : number
  /** Lo que se ve, para quien no ve la gráfica */
  description : string
  /** El nombre de su tabla de datos (distinto en cada gráfica de la página); por defecto, «<valor>: real y predicho» */
  dataCaption?: string
  testId?     : string
}

/** Una línea vertical discontinua en una posición del eje X, con un texto arriba */
const splitPlugin = (index: number, label: string, color: string): Plugin<'line'> => ({
  id: 'n4l-series-split',
  afterDatasetsDraw(chart) {
    const x = chart.scales.x.getPixelForValue(index)
    const { top, bottom, left, right } = chart.chartArea
    if (x < left || x > right) return
    const { ctx } = chart
    ctx.save()
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x, bottom)
    ctx.stroke()
    ctx.fillText(label, x + 4, top + 12)
    ctx.restore()
  },
})

/** La serie real y, si las hay, las predicciones de la red con los datos de entrenamiento, los de prueba y el futuro */
export default function TimeSeriesChart({ labels, values, valueLabel, split, train, test, future, from = 0, description, dataCaption, testId }: TimeSeriesChartProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const textColor = theme === 'dark' ? '#dee2e6' : '#495057'

  const data = useMemo(() => {
    const total = labels.length
    const line = ({ targets, values: predicted }: SeriesLine_t) => {
      const points = new Array<number | null>(total).fill(null)
      targets.forEach((target, i) => { points[target] = predicted[i] })
      return points
    }
    // El futuro empieza en el último valor real, para que la línea siga sin saltos
    const futurePoints = new Array<number | null>(total).fill(null)
    if (future !== undefined && future.values.length > 0) {
      futurePoints[values.length - 1] = values[values.length - 1]
      future.values.forEach((value, i) => { futurePoints[values.length + i] = value })
    }
    const common = { pointRadius: 0, pointHoverRadius: 3, borderWidth: 1.5, spanGaps: false }
    const colors = seriesColors(theme)
    const trainPoints = train !== undefined ? line(train) : null
    const testPoints = test !== undefined ? line(test) : null
    const hasFuture = future !== undefined && future.values.length > 0
    // Cada línea, también con su trazo (WCAG 1.4.1): la serie y el entrenamiento continuas, la prueba de puntos y el
    // futuro de rayas; en la leyenda se ve igual
    const chart = {
      labels  : labels.slice(from),
      datasets: [
        { ...common, label: valueLabel, data: values.slice(from), borderColor: textColor, backgroundColor: textColor },
        ...(train !== undefined && trainPoints !== null ? [{ ...common, label: train.label, data: trainPoints.slice(from), borderColor: colors.train, backgroundColor: colors.train }] : []),
        ...(test !== undefined && testPoints !== null ? [{ ...common, label: test.label, data: testPoints.slice(from), borderColor: colors.test, backgroundColor: colors.test, borderDash: [2, 3], borderWidth: 2.5 }] : []),
        ...(future !== undefined && hasFuture
          ? [{ ...common, label: future.label, data: futurePoints.slice(from), borderColor: colors.future, backgroundColor: colors.future, borderDash: [8, 4], borderWidth: 2 }]
          : []),
      ],
    }
    // Lo mismo en una tabla: cada fecha con el valor real y lo predicho (el futuro, solo después del último valor)
    const table = {
      columns: [
        t(prefix + 'windows.date'), valueLabel,
        ...(train !== undefined ? [train.label] : []), ...(test !== undefined ? [test.label] : []), ...(future !== undefined && hasFuture ? [future.label] : []),
      ],
      rows: labels.slice(from).map((date, offset) => {
        const i = from + offset
        return [
          date, values[i],
          ...(trainPoints !== null ? [trainPoints[i]] : []), ...(testPoints !== null ? [testPoints[i]] : []),
          ...(hasFuture ? [i >= values.length ? futurePoints[i] : null] : []),
        ]
      }),
    }
    return { chart, table }
  }, [labels, values, valueLabel, train, test, future, from, textColor, theme, t])

  const plugins = useMemo(() => (split === undefined ? [] : [splitPlugin(split.index - from, split.label, textColor)]), [split, from, textColor])

  return (
    <div data-testid={testId}>
      <div style={{ position: 'relative', height: '22rem' }}>
        <Line role={'img'} aria-label={description} data={data.chart} plugins={plugins} options={{
          animation          : false,
          responsive         : true,
          maintainAspectRatio: false,
          normalized         : true,
          interaction        : { mode: 'index', intersect: false },
          plugins            : { legend: { labels: { color: textColor } } },
          scales             : {
            x: { ticks: { color: textColor, autoSkip: true, maxTicksLimit: 12, maxRotation: 0 } },
            y: { ticks: { color: textColor }, title: { display: true, text: valueLabel, color: textColor } },
          },
        }} />
      </div>
      <N4LChartData caption={dataCaption ?? t(prefix + 'chart-data', { value: valueLabel })} columns={data.table.columns} rows={data.table.rows} />
    </div>
  )
}
