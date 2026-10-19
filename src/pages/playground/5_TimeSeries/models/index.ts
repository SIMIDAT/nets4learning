import { TASKS } from '@/TASKS'
import type { MenuModel_t } from '@/DATA_MODEL'
import type { ModelRegistry } from '@core/models/modelRegistry'
import { builtinN4LPackage, n4lPackagesOf, type N4LCatalogEntry_t } from '@core/n4l/catalog'

/** La clase de una serie de un paquete: MODEL_N4L con ese paquete (se descarga al usarla, como las demás) */
const n4lModelClass = (entry: N4LCatalogEntry_t) => async () => {
  const { default: MODEL_N4L } = await import('./MODEL_N4L')
  return class extends MODEL_N4L {
    constructor() {
      super(builtinN4LPackage(entry))
    }
  }
}

/** Las series de los paquetes .n4l de la aplicación, por su clave: su nombre y su descripción en los menús */
const MAP_TS_CLASSES: ModelRegistry<MenuModel_t> = Object.fromEntries(n4lPackagesOf(TASKS.TIME_SERIES).map(({ entry, section }) =>
  [section.key, n4lModelClass(entry)]))

export { MAP_TS_CLASSES }
