import { useMemo } from 'react'
import { Alert, Button } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import type { PendingDownload_t } from '@core/models/downloadConsent'

/**
 * La pregunta antes de descargar un modelo grande: cuánto pesa, por qué se pregunta (ahorro de datos, conexión lenta o
 * porque se pidió en /settings) y el botón para descargarlo.
 */
export default function N4LDownloadConsent({ download }: { download: PendingDownload_t }) {
  const { t, i18n } = useTranslation()
  const prefix = 'download-consent.'
  const mb = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(download.mb), [i18n.language, download.mb])

  return (
    <Alert variant={'info'} className={'mt-2 mb-0'} data-testid={'Test-DownloadConsent'}>
      <p className={'fw-semibold mb-1'}>{t(prefix + 'title', { mb })}</p>
      <p className={'small mb-2'}>{t(prefix + 'reason.' + download.reason)}</p>
      <div className={'d-flex flex-wrap align-items-center gap-3'}>
        <Button variant={'primary'} onClick={download.accept} data-testid={'Test-DownloadConsent-Accept'}>
          {t(prefix + 'accept', { mb })}
        </Button>
        <span className={'small'}>
          <Trans i18nKey={prefix + 'settings'} components={{ link1: <Link to={'/settings'} /> }} />
        </span>
      </div>
    </Alert>
  )
}
