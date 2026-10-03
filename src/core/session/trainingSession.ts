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

// region Enlace para compartir: la sesión va en la dirección, tras #n4z= (JSON comprimido con deflate, en base64url) o,
// si el navegador no sabe comprimir, tras #n4l= (el JSON tal cual). Lo que va tras # no llega al servidor: la
// configuración solo la ve quien abre el enlace. Comprimida ocupa unas tres veces menos: el QR se lee mejor.
const PLAIN_PREFIX = '#n4l='
const DEFLATE_PREFIX = '#n4z='

const toBase64Url = (bytes: Uint8Array) => {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const fromBase64Url = (text: string) => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0))

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  return new Uint8Array(await new Response(new Response(bytes as BlobPart).body!.pipeThrough(stream)).arrayBuffer())
}

/** La parte de la dirección con la sesión (#n4z=… o #n4l=…) */
export async function sessionHash(session: TrainingSession_t): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(session))
  if (typeof CompressionStream !== 'function') return PLAIN_PREFIX + toBase64Url(bytes)
  return DEFLATE_PREFIX + toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))
}

/** El texto (JSON) de la sesión que viene en la dirección; null si no trae ninguna. Lo valida parseSession */
export async function sessionFromHash(hash: string): Promise<string | null> {
  const isDeflated = hash.startsWith(DEFLATE_PREFIX)
  if (!isDeflated && !hash.startsWith(PLAIN_PREFIX)) return null
  try {
    const encoded = fromBase64Url(hash.slice(PLAIN_PREFIX.length))
    const bytes = isDeflated ? await pipe(encoded, new DecompressionStream('deflate-raw')) : encoded
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new SessionError('session.error-link')
  }
}
// endregion
