import { useSyncExternalStore } from 'react'

import { trackEvent } from '@core/analytics'

// Si se enseña la sección Paso a paso (N4LStepByStep) en las páginas de entrenamiento y en las de los modelos. Está
// oculta por defecto y se activa en /settings; se guarda en el navegador de quien la elige.

export const STEP_BY_STEP_STORAGE_KEY = 'n4l-step-by-step'

function readSaved(): boolean {
  try {
    return localStorage.getItem(STEP_BY_STEP_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

let current: boolean | null = null
const listeners = new Set<() => void>()

export const isStepByStepEnabled = (): boolean => (current ??= readSaved())

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function setStepByStepEnabled(enabled: boolean) {
  current = enabled
  try {
    if (enabled) localStorage.setItem(STEP_BY_STEP_STORAGE_KEY, 'true')
    else localStorage.removeItem(STEP_BY_STEP_STORAGE_KEY)
  } catch {
    // Sin almacenamiento vale solo para esta visita
  }
  trackEvent('settings_change', { setting: 'step_by_step', value: String(enabled) })
  listeners.forEach((listener) => listener())
}

/** Vuelve a ocultarla (y lo olvida): para "Restablecer todo" en /settings */
export function resetStepByStep() {
  current = false
  try {
    localStorage.removeItem(STEP_BY_STEP_STORAGE_KEY)
  } catch {
    // Nada que borrar
  }
  listeners.forEach((listener) => listener())
}

/** Si la sección Paso a paso está activada; cambia en cuanto se activa o desactiva en /settings */
export function useStepByStepEnabled(): boolean {
  return useSyncExternalStore(subscribe, isStepByStepEnabled, () => false)
}
