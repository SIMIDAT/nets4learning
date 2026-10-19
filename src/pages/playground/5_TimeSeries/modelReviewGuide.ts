import { TASKS } from '@/TASKS'
import { n4lPackagesOf } from '@core/n4l/catalog'
import type { GuideStep_t } from '@components/guide/N4LGuide'
import { buildGuideSteps, centerStep, guideStep, type GuideTranslate_t } from '@components/guide/buildGuideSteps'

/**
 * Modelos con guía en su página (/playground/time-series/model/<KEY>): los de los paquetes con serie temporal. Sus
 * textos van en guide.5-time-series.common (las tres páginas son iguales) y, si alguno necesita uno propio, en
 * guide.5-time-series.<KEY>
 */
export const TIME_SERIES_REVIEW_GUIDES = n4lPackagesOf(TASKS.TIME_SERIES).filter(({ section }) => section.models.length > 0).map(({ section }) => section.key)

/**
 * Los pasos de la guía de la página de un modelo de una serie temporal (null si no tiene), en el orden de la página,
 * como en las de las demás tareas: el modelo, la serie y cómo se preparó, el formulario para predecir un valor y su
 * resultado; después, cómo predice toda la prueba (a un paso o seguida) frente a las predicciones sencillas y el futuro
 */
export function timeSeriesReviewGuide(t: GuideTranslate_t, modelKey: string): GuideStep_t[] | null {
  if (!TIME_SERIES_REVIEW_GUIDES.includes(modelKey)) return null
  return buildGuideSteps(t, 'guide.5-time-series', modelKey, [
    centerStep('intro'),
    guideStep('model', 'model'),
    guideStep('model-summary', 'model-summary'),
    guideStep('dataset', 'dataset'),
    guideStep('dataset-chart', 'dataset-chart', 'bottom'),
    guideStep('dataset-windows', 'dataset-windows', 'bottom'),
    guideStep('instances', 'instances', 'bottom'),
    guideStep('form', 'form'),
    guideStep('vector', 'vector'),
    guideStep('predict', 'predict'),
    guideStep('result', 'result'),
    guideStep('mode', 'forecast-mode', 'bottom'),
    guideStep('chart', 'forecast-chart', 'top'),
    guideStep('errors', 'errors'),
    guideStep('future', 'future'),
    centerStep('end'),
  ])
}
