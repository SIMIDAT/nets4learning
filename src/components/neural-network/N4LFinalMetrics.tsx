import { Badge } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { historyCurves, type TrainingLogs_t } from '@core/history/trainingSummary'

const format = (values: number[]) => {
  const last = values[values.length - 1]
  return Number.isFinite(last) ? last.toFixed(3) : '-'
}

/** Celda de la tabla de modelos: valor final de cada métrica y, entre paréntesis, el de validación */
export default function N4LFinalMetrics({ logs }: { logs: TrainingLogs_t }) {
  return <>
    {historyCurves(logs).map(({ name, train, validation }) => (
      <span key={name} className={'n4l-table-cell d-block'}>
        <small>{name}: {format(train)}{validation !== null && ` (${format(validation)})`}</small>
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
