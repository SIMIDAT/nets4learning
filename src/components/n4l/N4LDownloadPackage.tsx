import { useState } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { trackEvent } from '@core/analytics'
import { downloadN4LPackage } from '@core/n4l/export'
import type { N4LPackage_t } from '@core/n4l/source'

/** Descargar el paquete del modelo en un fichero .n4l (su modelo, sus datos y sus textos) para compartirlo o abrirlo después */
export default function N4LDownloadPackage({ pkg }: { pkg: N4LPackage_t | null }) {
  const { t } = useTranslation()
  const [isPacking, setIsPacking] = useState(false)
  if (pkg === null) return null

  const handleClick = async () => {
    setIsPacking(true)
    try {
      await downloadN4LPackage(pkg)
      trackEvent('n4l_download', { item: pkg.manifest.id })
    } finally {
      setIsPacking(false)
    }
  }

  return (
    <div className={'d-grid mb-3'}>
      <Button size={'sm'} variant={'outline-secondary'} onClick={handleClick} disabled={isPacking} title={t('n4l.download-title')} data-testid={'Test-N4LDownload'}>
        {isPacking && <Spinner size={'sm'} className={'me-2'} />}
        {t('n4l.download')}
      </Button>
    </div>
  )
}
