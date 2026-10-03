import { useSyncExternalStore } from 'react'

import { onAppEvent, type AnalyticsParams_t } from '@core/analytics'

// El recorrido «Empieza aquí» (/learn): pasos cortos, de probar una red ya entrenada a explicar sus predicciones. Cada
// paso se marca solo al hacerlo, con los eventos que ya avisa la aplicación (onAppEvent), y se guarda en el navegador.

export type LearningStep_t = {
  id  : string
  /** Adónde lleva el paso */
  to  : string
  /** Si un evento de la aplicación (con el contexto de su página) completa el paso */
  done: (name: string, event: AnalyticsParams_t) => boolean
}

const trained = (task: string) => (name: string, event: AnalyticsParams_t) => name === 'train_end' && event.task === task && event.outcome !== 'error'

export const LEARNING_STEPS: readonly LearningStep_t[] = [
  { id: 'glossary', to: '/glossary', done: (name, event) => name === 'page_view' && event.page_type === 'glossary' },
  { id: 'pretrained', to: '/playground/image-classification/model/IMAGE-MNIST', done: (name, event) => name === 'predict' && event.mode === 'pretrained' },
  { id: 'train', to: '/playground/tabular-classification/dataset/IRIS', done: trained('tabular-classification') },
  { id: 'compare', to: '/playground/tabular-classification/dataset/IRIS', done: (name) => name === 'models_compare' },
  { id: 'fix-layers', to: '/playground/tabular-classification/dataset/IRIS', done: (name) => name === 'layer_fix' },
  { id: 'regression', to: '/playground/regression/dataset/AUTO_MPG', done: trained('regression') },
  { id: 'cnn', to: '/playground/image-classification/dataset/IMAGE-MNIST', done: trained('image-classification') },
  { id: 'explain', to: '/playground/tabular-classification/model/CAR', done: (name) => name === 'explain' },
]

/**
 * Los retos, para cuando ya se sabe entrenar: se superan solos con el resultado de un entrenamiento (train_result, con
 * el contexto de su página). `check` da el valor con el que se supera (los aciertos, para enseñarlos) o null.
 */
export type LearningChallenge_t = {
  id   : string
  to   : string
  check: (event: AnalyticsParams_t) => number | null
}

const IRIS = '/playground/tabular-classification/dataset/IRIS'
const accuracy = (event: AnalyticsParams_t) => (typeof event.accuracy === 'number' ? event.accuracy : -1)
const number = (value: unknown) => (typeof value === 'number' ? value : Infinity)
/** Aciertos en `item` de `task` de al menos `min` (y lo que pida `also`) */
const accuracyChallenge = (task: string, item: string, min: number, also: (event: AnalyticsParams_t) => boolean = () => true) =>
  (event: AnalyticsParams_t) => (event.task === task && event.item === item && accuracy(event) >= min && also(event) ? accuracy(event) : null)

export const LEARNING_CHALLENGES: readonly LearningChallenge_t[] = [
  // Con el 10 % de prueba son 15 flores: los aciertos van de 1/15 en 1/15 (86,7 %, 93,3 %, 100 %) y el 93 % sale a veces
  // con lo que hay por defecto
  { id: 'iris-accuracy', to: IRIS, check: accuracyChallenge('tabular-classification', 'IRIS', 1) },
  { id: 'iris-tiny', to: IRIS, check: accuracyChallenge('tabular-classification', 'IRIS', 0.9, (event) => number(event.hidden_units) <= 4) },
  { id: 'iris-fast', to: IRIS, check: accuracyChallenge('tabular-classification', 'IRIS', 0.9, (event) => number(event.epochs) <= 5) },
  // Con Salary sale con unas 40 épocas; Auto MPG va más a saltos (también vale cualquier otro de regresión)
  { id: 'regression-good', to: '/playground/regression/dataset/SALARY', check: (event) => (event.task === 'regression' && event.diagnosis === 'good' ? 1 : null) },
  // Con lo que hay por defecto (5 épocas) MNIST llega al 97 %: el reto es hacerlo deprisa. En 2 épocas, con la tasa de
  // aprendizaje por defecto (0,001) se queda en un 83 %; con 0,005, en un 92 %; con 0,01, en un 95 %
  { id: 'mnist-fast', to: '/playground/image-classification/dataset/IMAGE-MNIST', check: accuracyChallenge('image-classification', 'IMAGE-MNIST', 0.93, (event) => number(event.epochs) <= 2) },
]

export const LEARNING_STORAGE_KEY = 'n4l-learning-path'

