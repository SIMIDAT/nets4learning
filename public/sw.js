/*
 * Service worker de Nets4Learning: para seguir usando sin conexión lo que ya se ha abierto (en clase, con mala wifi).
 * No descarga nada por adelantado: guarda lo que se va usando.
 *  - Páginas: primero la red; sin conexión, la última versión guardada de la aplicación.
 *  - Código (ficheros con hash en el nombre, no cambian nunca): guardado la primera vez.
 *  - Traducciones, conjuntos de datos y modelos de la aplicación: lo guardado enseguida y, por detrás, se actualiza.
 *  - Modelos de otras webs (Google Storage, jsDelivr…): guardados la primera vez.
 *  - Analíticas: nunca.
 * Se borra desde /settings (y con «Restablecer todo»). Al cambiar VERSION se borran las cachés de la anterior.
 */
const VERSION = 'v1'
const SHELL = `n4l-shell-${VERSION}`
const RUNTIME = `n4l-runtime-${VERSION}`
const CDN_HOSTS = ['storage.googleapis.com', 'tfhub.dev', 'www.kaggle.com', 'cdn.jsdelivr.net', 'unpkg.com']
const SKIP_HOSTS = ['google-analytics.com', 'googletagmanager.com', 'analytics.google.com']

// La raíz de la aplicación (https://…/ o https://…/n4l/): ahí está su index.html
const scope = self.registration.scope

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL)
    .then((cache) => cache.add(new Request(scope, { cache: 'reload' })))
    .then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith('n4l-') && key !== SHELL && key !== RUNTIME).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

const isHashedAsset = (url) => /\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.\w+$/.test(url.pathname)

async function networkFirstPage(request) {
  try {
    const response = await fetch(request)
    if (response.ok) await (await caches.open(SHELL)).put(scope, response.clone())
    return response
  } catch {
    return (await caches.match(scope)) ?? Response.error()
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) await (await caches.open(RUNTIME)).put(request, response.clone())
  return response
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(RUNTIME)
  const cached = await cache.match(event.request)
  const update = fetch(event.request)
    .then(async (response) => {
      if (response.ok) await cache.put(event.request, response.clone())
      return response
    })
    .catch(() => cached ?? Response.error())
  if (cached) {
    event.waitUntil(update)
    return cached
  }
  return update
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || request.headers.has('range')) return
  const url = new URL(request.url)
  if (SKIP_HOSTS.some((host) => url.hostname.endsWith(host))) return
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request))
    return
  }
  if (url.origin === self.location.origin) {
    if (!url.href.startsWith(scope)) return
    event.respondWith(isHashedAsset(url) ? cacheFirst(request) : staleWhileRevalidate(event))
    return
  }
  if (CDN_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(request))
})
