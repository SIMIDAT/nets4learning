import { canUseWorkers, createWorkerClient } from '@core/workers/workerClient'
import { ModelDefinitionError } from './buildModels'
import type { TrainingWorkerApi_t } from './training.worker'
import { BACKEND_ERROR_PREFIX, DEFINITION_ERROR_PREFIX, type TrainingProgress_t, type TrainingResult_t } from './trainingTypes'

/** No se puede entrenar en un worker (no hay, no carga o no tiene el backend elegido): se entrena en el hilo principal */
export class TrainingWorkerUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TrainingWorkerUnavailableError'
  }
}

// Un worker para todos los entrenamientos de la visita: los shaders que compila se reutilizan en los siguientes
const client = createWorkerClient<TrainingWorkerApi_t>(
  () => new Worker(new URL('./training.worker.ts', import.meta.url), { type: 'module' }),
)

export type TrainInWorkerOptions_t = {
  onProgress?: (progress: TrainingProgress_t) => void
  /** Se consulta a menudo: si devuelve true, se pide al worker que pare al acabar el lote */
  shouldStop?: () => boolean
  transfer?  : Transferable[]
}

/** Traduce los errores que llegan del worker como texto */
function trainingError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error)
  if (message.startsWith(DEFINITION_ERROR_PREFIX)) {
    const [kind, ...rest] = message.slice(DEFINITION_ERROR_PREFIX.length).split(':')
    return new ModelDefinitionError(rest.join(':'), kind === 'compile' ? 'compile' : 'activation')
  }
  if (message.startsWith(BACKEND_ERROR_PREFIX)) return new TrainingWorkerUnavailableError(`Backend not available in the worker: ${message.slice(BACKEND_ERROR_PREFIX.length)}`)
  // El worker no se pudo crear o su módulo no cargó
  if (!(error instanceof Error) || /Web Workers are not available|Worker error|Failed to fetch|import/i.test(message)) {
    return new TrainingWorkerUnavailableError(message)
  }
  return error
}

/** Entrena en el worker (`trainDense` o `trainImages`) */
export async function trainInWorker<K extends keyof TrainingWorkerApi_t>(
  type: K,
  request: Parameters<TrainingWorkerApi_t[K]>[0],
  { onProgress, shouldStop, transfer }: TrainInWorkerOptions_t = {},
): Promise<TrainingResult_t> {
  if (!canUseWorkers()) throw new TrainingWorkerUnavailableError('Web Workers are not available')
  const controller = new AbortController()
  const checkStop = () => {
    if (!controller.signal.aborted && shouldStop?.()) controller.abort()
  }
  // Además de con cada aviso, por si un lote tarda (al pedir parar, el botón responde enseguida)
  const timer = setInterval(checkStop, 150)
  try {
    return await client.call(type, request as never, {
      transfer,
      signal    : controller.signal,
      onProgress: (data) => {
        checkStop()
        onProgress?.(data as TrainingProgress_t)
      },
    }) as TrainingResult_t
  } catch (error) {
    throw trainingError(error)
  } finally {
    clearInterval(timer)
  }
}
