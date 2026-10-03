import type { GuideStep_t } from './N4LGuide'
import { buildGuideSteps, centerStep, guideStep, type GuideTranslate_t } from './buildGuideSteps'

/** Tareas con página de entrenamiento: el prefijo de sus textos (guide.train.<tarea>) */
export type TrainerTask_t = '0-tabular-classification' | '1-regression' | '3-image-classification'

type TrainerGuideOptions_t = {
  /** Conjunto de datos propio: primero hay que subirlo y procesarlo */
  upload      : boolean
  /** La página enseña el conjunto de datos en una tabla (la de imágenes no) */
  datasetTable: boolean
  /** data-guide del campo con el porcentaje de datos que se reserva para la prueba */
  testSize    : 'hp-train-rate' | 'hp-test-size'
  /** La sección Paso a paso (redes densas pequeñas): detrás del botón de entrenar o de la tabla de modelos */
  stepByStep  : 'after-train' | 'after-models' | false
}

/**
 * La guía de una página de entrenamiento (/playground/<tarea>/dataset/<KEY>), en el orden de la página: los datos, la
 * red y sus capas, cada hiperparámetro, el entrenamiento, los modelos generados, la predicción y la explicabilidad.
 * Textos en guide.train.<tarea>.<KEY> (la presentación y lo propio de cada conjunto) y, lo demás, en .common. Los
 * elementos que señala llevan data-guide; uno que todavía no está (p. ej. sin datos procesados) se salta. Los bloques
 * grandes (la red, las capas, las tablas) no fijan dónde va el bocadillo: con 'auto' va donde quepa entero.
 */
export function trainerGuide(t: GuideTranslate_t, task: TrainerTask_t, dataset: string, options: TrainerGuideOptions_t): GuideStep_t[] {
  return buildGuideSteps(t, 'guide.train.' + task, dataset, [
    centerStep('intro'),
    guideStep('session', 'session', 'bottom'),
    guideStep('manual', 'manual', 'bottom'),
    guideStep('dataset-info', 'dataset-info', 'bottom'),
    ...(options.upload ? [guideStep('process', 'process')] : []),
    ...(options.datasetTable ? [guideStep('dataset', 'dataset')] : []),
    guideStep('layer-design', 'layer-design'),
    guideStep('layers', 'layers'),
    guideStep('layers-add', 'layers-add', 'bottom'),
    guideStep('learning-rate', 'hp-learning-rate'),
    guideStep('epochs', 'hp-number-of-epochs'),
    guideStep('test-size', options.testSize),
    guideStep('optimizer', 'hp-optimizer'),
    guideStep('loss', 'hp-loss'),
    guideStep('metrics', 'hp-metrics'),
    guideStep('train', 'train'),
    ...(options.stepByStep === 'after-train' ? [guideStep('step-by-step', 'step-by-step')] : []),
    guideStep('models', 'models'),
    ...(options.stepByStep === 'after-models' ? [guideStep('step-by-step', 'step-by-step')] : []),
    guideStep('predict', 'predict'),
    guideStep('explain', 'explain'),
    centerStep('end'),
  ])
}
