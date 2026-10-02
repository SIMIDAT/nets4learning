import { useEffect, useMemo, useState } from 'react'
import { ProgressBar } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { useDownloadProgress } from '@core/downloadProgress'

type N4LDownloadProgressProps = {
  isLoading: boolean
}

/** Lo que se ve "Descargado" antes de quitar la barra */
const DONE_MS = 2000

/** Por debajo de esto (las primeras peticiones, como model.json) no se dan MB ni porcentaje: saldría "0,0 de 0,0 MB" */
const MIN_BYTES = 256 * 1024

/**
 * La carga de un modelo (lo que esté dentro de trackDownloads): cuántos MB han llegado de cuántos, o una barra animada
 * mientras no se sabe el tamaño. Al terminar dice "Descargado" un momento, se desvanece y deja de ocupar sitio.
 */
export default function N4LDownloadProgress({ isLoading }: N4LDownloadProgressProps) {
  const { t, i18n } = useTranslation()
  const progress = useDownloadProgress()
  const format = useMemo(() => new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), [i18n.language])
  const mb = (bytes: number) => format.format(bytes / 1024 / 1024)

  // Recién terminada: "Descargado" durante DONE_MS. Sin haber cargado nada (ya estaba), no se enseña
  const [wasLoading, setWasLoading] = useState(isLoading)
  const [done, setDone] = useState(false)
  if (wasLoading !== isLoading) {
    setWasLoading(isLoading)
    setDone(!isLoading)
  }
  useEffect(() => {
    if (!done) return
    const timer = window.setTimeout(() => setDone(false), DONE_MS)
    return () => window.clearTimeout(timer)
  }, [done])

  const known = isLoading && progress !== null && progress.total !== null && progress.total >= MIN_BYTES
  const percent = known ? Math.min(100, (progress.loaded / progress.total!) * 100) : 100
  const label = !isLoading
    ? t('downloaded')
    : known
      ? t('loading-status.model-progress', { loaded: mb(progress.loaded), total: mb(progress.total!) })
      : progress !== null && progress.loaded >= MIN_BYTES
        ? t('loading-status.model-loaded', { loaded: mb(progress.loaded) })
        : t('loading-status.model')

  if (!isLoading && !done) return null

  return (
    <div className={isLoading ? 'mt-2' : 'mt-2 n4l-fade-hidden'} role={'status'} aria-live={'polite'} data-testid={'Test-DownloadProgress'}>
      {/* La etiqueta va fuera de la barra: dentro no cabe en el móvil cuando la barra va por el principio */}
      <div className={'d-flex flex-wrap justify-content-between gap-2 small mb-1'}>
        <span>{label}</span>
        {known && <span className={'text-body-secondary'}>{Math.round(percent)} %</span>}
      </div>
      <ProgressBar now={percent} striped={isLoading} animated={isLoading && !known} aria-label={label} />
      {isLoading && <p className={'small text-body-secondary mt-1 mb-0'}>{t('loading-status.model-help')}</p>}
    </div>
  )
}
