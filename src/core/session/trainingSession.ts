import type { TASKS_TYPE_V } from '@/TASKS'

/**
 * Arquitectura e hiperparámetros de una página de entrenamiento, para guardarlos en un fichero JSON y compartirlos
 * (p. ej. un docente reparte una arquitectura de partida). Los datos y los modelos entrenados no se guardan.
 */
export type TrainingSession_t = {
  app            : 'nets4learning'
  version        : 1
  task           : TASKS_TYPE_V
  /** Dataset con el que se guardó: se puede importar en otro de la misma tarea */
  dataset        : string
  /** Capas tal como las usa el editor de la tarea (dense: units y activation; imágenes: además _class, kernelSize…) */
  layers         : Array<Record<string, unknown>>
  hyperparameters: {
    learningRate: number
    epochs      : number
    /** Porcentaje (1–100) */
    testSize    : number
    optimizer   : string
    loss        : string
    metrics     : string[]
  }
}

/** Error de un fichero que no se puede importar; `i18nKey` es el mensaje para el usuario */
export class SessionError extends Error {
  readonly i18nKey: string

  constructor(i18nKey: string) {
    super(i18nKey)
    this.i18nKey = i18nKey
  }
}

export function sessionFileName(session: TrainingSession_t): string {
  return `nets4learning-${session.task}-${session.dataset}.json`.toLowerCase()
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** Lee y valida un fichero de sesión para la tarea `task` */
export function parseSession(text: string, task: TASKS_TYPE_V): TrainingSession_t {
  let data: Partial<TrainingSession_t>
  try {
    data = JSON.parse(text)
  } catch {
    throw new SessionError('session.error-not-json')
  }
  if (data?.app !== 'nets4learning' || data.version !== 1) throw new SessionError('session.error-not-session')
  if (data.task !== task) throw new SessionError('session.error-other-task')

  const { layers, hyperparameters: h } = data
  const validLayers = Array.isArray(layers) && layers.length > 0 && layers.every((layer) => typeof layer === 'object' && layer !== null)
  const validHyperparameters = typeof h === 'object' && h !== null
    && isFiniteNumber(h.learningRate) && isFiniteNumber(h.epochs) && isFiniteNumber(h.testSize)
    && typeof h.optimizer === 'string' && typeof h.loss === 'string'
    && Array.isArray(h.metrics) && h.metrics.every((metric) => typeof metric === 'string')
  if (!validLayers || !validHyperparameters) throw new SessionError('session.error-not-session')
  return data as TrainingSession_t
}

/** Descarga la sesión como fichero JSON */
export function downloadSession(session: TrainingSession_t) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = sessionFileName(session)
  link.click()
  URL.revokeObjectURL(url)
}
