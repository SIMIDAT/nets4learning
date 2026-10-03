import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { GuideTranslate_t } from '@components/guide/buildGuideSteps'
import { trainerGuide, type TrainerTask_t } from '@components/guide/trainerGuide'
import { TASK_DATASET_OPTIONS } from '@/TASK_OPTIONS'
import { TASKS, UPLOAD } from '@/TASKS'

const LANGUAGES = ['es', 'en', 'ja']
const translations = Object.fromEntries(LANGUAGES.map((language) => [language,
  JSON.parse(readFileSync(path.resolve(__dirname, `../../public/locales/${language}/translation.json`), 'utf8'))]))

const lookup = (language: string, key: string) =>
  key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], translations[language])

/** Como el t de i18next con varias claves: la primera que existe. Apunta las que no tienen ninguna y las usadas */
function translator(language: string, missing: string[], used: Set<string>): GuideTranslate_t {
  return (keys) => {
    const list = Array.isArray(keys) ? keys : [keys]
    const found = list.find((key) => typeof lookup(language, key) === 'string' && (lookup(language, key) as string).trim() !== '')
    if (found === undefined) missing.push(`${language}: ${list.join(' | ')}`)
    else used.add(found)
    return found === undefined ? list[0] : lookup(language, found) as string
  }
}

function keysOf(node: unknown, prefix: string): string[] {
  if (typeof node === 'string') return [prefix]
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => keysOf(value, `${prefix}.${key}`))
}

// Cada página de entrenamiento con lo que la diferencia (las mismas opciones que le pasa la página)
const TRAINERS: Array<{ task: TrainerTask_t, datasets: string[], datasetTable: boolean, testSize: 'hp-train-rate' | 'hp-test-size', stepByStep: 'after-train' | 'after-models' | false }> = [
  { task: '0-tabular-classification', datasets: TASK_DATASET_OPTIONS[TASKS.TABULAR_CLASSIFICATION].map(({ value }) => value), datasetTable: true, testSize: 'hp-train-rate', stepByStep: 'after-train' },
  { task: '1-regression', datasets: TASK_DATASET_OPTIONS[TASKS.REGRESSION].map(({ value }) => value), datasetTable: true, testSize: 'hp-train-rate', stepByStep: 'after-models' },
  { task: '3-image-classification', datasets: TASK_DATASET_OPTIONS[TASKS.IMAGE_CLASSIFICATION].map(({ value }) => value), datasetTable: false, testSize: 'hp-test-size', stepByStep: false },
]

const CASES = TRAINERS.flatMap((trainer) => trainer.datasets.map((dataset) => ({ ...trainer, dataset })))

describe('guías de las páginas de entrenamiento', () => {
  test.each(CASES)('$task / $dataset: cada paso tiene título y explicación en todos los idiomas', ({ task, dataset, datasetTable, testSize, stepByStep }) => {
    for (const language of LANGUAGES) {
      const missing: string[] = []
      const steps = trainerGuide(translator(language, missing, new Set()), task, dataset, { upload: dataset === UPLOAD, datasetTable, testSize, stepByStep })
      expect(missing).toEqual([])
      // Empieza y acaba en medio de la pantalla; en medio, un paso por cada parte de la página
      expect(steps[0].placement).toBe('center')
      expect(steps.at(-1)!.placement).toBe('center')
      expect(steps.length).toBeGreaterThanOrEqual(18)
      // La presentación es la de su conjunto de datos, no la genérica
      expect(steps[0].content).toBe(lookup(language, `guide.train.${task}.${dataset}.intro.content`))
    }
  })

  test('con datos propios hay que subirlos y prepararlos; con uno de ejemplo, no', () => {
    const t: GuideTranslate_t = (keys) => (Array.isArray(keys) ? keys[0] : keys)
    const targets = (dataset: string) => trainerGuide(t, '0-tabular-classification', dataset, { upload: dataset === UPLOAD, datasetTable: true, testSize: 'hp-train-rate', stepByStep: 'after-train' })
      .map(({ target }) => target)
    expect(targets(UPLOAD)).toContain('[data-guide="process"]')
    expect(targets('IRIS')).not.toContain('[data-guide="process"]')
    // Paso a paso, solo si está activado en /settings: detrás del botón de entrenar (o de la tabla de modelos)
    const withStepByStep = (stepByStep: 'after-train' | 'after-models' | false) => trainerGuide(t, '0-tabular-classification', 'IRIS', { upload: false, datasetTable: true, testSize: 'hp-train-rate', stepByStep })
      .map(({ target }) => target)
    expect(withStepByStep(false)).not.toContain('[data-guide="step-by-step"]')
    const afterTrain = withStepByStep('after-train')
    expect(afterTrain.indexOf('[data-guide="step-by-step"]')).toBe(afterTrain.indexOf('[data-guide="train"]') + 1)
    const afterModels = withStepByStep('after-models')
    expect(afterModels.indexOf('[data-guide="step-by-step"]')).toBe(afterModels.indexOf('[data-guide="models"]') + 1)
    // Cada hiperparámetro, en su paso
    expect(targets('IRIS')).toEqual(expect.arrayContaining(['learning-rate', 'number-of-epochs', 'train-rate', 'optimizer', 'loss', 'metrics']
      .map((name) => `[data-guide="hp-${name}"]`)))
  })

  // Los de .common también sirven de respaldo a un conjunto de datos nuevo sin textos propios: esos pueden no usarse hoy
  test('no sobra ningún texto propio de un conjunto de datos: todos se usan en su guía', () => {
    for (const language of LANGUAGES) {
      const used = new Set<string>()
      for (const { task, dataset, datasetTable, testSize, stepByStep } of CASES) {
        trainerGuide(translator(language, [], used), task, dataset, { upload: dataset === UPLOAD, datasetTable, testSize, stepByStep })
      }
      const texts = keysOf(lookup(language, 'guide.train'), 'guide.train').map((key) => key.replace(/\.(title|content)$/, ''))
      expect([...new Set(texts)].filter((key) => !key.includes('.common.') && !used.has(key + '.title'))).toEqual([])
    }
  })
})
