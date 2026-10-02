import { useSyncExternalStore } from 'react'

import { trackEvent } from '@core/analytics'

// Progreso real de las descargas mientras se carga un modelo. TF.js y las librerías de modelos (@tensorflow-models,
// MediaPipe, face-api) descargan con fetch y no dicen cuánto llevan: mientras dura trackDownloads, fetch devuelve las
// respuestas tal cual pero contando los bytes que van llegando. Al terminar, fetch vuelve a ser el de siempre.

export type DownloadProgress_t = {
  /** Bytes que han llegado */
  loaded: number
  /** Bytes en total (null mientras alguna descarga no dice su tamaño) */
  total : number | null
}

type Transfer_t = { loaded: number, total: number | null }

/** Cada cuánto se avisa como mucho (la descarga llega en miles de trozos) */
const PUBLISH_MS = 100

let tracking = 0
let originalFetch: typeof fetch | null = null
let transfers: Transfer_t[] = []
let snapshot: DownloadProgress_t | null = null
let timer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()

function publish() {
  timer = null
  if (tracking === 0) return
  const loaded = transfers.reduce((sum, { loaded }) => sum + loaded, 0)
  const total = transfers.some(({ total }) => total === null) ? null : transfers.reduce((sum, { total }) => sum + (total ?? 0), 0)
  snapshot = { loaded, total }
  listeners.forEach((listener) => listener())
}

function schedulePublish() {
  timer ??= setTimeout(publish, PUBLISH_MS)
}

/** fetch que cuenta lo que llega: la misma respuesta (estado, cabeceras, url), con el cuerpo pasando por un contador */
async function countingFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await originalFetch!(input, init)
  if (!response.ok || response.body === null) return response
  const length = Number(response.headers.get('content-length'))
  const transfer: Transfer_t = { loaded: 0, total: Number.isFinite(length) && length > 0 ? length : null }
  transfers.push(transfer)
  schedulePublish()
  const counted = response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      transfer.loaded += chunk.byteLength
      // Con compresión, content-length es lo comprimido y llega más
      if (transfer.total !== null && transfer.loaded > transfer.total) transfer.total = transfer.loaded
      schedulePublish()
      controller.enqueue(chunk)
    },
  }))
  const wrapped = new Response(counted, { status: response.status, statusText: response.statusText, headers: response.headers })
  // Algunas librerías miran de dónde viene la respuesta
  Object.defineProperty(wrapped, 'url', { value: response.url })
  Object.defineProperty(wrapped, 'redirected', { value: response.redirected })
  return wrapped
}

/**
 * Carga algo (un modelo) contando lo que se descarga mientras tanto; useDownloadProgress lo enseña. Con
 * `analyticsEvent`, al terminar se registra cuánto ha tardado y cuántos kB han llegado (de la red o de la caché).
 */
export async function trackDownloads<T>(load: () => Promise<T>, analyticsEvent?: string): Promise<T> {
  if (tracking === 0 && typeof window.fetch === 'function') {
    originalFetch = window.fetch
    window.fetch = countingFetch
    transfers = []
  }
  tracking += 1
  const startedAt = performance.now()
  let outcome = 'error'
  try {
    const result = await load()
    outcome = 'completed'
    return result
  } finally {
    if (analyticsEvent !== undefined) {
      const loaded = transfers.reduce((sum, transfer) => sum + transfer.loaded, 0)
      trackEvent(analyticsEvent, {
        load_ms    : Math.round(performance.now() - startedAt),
        download_kb: Math.round(loaded / 1024),
        outcome,
      })
    }
    tracking -= 1
    if (tracking === 0) {
      if (originalFetch !== null) window.fetch = originalFetch
      originalFetch = null
      transfers = []
      snapshot = null
      if (timer !== null) clearTimeout(timer)
      timer = null
      listeners.forEach((listener) => listener())
    }
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Lo descargado mientras se carga un modelo (null si no se está cargando ninguno o aún no ha llegado nada) */
export const useDownloadProgress = () => useSyncExternalStore(subscribe, () => snapshot, () => null)
