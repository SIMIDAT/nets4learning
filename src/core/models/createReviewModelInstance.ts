import * as tfjs from '@tensorflow/tfjs'
import type { NavigateFunction } from 'react-router'

import { UPLOAD } from '@/TASKS'
import { hasModel, loadModelClass, type ModelClass, type ModelRegistry } from '@core/models/modelRegistry'

/**
 * Crea la instancia del modelo preentrenado `key` para las páginas de revisión de modelos.
 * Devuelve null si no hay modelo que revisar: con UPLOAD (no es un modelo preentrenado) o con una clave
 * desconocida, que además lleva a la página 404. Lo que haga cada página con la instancia es cosa suya.
 */
export async function createReviewModelInstance<T>(
  registry: ModelRegistry<T>,
  key: string,
  create: (ModelClass: ModelClass<T>) => T,
  navigate: NavigateFunction,
): Promise<T | null> {
  await tfjs.ready()
  if (key === UPLOAD) {
    console.error('Error, option not valid', { key })
    return null
  }
  if (!hasModel(registry, key)) {
    // La página 404 ya explica el problema: sin alerta encima de la página vacía
    console.error('Error, option not valid', { key })
    navigate('/404')
    return null
  }
  return create(await loadModelClass(registry, key))
}
