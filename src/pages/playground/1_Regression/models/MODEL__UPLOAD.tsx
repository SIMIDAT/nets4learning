import I_MODEL_REGRESSION from './_model'
import { LR_MODEL_KEYS } from '@/MODEL_KEYS'

/** Modelo para cuando el usuario sube su propio CSV: sin datasets ni capas predefinidas. */
export default class MODEL__UPLOAD extends I_MODEL_REGRESSION {
  static KEY = LR_MODEL_KEYS.UPLOAD
}
