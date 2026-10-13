import { Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { prefix } from './timeSeriesConfig'

type TimeSeriesTestMetricsProps = {
  /** Las del manifiesto del modelo: test_mae y, para compararse, test_naive_mae y (con estación) test_seasonal_mae */
  metrics : Record<string, number> | undefined
  testSize: number
}

/**
 * Cómo predice el modelo de una serie con la parte final, que no vio al entrenarlo: su error medio a un paso frente al
 * de repetir el valor anterior y el de hace una estación. Si no mejora la mejor de las dos, se dice
 */
export default function TimeSeriesTestMetrics({ metrics, testSize }: TimeSeriesTestMetricsProps) {
  const { t, i18n } = useTranslation()
  if (metrics?.test_mae === undefined || metrics.test_naive_mae === undefined) return null
  const number = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 })
  const baseline = Math.min(metrics.test_naive_mae, metrics.test_seasonal_mae ?? Infinity)
  const isBetter = metrics.test_mae < baseline
  return (
    <Alert variant={isBetter ? 'info' : 'warning'} className={'small mt-0 mb-3'} data-testid={'Test-TimeSeries-TestMetrics'}>
      <p className={'fw-semibold mb-1'}>{t('n4l.metrics.title')}</p>
      <p className={'mb-1'}>
        {t(prefix + 'review.metrics', { testSize, mae: number.format(metrics.test_mae), naive: number.format(metrics.test_naive_mae) })}
        {metrics.test_seasonal_mae !== undefined && <> {t(prefix + 'review.metrics-seasonal', { seasonal: number.format(metrics.test_seasonal_mae) })}</>}
      </p>
      {!isBetter && <p className={'mb-0'}>{t(prefix + 'review.metrics-no-better')}</p>}
    </Alert>
  )
}
