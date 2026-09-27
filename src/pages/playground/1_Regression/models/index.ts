import I_MODEL_REGRESSION from './_model'
import { LR_MODEL_KEYS } from '@/MODEL_KEYS'
import type { ModelRegistry } from '@core/models/modelRegistry'

/** Clases de modelos de regresión, cargadas bajo demanda. */
const MAP_LR_CLASSES: ModelRegistry<I_MODEL_REGRESSION> = {
  [LR_MODEL_KEYS.SALARY]             : () => import('./MODEL_1_SALARY').then((m) => m.default),
  [LR_MODEL_KEYS.AUTO_MPG]           : () => import('./MODEL_2_AUTO_MPG').then((m) => m.default),
  [LR_MODEL_KEYS.HOUSING_PRICES]     : () => import('./MODEL_3_HOUSING_PRICES').then((m) => m.default),
  [LR_MODEL_KEYS.BREAST_CANCER]      : () => import('./MODEL_4_BREAST_CANCER').then((m) => m.default),
  [LR_MODEL_KEYS.STUDENT_PERFORMANCE]: () => import('./MODEL_5_STUDENT_PERFORMANCE').then((m) => m.default),
  [LR_MODEL_KEYS.WINE]               : () => import('./MODEL_6_WINE').then((m) => m.default),
}

export {
  MAP_LR_CLASSES,
  I_MODEL_REGRESSION,
}
