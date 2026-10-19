import type { GuideStep_t } from '@components/guide/N4LGuide'
import { buildGuideSteps, centerStep, type GuideStepSpec_t, type GuideTranslate_t } from '@components/guide/buildGuideSteps'

/** Un paso que señala la tarjeta de un término (GlossaryTerm: id="glossary-<id del término>") */
const termStep = (key: string, id: string): GuideStepSpec_t => ({ key, target: '#glossary-' + id })

/**
 * La guía del glosario: lo más importante y dónde está. Cómo buscar y moverse, las tareas, lo básico de una red (neuronas,
 * activación, tasa de aprendizaje, épocas, datos de prueba), los optimizadores, las funciones de activación, la pérdida
 * y las métricas, y los enlaces a cada término. Textos en guide.glossary.
 */
export function glossaryGuide(t: GuideTranslate_t): GuideStep_t[] {
  return buildGuideSteps(t, 'guide', 'glossary', [
    centerStep('intro'),
    { key: 'search', target: '.n4l-glossary-search', placement: 'bottom' },
    // En pantallas estrechas el índice no está a la vista: el paso se salta
    { key: 'index', target: '.n4l-section-nav', placement: 'right' },
    termStep('tasks', 'task-tabular-classification'),
    termStep('units', 'editor-units'),
    termStep('activation-function', 'editor-activation-function'),
    termStep('learning-rate', 'editor-learning-rate'),
    termStep('epochs', 'editor-number-or-epochs'),
    termStep('test-size', 'editor-test-size'),
    termStep('optimizer', 'optimizer-adam'),
    termStep('activation-plots', 'activation-relu'),
    termStep('softmax', 'activation-softmax'),
    termStep('loss', 'loss-categoricalCrossentropy'),
    termStep('loss-regression', 'loss-meanSquaredError'),
    termStep('metrics', 'metric-CategoricalAccuracy'),
    termStep('confusion-matrix', 'metric-confusion-matrix'),
    { key: 'anchor', target: '#glossary-editor-units .n4l-glossary-anchor', placement: 'bottom' },
    centerStep('end'),
  ])
}
