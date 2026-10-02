import { useEffect, useState } from 'react'
import { Container, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

/** Pasado este tiempo, se explica por qué tarda */
const SLOW_MS = 3000

/**
 * Lo que se ve mientras llega el código de una página (el fallback de Suspense en App). Si tarda, dice por qué: la
 * primera vez se descargan las librerías de esa sección (TensorFlow.js, danfo…), y después ya están en la caché.
 */
export default function Loading() {
  // Sin Suspense: esto es lo que se enseña mientras se espera, y los textos pueden no haber llegado todavía
  const { t, ready } = useTranslation(undefined, { useSuspense: false })
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <Container className={'n4l-page-loading'} role={'status'} aria-live={'polite'} data-testid={'Test-PageLoading'}>
      <div className={'d-flex align-items-center gap-3'}>
        <Spinner animation={'border'} aria-hidden={true} />
        <span className={'fs-5'}>{ready ? t('loading-status.page') : ''}</span>
      </div>
      {slow && ready && <p className={'text-body-secondary small mt-3 mb-0 text-center'}>{t('loading-status.slow')}</p>}
    </Container>
  )
}
