import { useCallback, useMemo, useRef, useState } from 'react'

export type TrainingProgress_t = { epoch: number, totalEpochs: number }

/**
 * Estado de un entrenamiento en curso: época actual y petición de parar. `callbacks` se pasa tal cual a las
 * funciones de entrenamiento (`onEpochEnd`, `shouldStop`).
 */
export function useTrainingProgress() {
  const [isTraining, setIsTraining] = useState(false)
  const [progress, setProgress] = useState<TrainingProgress_t | null>(null)
  const [isStopping, setIsStopping] = useState(false)
  // Se lee dentro del entrenamiento, que no ve los cambios de estado de React
  const stopRequested_ref = useRef(false)

  const start = useCallback(() => {
    stopRequested_ref.current = false
    setIsStopping(false)
    setProgress(null)
    setIsTraining(true)
  }, [])

  const finish = useCallback(() => {
    setIsTraining(false)
    setIsStopping(false)
    setProgress(null)
  }, [])

  const stop = useCallback(() => {
    stopRequested_ref.current = true
    setIsStopping(true)
  }, [])

  const callbacks = useMemo(() => ({
    onEpochEnd: (epoch: number, totalEpochs: number) => setProgress({ epoch, totalEpochs }),
    shouldStop: () => stopRequested_ref.current,
  }), [])

  return { isTraining, progress, isStopping, start, finish, stop, callbacks }
}
