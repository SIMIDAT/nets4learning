import { describe, test, expect } from 'vitest'
import { checkDenseLayers, checkImageLayers, imageLayerShapes } from '@core/nn-utils/checkLayers'
import { buildImageModel } from '@core/training/buildModels'
import type { Layer_t } from '@/types/types'

type Dense_t = { units: number, activation: string | null }
const kinds = (issues: { kind: string }[]) => issues.map(({ kind }) => kind)

describe('checkDenseLayers: capas de clasificación tabular y regresión', () => {
  const output = { units: 3, activation: 'softmax' }
  const good: Dense_t[] = [{ units: 10, activation: 'relu' }, { units: 3, activation: 'softmax' }]

  test('una red bien montada no tiene nada que decir', () => {
    expect(checkDenseLayers(good, output)).toEqual([])
  })

  test('la salida necesita una neurona por clase (error) y softmax (aviso); el arreglo deja la red bien', () => {
    const issues = checkDenseLayers([{ units: 10, activation: 'relu' }, { units: 5, activation: 'sigmoid' }], output)
    expect(kinds(issues)).toEqual(['output-units', 'output-activation'])
    expect(issues[0]).toMatchObject({ severity: 'error', layer: 1, values: { units: 5, classes: 3 } })
    expect(issues[1]).toMatchObject({ severity: 'warning', values: { activation: 'sigmoid', expected: 'softmax' } })
    expect(checkDenseLayers(issues[1].fixed, output)).toHaveLength(1)
    expect(checkDenseLayers(checkDenseLayers(issues[0].fixed, output)[0].fixed, output)).toEqual([])
  })

  test('unidades vacías, a cero o de más: error, y el arreglo pone un valor válido', () => {
    const issues = checkDenseLayers([{ units: NaN, activation: 'relu' }, { units: 500, activation: 'relu' }, { units: 0, activation: 'softmax' }], output)
    expect(issues.map(({ kind, layer, values }) => [kind, layer, values.value])).toEqual([['param', 0, 10], ['param', 1, 200], ['param', 2, 3]])
  })

  test('softmax en una capa oculta: aviso, y se cambia por ReLU', () => {
    const [issue] = checkDenseLayers([{ units: 10, activation: 'softmax' }, { units: 3, activation: 'softmax' }], output)
    expect(issue).toMatchObject({ kind: 'hidden-softmax', severity: 'warning', layer: 0 })
    expect(issue.fixed[0]).toEqual({ units: 10, activation: 'relu' })
  })

  test('sin salida fijada (regresión), la última capa no se mira', () => {
    expect(checkDenseLayers([{ units: 8, activation: 'relu' }, { units: 1, activation: 'linear' }])).toEqual([])
  })

  test('no cambia las capas que recibe', () => {
    const layers = [{ units: 10, activation: 'relu' }, { units: 5, activation: 'relu' }]
    checkDenseLayers(layers, output)
    expect(layers).toEqual([{ units: 10, activation: 'relu' }, { units: 5, activation: 'relu' }])
  })
})

