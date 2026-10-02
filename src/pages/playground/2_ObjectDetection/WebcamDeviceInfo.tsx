import { Fragment, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { Badge, Col, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'

import { probeSystem, probeWebGL, type SystemInfo_t, type WebGLInfo_t } from '@pages/debug/diagnostics/collectDiagnostics'

/** Lo que cuenta el bucle de detección: predicciones hechas y lo que han tardado en total (para las medias) */
export type DetectionStats_t = { predictions: number, totalMs: number }

type WebcamDeviceInfoProps = {
  /** El vídeo de la cámara (null con la cámara apagada) */
  getVideo        : () => HTMLVideoElement | null | undefined
  devices         : MediaDeviceInfo[]
  cameraPermission: string
  isWebView       : boolean
  mirrored        : boolean
  /** Nombre del modelo */
  model           : string
  /** Predicciones por segundo como máximo */
  fpsLimit        : number
  stats           : React.RefObject<DetectionStats_t>
}

/** Lo que cambia mientras se mira: se lee una vez por segundo */
type Live_t = {
  track: {
    label       : string
    readyState  : MediaStreamTrackState
    settings    : MediaTrackSettings
    /** null si el navegador no tiene getCapabilities() */
    capabilities: Record<string, unknown> | null
  } | null
  video      : { width: number, height: number, displayWidth: number, displayHeight: number } | null
  /** Predicciones por segundo y lo que tarda cada una (ms) desde la lectura anterior */
  fps        : number | null
  ms         : number | null
  backend    : string
  tensors    : number
  bytes      : number
  viewport   : string
  orientation: string | null
}

const REFRESH_MS = 1000

// Proporciones con nombre: la de la cámara se dice así si coincide con alguna
const NAMED_RATIOS = [[16, 9], [4, 3], [3, 2], [1, 1], [5, 4], [21, 9], [9, 16], [3, 4], [2, 3], [4, 5]]

const shortId = (id: string | undefined) => (!id ? '—' : id.length > 12 ? id.slice(0, 12) + '…' : id)

// Navegador y versión según el user agent, en este orden: Edge y Opera también dicen "Chrome", y Chrome, "Safari"
const USER_AGENT_BROWSERS: Array<[RegExp, string]> = [
  [/Edg(?:A|iOS)?\/(\d+)/, 'Edge'],
  [/OPR\/(\d+)/, 'Opera'],
  [/SamsungBrowser\/(\d+)/, 'Samsung Internet'],
  [/(?:Firefox|FxiOS)\/(\d+)/, 'Firefox'],
  [/(?:Chrome|CriOS)\/(\d+)/, 'Chrome'],
  [/Version\/(\d+).*Safari\//, 'Safari'],
]

/** El navegador cuando no hay userAgentData (Firefox, Safari): /debug lo saca de ahí y con ellos se quedaba vacío */
function browserFromUserAgent(userAgent: string): string | null {
  for (const [pattern, name] of USER_AGENT_BROWSERS) {
    const match = pattern.exec(userAgent)
    if (match) return `${name} ${match[1]}`
  }
  return null
}

/**
 * Información del dispositivo de la tarjeta de la cámara: la cámara en uso y lo que puede hacer, cómo va la detección,
 * las cámaras disponibles, el navegador y la pantalla. Mientras está abierta se pone al día cada segundo; cerrada no
 * hace nada.
 */
export default function WebcamDeviceInfo(props: WebcamDeviceInfoProps) {
  const { getVideo, devices, cameraPermission, isWebView, mirrored, model, fpsLimit, stats } = props
  const prefix = 'datasets-models.2-object-detection.interface.device-info.'
  const { t, i18n } = useTranslation()
  const format = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }), [i18n.language])

  const [open, setOpen] = useState(false)
  const [live, setLive] = useState<Live_t | null>(null)
  const [system, setSystem] = useState<SystemInfo_t | null>(null)
  const [webgl, setWebgl] = useState<WebGLInfo_t | null>(null)
  // Contadores de la lectura anterior, para sacar las predicciones por segundo
  const previous = useRef<DetectionStats_t & { time: number } | null>(null)

  const sample = (): Live_t => {
    const video = getVideo() ?? null
    const stream = video?.srcObject
    const track = stream && 'getVideoTracks' in stream ? stream.getVideoTracks()[0] ?? null : null
    const now = performance.now()
    const { predictions, totalMs } = stats.current
    const last = previous.current
    const done = last ? predictions - last.predictions : 0
    previous.current = { predictions, totalMs, time: now }
    const memory = tfjs.memory()
    return {
      track: track && {
        label       : track.label,
        readyState  : track.readyState,
        settings    : track.getSettings(),
        capabilities: typeof track.getCapabilities === 'function' ? track.getCapabilities() as Record<string, unknown> : null,
      },
      video: video && video.videoWidth > 0
        ? { width: video.videoWidth, height: video.videoHeight, displayWidth: video.clientWidth, displayHeight: video.clientHeight }
        : null,
      fps        : last && track ? done / ((now - last.time) / 1000) : null,
      ms         : last && done > 0 ? (totalMs - last.totalMs) / done : null,
      backend    : tfjs.getBackend(),
      tensors    : memory.numTensors,
      bytes      : memory.numBytes,
      viewport   : `${window.innerWidth}×${window.innerHeight}`,
      orientation: window.screen.orientation?.type ?? null,
    }
  }

  // Abierta: una lectura cada segundo
  const onRefresh = useEffectEvent(() => setLive(sample()))
  useEffect(() => {
    if (!open) return
    const id = window.setInterval(onRefresh, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [open])

  const handleToggle = (event: React.SyntheticEvent<HTMLDetailsElement>) => {
    const isOpen = event.currentTarget.open
    setOpen(isOpen)
    if (!isOpen) return
    previous.current = null
    setLive(sample())
    // El navegador, el sistema y la GPU no cambian: se leen la primera vez
    if (webgl === null) setWebgl(probeWebGL())
    if (system === null) probeSystem().then(setSystem).catch((error) => console.error(error))
  }

  const yesNo = (value: boolean | null | undefined) => (value === null || value === undefined ? '—' : t(prefix + (value ? 'yes' : 'no')))
  const size = (width?: number, height?: number) => (width && height ? `${format.format(width)} × ${format.format(height)}` : '—')
  const aspect = (width?: number, height?: number) => {
    if (!width || !height) return '—'
    const ratio = width / height
    const named = NAMED_RATIOS.find(([w, h]) => Math.abs(ratio - w / h) < 0.01)
    return named ? `${named[0]}:${named[1]} (${format.format(ratio)})` : format.format(ratio)
  }
  const facing = (mode?: string) => (mode === 'user' || mode === 'environment' ? t(prefix + 'facing-' + mode) : mode || '—')
  const capability = (value: unknown): string => {
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '—'
    if (typeof value === 'boolean') return yesNo(value)
    if (typeof value === 'number') return format.format(value)
    if (value !== null && typeof value === 'object' && ('min' in value || 'max' in value)) {
      const { min, max } = value as { min?: number, max?: number }
      return `${min === undefined ? '…' : format.format(min)} – ${max === undefined ? '…' : format.format(max)}`
    }
    return value === undefined || value === null ? '—' : String(value)
  }

  const settings = live?.track?.settings
  const activeDeviceId = settings?.deviceId
  const capabilities = Object.entries(live?.track?.capabilities ?? {}).filter(([key]) => key !== 'deviceId' && key !== 'groupId')

  return (
    <details onToggle={handleToggle} data-testid={'Test-WebcamDeviceInfo'}>
      <summary>{t('Device info')}</summary>
      {open && live && <Row className={'g-3'}>
        <InfoList title={t(prefix + 'camera')} items={live.track && settings ? [
          [t(prefix + 'name'), live.track.label || '—'],
          [t(prefix + 'resolution'), size(settings.width, settings.height)],
          [t(prefix + 'frames'), size(live.video?.width, live.video?.height)],
          [t(prefix + 'aspect'), aspect(live.video?.width ?? settings.width, live.video?.height ?? settings.height)],
          [t(prefix + 'frame-rate'), settings.frameRate ? format.format(settings.frameRate) : '—'],
          [t(prefix + 'facing'), facing(settings.facingMode)],
          [t(prefix + 'resize-mode'), (settings as MediaTrackSettings & { resizeMode?: string }).resizeMode ?? '—'],
          [t(prefix + 'displayed'), size(live.video?.displayWidth, live.video?.displayHeight)],
          [t(prefix + 'mirrored'), yesNo(mirrored)],
          [t(prefix + 'state'), t(prefix + 'state-' + live.track.readyState)],
          [t(prefix + 'device-id'), <code key={'id'} title={activeDeviceId}>{shortId(activeDeviceId)}</code>],
        ] : []} empty={t(prefix + 'camera-off')} />

        <InfoList title={t(prefix + 'capabilities')}
          items={capabilities.map(([key, value]): Item_t => [<code key={key}>{key}</code>, capability(value)])}
          empty={live.track ? t(prefix + 'capabilities-none') : t(prefix + 'camera-off')} />

        <InfoList title={t(prefix + 'detection')} items={[
          [t(prefix + 'model'), model],
          [t(prefix + 'predictions'), live.fps === null ? '—' : format.format(live.fps)],
          [t(prefix + 'prediction-time'), live.ms === null ? '—' : `${format.format(live.ms)} ms`],
          [t(prefix + 'limit'), t(prefix + 'limit-value', { fps: fpsLimit })],
          [t(prefix + 'backend'), live.backend],
          [t(prefix + 'tensors'), `${format.format(live.tensors)} · ${format.format(live.bytes / 1024 / 1024)} MB`],
        ]} />

        <InfoList title={t(prefix + 'devices')} items={devices.map((device, index): Item_t => [
          <span key={device.deviceId || index}>
            {device.label || t(prefix + 'unnamed', { index: index + 1 })}
            {device.deviceId !== '' && device.deviceId === activeDeviceId && <> <Badge bg={'success'}>{t(prefix + 'in-use')}</Badge></>}
          </span>,
          <code key={'id'} title={device.deviceId}>{shortId(device.deviceId)}</code>,
        ])} empty={t(prefix + 'devices-none')} />

        <InfoList title={t(prefix + 'browser')} items={system ? [
          [t(prefix + 'browser-name'), system.brands ?? browserFromUserAgent(system.userAgent) ?? '—'],
          [t(prefix + 'platform'), [system.platform, system.platformVersion].filter(Boolean).join(' ') || '—'],
          [t(prefix + 'mobile'), yesNo(system.mobile)],
          [t(prefix + 'architecture'), system.architecture ?? '—'],
          [t(prefix + 'cores'), system.cores === null ? '—' : format.format(system.cores)],
          [t(prefix + 'memory'), system.memoryGB === null ? '—' : `${format.format(system.memoryGB)} GB`],
          [t(prefix + 'language'), system.language],
          [t(prefix + 'permission'), t(prefix + 'permission-' + cameraPermission, { defaultValue: cameraPermission })],
          [t(prefix + 'webview'), yesNo(isWebView)],
          [t(prefix + 'secure'), yesNo(system.secureContext)],
          [t(prefix + 'user-agent'), system.userAgent],
        ] : []} />

        <InfoList title={t(prefix + 'screen')} items={[
          [t(prefix + 'screen-size'), system?.screen ?? '—'],
          [t(prefix + 'window'), live.viewport],
          [t(prefix + 'pixel-ratio'), format.format(window.devicePixelRatio)],
          [t(prefix + 'orientation'), live.orientation ?? '—'],
          [t(prefix + 'gpu'), webgl?.unmaskedRenderer ?? webgl?.renderer ?? '—'],
          [t(prefix + 'webgl2'), yesNo(webgl?.webgl2)],
          [t(prefix + 'software'), yesNo(webgl?.software)],
        ]} />
      </Row>}
    </details>
  )
}

type Item_t = [label: React.ReactNode, value: React.ReactNode]

/** Un apartado: su título y una lista de nombre y valor (o un aviso si no hay nada) */
function InfoList({ title, items, empty }: { title: string, items: Item_t[], empty?: string }) {
  return (
    <Col md={6} xl={4}>
      <h4 className={'h6 mt-2'}>{title}</h4>
      {items.length === 0
        ? <p className={'small text-body-secondary mb-0'}>{empty ?? '—'}</p>
        : <dl className={'row small mb-0'}>
          {items.map(([label, value], index) => (
            <Fragment key={index}>
              <dt className={'col-6 fw-normal text-body-secondary'}>{label}</dt>
              <dd className={'col-6 mb-1 text-break'}>{value}</dd>
            </Fragment>
          ))}
        </dl>}
    </Col>
  )
}
