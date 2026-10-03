import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { trackEvent, trackPageView } from '@core/analytics'
import {
  LEARNING_STORAGE_KEY,
  nextStep,
  resetLearningPath,
  setStepDone,
  startLearningPath,
  trackLearningPath,
  useJustCompleted,
  useLearningPath,
} from '@core/learning/learningPath'

describe('learningPath: el recorrido «Empieza aquí»', () => {
  let stop: () => void
  beforeEach(() => {
    resetLearningPath()
    stop = trackLearningPath()
  })
  afterEach(() => stop())

  test('los pasos se marcan solos con los eventos de la aplicación (sin consentimiento de analíticas)', () => {
    const { result } = renderHook(() => useLearningPath())
    act(() => trackPageView('/glossary', { page_type: 'glossary' }))
    expect(result.current.done).toEqual(['glossary'])

    // Entrenar en otra tarea no completa el de Iris; un entrenamiento con error, tampoco
    act(() => trackPageView('/playground/regression/dataset/AUTO_MPG', { page_type: 'playground', task: 'regression', mode: 'train', item: 'AUTO_MPG' }))
    act(() => trackEvent('train_end', { outcome: 'error' }))
    act(() => trackEvent('train_end', { outcome: 'completed' }))
    expect(result.current.done).toEqual(['glossary', 'regression'])

    act(() => trackEvent('layer_fix', { kind: 'output-units' }))
    expect(result.current.done).toContain('fix-layers')
    expect(nextStep(result.current.done)?.id).toBe('pretrained')
    expect(JSON.parse(localStorage.getItem(LEARNING_STORAGE_KEY)!).done).toEqual(['glossary', 'regression', 'fix-layers'])
  })

  test('solo se avisa del paso completado si ya se ha entrado en /learn', () => {
    const { result } = renderHook(() => useJustCompleted())
    act(() => trackEvent('models_compare', { models: 2 }))
    expect(result.current).toBeNull()

    act(() => startLearningPath())
    act(() => trackEvent('explain', { method: 'shap' }))
    expect(result.current).toEqual({ type: 'step', id: 'explain' })
  })

  test('se puede marcar y desmarcar a mano, y empezar de cero', () => {
    const { result } = renderHook(() => useLearningPath())
    act(() => setStepDone('cnn', true))
    act(() => setStepDone('cnn', true))
    expect(result.current.done).toEqual(['cnn'])
    act(() => setStepDone('cnn', false))
    expect(result.current.done).toEqual([])
    act(() => {
      setStepDone('train', true)
      resetLearningPath()
    })
    expect(result.current).toEqual({ started: false, done: [], challenges: {} })
  })

  test('los retos se superan con el resultado de un entrenamiento en su página, y se guarda el mejor', () => {
    const { result } = renderHook(() => useLearningPath())
    const { result: completed } = renderHook(() => useJustCompleted())
    act(() => startLearningPath())
    act(() => trackPageView('/playground/tabular-classification/dataset/IRIS', { page_type: 'playground', task: 'tabular-classification', mode: 'train', item: 'IRIS' }))

    // 90 %, con 4 neuronas ocultas y en 5 épocas: «pocas neuronas» y «pocas épocas», pero no el de todas las flores
    act(() => trackEvent('train_result', { accuracy: 0.9, hidden_units: 4, layers: 2, epochs: 5, diagnosis: 'still-improving' }))
    expect(result.current.challenges).toEqual({ 'iris-tiny': 0.9, 'iris-fast': 0.9 })
    expect(completed.current).toEqual({ type: 'challenge', id: 'iris-tiny' })

    act(() => trackEvent('train_result', { accuracy: 0.933, hidden_units: 20, layers: 3, epochs: 30 }))
    expect(result.current.challenges).toEqual({ 'iris-tiny': 0.9, 'iris-fast': 0.9 })
    act(() => trackEvent('train_result', { accuracy: 1, hidden_units: 20, layers: 3, epochs: 30 }))
    expect(result.current.challenges).toEqual({ 'iris-tiny': 0.9, 'iris-fast': 0.9, 'iris-accuracy': 1 })
    // Otro conjunto de datos no cuenta
    act(() => trackPageView('/playground/tabular-classification/dataset/CAR', { page_type: 'playground', task: 'tabular-classification', mode: 'train', item: 'CAR' }))
    act(() => trackEvent('train_result', { accuracy: 1, hidden_units: 2, layers: 2, epochs: 2 }))
    expect(result.current.challenges['iris-tiny']).toBe(0.9)
  })

  test('el reto de regresión pide un entrenamiento que el diagnóstico da por bueno', () => {
    const { result } = renderHook(() => useLearningPath())
    act(() => trackPageView('/playground/regression/dataset/SALARY', { page_type: 'playground', task: 'regression', mode: 'train', item: 'SALARY' }))
    act(() => trackEvent('train_result', { hidden_units: 10, layers: 2, epochs: 20, diagnosis: 'overfitting' }))
    expect(result.current.challenges).toEqual({})
    act(() => trackEvent('train_result', { hidden_units: 10, layers: 2, epochs: 20, diagnosis: 'good' }))
    expect(result.current.challenges).toEqual({ 'regression-good': 1 })
  })
})
