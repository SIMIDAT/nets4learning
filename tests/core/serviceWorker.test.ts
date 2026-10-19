import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, test, vi } from 'vitest'

// public/sw.js, ejecutado en un contexto aparte con lo que le da el navegador a un service worker: cachés y fetch
// falsos. Así se comprueba a qué caché va cada cosa y qué se vuelve a descargar

const SCOPE = 'https://n4l.test/n4l/'
const SOURCE = readFileSync('public/sw.js', 'utf8')

class FakeCache {
  entries = new Map<string, Response>()
  async match(request: Request | string) {
    return this.entries.get(typeof request === 'string' ? request : request.url)?.clone()
  }
  async put(request: Request | string, response: Response) {
    this.entries.set(typeof request === 'string' ? request : request.url, response)
  }
  async keys() {
    return [...this.entries.keys()].map((url) => new Request(url))
  }
  async delete(request: Request | string) {
    return this.entries.delete(typeof request === 'string' ? request : request.url)
  }
}

function serviceWorker({ modelsOnly = false, caches: initial = {} as Record<string, Record<string, string>> } = {}) {
  const stores = new Map<string, FakeCache>()
  for (const [name, entries] of Object.entries(initial)) {
    const cache = new FakeCache()
    for (const [url, body] of Object.entries(entries)) cache.entries.set(url, new Response(body))
    stores.set(name, cache)
  }
  const caches = {
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new FakeCache())
      return stores.get(name)!
    },
    has   : async (name: string) => stores.has(name),
    keys  : async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match : async (request: Request) => {
      for (const cache of stores.values()) {
        const response = await cache.match(request)
        if (response) return response
      }
      return undefined
    },
  }
  const network = vi.fn(async (request: Request) => new Response(`red: ${request.url}`))
  const listeners: Record<string, (event: unknown) => void> = {}
  const self = {
    location        : new URL(`${SCOPE}sw.js${modelsOnly ? '?models' : ''}`),
    registration    : { scope: SCOPE },
    clients         : { claim: async () => undefined },
    skipWaiting     : async () => undefined,
    addEventListener: (type: string, listener: (event: unknown) => void) => { listeners[type] = listener },
  }
  runInNewContext(SOURCE, { self, caches, fetch: network, URL, Request, Response, console })

  /** Una petición: lo que responde el service worker (null si la deja pasar a la red) */
  async function request(url: string, init: RequestInit = {}) {
    let response: Promise<Response> | null = null
    const waits: Array<Promise<unknown>> = []
    listeners.fetch({
      request    : new Request(url, init),
      respondWith: (promise: Promise<Response>) => { response = promise },
      waitUntil  : (promise: Promise<unknown>) => { waits.push(promise) },
    })
    const result = response === null ? null : await (response as Promise<Response>).then((r) => r.text())
    await Promise.all(waits)
    return result
  }
  async function lifecycle(type: 'install' | 'activate') {
    let done: Promise<unknown> = Promise.resolve()
    listeners[type]({ waitUntil: (promise: Promise<unknown>) => { done = promise } })
    await done
  }
  const urls = (name: string) => [...(stores.get(name)?.entries.keys() ?? [])]
  return { request, lifecycle, network, stores, urls }
}

const MEDIAPIPE = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh_solution_packed_assets.data'
const COCO = 'https://storage.googleapis.com/tfjs-models/savedmodel/ssdlite_mobilenet_v2/model.json'
const FACE_API = `${SCOPE}models/02-object-detection/face-api-js/v1.7.14/ssd_mobilenetv1_model-weights_manifest.json`

describe('public/sw.js: los modelos preentrenados se guardan en el navegador (Cache Storage)', () => {
  test('un modelo de otra web se guarda en n4l-models-v1 la primera vez y después no se vuelve a descargar', async () => {
    const worker = serviceWorker()
    expect(await worker.request(COCO)).toBe(`red: ${COCO}`)
    expect(await worker.request(COCO)).toBe(`red: ${COCO}`)
    expect(worker.network).toHaveBeenCalledTimes(1)
    expect(worker.urls('n4l-models-v1')).toEqual([COCO])
    expect(worker.urls('n4l-runtime-v1')).toEqual([])
  })

  test('los de la aplicación (face-api) también van a la caché de modelos', async () => {
    const worker = serviceWorker()
    await worker.request(FACE_API)
    expect(worker.urls('n4l-models-v1')).toEqual([FACE_API])
  })

  test('en desarrollo (sw.js?models): se guardan los modelos y el código se deja pasar a Vite', async () => {
    const worker = serviceWorker({ modelsOnly: true })
    await worker.lifecycle('install')
    expect(await worker.request(MEDIAPIPE)).toBe(`red: ${MEDIAPIPE}`)
    expect(await worker.request(MEDIAPIPE)).toBe(`red: ${MEDIAPIPE}`)
    expect(worker.network).toHaveBeenCalledTimes(1)
    expect(await worker.request(`${SCOPE}src/main.tsx`)).toBeNull()
    expect(await worker.request(SCOPE, { mode: 'same-origin' })).toBeNull()
    expect([...worker.stores.keys()]).toEqual(['n4l-models-v1'])
  })

  test('el código de la aplicación sigue en su caché, sin mezclarse con los modelos', async () => {
    const worker = serviceWorker()
    const asset = `${SCOPE}assets/index-AbCdEf123456.js`
    await worker.request(asset)
    expect(worker.urls('n4l-runtime-v1')).toEqual([asset])
    expect(worker.urls('n4l-models-v1')).toEqual([])
  })

  test('al activarse, los modelos que la versión anterior guardaba con todo lo demás pasan a su caché', async () => {
    const asset = `${SCOPE}assets/index-AbCdEf123456.js`
    const worker = serviceWorker({ caches: { 'n4l-runtime-v1': { [COCO]: 'coco', [asset]: 'código' }, 'n4l-runtime-v0': { [asset]: 'viejo' } } })
    await worker.lifecycle('activate')
    expect(worker.urls('n4l-models-v1')).toEqual([COCO])
    expect(worker.urls('n4l-runtime-v1')).toEqual([asset])
    expect(worker.stores.has('n4l-runtime-v0')).toBe(false)
    // Y se sirve de ahí, sin descargarlo
    expect(await worker.request(COCO)).toBe('coco')
    expect(worker.network).not.toHaveBeenCalled()
  })
})
