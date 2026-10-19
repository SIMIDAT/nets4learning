import I_MODEL_IMAGE_CLASSIFICATION from './_model'
import { TASKS } from '@/TASKS'
import { withDynamicModels, type ModelRegistry } from '@core/models/modelRegistry'
import { builtinN4LPackage, n4lPackagesOf } from '@core/n4l/catalog'
import { n4lFileUrls, n4lImageExamples, n4lImageRuntime } from '@core/n4l/imageClassification'
import { LOCAL_KEY_PREFIX, openLocalPackage } from '@core/n4l/localPackages'
import type { N4LPackage_t } from '@core/n4l/source'
import type { TFunction } from 'i18next'

/**
 * La clase de un paquete .n4l, según cómo se usa: MODEL_N4L (un modelo de TF.js con su sprite de imágenes) o
 * MODEL_N4L_MOBILENET, con ese paquete y la dirección de sus imágenes de ejemplo (se descarga al usarla, como las demás)
 */
const n4lModelClass = (open: () => Promise<N4LPackage_t>) => async () => {
  const pkg = await open()
  const runtime = n4lImageRuntime(pkg.manifest)
  const urls = await n4lFileUrls(pkg.source, n4lImageExamples(runtime.section).map(({ file }) => file))
  if (runtime.kind === 'mobilenet') {
    const mobilenet = runtime
    const { default: MODEL_N4L_MOBILENET } = await import('./MODEL_N4L_MOBILENET')
    return class extends MODEL_N4L_MOBILENET {
      constructor(t: TFunction<'translation', undefined>) {
        super(t, pkg, mobilenet, urls)
      }
    }
  }
  const sprite = runtime
  const { default: MODEL_N4L } = await import('./MODEL_N4L')
  return class extends MODEL_N4L {
    constructor(t: TFunction<'translation', undefined>) {
      super(t, pkg, sprite, urls)
    }
  }
}

/**
 * Clases de modelos de clasificación de imágenes, cargadas bajo demanda: los paquetes .n4l de la aplicación y, como
 * local-<id>, los que haya abierto el usuario
 */
const MAP_IC_CLASSES: ModelRegistry<I_MODEL_IMAGE_CLASSIFICATION> = withDynamicModels<I_MODEL_IMAGE_CLASSIFICATION>(
  Object.fromEntries(n4lPackagesOf(TASKS.IMAGE_CLASSIFICATION).map(({ entry, section }) =>
    [section.key, n4lModelClass(async () => builtinN4LPackage(entry))])),
  (key) => (key.startsWith(LOCAL_KEY_PREFIX) ? n4lModelClass(() => openLocalPackage(key.slice(LOCAL_KEY_PREFIX.length))) : undefined),
)

export {
  MAP_IC_CLASSES,
  I_MODEL_IMAGE_CLASSIFICATION,
}
