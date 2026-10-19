import { Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import alertHelper from '@utils/alertHelper'
import { trackEvent } from '@core/analytics'
import { saveReport, type TrainingReport_t } from '@core/report/trainingReport'

/** Abre en otra pestaña el informe del modelo (para imprimirlo o guardarlo en PDF y entregarlo) */
export default function N4LReportButton({ getReport }: { getReport: () => TrainingReport_t }) {
  const { t } = useTranslation()
  const handleClick = async () => {
    if (!saveReport(getReport())) {
      await alertHelper.alertError(t('report.error-storage'))
      return
    }
    trackEvent('report_open')
    window.open(import.meta.env.VITE_PATH + '/report', '_blank')
  }
  return (
    <Button variant={'outline-secondary'} size={'sm'} className={'text-nowrap'} onClick={handleClick} data-testid={'Test-ReportButton'}>
      {t('report.button')}
    </Button>
  )
}
