import type { GuideStep_t } from '@components/guide/N4LGuide'
import { buildGuideSteps, centerStep, guideStep, type GuideTranslate_t } from '@components/guide/buildGuideSteps'

/**
 * La guía de la página de entrenamiento de una serie (/playground/time-series/dataset/<KEY>), en el orden de la
 * página: la serie y su preparación, la red, cada hiperparámetro, el entrenamiento, los modelos y la predicción. Textos
 * en guide.train.5-time-series.common (y, si una serie necesita los suyos, en .<KEY>). Un elemento que todavía no está
 * (sin la serie subida) se salta
 */
export function timeSeriesTrainerGuide(t: GuideTranslate_t, dataset: string, upload: boolean): GuideStep_t[] {
  return buildGuideSteps(t, 'guide.train.5-time-series', dataset, [
    centerStep('intro'),
    guideStep('session', 'session', 'bottom'),
    guideStep('manual', 'manual', 'bottom'),
    guideStep('dataset-info', 'dataset-info', 'bottom'),
    ...(upload ? [guideStep('process', 'process')] : []),
    guideStep('dataset', 'dataset'),
    guideStep('preparation', 'preparation'),
    guideStep('windows', 'windows'),
    guideStep('layers', 'layers'),
    guideStep('layers-add', 'layers-add', 'bottom'),
    guideStep('learning-rate', 'hp-learning-rate'),
    guideStep('epochs', 'hp-number-of-epochs'),
    guideStep('batch-size', 'hp-batch-size'),
    guideStep('optimizer', 'hp-optimizer'),
    guideStep('loss', 'hp-loss'),
    guideStep('train', 'train'),
    guideStep('models', 'models'),
    guideStep('predict', 'predict'),
    centerStep('end'),
  ])
}
