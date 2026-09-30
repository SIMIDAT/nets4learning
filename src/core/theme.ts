export const THEMES = ['light', 'dark'] as const
export type Theme_t = typeof THEMES[number]

const THEME_STORAGE_KEY = 'theme'

export const isTheme = (value: string): value is Theme_t => (THEMES as readonly string[]).includes(value)

/** Tema con el que arranca la aplicación: el que eligió el usuario (si está guardado), si no el del sistema */
export function detectTheme(saved: string | null, systemPrefersDark: boolean): Theme_t {
  if (saved !== null && isTheme(saved)) return saved
  return systemPrefersDark ? 'dark' : 'light'
}

// localStorage puede no estar disponible (modo privado, almacenamiento bloqueado…): entonces no se recuerda
export function readSavedTheme(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    return null
  }
}

export function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

/** Aplica el tema a Bootstrap (`data-bs-theme`) y a los estilos propios (`data-theme`) */
export function applyTheme(theme: Theme_t) {
  document.documentElement.setAttribute('data-bs-theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
}

/** Cambia el tema porque lo ha elegido el usuario y lo recuerda para las siguientes visitas */
export function changeUserTheme(theme: Theme_t) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Sin almacenamiento: el tema solo dura esta visita
  }
  applyTheme(theme)
}
