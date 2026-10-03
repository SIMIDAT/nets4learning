import { clearConsent } from '@core/analytics'
import { LANGUAGE_STORAGE_KEY } from '@core/i18n/language'
import { THEME_STORAGE_KEY } from '@core/theme'
import { TF_BACKEND_STORAGE_KEY } from '@core/tfBackend'
import { clearAllGuideProgress } from '@components/guide/guideProgress'
import { resetGuideSettings } from '@components/guide/guideSettings'
import { resetStepByStep } from '@components/neural-network/stepByStep/stepByStepSetting'
import { deleteTrainedModels } from '@core/training/modelStore'
import { resetDownloadConsent } from '@core/models/downloadConsent'
import { resetLearningPath } from '@core/learning/learningPath'

// Lo que la aplicación guarda en el navegador (localStorage y la cookie del consentimiento), para borrarlo desde
// /settings.

/**
 * Las versiones anteriores tenían en las páginas de entrenamiento un tutorial que apuntaba si ya se había visto
 * (<tarea>.joyride-<KEY>). Ahora son guías como las demás, pero esas claves pueden seguir en el navegador.
 */
function removeLegacyTutorialKeys() {
  try {
    Object.keys(localStorage).filter((key) => key.includes('.joyride-')).forEach((key) => localStorage.removeItem(key))
  } catch {
    // Sin almacenamiento no había nada guardado
  }
}

/**
 * Borra todos los ajustes: idioma, tema, backend, voz y progreso de las guías, Paso a paso, el aviso de descargas, el
 * progreso de «Empieza aquí», modelos guardados y cookies
 */
export async function resetAllSettings() {
  try {
    [LANGUAGE_STORAGE_KEY, THEME_STORAGE_KEY, TF_BACKEND_STORAGE_KEY].forEach((key) => localStorage.removeItem(key))
  } catch {
    // Sin almacenamiento no había nada guardado
  }
  resetGuideSettings()
  clearAllGuideProgress()
  resetStepByStep()
  resetDownloadConsent()
  resetLearningPath()
  removeLegacyTutorialKeys()
  clearConsent()
  await deleteTrainedModels()
}
