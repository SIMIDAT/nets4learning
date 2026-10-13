/*
 * Service worker de Nets4Learning: para seguir usando sin conexión lo que ya se ha abierto (en clase, con mala wifi) y
 * para no volver a descargar los modelos preentrenados. No descarga nada por adelantado: guarda lo que se va usando.
 *  - Páginas: primero la red; sin conexión, la última versión guardada de la aplicación.
 *  - Código (ficheros con hash en el nombre, no cambian nunca): guardado la primera vez.
 *  - Traducciones y conjuntos de datos: lo guardado enseguida y, por detrás, se actualiza.
 *  - Modelos preentrenados, en su propia caché (n4l-models-…): los de otras webs (Google Storage, jsDelivr…: los de
 *    detección de objetos de MediaPipe, MoveNet, COCO-SSD…), guardados la primera vez y sin volver a descargarlos; los
 *    de la aplicación (models/: face-api…), lo guardado enseguida y, por detrás, se actualiza.
 *  - Analíticas: nunca.
 * Con `sw.js?models` (en desarrollo) solo guarda los modelos: el código lo sirve Vite y guardarlo serviría código viejo.
 * Se borra desde /settings (y con «Restablecer todo»). Al cambiar VERSION se borran las cachés de la aplicación de la
 * anterior; los modelos tienen su propia versión, MODELS_VERSION, para no volver a descargarlos con cada versión.
 */
const VERSION = 'v1'
const MODELS_VERSION = 'v1'
const SHELL = `n4l-shell-${VERSION}`
const RUNTIME = `n4l-runtime-${VERSION}`
const MODELS = `n4l-models-${MODELS_VERSION}`
const CDN_HOSTS = ['storage.googleapis.com', 'tfhub.dev', 'www.kaggle.com', 'cdn.jsdelivr.net', 'unpkg.com']
const SKIP_HOSTS = ['google-analytics.com', 'googletagmanager.com', 'analytics.google.com']
const MODELS_ONLY = new URL(self.location.href).searchParams.has('models')

// La raíz de la aplicación (https://…/ o https://…/n4l/): ahí está su index.html
const scope = self.registration.scope

const isModel = (url) => CDN_HOSTS.includes(url.hostname) || url.href.startsWith(`${scope}models/`)

// Los modelos que la versión anterior guardaba con todo lo demás pasan a su caché, sin volver a descargarlos
async function moveModels() {
  if (!(await caches.has(RUNTIME))) return
  const [runtime, models] = await Promise.all([caches.open(RUNTIME), caches.open(MODELS)])
  for (const request of await runtime.keys()) {
    if (!isModel(new URL(request.url))) continue
    const response = await runtime.match(request)
    if (response) await models.put(request, response)
    await runtime.delete(request)
  }
}

self.addEventListener('install', (event) => {
  if (MODELS_ONLY) {
    event.waitUntil(self.skipWaiting())
    return
  }
  event.waitUntil(caches.open(SHELL)
    .then((cache) => cache.add(new Request(scope, { cache: 'reload' })))
    .then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await moveModels()
    const keep = MODELS_ONLY ? [MODELS] : [SHELL, RUNTIME, MODELS]
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith('n4l-') && !keep.includes(key)).map((key) => caches.delete(key)))
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

async function cacheFirst(request, name) {
  const cache = await caches.open(name)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}

async function staleWhileRevalidate(event, name) {
  const cache = await caches.open(name)
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
  // Los modelos: los de otras webs no cambian (su dirección lleva la versión); los de la aplicación, quizá sí
  if (isModel(url)) {
    event.respondWith(url.origin === self.location.origin ? staleWhileRevalidate(event, MODELS) : cacheFirst(request, MODELS))
    return
  }
  if (MODELS_ONLY) return
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request))
    return
  }
  if (url.origin === self.location.origin) {
    if (!url.href.startsWith(scope)) return
    event.respondWith(isHashedAsset(url) ? cacheFirst(request, RUNTIME) : staleWhileRevalidate(event, RUNTIME))
  }
})
