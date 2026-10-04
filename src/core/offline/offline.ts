import { useSyncExternalStore } from 'react'

// Usar la aplicación sin conexión (public/sw.js): registrar el service worker, saber si hay conexión y cuánto se ha
// guardado para usarla sin ella, y borrarlo.

/** Las cachés del service worker (n4l-shell-…, n4l-runtime-…) */
const CACHE_PREFIX = 'n4l-'

/** Solo en la versión publicada: en desarrollo, el service worker serviría código viejo al cambiarlo */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const base = import.meta.env.VITE_PATH ?? ''
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch((error: unknown) => console.warn('Service worker:', error))
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

/** Lo guardado para usar sin conexión: cuántos ficheros y cuánto ocupan (aproximado, lo que dicen sus cabeceras) */
export async function offlineUsage(): Promise<{ files: number, bytes: number }> {
  if (typeof caches === 'undefined') return { files: 0, bytes: 0 }
  let files = 0
  let bytes = 0
  for (const key of (await caches.keys()).filter((name) => name.startsWith(CACHE_PREFIX))) {
    const cache = await caches.open(key)
    for (const request of await cache.keys()) {
      files += 1
      const response = await cache.match(request)
      bytes += Number(response?.headers.get('content-length') ?? 0)
    }
  }
  return { files, bytes }
}

/** Borra lo guardado para usar sin conexión (se volverá a guardar al usar la aplicación) */
export async function clearOfflineData() {
  if (typeof caches === 'undefined') return
  await Promise.all((await caches.keys()).filter((name) => name.startsWith(CACHE_PREFIX)).map((name) => caches.delete(name)))
}
