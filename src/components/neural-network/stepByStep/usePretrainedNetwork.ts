import { useEffect, useState } from 'react'
import type * as tfjs from '@tensorflow/tfjs'

import { networkFromModel } from '@core/nn-utils/stepByStepModel'
import type { StepNetwork_t } from '@core/nn-utils/stepByStep'

/**
 * Los pesos de un modelo ya entrenado para N4LStepByStep: undefined mientras se leen (o si está desactivado), null si
 * no es una red de capas densas. Solo se leen con la sección activada; al cambiar de modelo, otra vez.
 */
export function usePretrainedNetwork(model: tfjs.LayersModel | null, enabled: boolean): StepNetwork_t | null | undefined {
  const [read, setRead] = useState<{ model: tfjs.LayersModel, network: StepNetwork_t | null } | null>(null)

  useEffect(() => {
    if (!enabled || model === null) return
    let isCancelled = false
    networkFromModel(model)
      .then((network) => {
        if (!isCancelled) setRead({ model, network })
      })
      .catch((error: unknown) => {
        console.error('usePretrainedNetwork', error)
        if (!isCancelled) setRead({ model, network: null })
      })
    return () => { isCancelled = true }
  }, [model, enabled])

  return enabled && model !== null && read?.model === model ? read.network : undefined
}
