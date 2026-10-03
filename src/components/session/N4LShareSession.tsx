import { useEffect, useState } from 'react'
import { Button, Form, InputGroup, Modal } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { sessionHash, type TrainingSession_t } from '@core/session/trainingSession'
import { trackEvent } from '@core/analytics'

/** El código QR como un trazado SVG (un cuadrado por módulo oscuro), con el margen de 4 módulos que pide el estándar */
type QR_t = { size: number, path: string }
const QUIET_ZONE = 4

async function makeQR(text: string): Promise<QR_t | null> {
  const { default: qrcode } = await import('qrcode-generator')
  try {
    const qr = qrcode(0, 'L')
    qr.addData(text)
    qr.make()
    const count = qr.getModuleCount()
    let path = ''
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) path += `M${col + QUIET_ZONE},${row + QUIET_ZONE}h1v1h-1z`
      }
    }
    return { size: count + QUIET_ZONE * 2, path }
  } catch {
    // Demasiado largo para un QR: queda el enlace
    return null
  }
}

type N4LShareSessionProps = {
  /** La configuración actual de la página (se lee al abrir) */
  getSession: () => TrainingSession_t
}

/**
 * Compartir el ejercicio: un enlace (y su QR, para abrirlo con el móvil) con la red y los hiperparámetros de la página.
 * Quien lo abre los tiene listos para entrenar con el mismo conjunto de datos (useSharedSession).
 */
export default function N4LShareSession({ getSession }: N4LShareSessionProps) {
  const { t } = useTranslation()
  const prefix = 'session.share.'
  const [link, setLink] = useState<string | null>(null)
  const [qr, setQR] = useState<QR_t | null | undefined>(undefined)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (link === null) return
    let isCancelled = false
    makeQR(link).then((value) => { if (!isCancelled) setQR(value) })
    return () => { isCancelled = true }
  }, [link])

  const handleClick_Open = async () => {
    const url = new URL(window.location.href)
    url.hash = await sessionHash(getSession())
    setLink(url.toString())
    setQR(undefined)
    setCopied(false)
    trackEvent('session_share', { action: 'open' })
  }
  const handleClick_Copy = async () => {
    if (link === null) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      trackEvent('session_share', { action: 'copy' })
    } catch {
      // Sin permiso para el portapapeles: el enlace está seleccionable en el campo
    }
  }
  const handleClick_Share = async () => {
    if (link === null) return
    try {
      await navigator.share({ title: t(prefix + 'title'), url: link })
      trackEvent('session_share', { action: 'native' })
    } catch {
      // Cancelado por el usuario
    }
  }

  return (
    <>
      <Button size={'sm'} variant={'outline-primary'} className={'text-nowrap'} onClick={handleClick_Open} data-testid={'Test-SessionShare'}>
        {t(prefix + 'button')}
      </Button>
      <Modal show={link !== null} onHide={() => setLink(null)} centered={true} data-testid={'Test-SessionShare-Modal'}>
        <Modal.Header closeButton={true} closeLabel={t(prefix + 'close')}>
          <Modal.Title as={'h2'} className={'h5'}>{t(prefix + 'title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{t(prefix + 'text')}</p>
          <InputGroup className={'mb-3'}>
            <Form.Control readOnly={true} value={link ?? ''} aria-label={t(prefix + 'link')} onFocus={(event) => event.target.select()}
              data-testid={'Test-SessionShare-Link'} />
            <Button variant={copied ? 'success' : 'primary'} onClick={handleClick_Copy}>
              {t(prefix + (copied ? 'copied' : 'copy'))}
            </Button>
          </InputGroup>
          {typeof navigator.share === 'function' && (
            <Button variant={'outline-primary'} className={'mb-3'} onClick={handleClick_Share}>{t(prefix + 'native')}</Button>
          )}
          {qr && (
            <figure className={'text-center mb-0'}>
              <svg viewBox={`0 0 ${qr.size} ${qr.size}`} className={'n4l-share-qr'} role={'img'} aria-label={t(prefix + 'qr')}
                shapeRendering={'crispEdges'} data-testid={'Test-SessionShare-QR'}>
                {/* Siempre oscuro sobre claro (también en el tema oscuro): así lo leen las cámaras */}
                <rect width={qr.size} height={qr.size} fill={'#fff'} />
                <path d={qr.path} fill={'#000'} />
              </svg>
              <figcaption className={'small text-body-secondary'}>{t(prefix + 'qr')}</figcaption>
            </figure>
          )}
        </Modal.Body>
      </Modal>
    </>
  )
}
