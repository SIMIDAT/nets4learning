import { useSyncExternalStore } from 'react'

// Los ajustes de accesibilidad de /settings: cómo se ve y se mueve la aplicación. Se guardan en el navegador de quien
// los elige y se aplican en <html> (atributos y clases que usa globals.css) antes de pintar la página (index.html) y al
// cambiarlos. Lo que ya pide el sistema (movimiento reducido, más contraste) se respeta aunque no se elija aquí.
// No van a las analíticas: dirían qué necesidades tiene quien los usa.

export const TEXT_SIZES = [100, 125, 150, 200] as const
export type TextSize_t = typeof TEXT_SIZES[number]

export type DisplaySettings_t = {
  /** Tamaño del texto (y de todo lo que se mide en rem), en % */
  textSize      : TextSize_t
  /** El espaciado de WCAG 1.4.12: interlineado 1,5, párrafos, letras y palabras más separados */
  spacing       : boolean
  highContrast  : boolean
  reduceMotion  : boolean
  underlineLinks: boolean
  /** Un anillo de foco más grueso */
  strongFocus   : boolean
  /** Abrir el visor de tfjs-vis al entrenar (no es accesible; las curvas de la página dicen lo mismo) */
  openVisor     : boolean
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings_t = {
  textSize      : 100,
  spacing       : false,
  highContrast  : false,
  reduceMotion  : false,
  underlineLinks: false,
  strongFocus   : false,
  openVisor     : true,
}

export const DISPLAY_SETTINGS_STORAGE_KEY = 'n4l-display'

/** Lo guardado, con los valores por defecto en lo que falte o no valga */
export function parseDisplaySettings(raw: string | null): DisplaySettings_t {
  let saved: Record<string, unknown> = {}
  try {
    const value: unknown = JSON.parse(raw ?? '{}')
    if (value !== null && typeof value === 'object') saved = value as Record<string, unknown>
  } catch {
    // Mal guardado: los de por defecto
  }
  const flag = (key: Exclude<keyof DisplaySettings_t, 'textSize'>) => (typeof saved[key] === 'boolean' ? saved[key] as boolean : DEFAULT_DISPLAY_SETTINGS[key])
  return {
    textSize      : TEXT_SIZES.includes(saved.textSize as TextSize_t) ? saved.textSize as TextSize_t : DEFAULT_DISPLAY_SETTINGS.textSize,
    spacing       : flag('spacing'),
    highContrast  : flag('highContrast'),
    reduceMotion  : flag('reduceMotion'),
    underlineLinks: flag('underlineLinks'),
    strongFocus   : flag('strongFocus'),
    openVisor     : flag('openVisor'),
  }
}

function readSaved(): DisplaySettings_t {
  try {
    return parseDisplaySettings(localStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY))
  } catch {
    return DEFAULT_DISPLAY_SETTINGS
  }
}

let current: DisplaySettings_t | null = null
const listeners = new Set<() => void>()

export const getDisplaySettings = (): DisplaySettings_t => (current ??= readSaved())

const mediaMatches = (query: string) => (typeof window !== 'undefined' && window.matchMedia?.(query).matches) || false

/** Menos movimiento: elegido aquí o pedido por el sistema (para las animaciones que se hacen con JavaScript) */
export const prefersReducedMotion = () => getDisplaySettings().reduceMotion || mediaMatches('(prefers-reduced-motion: reduce)')

/** Si al entrenar se abre el visor de tfjs-vis */
export const shouldOpenVisor = () => getDisplaySettings().openVisor

/** Aplica los ajustes al documento: el tamaño en un atributo y el resto como clases (globals.css) */
export function applyDisplaySettings(settings: DisplaySettings_t = getDisplaySettings()) {
  const root = document.documentElement
  if (settings.textSize === 100) root.removeAttribute('data-n4l-text-size')
  else root.setAttribute('data-n4l-text-size', String(settings.textSize))
  root.classList.toggle('n4l-text-spacing', settings.spacing)
  root.classList.toggle('n4l-high-contrast', settings.highContrast || mediaMatches('(prefers-contrast: more)'))
  root.classList.toggle('n4l-reduce-motion', settings.reduceMotion)
  root.classList.toggle('n4l-underline-links', settings.underlineLinks)
  root.classList.toggle('n4l-strong-focus', settings.strongFocus)
}

/** Al arrancar: los aplica y sigue los cambios del sistema (más contraste) */
export function startDisplaySettings() {
  applyDisplaySettings()
  window.matchMedia?.('(prefers-contrast: more)').addEventListener?.('change', () => applyDisplaySettings())
}

export function subscribeDisplaySettings(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function save(settings: DisplaySettings_t) {
  current = settings
  try {
    localStorage.setItem(DISPLAY_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Sin almacenamiento vale solo para esta visita
  }
  applyDisplaySettings(settings)
  listeners.forEach((listener) => listener())
}

/** Cambia uno o varios ajustes (y lo recuerda) */
export function updateDisplaySettings(changes: Partial<DisplaySettings_t>) {
  save({ ...getDisplaySettings(), ...changes })
}

/** Vuelve a los de por defecto (y los olvida): para «Restablecer todo» en /settings */
export function resetDisplaySettings() {
  try {
    localStorage.removeItem(DISPLAY_SETTINGS_STORAGE_KEY)
  } catch {
    // Nada que borrar
  }
  current = DEFAULT_DISPLAY_SETTINGS
  applyDisplaySettings(current)
  listeners.forEach((listener) => listener())
}

/** Los ajustes; cambian en cuanto se cambian en /settings */
export function useDisplaySettings(): DisplaySettings_t {
  return useSyncExternalStore(subscribeDisplaySettings, getDisplaySettings, () => DEFAULT_DISPLAY_SETTINGS)
}
