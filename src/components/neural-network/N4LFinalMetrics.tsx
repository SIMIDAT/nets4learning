import { Badge } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { historyCurves, type TrainingLogs_t } from '@core/history/trainingSummary'

/**
 * Celda de la tabla de modelos: valor final de cada métrica con los datos de entrenamiento y, si los hay, con los de
 * validación, dicho con palabras (antes iba entre paréntesis sin decir qué era)
 */
export default function N4LFinalMetrics({ logs }: { logs: TrainingLogs_t }) {
  const { t, i18n } = useTranslation()
  const number = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 })
  const format = (values: number[]) => {
    const last = values[values.length - 1]
    return Number.isFinite(last) ? number.format(last) : '-'
  }
  const prefix = 'pages.playground.generator.training.'
  return <>
    {historyCurves(logs).map(({ name, train, validation }) => (
      <span key={name} className={'n4l-table-cell d-block'}>
        <small>
          {name}: {format(train)}
          {validation !== null && <>, {t(prefix + 'validation').toLowerCase()} {format(validation)}</>}
        </small>
      </span>
    ))}
  </>
}

/** Marca del modelo con menor pérdida de validación final */
export function N4LBestBadge() {
  const { t } = useTranslation()
  return (
    <Badge bg={'success'} className={'ms-1'} title={t('pages.playground.generator.training.best-title')}>
      <Trans i18nKey={'pages.playground.generator.training.best'} />
    </Badge>
  )
}
