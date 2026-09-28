import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TASK_MODEL_REGISTRY, type MenuModel_t } from '@/DATA_MODEL'
import { hasModel, loadModelClass } from '@core/models/modelRegistry'

/**
 * Instancia del modelo `modelKey` de la tarea `task`, cargada bajo demanda (solo se descarga
 * el modelo seleccionado). Devuelve `null` mientras se carga o si la clave no es un modelo.
 */
export function useMenuModel(task: string | undefined, modelKey: string): MenuModel_t | null {
  const { t } = useTranslation()
  const [loaded, setLoaded] = useState<{ key: string, model: MenuModel_t } | null>(null)

  useEffect(() => {
    const registry = task ? TASK_MODEL_REGISTRY[task] : undefined
    if (!registry || !hasModel(registry, modelKey)) return
    let cancelled = false
    loadModelClass(registry, modelKey)
      .then((ModelClass) => {
        if (!cancelled) setLoaded({ key: modelKey, model: new ModelClass(t, () => {}) })
      })
      .catch((error) => console.error('Error loading model', { task, modelKey, error }))
    return () => {
      cancelled = true
    }
  }, [task, modelKey, t])

  return loaded?.key === modelKey ? loaded.model : null
}
