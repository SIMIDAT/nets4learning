import { CANCEL_REQUEST, type WorkerApi_t, type WorkerRequest_t, type WorkerResponse_t } from './workerProtocol'

type Pending_t = { resolve: (value: unknown) => void, reject: (reason: Error) => void, onProgress?: (data: unknown) => void }

export type WorkerCallOptions_t = {
  /** Buffers del dato que se mueven al worker en vez de copiarse */
  transfer?  : Transferable[]
  /** Avisos de progreso de la tarea */
  onProgress?: (data: unknown) => void
  /** Al abortarlo se pide al worker que pare la tarea (ella decide cuándo; la respuesta llega igual) */
  signal?    : AbortSignal
}

export type WorkerClient_t<TApi extends WorkerApi_t> = {
  /** Ejecuta `type` en el worker */
  call     : <K extends keyof TApi & string>(type: K, payload: Parameters<TApi[K]>[0], options?: WorkerCallOptions_t) => Promise<Awaited<ReturnType<TApi[K]>>>
  /** Para el worker; lo que estuviera pendiente falla */
  terminate: () => void
}

/** Si el navegador puede crear workers (en jsdom, el de los tests, no) */
export const canUseWorkers = () => typeof Worker !== 'undefined'

/**
 * Cliente de un worker que se crea al hacer la primera petición. Sin workers (jsdom, navegadores antiguos), cada
 * petición se resuelve con `fallback` en el mismo hilo, si lo hay, o falla para que quien llama use su camino de
 * siempre.
 */
export function createWorkerClient<TApi extends WorkerApi_t>(create: () => Worker, fallback?: TApi): WorkerClient_t<TApi> {
  let worker: Worker | null = null
  let nextId = 0
  const pending = new Map<number, Pending_t>()

  const rejectAll = (error: Error) => {
    for (const { reject } of pending.values()) reject(error)
    pending.clear()
  }

  const start = () => {
    const created = create()
    created.addEventListener('message', (event: MessageEvent<WorkerResponse_t>) => {
      const { id, result, error, progress } = event.data
      const request = pending.get(id)
      if (request === undefined) return
      if (progress !== undefined && result === undefined && error === undefined) {
        request.onProgress?.(progress)
        return
      }
      pending.delete(id)
      if (error !== undefined) request.reject(new Error(error))
      else request.resolve(result)
    })
    // Un error sin capturar (o que el módulo no cargue) deja el worker inservible: se descarta y el siguiente se crea
    created.addEventListener('error', (event) => {
      event.preventDefault()
      rejectAll(new Error(event.message || 'Worker error'))
      created.terminate()
      if (worker === created) worker = null
    })
    return created
  }

  return {
    call(type, payload, { transfer = [], onProgress, signal } = {}) {
      if (!canUseWorkers()) {
        if (fallback === undefined) return Promise.reject(new Error('Web Workers are not available'))
        const context = { progress: (data: unknown) => onProgress?.(data), cancelled: () => signal?.aborted ?? false }
        return Promise.resolve().then(() => fallback[type](payload as never, context)) as Promise<Awaited<ReturnType<TApi[typeof type]>>>
      }
      worker ??= start()
      const target = worker
      const id = ++nextId
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve: resolve as (value: unknown) => void, reject, onProgress })
        signal?.addEventListener('abort', () => target.postMessage({ id, type: CANCEL_REQUEST, payload: null } satisfies WorkerRequest_t), { once: true })
        target.postMessage({ id, type, payload } satisfies WorkerRequest_t, transfer)
      })
    },
    terminate() {
      worker?.terminate()
      worker = null
      rejectAll(new Error('Worker terminated'))
    },
  }
}
