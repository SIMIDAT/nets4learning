import { useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'
import { Badge } from 'react-bootstrap'
import type { ChartData, ChartOptions } from 'chart.js'
import { argMax, isProbabilityDistribution } from '@core/nn-utils/classificationOutput'
import { chartColor, withAlpha } from '@core/chartColors'
import { announce } from '@core/a11y/announce'
import N4LChartData from '@components/chart/N4LChartData'
import { useTheme } from '@hooks/useTheme'
import { prefersReducedMotion } from '@core/a11y/displaySettings'

type N4LClassificationChartProps = {
  /** Salida del modelo para cada clase (probabilidades si la última capa es softmax) */
  values      : number[]
  classLabels : string[]
  /** Clase elegida; por defecto la de mayor valor */
  index?      : number
  /** Clase real, si se conoce (un ejemplo del conjunto de datos): se indica si el modelo acierta */
  actualIndex?: number | null
  /**
   * Solo las clases más probables de muchas (p. ej. MobileNet, con 1000): son probabilidades aunque no sumen 1 y el
   * título lo dice
   */
  topK?       : boolean
}

/** Clase predicha y, en un gráfico de barras, la probabilidad (o la salida) de cada clase, con la elegida resaltada */
export default function N4LClassificationChart({ values, classLabels, index = argMax(values), actualIndex = null, topK = false }: N4LClassificationChartProps) {
  const { t, i18n } = useTranslation()
  const prefix = 'pages.playground.generator.classify.'
  // Azul y gris: la clase elegida resalta sobre el resto. El relleno es translúcido; el borde, del color entero, se
  // distingue del fondo (3:1) también en las barras grises
  const theme = useTheme()
  const highlight = chartColor('blue', theme)
  const muted = chartColor('gray', theme)
  const isProbability = topK || isProbabilityDistribution(values)
  const title = topK ? t(prefix + 'chart-title-top', { count: values.length }) : t(prefix + (isProbability ? 'chart-title' : 'chart-title-output'))
  const help = t(prefix + (topK ? 'chart-help-top' : isProbability ? 'chart-help' : 'chart-help-output'))
  const percentFormat = new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 1 })
  const numberFormat = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 })
  const format = (value: number) => (isProbability ? percentFormat.format(value) : numberFormat.format(value))
  const labels = values.map((_, i) => classLabels[i] ?? String(i))
  // Las clases de una o dos letras (dígitos, hiragana) se leen mejor más grandes; los nombres largos, no
  const tickFont = labels.every((label) => label.length <= 2) ? { size: 16 } : undefined
  const axisValue = t(prefix + (isProbability ? 'axis-probability' : 'axis-output'))
  const isHit = actualIndex !== null && actualIndex === index
  const actualText = actualIndex === null ? null
    : `${t(prefix + 'actual-class', { label: classLabels[actualIndex] ?? String(actualIndex) })} (${t(prefix + (isHit ? 'hit' : 'miss'))})`

  // El resultado, también para el lector de pantalla, sin mover el foco del botón que lo ha pedido (WCAG 4.1.3)
  const predicted = `${t(prefix + 'predicted-class')}: ${labels[index]}`
    + (isProbability ? `, ${t(prefix + 'confidence', { value: percentFormat.format(values[index]) })}` : '')
  const result = actualText === null ? predicted : `${predicted}. ${actualText}`
  useEffect(() => announce(result), [result])

  const data: ChartData<'bar'> = {
    labels,
    datasets: [{
      label          : axisValue,
      data           : isProbability ? values.map((value) => value * 100) : values,
      backgroundColor: values.map((_, i) => (i === index ? withAlpha(highlight, 0.75) : withAlpha(muted, 0.35))),
      borderColor    : values.map((_, i) => (i === index ? highlight : muted)),
      borderWidth    : 1,
      // Con pocas clases y todo el ancho, las barras no se ensanchan sin límite
      maxBarThickness: 96,
    }],
  }
  const options: ChartOptions<'bar'> = {
    responsive         : true,
    maintainAspectRatio: false,
    animation          : prefersReducedMotion() ? false : { duration: 300 },
    plugins            : {
      legend : { display: false },
      tooltip: { callbacks: { label: (context) => format(values[context.dataIndex]) } },
    },
    scales: {
      x: { title: { display: true, text: t(prefix + 'axis-class') }, ticks: { font: tickFont } },
      y: isProbability
        ? { min: 0, max: 100, title: { display: true, text: axisValue }, ticks: { callback: (value) => `${value} %` } }
        : { title: { display: true, text: axisValue } },
    },
  }

  return (
    <div data-testid={'Test-ClassificationChart'}>
      <div className={'d-flex flex-wrap align-items-baseline gap-2 mb-3'}>
        <span className={'text-body-secondary'}>{t(prefix + 'predicted-class')}</span>
        <span className={'display-6 fw-semibold lh-1'} data-testid={'Test-ClassificationChart-class'}>{labels[index]}</span>
        {isProbability && <span className={'text-body-secondary'}>{t(prefix + 'confidence', { value: percentFormat.format(values[index]) })}</span>}
        {actualIndex !== null &&
          <Badge bg={isHit ? 'success' : 'danger'} className={'fs-6 fw-normal ms-sm-2'} data-testid={'Test-ClassificationChart-actual'}>
            {t(prefix + 'actual-class', { label: classLabels[actualIndex] ?? String(actualIndex) })}
            {/* Si acierta o no, también sin el color (WCAG 1.4.1): con una marca y, para el lector, con palabras */}
            <span aria-hidden={true}> {isHit ? '✓' : '✗'}</span>
            <span className={'visually-hidden'}> ({t(prefix + (isHit ? 'hit' : 'miss'))})</span>
          </Badge>}
      </div>
      <h4 className={'h6'}>{title}</h4>
      <div className={'position-relative'} style={{ height: 280 }}>
        <Bar data={data} options={options} role={'img'}
          aria-label={labels.map((label, i) => `${label}: ${format(values[i])}`).join(', ')} />
      </div>
      <p className={'small text-body-secondary mt-2 mb-0'}>{help}</p>
      <N4LChartData caption={title} columns={[t(prefix + 'class'), axisValue]}
        rows={labels.map((label, i) => [label, isProbability ? percentFormat.format(values[i]) : values[i]])} />
    </div>
  )
}
