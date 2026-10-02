// Protocolo entre el hilo principal y los workers: cada petición lleva un id y su respuesta lo repite, así varias
// peticiones pueden ir a la vez y cada una recibe la suya. Una tarea larga (un entrenamiento) puede mandar mensajes de
// progreso antes de su respuesta, y el hilo principal puede pedirle que pare.

/** Lo que recibe cada función del worker además de su dato */
export type WorkerTaskContext_t = {
  /** Manda un aviso de progreso a quien hizo la petición */
  progress : (data: unknown) => void
  /** true si quien hizo la petición pidió parar */
  cancelled: () => boolean
}

/** Las funciones que expone un worker: reciben un dato y devuelven otro (o una promesa) */
export type WorkerApi_t = Record<string, (payload: never, context: WorkerTaskContext_t) => unknown>

/** Mensaje de control para pedir que pare la tarea con ese id */
export const CANCEL_REQUEST = '__cancel'

export type WorkerRequest_t = { id: number, type: string, payload: unknown }
export type WorkerResponse_t = { id: number, result?: unknown, error?: string, progress?: unknown }

/**
 * Los `ArrayBuffer` de un resultado, para transferirlos en vez de copiarlos (un sprite de MNIST decodificado ocupa
 * 204 MB): los del propio valor, de arrays tipados y de las propiedades de los objetos (hasta tres niveles; de los
 * arrays solo los cortos, como la lista de buffers de los pesos de un modelo)
 */
export function transferablesOf(value: unknown): Transferable[] {
  const buffers = new Set<ArrayBuffer>()
  const visit = (item: unknown, depth: number) => {
    if (item instanceof ArrayBuffer) buffers.add(item)
    else if (ArrayBuffer.isView(item)) {
      if (item.buffer instanceof ArrayBuffer) buffers.add(item.buffer)
    } else if (depth < 3 && Array.isArray(item)) {
      if (item.length <= 16) item.forEach((child) => visit(child, depth + 1))
    } else if (depth < 3 && item !== null && typeof item === 'object') {
      for (const child of Object.values(item)) visit(child, depth + 1)
    }
  }
  visit(value, 0)
  return [...buffers]
}
