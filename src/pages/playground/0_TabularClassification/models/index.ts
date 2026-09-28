import I_MODEL_TABULAR_CLASSIFICATION from './_model'
import { TC_MODEL_KEYS } from '@/MODEL_KEYS'
import type { ModelRegistry } from '@core/models/modelRegistry'

/** Clases de modelos de clasificación tabular, cargadas bajo demanda. */
const MAP_TC_CLASSES: ModelRegistry<I_MODEL_TABULAR_CLASSIFICATION> = {
  [TC_MODEL_KEYS.UPLOAD]      : () => import('./MODEL__UPLOAD').then((m) => m.default),
  [TC_MODEL_KEYS.CAR]         : () => import('./MODEL_CAR').then((m) => m.default),
  [TC_MODEL_KEYS.IRIS]        : () => import('./MODEL_IRIS').then((m) => m.default),
  [TC_MODEL_KEYS.LYMPHOGRAPHY]: () => import('./MODEL_LYMPHOGRAPHY').then((m) => m.default),
}

export {
  MAP_TC_CLASSES,
  I_MODEL_TABULAR_CLASSIFICATION,
}
