import { TC_MODEL_KEYS } from '@/MODEL_KEYS'
import type { GuideStep_t } from '@components/guide/N4LGuide'
import { buildGuideSteps, centerStep, guideStep, type GuideTranslate_t } from '@components/guide/buildGuideSteps'

/**
 * Modelos con guía en su página de prueba (/playground/tabular-classification/model/<KEY>). Sus textos van en
 * guide.0-tabular-classification.<KEY> y, lo que es igual en todos, en guide.0-tabular-classification.common.
 * `fieldSteps`: un paso por atributo del formulario (fields.<nombre>); si son muchos, uno para todo el formulario (form).
 */
const GUIDES: Record<string, { fieldSteps: boolean }> = {
  [TC_MODEL_KEYS.CAR]         : { fieldSteps: true },
  [TC_MODEL_KEYS.IRIS]        : { fieldSteps: true },
  [TC_MODEL_KEYS.LYMPHOGRAPHY]: { fieldSteps: false },
}

export const TABULAR_REVIEW_GUIDES = Object.keys(GUIDES)

/**
 * Los pasos de la guía de la página de un modelo de clasificación tabular (null si no tiene): qué hace la página, el
 * modelo, sus datos, el formulario, cómo se convierte en números, la clasificación y su explicación. Los elementos que
 * señala llevan data-guide.
 */
export function tabularReviewGuide(t: GuideTranslate_t, modelKey: string, fields: string[], stepByStep = false): GuideStep_t[] | null {
  const guide = GUIDES[modelKey]
  if (guide === undefined) return null
  return buildGuideSteps(t, 'guide.0-tabular-classification', modelKey, [
    centerStep('intro'),
    guideStep('model', 'model'),
    guideStep('model-summary', 'model-summary'),
    guideStep('dataset', 'dataset'),
    guideStep('dataset-processed', 'dataset-processed', 'bottom'),
    guideStep('dataset-analysis', 'dataset-analysis', 'bottom'),
    guideStep('instances', 'instances', 'bottom'),
    ...(guide.fieldSteps
      ? fields.map((field) => guideStep('fields.' + field, 'field-' + field, 'bottom'))
      : [guideStep('form', 'form')]),
    guideStep('vector', 'vector'),
    guideStep('classify', 'classify'),
    guideStep('result', 'result'),
    guideStep('explain', 'explain'),
    // Paso a paso, solo si se ha activado en /settings
    ...(stepByStep ? [guideStep('step-by-step', 'step-by-step')] : []),
    centerStep('end'),
  ])
}
