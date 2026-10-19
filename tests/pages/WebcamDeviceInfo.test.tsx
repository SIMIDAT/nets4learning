import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import WebcamDeviceInfo, { type DetectionStats_t } from '@pages/playground/2_ObjectDetection/WebcamDeviceInfo'

// Sin GPU ni navegador de verdad: lo que leen de ellos /debug y TF.js, fijo (Firefox, que no tiene userAgentData)
vi.mock('@pages/debug/diagnostics/collectDiagnostics', () => ({
  probeSystem: async () => ({
    userAgent          : 'Mozilla/5.0 (X11; Linux x86_64; rv:153.0) Gecko/20100101 Firefox/153.0',
    brands             : null,
    platform           : 'Linux x86_64',
    mobile             : null,
    architecture       : null,
    platformVersion    : null,
    cores              : 8,
    memoryGB           : null,
    devicePixelRatio   : 1,
    screen             : '1920×1080',
    language           : 'es-ES',
    secureContext      : true,
    crossOriginIsolated: false,
  }),
  probeWebGL: () => ({
    webgl2          : true,
    renderer        : 'WebKit WebGL',
    unmaskedRenderer: 'NVIDIA GeForce GTX 980',
    software        : false,
  }),
}))
vi.mock('@tensorflow/tfjs', () => ({
  getBackend: () => 'webgl',
  memory    : () => ({ numTensors: 12, numBytes: 3 * 1024 * 1024 }),
}))

const prefix = 'datasets-models.2-object-detection.interface.device-info.'

const DEVICES = [
  { deviceId: 'camara-portatil-123456', label: 'Integrated Camera', kind: 'videoinput', groupId: 'g1' },
  { deviceId: 'camara-usb', label: '', kind: 'videoinput', groupId: 'g2' },
] as MediaDeviceInfo[]

// Un vídeo con la cámara del portátil emitiendo (lo que se lee de él)
const video = {
  videoWidth  : 1280,
  videoHeight : 720,
  clientWidth : 640,
  clientHeight: 360,
  srcObject   : {
    getVideoTracks: () => [{
      label          : 'Integrated Camera',
      readyState     : 'live',
      getSettings    : () => ({ width: 1280, height: 720, frameRate: 30, facingMode: 'user', deviceId: 'camara-portatil-123456' }),
      getCapabilities: () => ({ width: { min: 1, max: 1920 }, facingMode: ['user'], deviceId: 'camara-portatil-123456' }),
    }],
  },
} as unknown as HTMLVideoElement

function renderInfo(getVideo: () => HTMLVideoElement | null, stats: DetectionStats_t = { predictions: 0, totalMs: 0 }) {
  render(<WebcamDeviceInfo getVideo={getVideo}
    devices={DEVICES}
    cameraPermission={'granted'}
    isWebView={false}
    mirrored={false}
    model={'COCO SSD'}
    fpsLimit={20}
    stats={{ current: stats }} />)
}

// El valor de un dato: el <dd> que sigue a su <dt>
const valueOf = (label: string) => screen.getByText(label).nextElementSibling?.textContent

// Como en el navegador: se abre y jsdom avisa (toggle) en una tarea aparte
async function open() {
  const details = screen.getByTestId('Test-WebcamDeviceInfo') as HTMLDetailsElement
  await act(async () => {
    details.open = true
    await vi.advanceTimersByTimeAsync(0)
  })
}

describe('WebcamDeviceInfo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  test('cerrada no lee nada; al abrirla, con la cámara apagada, lo dice y enseña el resto', async () => {
    const getVideo = vi.fn(() => null)
    renderInfo(getVideo)
    expect(getVideo).not.toHaveBeenCalled()

    await open()
    expect(screen.getAllByText(prefix + 'camera-off')).toHaveLength(2)
    expect(valueOf(prefix + 'model')).toBe('COCO SSD')
    expect(valueOf(prefix + 'backend')).toBe('webgl')
    expect(valueOf(prefix + 'predictions')).toBe('—')
    // Firefox no tiene userAgentData: el navegador sale del user agent
    expect(valueOf(prefix + 'browser-name')).toBe('Firefox 153')
    expect(valueOf(prefix + 'gpu')).toBe('NVIDIA GeForce GTX 980')
    // Las cámaras, también la que no tiene nombre (sin permiso los navegadores no lo dan)
    expect(screen.getByText('Integrated Camera')).toBeInTheDocument()
    expect(screen.getByText(prefix + 'unnamed')).toBeInTheDocument()
    expect(screen.queryByText(prefix + 'in-use')).not.toBeInTheDocument()
  })

  test('con la cámara encendida, sus datos y capacidades, la que está en uso y cómo va la detección', async () => {
    const stats = { predictions: 0, totalMs: 0 }
    renderInfo(() => video, stats)
    await open()

    expect(valueOf(prefix + 'name')).toBe('Integrated Camera')
    expect(valueOf(prefix + 'resolution')).toMatch(/1,?280 × 720/)
    expect(valueOf(prefix + 'aspect')).toMatch(/^16:9/)
    expect(valueOf(prefix + 'facing')).toBe(prefix + 'facing-user')
    expect(valueOf(prefix + 'state')).toBe(prefix + 'state-live')
    // Capacidades: los rangos como mínimo – máximo, sin los identificadores
    expect(within(screen.getByText('width').closest('dl')!).getByText('facingMode')).toBeInTheDocument()
    expect(screen.getByText('width').closest('dt')?.nextElementSibling?.textContent).toMatch(/^1 – 1,?920$/)
    expect(screen.queryByText('deviceId')).not.toBeInTheDocument()
    // La cámara del vídeo es la que está en uso
    expect(screen.getByText(prefix + 'in-use').closest('dt')).toHaveTextContent('Integrated Camera')

    // Un segundo después, 10 predicciones de 50 ms
    stats.predictions = 10
    stats.totalMs = 500
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(valueOf(prefix + 'prediction-time')).toBe('50 ms')
    expect(valueOf(prefix + 'predictions')).not.toBe('—')
  })
})
