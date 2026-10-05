// Motor «image-classification» de los paquetes .n4l: qué modelo usa la tarea (uno de TF.js con las imágenes del
// paquete, en gris o en color, o MobileNet), sus imágenes de ejemplo y una dirección para cada fichero (también si el
// paquete es un .n4l abierto por el usuario, que no está servido).

import {
  isImageDataset,
  isImagePrediction,
  n4lTaskView,
  type N4LImageDataset_t,
  type N4LImageExample_t,
  type N4LLayersModel_t,
  type N4LManifest_t,
  type N4LMobileNetModel_t,
  type N4LTask_t,
} from './format'
import type { N4LSource } from './source'
import { N4LError } from './validate'

const TASK = 'image-classification'

/** Las imágenes que sabe usar la aplicación: en gris (1 canal; se pueden dibujar) o en color (RGB), de hasta 64×64 */
export const N4L_IMAGE_CHANNELS = [1, 3]
export const N4L_IMAGE_MAX_SIDE = 64

/** Cómo se usa el paquete: un modelo de TF.js con su sprite de imágenes, o MobileNet (con un conjunto externo) */
export type N4LImageRuntime_t =
  | { kind: 'sprite', section: N4LTask_t, dataset: N4LImageDataset_t, model: N4LLayersModel_t | undefined }
  | { kind: 'mobilenet', section: N4LTask_t, model: N4LMobileNetModel_t }

/** Cómo se usa el paquete en la clasificación de imágenes; N4LError si la aplicación no sabe usarlo */
export function n4lImageRuntime(manifest: N4LManifest_t): N4LImageRuntime_t {
  const view = n4lTaskView(manifest, TASK)
  if (view === undefined) throw new N4LError(manifest.id, [`no tiene la tarea ${TASK}`])
  const { section, dataset } = view
  const mobilenet = section.models.find((model): model is N4LMobileNetModel_t => model.format === 'tfjs-mobilenet')
  if (mobilenet !== undefined) return { kind: 'mobilenet', section, model: mobilenet }
  if (!isImageDataset(dataset)) throw new N4LError(manifest.id, [`${TASK}: su conjunto tiene que ser un sprite de imágenes (kind image-sprite)`])
  const { width, height, channels } = dataset.image
  if (!N4L_IMAGE_CHANNELS.includes(channels) || Math.max(width, height) > N4L_IMAGE_MAX_SIDE) {
    throw new N4LError(manifest.id, [`datasets.${dataset.id}.image: la aplicación solo sabe usar imágenes en gris (channels 1) o en color (channels 3) de hasta ${N4L_IMAGE_MAX_SIDE}×${N4L_IMAGE_MAX_SIDE}`])
  }
  if ((section.classes ?? []).length < 2) throw new N4LError(manifest.id, [`${TASK}.classes: al menos dos clases`])
  const model = section.models.find((item): item is N4LLayersModel_t => item.format === 'tfjs-layers' && item.dataset === dataset.id)
  return { kind: 'sprite', section, dataset, model }
}

/** Las imágenes de ejemplo de una tarea */
export const n4lImageExamples = (section: N4LTask_t): N4LImageExample_t[] =>
  (section.prediction !== undefined && isImagePrediction(section.prediction) ? section.prediction.images : [])

const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }

/**
 * Una dirección para cada fichero: la suya si el paquete está servido; si no (un .n4l abierto), una del navegador con
 * sus bytes (vale para las imágenes, el sprite que se lee en un worker y fetch)
 */
export async function n4lFileUrls(source: N4LSource, paths: string[]): Promise<Record<string, string>> {
  return Object.fromEntries(await Promise.all([...new Set(paths)].map(async (path) => {
    const url = source.url(path)
    if (url !== null) return [path, url] as const
    const type = MIME[path.slice(path.lastIndexOf('.') + 1).toLowerCase()] ?? 'application/octet-stream'
    return [path, URL.createObjectURL(new Blob([await source.readBytes(path)], { type }))] as const
  })))
}
