import { describe, test, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const trackEvent = vi.hoisted(() => vi.fn())
vi.mock('@core/analytics', () => ({ trackEvent }))
const announce = vi.hoisted(() => vi.fn())
vi.mock('@core/a11y/announce', () => ({ announce }))
vi.mock('i18next', () => ({ default: { t: (key: string) => key } }))

import { useTrainingProgress } from '@hooks/useTrainingProgress'

const SUMMARY = { epochs: 10, learningRate: 0.01, optimizer: 'adam', loss: 'categoricalCrossentropy', layers: 3 }
const trainEnd = () => trackEvent.mock.calls.find(([name]) => name === 'train_end')?.[1]

describe('useTrainingProgress: analíticas del entrenamiento', () => {
  beforeEach(() => {
    trackEvent.mockClear()
    announce.mockClear()
  })

  test('al empezar, los hiperparámetros; al terminar bien, completed con las épocas hechas', () => {
    const { result } = renderHook(() => useTrainingProgress())
    act(() => result.current.start(SUMMARY))
    expect(trackEvent).toHaveBeenCalledWith('train_start', { epochs: 10, learning_rate: 0.01, optimizer: 'adam', loss: 'categoricalCrossentropy', layers: 3 })
    act(() => {
      for (let epoch = 1; epoch <= 10; epoch++) result.current.callbacks.onEpochEnd(epoch, 10)
      result.current.complete()
      result.current.finish()
    })
    expect(trainEnd()).toEqual(expect.objectContaining({ outcome: 'completed', epochs: 10, epochs_done: 10 }))
  })

  test('parado a mitad: stopped; sin complete (falló): error', () => {
    const { result } = renderHook(() => useTrainingProgress())
    act(() => {
      result.current.start(SUMMARY)
      result.current.callbacks.onEpochEnd(4, 10)
      result.current.stop()
      result.current.finish()
    })
    expect(trainEnd()).toEqual(expect.objectContaining({ outcome: 'stopped', epochs_done: 4 }))

    trackEvent.mockClear()
    act(() => {
      result.current.start(SUMMARY)
      result.current.finish()
    })
    expect(trainEnd()).toEqual(expect.objectContaining({ outcome: 'error', epochs_done: 0 }))
  })

  test('el lector de pantalla oye que empieza, cómo va cada 10 s (no en cada época) y si se para', () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(0)
    const { result } = renderHook(() => useTrainingProgress())
    act(() => result.current.start(SUMMARY))
    expect(announce).toHaveBeenLastCalledWith('pages.playground.generator.training.announce-start')
    act(() => {
      for (let epoch = 1; epoch <= 4; epoch++) {
        now.mockReturnValue(epoch * 3_000)
        result.current.callbacks.onEpochEnd(epoch, 10)
      }
    })
    // A los 12 s (época 4): una sola vez
    expect(announce).toHaveBeenCalledTimes(2)
    // La época y lo que queda
    expect(announce).toHaveBeenLastCalledWith(expect.stringMatching(/training\.epoch.*training\.remaining/))
    act(() => {
      result.current.stop()
      result.current.finish()
    })
    expect(announce).toHaveBeenLastCalledWith('pages.playground.generator.training.announce-stopped')
    now.mockRestore()
  })

  test('al terminar bien no se anuncia nada más: ya lo dice el aviso de «modelo entrenado»', () => {
    const { result } = renderHook(() => useTrainingProgress())
    act(() => result.current.start(SUMMARY))
    announce.mockClear()
    act(() => {
      result.current.callbacks.onEpochEnd(10, 10)
      result.current.complete()
      result.current.finish()
    })
    expect(announce).not.toHaveBeenCalled()
  })
})
