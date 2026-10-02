import { LR_MODEL_KEYS } from '@/MODEL_KEYS'
import type { GuideStep_t } from '@components/guide/N4LGuide'
import { buildGuideSteps, centerStep, guideStep, type GuideStepSpec_t, type GuideTranslate_t } from '@components/guide/buildGuideSteps'

type RegressionGuide_t = {
  /** Un paso por variable de entrada (fields.<nombre>); si son muchas, uno para todo el formulario (form) */
  fieldSteps: boolean
  /** Pasos propios del modelo, detrás del paso con esa clave */
  extra?    : Record<string, GuideStepSpec_t[]>
}

/**
 * Modelos con guía en su página de prueba (/playground/regression/model/<KEY>). Sus textos van en guide.1-regression.<KEY>
 * y, lo que es igual en todos, en guide.1-regression.common.
 */
const GUIDES: Record<string, RegressionGuide_t> = {
  [LR_MODEL_KEYS.AUTO_MPG]           : { fieldSteps: true },
  // Sin G1 ni G2 (las notas de los trimestres): en su formulario se echan en falta y un paso explica por qué
  [LR_MODEL_KEYS.STUDENT_PERFORMANCE]: { fieldSteps: false, extra: { form: [guideStep('grades', 'form')] } },
  [LR_MODEL_KEYS.WINE]               : { fieldSteps: false },
}

export const REGRESSION_REVIEW_GUIDES = Object.keys(GUIDES)

/**
 * Los pasos de la guía de la página de un modelo de regresión (null si no tiene): qué predice, el modelo y sus
 * conjuntos de datos (tal cual, procesados y su análisis), el formulario, la predicción y su explicación. `fields`
 * son las variables de entrada del conjunto elegido.
 */
export function regressionReviewGuide(t: GuideTranslate_t, modelKey: string, fields: string[]): GuideStep_t[] | null {
  const guide = GUIDES[modelKey]
  if (guide === undefined) return null
  const specs: GuideStepSpec_t[] = [
    centerStep('intro'),
    guideStep('model', 'model'),
    guideStep('model-summary', 'model-summary'),
    guideStep('dataset-select', 'dataset-select'),
    guideStep('dataset', 'dataset'),
    guideStep('dataset-processed', 'dataset-processed', 'bottom'),
    guideStep('dataset-analysis', 'dataset-analysis', 'bottom'),
    guideStep('instances', 'instances', 'bottom'),
    guideStep('models', 'models', 'bottom'),
    ...(guide.fieldSteps
      ? fields.map((field) => guideStep('fields.' + field, 'field-' + field, 'bottom'))
      : [guideStep('form', 'form')]),
    guideStep('predict', 'predict'),
    guideStep('result', 'result'),
    guideStep('explain', 'explain'),
    centerStep('end'),
  ]
  return buildGuideSteps(t, 'guide.1-regression', modelKey, specs.flatMap((spec) => [spec, ...(guide.extra?.[spec.key] ?? [])]))
}
