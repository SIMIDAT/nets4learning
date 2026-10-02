import type { i18n } from 'i18next'

import { trackEvent } from '@core/analytics'

/** Idiomas con traducción en public/locales/<idioma>/translation.json */
export const SUPPORTED_LANGUAGES = ['en', 'es', 'ja'] as const
export type Language_t = typeof SUPPORTED_LANGUAGES[number]

/** Cada idioma con su nombre en ese idioma (sin banderas: un idioma no es un país) */
export const LANGUAGE_OPTIONS: Array<{ language: Language_t, label: string }> = [
  { language: 'en', label: 'English' },
  { language: 'es', label: 'Español' },
  { language: 'ja', label: '日本語' },
]

/** Idioma cuando no hay traducción para el del usuario */
export const DEFAULT_LANGUAGE: Language_t = 'en'

export const LANGUAGE_STORAGE_KEY = 'language'

export const isSupportedLanguage = (value: string): value is Language_t => (SUPPORTED_LANGUAGES as readonly string[]).includes(value)

/**
 * Idioma con el que arranca la aplicación: el que eligió el usuario (si está guardado), si no el primero
 * de los del navegador que tengamos traducido ("es-ES" → "es"), y si no inglés.
 */
export function detectLanguage(saved: string | null, browserLanguages: readonly string[]): Language_t {
  if (saved !== null && isSupportedLanguage(saved)) return saved
  for (const language of browserLanguages) {
    const base = language.toLowerCase().split('-')[0]
    if (isSupportedLanguage(base)) return base
  }
  return DEFAULT_LANGUAGE
}

// localStorage puede no estar disponible (modo privado, almacenamiento bloqueado…): entonces no se recuerda
export function readSavedLanguage(): string | null {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY)
  } catch {
    return null
  }
}

export function browserLanguages(): readonly string[] {
  return navigator.languages?.length ? navigator.languages : [navigator.language]
}

/** Cambia el idioma porque lo ha elegido el usuario y lo recuerda para las siguientes visitas */
export function changeUserLanguage(i18nInstance: i18n, language: Language_t) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Sin almacenamiento: el idioma solo dura esta visita
  }
  trackEvent('settings_change', { setting: 'language', value: language })
  return i18nInstance.changeLanguage(language)
}
