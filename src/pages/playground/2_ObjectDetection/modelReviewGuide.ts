import { OD_MODEL_KEYS } from '@/MODEL_KEYS'
import type { GuideStep_t } from '@components/guide/N4LGuide'
import { buildGuideSteps, centerStep, guideStep, type GuideTranslate_t } from '@components/guide/buildGuideSteps'

/**
 * Modelos con guía en su página (/playground/object-detection/model/<KEY>): todos. Sus textos van en
 * guide.2-object-detection.<KEY> (qué detecta y qué se ve) y, lo que es igual en todos, en
 * guide.2-object-detection.common.
 */
export const OBJECT_DETECTION_REVIEW_GUIDES: string[] = Object.values(OD_MODEL_KEYS)

/** Los pasos de la guía de la página de un modelo de detección (null si no tiene) */
export function objectDetectionReviewGuide(t: GuideTranslate_t, modelKey: string): GuideStep_t[] | null {
  if (!OBJECT_DETECTION_REVIEW_GUIDES.includes(modelKey)) return null
  return buildGuideSteps(t, 'guide.2-object-detection', modelKey, [
    centerStep('intro'),
    guideStep('model', 'model'),
    guideStep('explain-about', 'explain-about'),
    guideStep('webcam', 'webcam'),
    guideStep('webcam-controls', 'webcam-controls', 'bottom'),
    guideStep('device-info', 'device-info'),
    guideStep('image', 'image'),
    guideStep('explain', 'explain'),
    centerStep('end'),
  ])
}
