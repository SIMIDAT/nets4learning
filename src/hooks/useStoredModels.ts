import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import type * as tfjs from '@tensorflow/tfjs'

import { deleteTrainedModels, loadTrainedModels, saveTrainedModel, type StoredModel_t } from '@core/training/modelStore'

/**
 * Los modelos entrenados de una página, guardados en el navegador: al entrar se recuperan los de antes (onRestore los
 * pone en la tabla de la página), `save` guarda cada uno nuevo y `clear` los borra. Solo con `enabled` (los conjuntos de
 * ejemplo: los de uno subido no se podrían usar sin volver a subirlo).
 */
export function useStoredModels<T>(task: string, dataset: string, enabled: boolean, onRestore: (stored: StoredModel_t<T>[]) => void) {
  const [restored, setRestored] = useState(0)
  const restore = useEffectEvent(onRestore)
  // Una sola vez por página: si `enabled` vuelve a ser true (p. ej. al cargarse otra vez los datos) no se duplican
  const restoredFor = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || restoredFor.current === task + '/' + dataset) return
    restoredFor.current = task + '/' + dataset
    let isCancelled = false
    let isFinished = false
    loadTrainedModels<T>(task, dataset).then((stored) => {
      if (isCancelled) return
      isFinished = true
      if (stored.length === 0) return
      restore(stored)
      setRestored(stored.length)
    })
    return () => {
      isCancelled = true
      // Sin terminar (React en modo estricto monta dos veces): la próxima vez se vuelve a intentar
      if (!isFinished) restoredFor.current = null
    }
  }, [task, dataset, enabled])

  const save = useCallback((model: tfjs.LayersModel, data: T) => {
    if (enabled) void saveTrainedModel(task, dataset, model, data)
  }, [task, dataset, enabled])

  const clear = useCallback(async () => {
    await deleteTrainedModels(task, dataset)
    setRestored(0)
  }, [task, dataset])

  return { restored, save, clear }
}
