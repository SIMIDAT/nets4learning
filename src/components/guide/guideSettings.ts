import { useSyncExternalStore } from 'react'

// Ajustes de la voz de las guías: los cambia la propia guía (desde su bocadillo) y /settings, y los dos se enteran al
// momento. Se guardan en el navegador de quien los elige.

export type GuideSettings_t = {
  /** Leer cada paso en voz alta */
  voice : boolean
  /** Pasar al siguiente paso al terminar de leer el actual */
  auto  : boolean
  /** Velocidad de la voz: 1 es la normal */
  rate  : number
  /** La voz elegida para cada idioma ("es", "en", "ja"…), por su voiceURI; sin ella, la elige la aplicación */
  voices: Record<string, string>
}

export const DEFAULT_GUIDE_SETTINGS: GuideSettings_t = { voice: true, auto: false, rate: 1, voices: {} }

/** Velocidades que se pueden elegir */
export const MIN_RATE = 0.5
export const MAX_RATE = 2

export const GUIDE_SETTINGS_STORAGE_KEY = 'n4l-guide-settings'

/** Lo guardado, con lo que no sea válido cambiado por su valor por defecto */
function readSettings(): GuideSettings_t {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(GUIDE_SETTINGS_STORAGE_KEY) ?? 'null')
    if (saved === null || typeof saved !== 'object') return DEFAULT_GUIDE_SETTINGS
    const { voice, auto, rate, voices } = saved as Partial<GuideSettings_t>
    return {
      voice : typeof voice === 'boolean' ? voice : DEFAULT_GUIDE_SETTINGS.voice,
      auto  : typeof auto === 'boolean' ? auto : DEFAULT_GUIDE_SETTINGS.auto,
      rate  : typeof rate === 'number' && rate >= MIN_RATE && rate <= MAX_RATE ? rate : DEFAULT_GUIDE_SETTINGS.rate,
      voices: voices !== null && typeof voices === 'object'
        ? Object.fromEntries(Object.entries(voices).filter(([, uri]) => typeof uri === 'string'))
        : {},
    }
  } catch {
    return DEFAULT_GUIDE_SETTINGS
  }
}

let current: GuideSettings_t | null = null
const listeners = new Set<() => void>()

export const getGuideSettings = (): GuideSettings_t => (current ??= readSettings())

function notify() {
  listeners.forEach((listener) => listener())
}

export function updateGuideSettings(patch: Partial<GuideSettings_t>) {
  current = { ...getGuideSettings(), ...patch }
  try {
    localStorage.setItem(GUIDE_SETTINGS_STORAGE_KEY, JSON.stringify(current))
  } catch {
    // Sin almacenamiento los ajustes valen solo para esta visita
  }
  notify()
}

/** Elige la voz de un idioma ("" vuelve a la que elige la aplicación) */
export function setGuideVoice(language: string, voiceURI: string) {
  const voices = { ...getGuideSettings().voices }
  if (voiceURI === '') delete voices[language]
  else voices[language] = voiceURI
  updateGuideSettings({ voices })
}

/** Vuelve a los ajustes por defecto (y los olvida) */
export function resetGuideSettings() {
  current = DEFAULT_GUIDE_SETTINGS
  try {
    localStorage.removeItem(GUIDE_SETTINGS_STORAGE_KEY)
  } catch {
    // Nada que borrar
  }
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const useGuideSettings = () => useSyncExternalStore(subscribe, getGuideSettings, () => DEFAULT_GUIDE_SETTINGS)
