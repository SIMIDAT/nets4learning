import { IC_MODEL_KEYS } from '@/MODEL_KEYS'
import type { GuideStep_t } from '@components/guide/N4LGuide'
import { buildGuideSteps, centerStep, guideStep, type GuideTranslate_t } from '@components/guide/buildGuideSteps'

/**
 * Modelos con guía en su página (/playground/image-classification/model/<KEY>). Sus textos van en
 * guide.3-image-classification.<KEY> y, lo que es igual en todos, en guide.3-image-classification.common.
 */
export const IMAGE_CLASSIFICATION_REVIEW_GUIDES: string[] = [IC_MODEL_KEYS.MNIST, IC_MODEL_KEYS.KMNIST, IC_MODEL_KEYS.CIFAR10, IC_MODEL_KEYS.MOBILENET]

/**
 * Los pasos de la guía de la página de un modelo de clasificación de imágenes (null si no tiene). Con las imágenes de
 * un conjunto (MNIST, KMNIST, CIFAR-10), también sus imágenes de test; con las que se pueden dibujar (en gris), el
 * dibujo; el resumen del modelo, solo si lo tiene (MobileNet no: no es un LayersModel).
 */
export function imageClassificationReviewGuide(t: GuideTranslate_t, modelKey: string, { drawable, summary, testImages }: { drawable: boolean, summary: boolean, testImages: boolean }): GuideStep_t[] | null {
  if (!IMAGE_CLASSIFICATION_REVIEW_GUIDES.includes(modelKey)) return null
  return buildGuideSteps(t, 'guide.3-image-classification', modelKey, [
    centerStep('intro'),
    guideStep('model', 'model'),
    ...(summary ? [guideStep('model-summary', 'model-summary')] : []),
    guideStep('explain-about', 'explain-about'),
    guideStep('examples', 'examples'),
    ...(testImages ? [guideStep('test-images', 'test-images', 'bottom')] : []),
    guideStep('upload', 'upload'),
    ...(drawable ? [guideStep('draw', 'draw')] : []),
    guideStep('result', 'result'),
    guideStep('explain', 'explain'),
    centerStep('end'),
  ])
}
