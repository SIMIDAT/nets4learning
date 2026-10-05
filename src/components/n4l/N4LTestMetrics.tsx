import { Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

type N4LTestMetricsProps = {
  metrics: { test_r2: number, test_mae: number, test_baseline_mae: number } | null
}

/**
 * Cómo predice un modelo de regresión con datos que no vio al entrenarlo: su error medio frente al de predecir siempre
 * la media, y su R². Si no lo mejora, se dice: con esos datos no se puede predecir mucho más
 */
export default function N4LTestMetrics({ metrics }: N4LTestMetricsProps) {
  const { t, i18n } = useTranslation()
  if (metrics === null) return null
  const number = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 })
  const isBetter = metrics.test_mae < metrics.test_baseline_mae
  return (
    <Alert variant={isBetter ? 'info' : 'warning'} className={'small mt-3 mb-0'} data-testid={'Test-N4LTestMetrics'}>
      <p className={'fw-semibold mb-1'}>{t('n4l.metrics.title')}</p>
      <p className={'mb-1'}>{t('n4l.metrics.text', { mae: number.format(metrics.test_mae), baseline: number.format(metrics.test_baseline_mae), r2: number.format(metrics.test_r2) })}</p>
      {!isBetter && <p className={'mb-0'}>{t('n4l.metrics.no-better')}</p>}
    </Alert>
  )
}
