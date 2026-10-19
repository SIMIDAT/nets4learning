import { afterEach, describe, expect, test, vi } from 'vitest'

import { pretrainedModelOf } from '@core/models/pretrainedModels'
import { offlineUsage } from '@core/offline/offline'

describe('pretrainedModelOf: de qué modelo es cada fichero descargado', () => {
  test.each([
    ['https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection_short.binarypb', 'FACE-DETECTOR'],
    ['https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh_solution_packed_assets.data', 'FACE-MESH'],
    ['https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands_solution_simd_wasm_bin.wasm', 'HAND-SIGN'],
    ['https://tfhub.dev/google/tfjs-model/movenet/multipose/lightning/1/model.json?tfjs-format=file', 'MOVE-NET--POSE-NET'],
    ['https://www.kaggle.com/models/google/movenet/tfJs/multipose-lightning/1/model.json?tfjs-format=file', 'MOVE-NET--POSE-NET'],
    ['https://storage.googleapis.com/tfjs-models/savedmodel/ssdlite_mobilenet_v2/model.json', 'COCO-SSD'],
    ['https://n4l.test/n4l/models/02-object-detection/face-api-js/v1.7.14/ssd_mobilenetv1_model-shard1', 'FACE-API'],
    ['https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2/model.json?tfjs-format=file', 'IMAGE-MOBILENET'],
  ])('%s → %s', (url, key) => {
    expect(pretrainedModelOf(url)?.key).toBe(key)
  })

  test('uno que no es de ningún modelo conocido: null', () => {
    expect(pretrainedModelOf('https://unpkg.com/otra-cosa/fichero.bin')).toBeNull()
  })
})

describe('offlineUsage: lo guardado, con los modelos uno a uno', () => {
  afterEach(() => vi.unstubAllGlobals())

  test('los ficheros de cada modelo, juntos, del que más ocupa al que menos y los desconocidos al final', async () => {
    const response = (bytes: number, withLength = true) =>
      new Response(new Uint8Array(bytes), { headers: withLength ? { 'content-length': String(bytes) } : {} })
    const stores: Record<string, Map<string, Response>> = {
      'n4l-models-v1': new Map([
        ['https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/a.data', response(300)],
        // Sin content-length (comprimido): se mide su contenido
        ['https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/b.wasm', response(200, false)],
        ['https://storage.googleapis.com/tfjs-models/savedmodel/ssdlite_mobilenet_v2/group1-shard1of5', response(1000)],
        ['https://unpkg.com/otra-cosa/fichero.bin', response(5000)],
      ]),
      'n4l-runtime-v1': new Map([['https://n4l.test/n4l/assets/index-AbCdEf123456.js', response(50)]]),
      'otra-web'      : new Map([['https://otra.test/x', response(7)]]),
    }
    vi.stubGlobal('caches', {
      keys: async () => Object.keys(stores),
      open: async (name: string) => ({
        keys : async () => [...stores[name].keys()].map((url) => new Request(url)),
        match: async (request: Request) => stores[name].get(request.url)?.clone(),
      }),
    })
    const usage = await offlineUsage()
    expect(usage.files).toBe(5)
    expect(usage.bytes).toBe(6550)
    expect(usage.models.bytes).toBe(6500)
    expect(usage.models.list.map(({ model, files, bytes }) => [model?.key ?? null, files, bytes])).toEqual([
      ['COCO-SSD', 1, 1000],
      ['FACE-MESH', 2, 500],
      [null, 1, 5000],
    ])
  })
})
