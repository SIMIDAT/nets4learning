import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { GuideStep_t } from '@components/guide/N4LGuide'
import type { GuideTranslate_t } from '@components/guide/buildGuideSteps'
import { TABULAR_REVIEW_GUIDES, tabularReviewGuide } from '@pages/playground/0_TabularClassification/modelReviewGuide'
import { REGRESSION_REVIEW_GUIDES, regressionReviewGuide } from '@pages/playground/1_Regression/modelReviewGuide'
import { OBJECT_DETECTION_REVIEW_GUIDES, objectDetectionReviewGuide } from '@pages/playground/2_ObjectDetection/modelReviewGuide'
import { IMAGE_CLASSIFICATION_REVIEW_GUIDES, imageClassificationReviewGuide } from '@pages/playground/3_ImageClassification/modelReviewGuide'
import { MAP_TC_CLASSES } from '@pages/playground/0_TabularClassification/models'
import { MAP_IC_CLASSES } from '@pages/playground/3_ImageClassification/models'
import { TASK_MODEL_OPTIONS } from '@/TASK_OPTIONS'
import { TASKS } from '@/TASKS'

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

/** Todas las claves de textos de una guía (guide.<tarea>.<modelo>) */
function keysOf(node: unknown, prefix: string): string[] {
  if (typeof node === 'string') return [prefix]
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => keysOf(value, `${prefix}.${key}`))
}

/** Las columnas de entrada de un CSV de regresión (sin la variable objetivo), en su paquete .n4l */
function csvFeatures(file: string, target: string) {
  const header = readFileSync(path.resolve(__dirname, '../../public/n4l/', file), 'utf8').split('\n')[0]
  return header.trim().split(',').filter((column) => column !== target)
}

type Case_t = { task: string, prefix: string, model: string, build: (t: GuideTranslate_t) => GuideStep_t[] | null }

const REGRESSION_FIELDS: Record<string, string[]> = {
  AUTO_MPG           : csvFeatures('auto-mpg.n4l/data/auto-mpg.csv', 'mpg'),
  STUDENT_PERFORMANCE: csvFeatures('student-performance.n4l/data/student-mat-2024.csv', 'G3'),
  WINE               : csvFeatures('wine-quality.n4l/data/wine-quality-red.csv', 'quality'),
  SALARY             : csvFeatures('salary.n4l/data/salary.csv', 'Salary'),
  HOUSING_PRICES     : csvFeatures('boston-housing.n4l/data/boston-housing-2020.csv', 'MEDV'),
}

async function cases(): Promise<Case_t[]> {
  const tabular = await Promise.all(TABULAR_REVIEW_GUIDES.map(async (model) => {
    const ModelClass = await MAP_TC_CLASSES[model]()
    const fields = new ModelClass(((key: string) => key) as never, () => {}).FORM.map(({ name }) => name)
    // Con Paso a paso activado (/settings): así se comprueban también sus textos
    return { task: 'tabular-classification', prefix: 'guide.0-tabular-classification', model, build: (t: GuideTranslate_t) => tabularReviewGuide(t, model, fields, true) }
  }))
  const regression = REGRESSION_REVIEW_GUIDES.map((model) => (
    { task: 'regression', prefix: 'guide.1-regression', model, build: (t: GuideTranslate_t) => regressionReviewGuide(t, model, REGRESSION_FIELDS[model], true) }))
  const detection = OBJECT_DETECTION_REVIEW_GUIDES.map((model) => (
    { task: 'object-detection', prefix: 'guide.2-object-detection', model, build: (t: GuideTranslate_t) => objectDetectionReviewGuide(t, model) }))
  const images = await Promise.all(IMAGE_CLASSIFICATION_REVIEW_GUIDES.map(async (model) => {
    const ModelClass = await MAP_IC_CLASSES[model]()
    // Los de gris se pueden dibujar; los de un conjunto tienen imágenes de test y son LayersModel (con resumen); MobileNet,
    // nada de eso
    const instance = new ModelClass(((key: string) => key) as never)
    const options = { drawable: instance.DRAWABLE, summary: instance.TEST_IMAGES, testImages: instance.TEST_IMAGES }
    return { task: 'image-classification', prefix: 'guide.3-image-classification', model, build: (t: GuideTranslate_t) => imageClassificationReviewGuide(t, model, options) }
  }))
  return [...tabular, ...regression, ...detection, ...images]
}