export type LearningProgress_t = {
  /** Si se ha entrado en /learn: solo entonces se avisa al completar un paso o superar un reto */
  started   : boolean
  /** Los pasos hechos (sus id) */
  done      : readonly string[]
  /** Los retos superados, con el valor con el que se superaron (el mejor) */
  challenges: Readonly<Record<string, number>>
}

const EMPTY: LearningProgress_t = { started: false, done: [], challenges: {} }

function readSaved(): LearningProgress_t {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(LEARNING_STORAGE_KEY) ?? 'null')
    if (typeof saved !== 'object' || saved === null) return EMPTY
    const { started, done, challenges } = saved as Partial<LearningProgress_t>
    const steps = new Set(LEARNING_STEPS.map(({ id }) => id))
    const known = new Set(LEARNING_CHALLENGES.map(({ id }) => id))
    return {
      started   : started === true,
      done      : Array.isArray(done) ? done.filter((id) => steps.has(id)) : [],
      challenges: typeof challenges === 'object' && challenges !== null
        ? Object.fromEntries(Object.entries(challenges).filter(([id, value]) => known.has(id) && typeof value === 'number'))
        : {},
    }
  } catch {
    return EMPTY
  }
}

export type JustCompleted_t = { type: 'step' | 'challenge', id: string }

let progress: LearningProgress_t | null = null
/** Lo último completado (para el aviso): se borra al cerrarlo */
let justCompleted: JustCompleted_t | null = null
const listeners = new Set<() => void>()

const getProgress = (): LearningProgress_t => (progress ??= readSaved())

function save(next: LearningProgress_t) {
  progress = next
  try {
    localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Sin almacenamiento vale solo para esta visita
  }
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** Al entrar en /learn: desde entonces se avisa al completar un paso */
export function startLearningPath() {
  if (!getProgress().started) save({ ...getProgress(), started: true })
}

/** Marcar o desmarcar un paso a mano (si se hizo en otro navegador, o para repetirlo) */
export function setStepDone(id: string, isDone: boolean) {
  const current = getProgress()
  save({ ...current, done: isDone ? [...new Set([...current.done, id])] : current.done.filter((item) => item !== id) })
}

/** Empezar de cero: para el botón de /learn y "Restablecer todo" en /settings */
export function resetLearningPath() {
  justCompleted = null
  progress = EMPTY
  try {
    localStorage.removeItem(LEARNING_STORAGE_KEY)
  } catch {
    // Nada que borrar
  }
  listeners.forEach((listener) => listener())
}

/** Escucha los eventos de la aplicación y marca los pasos que completan y los retos que superan (una vez, al arrancar) */
export function trackLearningPath(): () => void {
  return onAppEvent((name, event) => {
    const current = getProgress()
    const steps = LEARNING_STEPS.filter((step) => !current.done.includes(step.id) && step.done(name, event))
    const results = name === 'train_result'
      ? LEARNING_CHALLENGES.flatMap(({ id, check }) => {
        const value = check(event)
        return value === null ? [] : [{ id, value }]
      })
      : []
    // Un reto ya superado solo se actualiza si se mejora (y entonces no se avisa otra vez)
    const improved = results.filter(({ id, value }) => current.challenges[id] === undefined || value > current.challenges[id])
    if (steps.length === 0 && improved.length === 0) return
    const firstTime = results.find(({ id }) => current.challenges[id] === undefined)
    if (current.started && firstTime !== undefined) justCompleted = { type: 'challenge', id: firstTime.id }
    else if (current.started && steps.length > 0) justCompleted = { type: 'step', id: steps.at(-1)!.id }
    save({
      ...current,
      done      : [...current.done, ...steps.map(({ id }) => id)],
      challenges: { ...current.challenges, ...Object.fromEntries(improved.map(({ id, value }) => [id, value])) },
    })
  })
}

export function useLearningPath(): LearningProgress_t {
  return useSyncExternalStore(subscribe, getProgress, () => EMPTY)
}

/** El paso recién completado o el reto recién superado (para avisar), o null */
export function useJustCompleted(): JustCompleted_t | null {
  return useSyncExternalStore(subscribe, () => justCompleted, () => null)
}

export function dismissJustCompleted() {
  justCompleted = null
  listeners.forEach((listener) => listener())
}

/** El siguiente paso por hacer (en orden), o undefined si están todos */
export const nextStep = (done: readonly string[]) => LEARNING_STEPS.find(({ id }) => !done.includes(id))
