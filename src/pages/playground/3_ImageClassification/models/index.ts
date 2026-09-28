import I_MODEL_IMAGE_CLASSIFICATION from './_model'
import { IC_MODEL_KEYS } from '@/MODEL_KEYS'
import type { ModelRegistry } from '@core/models/modelRegistry'

/** Clases de modelos de clasificación de imágenes, cargadas bajo demanda. */
const MAP_IC_CLASSES: ModelRegistry<I_MODEL_IMAGE_CLASSIFICATION> = {
  [IC_MODEL_KEYS.MNIST]    : () => import('./MODEL_IMAGE_MNIST').then((m) => m.default),
  [IC_MODEL_KEYS.KMNIST]   : () => import('./MODEL_IMAGE_KMNIST').then((m) => m.default),
  [IC_MODEL_KEYS.MOBILENET]: () => import('./MODEL_IMAGE_MOBILENET').then((m) => m.default),
  [IC_MODEL_KEYS.RESNET]   : () => import('./MODEL_IMAGE_RESNET').then((m) => m.default),
}

export {
  MAP_IC_CLASSES,
  I_MODEL_IMAGE_CLASSIFICATION,
}
