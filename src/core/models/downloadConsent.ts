import { useSyncExternalStore } from 'react'

import { trackEvent } from '@core/analytics'

// Antes de descargar un modelo preentrenado grande se pregunta, si quien usa la página ahorra datos (el navegador lo
// dice con navigator.connection.saveData) o tiene una conexión lenta, o si lo ha pedido en /settings. Lo que ya se
// aceptó no se vuelve a preguntar (el navegador lo tendrá en su caché).

/** Megas que descarga cada modelo al abrir su página (medido con la caché vacía), por tarea/modelo */
export const MODEL_DOWNLOAD_MB: Readonly<Record<string, number>> = {
  'image-classification/IMAGE-MNIST'    : 4.6,
  'image-classification/IMAGE-KMNIST'   : 2.2,
  'image-classification/IMAGE-CIFAR10'  : 3.3,
  'image-classification/IMAGE-MOBILENET': 14.0,
  'object-detection/FACE-DETECTOR'      : 2.2,
  'object-detection/FACE-MESH'          : 5.0,
  'object-detection/MOVE-NET--POSE-NET' : 9.3,
  'object-detection/COCO-SSD'           : 17.7,
  'object-detection/FACE-API'           : 6.3,
  'object-detection/HAND-SIGN'          : 8.9,
}

/** Por debajo de esto no se pregunta */
const MIN_MB = 2

export type DownloadWarning_t = 'auto' | 'always' | 'never'
export const DOWNLOAD_WARNING_STORAGE_KEY = 'n4l-download-warning'
const ACCEPTED_STORAGE_KEY = 'n4l-downloads-accepted'

/** Por qué se pregunta: ahorro de datos, conexión lenta o porque se pidió siempre en /settings */
export type DownloadReason_t = 'save-data' | 'slow' | 'always'

type NetworkInformation_t = { saveData?: boolean, effectiveType?: string }

/** El motivo para preguntar según la preferencia y la conexión; null si no hace falta */
export function downloadReason(preference: DownloadWarning_t, connection: NetworkInformation_t | undefined): DownloadReason_t | null {
  if (preference === 'never') return null
  if (preference === 'always') return 'always'
  if (connection?.saveData === true) return 'save-data'
  if (connection?.effectiveType !== undefined && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) return 'slow'
  return null
}

// region Preferencia (/settings)
const readPreference = (): DownloadWarning_t => {
  try {
    const saved = localStorage.getItem(DOWNLOAD_WARNING_STORAGE_KEY)
    return saved === 'always' || saved === 'never' ? saved : 'auto'
  } catch {
    return 'auto'
  }
}

let preference: DownloadWarning_t | null = null
const preferenceListeners = new Set<() => void>()
export const getDownloadWarning = (): DownloadWarning_t => (preference ??= readPreference())

export function setDownloadWarning(value: DownloadWarning_t) {
  preference = value
  try {
    if (value === 'auto') localStorage.removeItem(DOWNLOAD_WARNING_STORAGE_KEY)
    else localStorage.setItem(DOWNLOAD_WARNING_STORAGE_KEY, value)
  } catch {
    // Sin almacenamiento vale solo para esta visita
  }
  trackEvent('settings_change', { setting: 'download_warning', value })
  preferenceListeners.forEach((listener) => listener())
}

export function useDownloadWarning(): DownloadWarning_t {
  return useSyncExternalStore((listener) => {
    preferenceListeners.add(listener)
    return () => { preferenceListeners.delete(listener) }
  }, getDownloadWarning, () => 'auto')
}
// endregion

// region Lo ya aceptado
function readAccepted(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(ACCEPTED_STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

const acceptedThisVisit = new Set<string>()
const isAccepted = (model: string) => acceptedThisVisit.has(model) || readAccepted().includes(model)

function rememberAccepted(model: string) {
  acceptedThisVisit.add(model)
  try {
    localStorage.setItem(ACCEPTED_STORAGE_KEY, JSON.stringify([...new Set([...readAccepted(), model])]))
  } catch {
    // Sin almacenamiento se recuerda solo en esta visita
  }
}
// endregion

/** Vuelve a la preferencia automática y olvida lo aceptado: para "Restablecer todo" en /settings */
export function resetDownloadConsent() {
  preference = 'auto'
  acceptedThisVisit.clear()
  try {
    localStorage.removeItem(DOWNLOAD_WARNING_STORAGE_KEY)
    localStorage.removeItem(ACCEPTED_STORAGE_KEY)
  } catch {
    // Nada que borrar
  }
  preferenceListeners.forEach((listener) => listener())
}

// region La pregunta pendiente
export type PendingDownload_t = { model: string, mb: number, reason: DownloadReason_t, accept: () => void }

let pending: PendingDownload_t | null = null
const pendingListeners = new Set<() => void>()
const setPending = (value: PendingDownload_t | null) => {
  pending = value
  pendingListeners.forEach((listener) => listener())
}

/**
 * Antes de descargar el modelo `key` de `task`: termina enseguida si no hace falta preguntar y, si hace falta, cuando
 * se acepta (N4LDownloadProgress enseña la pregunta mientras tanto). Una pregunta nueva sustituye a la anterior (otra
 * página): la de antes ya no termina.
 */
export function askBeforeDownload(task: string, key: string): Promise<void> {
  const model = task + '/' + key
  const mb = MODEL_DOWNLOAD_MB[model]
  const connection = typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { connection?: NetworkInformation_t }).connection
  const reason = mb === undefined || mb < MIN_MB || isAccepted(model) ? null : downloadReason(getDownloadWarning(), connection)
  if (reason === null) {
    if (pending !== null) setPending(null)
    return Promise.resolve()
  }
  trackEvent('download_consent', { reason, download_mb: mb, outcome: 'shown' })
  return new Promise((resolve) => {
    setPending({
      model, mb, reason,
      accept: () => {
        rememberAccepted(model)
        trackEvent('download_consent', { reason, download_mb: mb, outcome: 'accepted' })
        setPending(null)
        resolve()
      },
    })
  })
}

/** Al salir de la página sin haber aceptado: la pregunta no pasa a la siguiente */
export function cancelPendingDownload() {
  if (pending !== null) setPending(null)
}

/** La descarga que espera a que se acepte (null si no hay ninguna) */
export function usePendingDownload(): PendingDownload_t | null {
  return useSyncExternalStore((listener) => {
    pendingListeners.add(listener)
    return () => { pendingListeners.delete(listener) }
  }, () => pending, () => null)
}
// endregion