describe('checkImageLayers: la red de imágenes, siguiendo el tamaño de los datos capa a capa', () => {
  const conv = (kernelSize = 3, filters = 8): Layer_t => ({ _class: 'conv2d', kernelSize, filters, activation: 'relu' })
  const pool = (poolSize = 2, strides = 2): Layer_t => ({ _class: 'maxPooling2d', poolSize, strides })
  const flatten: Layer_t = { _class: 'flatten' }
  const dense = (units: number, activation = 'relu'): Layer_t => ({ _class: 'dense', units, activation })
  const first: Layer_t = { ...conv(), _protected: true, inputShape: [28, 28, 1] }
  const good = [first, pool(), conv(), pool(), flatten, dense(32), dense(10, 'softmax')]

  // El arreglo vale de verdad: tfjs construye la red y da una salida por clase
  const builds = (layers: Layer_t[]) => expect(buildImageModel(layers).outputs[0].shape).toEqual([null, 10])

  test('la red por defecto está bien y se construye', () => {
    expect(checkImageLayers(good, 10)).toEqual([])
    builds(good)
  })

  test('Dense sin aplanar antes: error, y el arreglo añade Flatten delante', () => {
    const issues = checkImageLayers([first, pool(), dense(10, 'softmax')], 10)
    expect(kinds(issues)).toEqual(['dense-before-flatten'])
    expect(issues[0].fixed.map(({ _class }) => _class)).toEqual(['conv2d', 'maxPooling2d', 'flatten', 'dense'])
    expect(checkImageLayers(issues[0].fixed, 10)).toEqual([])
    builds(issues[0].fixed)
  })

  test('convolución o pooling después de Flatten, o un segundo Flatten: error, y se quitan', () => {
    const issues = checkImageLayers([first, flatten, conv(), flatten, dense(10, 'softmax')], 10)
    expect(issues.map(({ kind, layer }) => [kind, layer])).toEqual([['after-flatten', 2], ['flatten-again', 3]])
    const fixed = checkImageLayers(issues[0].fixed, 10)[0].fixed
    expect(checkImageLayers(fixed, 10)).toEqual([])
    builds(fixed)
  })

  test('la imagen se queda más pequeña que la ventana: error con su tamaño en ese punto', () => {
    // 28 → 26 → 13 → 11 → 5 → 3 → 1: un pooling de 2 ya no cabe
    const layers = [first, pool(), conv(), pool(), conv(), pool(), pool(), flatten, dense(10, 'softmax')]
    const [issue, ...rest] = checkImageLayers(layers, 10)
    expect(rest).toEqual([])
    expect(issue).toMatchObject({ kind: 'too-small', layer: 6, values: { type: 'Max Pooling 2D', height: 1, width: 1, window: 2 } })
    builds(issue.fixed)
  })

  test('la salida: falta la Dense final (se añade) o no tiene una neurona por clase o softmax', () => {
    const missing = checkImageLayers([first, pool()], 10)
    expect(kinds(missing)).toEqual(['output-missing'])
    builds(missing[0].fixed)

    const issues = checkImageLayers([first, flatten, dense(4, 'sigmoid')], 10)
    expect(kinds(issues)).toEqual(['output-units', 'output-activation'])
    builds(issues[0].fixed)
  })

  test('una capa añadida después de la salida: solo se dice que sobra (la salida sigue siendo la Dense de antes)', () => {
    const issues = checkImageLayers([...good, pool()], 10)
    expect(issues.map(({ kind, layer }) => [kind, layer])).toEqual([['after-flatten', 7]])
    expect(issues[0].fixed).toEqual(good)
  })

  test('parámetros vacíos o a cero: error con el valor que se pondría', () => {
    const issues = checkImageLayers([first, { ...pool(), poolSize: NaN }, flatten, dense(0, 'softmax')], 10)
    expect(issues.map(({ kind, values }) => [kind, values.param, values.value])).toEqual([['param', 'poolSize', 2], ['param', 'units', 10]])
  })
})

describe('imageLayerShapes: el tamaño de los datos y los pesos de cada capa', () => {
  test('la red por defecto de MNIST: 28×28×1 → … → 10, con los mismos pesos que cuenta tfjs', () => {
    const layers: Layer_t[] = [
      { _class: 'conv2d', _protected: true, inputShape: [28, 28, 1], kernelSize: 3, filters: 16, activation: 'relu' },
      { _class: 'maxPooling2d', poolSize: 2, strides: 2 },
      { _class: 'conv2d', kernelSize: 3, filters: 32, activation: 'relu' },
      { _class: 'flatten' },
      { _class: 'dense', units: 10, activation: 'softmax' },
    ]
    const shapes = imageLayerShapes(layers)
    expect(shapes.map((shape) => shape?.output)).toEqual([[26, 26, 16], [13, 13, 16], [11, 11, 32], [3872], [10]])
    expect(shapes.map((shape) => shape?.params)).toEqual([160, 0, 4640, 0, 38730])
    expect(buildImageModel(layers).layers.map((layer) => layer.countParams())).toEqual([160, 0, 4640, 0, 38730])
  })

  test('desde la primera capa que no encaja, null', () => {
    const shapes = imageLayerShapes([{ _class: 'conv2d', inputShape: [28, 28, 1], kernelSize: 3, filters: 8, activation: 'relu' }, { _class: 'dense', units: 10, activation: 'softmax' }, { _class: 'flatten' }])
    expect(shapes.map((shape) => shape?.output ?? null)).toEqual([[26, 26, 8], null, null])
  })
})
