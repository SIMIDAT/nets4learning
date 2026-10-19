// Por qué paso va cada guía (localStorage, en el navegador de quien la usa): al recargar la página, también cuando el
// móvil la recarga al desbloquearlo, se sigue donde se estaba en vez de empezar de cero.

export type GuideProgress_t = {
  /** Paso en el que se estaba (desde 0) */
  step   : number
  /** La guía estaba abierta: al recargar se vuelve a abrir sola */
  open   : boolean
  savedAt: number
}

/** Una guía abierta hace más de esto ya no se abre sola al volver (se sigue con el botón) */
export const RESTORE_MS = 60 * 60 * 1000

const storageKey = (id: string) => `n4l-guide-progress.${id}`

export function readGuideProgress(id: string): GuideProgress_t | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(id)) ?? 'null')
    if (value === null || typeof value !== 'object') return null
    const { step, open, savedAt } = value as Partial<GuideProgress_t>
    if (typeof step !== 'number' || !Number.isInteger(step) || step < 0 || typeof savedAt !== 'number') return null
    return { step, open: open === true, savedAt }
  } catch {
    return null
  }
}

export function saveGuideProgress(id: string, step: number, open: boolean) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify({ step, open, savedAt: Date.now() }))
  } catch {
    // Sin almacenamiento, la guía empieza de cero al recargar
  }
}

export function clearGuideProgress(id: string) {
  try {
    localStorage.removeItem(storageKey(id))
  } catch {
    // Nada que borrar
  }
}

/** Olvida por qué paso va cada guía: todas vuelven a empezar desde el principio */
export function clearAllGuideProgress() {
  try {
    Object.keys(localStorage).filter((key) => key.startsWith('n4l-guide-progress.')).forEach((key) => localStorage.removeItem(key))
  } catch {
    // Sin almacenamiento no había nada guardado
  }
}

/** Si la guía estaba abierta hace poco, se vuelve a abrir sola al cargar la página */
export const shouldRestore = (progress: GuideProgress_t | null, now = Date.now()) =>
  progress !== null && progress.open && now - progress.savedAt < RESTORE_MS
