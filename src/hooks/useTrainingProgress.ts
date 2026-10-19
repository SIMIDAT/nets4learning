import { useCallback, useMemo, useRef, useState } from 'react'
import i18next from 'i18next'

import { trackEvent } from '@core/analytics'
import { announce } from '@core/a11y/announce'
import { formatDuration } from '@core/format/duration'

const prefix = 'pages.playground.generator.training.'

/**
 * Cada cuánto, como mucho, se anuncia por qué época va (WCAG 4.1.3): en cada una, con entrenamientos de un segundo por
 * época, el lector de pantalla no diría otra cosa
 */
const ANNOUNCE_EVERY_MS = 10_000

/** Por qué época va y, desde la primera, lo que lleva y lo que le queda (a la velocidad de las épocas hechas) */
export type TrainingProgress_t = { epoch: number, totalEpochs: number, elapsedMs?: number, remainingMs?: number }

/** Lo que tardó el último entrenamiento: para saber qué esperar del siguiente */
export type LastTraining_t = { ms: number, epochs: number }

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
  const [lastRun, setLastRun] = useState<LastTraining_t | null>(null)
  // Se lee dentro del entrenamiento, que no ve los cambios de estado de React
  const stopRequested_ref = useRef(false)
  const run_ref = useRef({ startedAt: 0, epochs: 0, epochsDone: 0, completed: false, announcedAt: 0 })

  const start = useCallback((summary: TrainingSummary_t) => {
    stopRequested_ref.current = false
    run_ref.current = { startedAt: performance.now(), epochs: summary.epochs, epochsDone: 0, completed: false, announcedAt: performance.now() }
    announce(i18next.t(prefix + 'announce-start', { count: summary.epochs }))
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
    const outcome = stopRequested_ref.current ? 'stopped' : run.completed ? 'completed' : 'error'
    if (run.epochsDone > 0) setLastRun({ ms: performance.now() - run.startedAt, epochs: run.epochsDone })
    // Al terminar bien ya lo dice el aviso de «modelo entrenado»
    if (outcome === 'stopped') announce(i18next.t(prefix + 'announce-stopped', { epoch: run.epochsDone, total: run.epochs }))
    if (outcome === 'error') announce(i18next.t(prefix + 'announce-error'))
    trackEvent('train_end', {
      outcome,
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
      const run = run_ref.current
      run.epochsDone = epoch
      const elapsedMs = performance.now() - run.startedAt
      const remainingMs = epoch > 0 ? (elapsedMs / epoch) * (totalEpochs - epoch) : undefined
      setProgress({ epoch, totalEpochs, elapsedMs, remainingMs })
      if (epoch < totalEpochs && performance.now() - run.announcedAt >= ANNOUNCE_EVERY_MS) {
        run.announcedAt = performance.now()
        const remaining = remainingMs === undefined ? '' : ' ' + i18next.t(prefix + 'remaining', { time: formatDuration(remainingMs, i18next.language) })
        announce(i18next.t(prefix + 'epoch', { epoch, total: totalEpochs }) + remaining)
      }
    },
    shouldStop: () => stopRequested_ref.current,
  }), [])

  return { isTraining, progress, isStopping, lastRun, start, complete, finish, stop, callbacks }
}
