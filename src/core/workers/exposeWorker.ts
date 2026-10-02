import { CANCEL_REQUEST, transferablesOf, type WorkerApi_t, type WorkerRequest_t, type WorkerResponse_t } from './workerProtocol'

/** Lo que se usa del ámbito global de un worker (los tipos de WebWorker chocan con los del DOM en el tsconfig) */
export type WorkerScope_t = {
  postMessage     : (message: WorkerResponse_t, transfer: Transferable[]) => void
  addEventListener: (type: 'message', listener: (event: MessageEvent<WorkerRequest_t>) => void) => void
}

/**
 * Dentro de un worker: atiende las peticiones con las funciones de `api` y devuelve cada resultado (o su error). Cada
 * función recibe también cómo mandar progreso y si se ha pedido parar
 */
export function exposeWorker(api: WorkerApi_t, scope: WorkerScope_t = self as unknown as WorkerScope_t) {
  const cancelled = new Set<number>()
  scope.addEventListener('message', async (event) => {
    const { id, type, payload } = event.data
    if (type === CANCEL_REQUEST) {
      cancelled.add(id)
      return
    }
    let response: WorkerResponse_t
    let transfer: Transferable[] = []
    try {
      const handler = api[type]
      if (handler === undefined) throw new Error(`Unknown worker request: ${type}`)
      const result = await handler(payload as never, {
        progress : (data) => scope.postMessage({ id, progress: data }, []),
        cancelled: () => cancelled.has(id),
      })
      response = { id, result }
      transfer = transferablesOf(result)
    } catch (error) {
      response = { id, error: error instanceof Error ? error.message : String(error) }
    } finally {
      cancelled.delete(id)
    }
    scope.postMessage(response, transfer)
  })
}
