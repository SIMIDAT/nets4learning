import { clearConsent } from '@core/analytics'
import { LANGUAGE_STORAGE_KEY } from '@core/i18n/language'
import { THEME_STORAGE_KEY } from '@core/theme'
import { TF_BACKEND_STORAGE_KEY } from '@core/tfBackend'
import { clearAllGuideProgress } from '@components/guide/guideProgress'
import { resetGuideSettings } from '@components/guide/guideSettings'

// Lo que la aplicación guarda en el navegador (localStorage y la cookie del consentimiento), para borrarlo desde
// /settings.

/** Los tutoriales de las páginas de entrenamiento (N4LJoyride) salen solos la primera vez y apuntan que ya se vieron */
const isTrainingTutorialKey = (key: string) => key.includes('.joyride-')

/** Cuántos tutoriales de entrenamiento se han visto ya en este navegador */
export function countSeenTrainingTutorials(): number {
  try {
    return Object.keys(localStorage).filter(isTrainingTutorialKey).length
  } catch {
    return 0
  }
}

/** Los tutoriales de entrenamiento vuelven a salir solos la próxima vez que se entre en cada página */
export function resetTrainingTutorials() {
  try {
    Object.keys(localStorage).filter(isTrainingTutorialKey).forEach((key) => localStorage.removeItem(key))
  } catch {
    // Sin almacenamiento no había nada guardado
  }
}

/** Borra todos los ajustes: idioma, tema, backend, voz y progreso de las guías, tutoriales vistos y cookies */
export function resetAllSettings() {
  try {
    [LANGUAGE_STORAGE_KEY, THEME_STORAGE_KEY, TF_BACKEND_STORAGE_KEY].forEach((key) => localStorage.removeItem(key))
  } catch {
    // Sin almacenamiento no había nada guardado
  }
  resetGuideSettings()
  clearAllGuideProgress()
  resetTrainingTutorials()
  clearConsent()
}
