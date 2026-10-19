import I_MODEL_REGRESSION from './_model'
import { LR_MODEL_KEYS } from '@/MODEL_KEYS'
import { TASKS } from '@/TASKS'
import { withDynamicModels, type ModelRegistry } from '@core/models/modelRegistry'
import { builtinN4LPackage, n4lPackagesOf } from '@core/n4l/catalog'
import { LOCAL_KEY_PREFIX, openLocalPackage } from '@core/n4l/localPackages'
import type { N4LPackage_t } from '@core/n4l/source'
import type { TFunction } from 'i18next'

/** La clase de un paquete .n4l: MODEL_N4L con ese paquete (se descarga al usarla, como las demás) */
const n4lModelClass = (open: () => Promise<N4LPackage_t>) => async () => {
  const [{ default: MODEL_N4L }, pkg] = await Promise.all([import('./MODEL_N4L'), open()])
  return class extends MODEL_N4L {
    constructor(t: TFunction<'translation', undefined>, setAccordionActive: React.Dispatch<React.SetStateAction<string[]>>) {
      super(t, setAccordionActive, pkg)
    }
  }
}

/**
 * Clases de modelos de regresión, cargadas bajo demanda: subir un CSV propio, los paquetes .n4l de la aplicación y,
 * como local-<id>, los que haya abierto el usuario
 */
const MAP_LR_CLASSES: ModelRegistry<I_MODEL_REGRESSION> = withDynamicModels<I_MODEL_REGRESSION>({
  [LR_MODEL_KEYS.UPLOAD]: () => import('./MODEL__UPLOAD').then((m) => m.default),
  ...Object.fromEntries(n4lPackagesOf(TASKS.REGRESSION).map(({ entry, section }) =>
    [section.key, n4lModelClass(async () => builtinN4LPackage(entry))])),
}, (key) => (key.startsWith(LOCAL_KEY_PREFIX) ? n4lModelClass(() => openLocalPackage(key.slice(LOCAL_KEY_PREFIX.length))) : undefined))

export {
  MAP_LR_CLASSES,
  I_MODEL_REGRESSION,
}
