import { Bar } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'
import { Badge } from 'react-bootstrap'
import type { ChartData, ChartOptions } from 'chart.js'
import { argMax, isProbabilityDistribution } from '@core/nn-utils/classificationOutput'

// Primario y secundario de Bootstrap: la clase elegida resalta sobre el resto
const HIGHLIGHT = { background: 'rgba(13, 110, 253, 0.75)', border: 'rgb(13, 110, 253)' }
const MUTED = { background: 'rgba(108, 117, 125, 0.35)', border: 'rgba(108, 117, 125, 0.8)' }

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

  const data: ChartData<'bar'> = {
    labels,
    datasets: [{
      label          : axisValue,
      data           : isProbability ? values.map((value) => value * 100) : values,
      backgroundColor: values.map((_, i) => (i === index ? HIGHLIGHT.background : MUTED.background)),
      borderColor    : values.map((_, i) => (i === index ? HIGHLIGHT.border : MUTED.border)),
      borderWidth    : 1,
      // Con pocas clases y todo el ancho, las barras no se ensanchan sin límite
      maxBarThickness: 96,
    }],
  }
  const options: ChartOptions<'bar'> = {
    responsive         : true,
    maintainAspectRatio: false,
    animation          : { duration: 300 },
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
          <Badge bg={actualIndex === index ? 'success' : 'danger'} className={'fs-6 fw-normal ms-sm-2'} data-testid={'Test-ClassificationChart-actual'}>
            {t(prefix + 'actual-class', { label: classLabels[actualIndex] ?? String(actualIndex) })}
          </Badge>}
      </div>
      <h4 className={'h6'}>{title}</h4>
      <div className={'position-relative'} style={{ height: 280 }}>
        <Bar data={data} options={options} role={'img'}
          aria-label={labels.map((label, i) => `${label}: ${format(values[i])}`).join(', ')} />
      </div>
      <p className={'small text-body-secondary mt-2 mb-0'}>{help}</p>
    </div>
  )
}
