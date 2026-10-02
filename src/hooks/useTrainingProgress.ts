import { useCallback, useMemo, useRef, useState } from 'react'

import { trackEvent } from '@core/analytics'

export type TrainingProgress_t = { epoch: number, totalEpochs: number }

/** Los hiperparámetros de un entrenamiento, para las analíticas (train_start) */
export type TrainingSummary_t = { epochs: number, learningRate: number, optimizer: string, loss: string, layers: number }

/**
 * Estado de un entrenamiento en curso: época actual y petición de parar. `callbacks` se pasa tal cual a las
 * funciones de entrenamiento (`onEpochEnd`, `shouldStop`). `complete()` dice que ha terminado bien: al llamar a
 * `finish()` se sabe si se completó, se paró o falló (analíticas: train_start y train_end).
 */
export function useTrainingProgress() {
  const [isTraining, setIsTraining] = useState(false)
  const [progress, setProgress] = useState<TrainingProgress_t | null>(null)
  const [isStopping, setIsStopping] = useState(false)
  // Se lee dentro del entrenamiento, que no ve los cambios de estado de React
  const stopRequested_ref = useRef(false)
  const run_ref = useRef({ startedAt: 0, epochs: 0, epochsDone: 0, completed: false })

  const start = useCallback((summary: TrainingSummary_t) => {
    stopRequested_ref.current = false
    run_ref.current = { startedAt: performance.now(), epochs: summary.epochs, epochsDone: 0, completed: false }
    setIsStopping(false)
    setProgress(null)
    setIsTraining(true)
    trackEvent('train_start', {
      epochs       : summary.epochs,
      learning_rate: summary.learningRate,
      optimizer    : summary.optimizer,
      loss         : summary.loss,
      layers       : summary.layers,
    })
  }, [])

  const complete = useCallback(() => {
    run_ref.current.completed = true
  }, [])

  const finish = useCallback(() => {
    setIsTraining(false)
    setIsStopping(false)
    setProgress(null)
    const run = run_ref.current
    trackEvent('train_end', {
      outcome     : stopRequested_ref.current ? 'stopped' : run.completed ? 'completed' : 'error',
      duration_sec: Math.round((performance.now() - run.startedAt) / 1000),
      epochs      : run.epochs,
      epochs_done : run.epochsDone,
    })
  }, [])

  const stop = useCallback(() => {
    stopRequested_ref.current = true
    setIsStopping(true)
  }, [])

  const callbacks = useMemo(() => ({
    onEpochEnd: (epoch: number, totalEpochs: number) => {
      run_ref.current.epochsDone = epoch
      setProgress({ epoch, totalEpochs })
    },
    shouldStop: () => stopRequested_ref.current,
  }), [])

  return { isTraining, progress, isStopping, start, complete, finish, stop, callbacks }
}