describe('Guías de las páginas de los modelos', () => {
  test('cada paso de cada guía tiene título y texto en todos los idiomas, y no sobra ningún texto', async () => {
    for (const { prefix, model, build } of await cases()) {
      const missing: string[] = []
      for (const language of LANGUAGES) {
        const used = new Set<string>()
        const steps = build(translator(language, missing, used))!
        expect(steps.length, `${model}`).toBeGreaterThan(5)
        expect(steps[0]).toMatchObject({ target: 'body', placement: 'center' })
        expect(steps.at(-1)).toMatchObject({ target: 'body', placement: 'center' })
        // Los textos propios del modelo que ningún paso usa (p. ej. un atributo con otro nombre que el del formulario)
        const unused = keysOf(lookup(language, `${prefix}.${model}`) ?? {}, `${prefix}.${model}`).filter((key) => !used.has(key))
        expect(unused, `${language} ${model}`).toEqual([])
      }
      expect(missing, model).toEqual([])
    }
  })

  test('el paso de Paso a paso solo está si se ha activado en /settings', () => {
    const t: GuideTranslate_t = (keys) => (Array.isArray(keys) ? keys[0] : keys)
    const targets = (stepByStep: boolean) => [
      ...tabularReviewGuide(t, 'IRIS', ['sepal_length'], stepByStep)!,
      ...regressionReviewGuide(t, 'AUTO_MPG', REGRESSION_FIELDS.AUTO_MPG, stepByStep)!,
    ].map(({ target }) => target)
    expect(targets(false)).not.toContain('[data-guide="step-by-step"]')
    expect(targets(true).filter((target) => target === '[data-guide="step-by-step"]')).toHaveLength(2)
  })

  test('todos los modelos del menú tienen guía', () => {
    const guides: Record<string, string[]> = {
      [TASKS.TABULAR_CLASSIFICATION]: TABULAR_REVIEW_GUIDES,
      [TASKS.REGRESSION]            : REGRESSION_REVIEW_GUIDES,
      [TASKS.OBJECT_DETECTION]      : OBJECT_DETECTION_REVIEW_GUIDES,
      [TASKS.IMAGE_CLASSIFICATION]  : IMAGE_CLASSIFICATION_REVIEW_GUIDES,
    }
    for (const [task, options] of Object.entries(TASK_MODEL_OPTIONS)) {
      for (const { value } of options as Array<{ value: string }>) expect(guides[task], `${task} ${value}`).toContain(value)
    }
  })

  test('un paso por atributo cuando son pocos y uno para todo el formulario cuando son muchos', () => {
    const t: GuideTranslate_t = (keys) => (Array.isArray(keys) ? keys[0] : keys)
    const targets = (steps: GuideStep_t[] | null) => steps!.map(({ target }) => target)
    expect(targets(tabularReviewGuide(t, 'IRIS', ['sepal_length', 'petal_width']))).toContain('[data-guide="field-petal_width"]')
    expect(targets(tabularReviewGuide(t, 'LYMPHOGRAPHY', ['lymphatics']))).toContain('[data-guide="form"]')
    expect(targets(regressionReviewGuide(t, 'AUTO_MPG', ['weight']))).toContain('[data-guide="field-weight"]')
    expect(targets(regressionReviewGuide(t, 'WINE', ['alcohol']))).toContain('[data-guide="form"]')
    // En Rendimiento de estudiantes, justo después del formulario, por qué no están G1 ni G2
    const student = regressionReviewGuide(t, 'STUDENT_PERFORMANCE', ['age'])!.map(({ title }) => title)
    expect(student.indexOf('guide.1-regression.STUDENT_PERFORMANCE.grades.title'))
      .toBe(student.indexOf('guide.1-regression.STUDENT_PERFORMANCE.form.title') + 1)
    // Sin dibujo (MobileNet), sin los pasos del dibujo ni de las imágenes de test
    expect(targets(imageClassificationReviewGuide(t, 'IMAGE-MOBILENET', { drawable: false, summary: false, testImages: false })))
      .not.toEqual(expect.arrayContaining(['[data-guide="draw"]', '[data-guide="model-summary"]']))
    expect(targets(imageClassificationReviewGuide(t, 'IMAGE-MNIST', { drawable: true, summary: true, testImages: true })))
      .toEqual(expect.arrayContaining(['[data-guide="draw"]', '[data-guide="test-images"]', '[data-guide="model-summary"]']))
    // Fotos en color (CIFAR-10): imágenes de test, pero sin dibujo
    const cifar = targets(imageClassificationReviewGuide(t, 'IMAGE-CIFAR10', { drawable: false, summary: true, testImages: true }))
    expect(cifar).toContain('[data-guide="test-images"]')
    expect(cifar).not.toContain('[data-guide="draw"]')
    expect(tabularReviewGuide(t, 'UPLOAD', [])).toBeNull()
    expect(regressionReviewGuide(t, 'BREAST_CANCER', [])).toBeNull()
  })
})
