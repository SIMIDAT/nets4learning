import * as tfjs from '@tensorflow/tfjs'

import type { N4LSource } from './source'

// Aparte de source.ts: el catálogo (en la carga inicial, por los menús) no tiene que arrastrar TensorFlow.js

const directoryOf = (path: string) => path.slice(0, path.lastIndexOf('/') + 1)

/**
 * Un modelo de TF.js del paquete (su model.json y, al lado, sus pesos). Servido, por su dirección (con el progreso
 * de la descarga y la caché del navegador); de un ZIP, desde la memoria.
 */
export async function loadN4LLayersModel(source: N4LSource, path: string, onProgress?: (fraction: number) => void) {
  const url = source.url(path)
  if (url !== null) return tfjs.loadLayersModel(url, { onProgress })
  const artifacts = JSON.parse(await source.readText(path)) as tfjs.io.ModelJSON
  const weightSpecs = artifacts.weightsManifest.flatMap((group) => group.weights)
  const buffers = await Promise.all(artifacts.weightsManifest.flatMap((group) =>
    group.paths.map((weights) => source.readBytes(directoryOf(path) + weights.replace(/^\.?\//, '')))))
  // Los pesos de todos los ficheros, seguidos (como los espera TF.js)
  const weightData = new Uint8Array(buffers.reduce((total, buffer) => total + buffer.byteLength, 0))
  buffers.reduce((offset, buffer) => {
    weightData.set(new Uint8Array(buffer), offset)
    return offset + buffer.byteLength
  }, 0)
  onProgress?.(1)
  return tfjs.loadLayersModel(tfjs.io.fromMemory({ modelTopology: artifacts.modelTopology, weightSpecs, weightData: weightData.buffer }))
}
