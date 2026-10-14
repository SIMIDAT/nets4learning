import { useSyncExternalStore } from 'react'

import { pretrainedModelOf, type PretrainedModel_t } from '@core/models/pretrainedModels'

// Usar la aplicación sin conexión y no volver a descargar los modelos preentrenados (public/sw.js): registrar el
// service worker, saber si hay conexión y cuánto se ha guardado, y borrarlo.

/** Las cachés del service worker (n4l-shell-…, n4l-runtime-…, n4l-models-…) */
const CACHE_PREFIX = 'n4l-'
/** La de los modelos preentrenados */
const MODELS_PREFIX = 'n4l-models-'

/**
 * En la versión publicada, para todo. En desarrollo, solo para los modelos (sw.js?models): el código lo sirve Vite y
 * el service worker serviría código viejo al cambiarlo
 */
export function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const base = import.meta.env.VITE_PATH ?? ''
  const script = import.meta.env.PROD ? `${base}/sw.js` : `${base}/sw.js?models`
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(script, { scope: `${base}/` }).catch((error: unknown) => console.warn('Service worker:', error))
  })
}

const subscribe = (listener: () => void) => {
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

/** Si hay conexión (cambia al perderla o recuperarla) */
export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
}

export type Usage_t = { files: number, bytes: number }
/** Un modelo preentrenado guardado, con sus ficheros (model: null, los que no son de ninguno conocido) */
export type SavedModel_t = Usage_t & { model: PretrainedModel_t | null }

/** Lo que ocupa una respuesta guardada: lo que dice su cabecera o, si no lo dice (comprimida), su contenido */
async function sizeOf(response: Response | undefined): Promise<number> {
  if (response === undefined) return 0
  const length = Number(response.headers.get('content-length'))
  if (Number.isFinite(length) && length > 0) return length
  try {
    return (await response.blob()).size
  } catch {
    return 0
  }
}

/**
 * Lo guardado: en total y, de ello, los modelos preentrenados, uno a uno (del que más ocupa al que menos; los ficheros
 * que no son de ninguno conocido, al final). Cuántos ficheros y cuánto ocupan
 */
export async function offlineUsage(): Promise<Usage_t & { models: Usage_t & { list: SavedModel_t[] } }> {
  const usage = { files: 0, bytes: 0, models: { files: 0, bytes: 0, list: [] as SavedModel_t[] } }
  if (typeof caches === 'undefined') return usage
  const models = new Map<string, SavedModel_t>()
  for (const key of (await caches.keys()).filter((name) => name.startsWith(CACHE_PREFIX))) {
    const cache = await caches.open(key)
    for (const request of await cache.keys()) {
      const bytes = await sizeOf(await cache.match(request))
      usage.files += 1
      usage.bytes += bytes
      if (!key.startsWith(MODELS_PREFIX)) continue
      usage.models.files += 1
      usage.models.bytes += bytes
      const model = pretrainedModelOf(request.url)
      const id = model === null ? '' : model.task + '/' + model.key
      const saved = models.get(id) ?? { model, files: 0, bytes: 0 }
      saved.files += 1
      saved.bytes += bytes
      models.set(id, saved)
    }
  }
  usage.models.list = [...models.values()]
    .sort((a, b) => Number(a.model === null) - Number(b.model === null) || b.bytes - a.bytes)
  return usage
}

const deleteCaches = async (shouldDelete: (name: string) => boolean) => {
  if (typeof caches === 'undefined') return
  await Promise.all((await caches.keys()).filter(shouldDelete).map((name) => caches.delete(name)))
}

/** Borra todo lo guardado por el service worker, modelos incluidos (se volverá a guardar al usar la aplicación) */
export const clearOfflineData = () => deleteCaches((name) => name.startsWith(CACHE_PREFIX))

/** Borra lo guardado para usar sin conexión, sin los modelos preentrenados */
export const clearOfflinePages = () => deleteCaches((name) => name.startsWith(CACHE_PREFIX) && !name.startsWith(MODELS_PREFIX))

/** Borra solo los modelos preentrenados guardados (se volverán a descargar al usarlos) */
export const clearSavedModels = () => deleteCaches((name) => name.startsWith(MODELS_PREFIX))

/** Borra los ficheros guardados de un modelo preentrenado (null: los que no son de ninguno conocido) */
export async function clearSavedModel(model: PretrainedModel_t | null) {
  if (typeof caches === 'undefined') return
  const isIt = (other: PretrainedModel_t | null) =>
    model === null ? other === null : other !== null && other.task === model.task && other.key === model.key
  for (const name of (await caches.keys()).filter((key) => key.startsWith(MODELS_PREFIX))) {
    const cache = await caches.open(name)
    for (const request of await cache.keys()) {
      if (isIt(pretrainedModelOf(request.url))) await cache.delete(request)
    }
  }
}
