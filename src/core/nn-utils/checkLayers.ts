import type { ImageLayer_t } from '@/types/types'

// Lo que está mal (o se puede mejorar) en las capas que ha montado el usuario, antes de entrenar, con el arreglo de
// cada cosa: las capas ya corregidas, para aplicarlas con un botón. Sin DOM ni traducciones: los textos los pone quien
// lo enseña (layer-check.<kind> con `values`).

export type LayerIssueKind_t =
  | 'param'
  | 'hidden-softmax'
  | 'output-units'
  | 'output-activation'
  | 'output-missing'
  | 'after-flatten'
  | 'flatten-again'
  | 'dense-before-flatten'
  | 'too-small'

export type LayerIssue_t<L> = {
  kind    : LayerIssueKind_t
  /** Un error impide entrenar; un aviso, no */
  severity: 'error' | 'warning'
  /** La capa (desde 0) de la que se habla */
  layer   : number
  values  : Record<string, number | string>
  /** Todas las capas, con esto ya corregido */
  fixed   : L[]
}

/** Lo que admite el campo de unidades del editor */
export const MAX_UNITS = 200

const isPositiveInteger = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 1

const replaceAt = <L>(layers: L[], index: number, layer: L) => layers.map((item, i) => (i === index ? layer : item))
const removeAt = <L>(layers: L[], index: number) => layers.filter((_item, i) => i !== index)

type DenseLike_t = { units?: number, activation?: string | null }

/**
 * Capas dense (clasificación tabular y regresión). Con `output`, la última tiene que dar una neurona por clase con esa
 * activación (clasificación); sin él, la salida la fija la página (regresión) o aún no se sabe (sin datos procesados).
 */
export function checkDenseLayers<L extends DenseLike_t>(layers: L[], output?: { units: number, activation: string }): LayerIssue_t<L>[] {
  const issues: LayerIssue_t<L>[] = []
  const last = layers.length - 1
  for (const [index, layer] of layers.entries()) {
    const isOutput = index === last && output !== undefined
    if (!isPositiveInteger(layer.units) || layer.units > MAX_UNITS) {
      const value = isOutput ? output.units : Math.min(Math.max(Math.round(Number(layer.units)) || 10, 1), MAX_UNITS)
      issues.push({ kind: 'param', severity: 'error', layer: index, values: { param: 'units', value }, fixed: replaceAt(layers, index, { ...layer, units: value }) })
    } else if (isOutput && layer.units !== output.units) {
      issues.push({ kind: 'output-units', severity: 'error', layer: index, values: { units: layer.units, classes: output.units }, fixed: replaceAt(layers, index, { ...layer, units: output.units }) })
    }
    if (index < last && layer.activation === 'softmax') {
      issues.push({ kind: 'hidden-softmax', severity: 'warning', layer: index, values: {}, fixed: replaceAt(layers, index, { ...layer, activation: 'relu' }) })
    }
    if (isOutput && (layer.activation || 'relu') !== output.activation) {
      issues.push({ kind: 'output-activation', severity: 'warning', layer: index, values: { activation: layer.activation || 'relu', expected: output.activation }, fixed: replaceAt(layers, index, { ...layer, activation: output.activation }) })
    }
  }
  return sortIssues(issues)
}

/** Lo que mide un lado de la imagen tras una ventana de `window` que avanza de `step` en `step`, sin relleno ("valid") */
const slide = (size: number, window: number, step: number) => Math.floor((size - window) / step) + 1

export type LayerShape_t = {
  /** Lo que recibe: alto × ancho × canales de la imagen o, tras aplanar, [valores] */
  input : number[]
  output: number[]
  /** Pesos que aprende (los sesgos incluidos) */
  params: number
}

/**
 * El tamaño de los datos a la entrada y a la salida de cada capa de la red de imágenes, y sus pesos (para explicarlas);
 * null desde la primera que no encaja (lo que dice checkImageLayers).
 */
export function imageLayerShapes(layers: ImageLayer_t[], inputShape: number[] = [28, 28, 1]): Array<LayerShape_t | null> {
  let shape = layers[0]?.inputShape ?? inputShape
  let isBroken = false
  return layers.map((layer) => {
    if (isBroken) return null
    const input = shape
    const isImage = input.length === 3
    const [height, width, channels] = input
    let output: number[] | null = null
    let params = 0
    if (layer._class === 'conv2d' && isImage && isPositiveInteger(layer.kernelSize) && isPositiveInteger(layer.filters) && layer.kernelSize <= Math.min(height, width)) {
      output = [slide(height, layer.kernelSize, 1), slide(width, layer.kernelSize, 1), layer.filters]
      params = layer.kernelSize * layer.kernelSize * channels * layer.filters + layer.filters
    } else if (layer._class === 'maxPooling2d' && isImage && isPositiveInteger(layer.poolSize) && isPositiveInteger(layer.strides) && layer.poolSize <= Math.min(height, width)) {
      output = [slide(height, layer.poolSize, layer.strides), slide(width, layer.poolSize, layer.strides), channels]
    } else if (layer._class === 'flatten' && isImage) {
      output = [height * width * channels]
    } else if (layer._class === 'dense' && !isImage && isPositiveInteger(layer.units)) {
      output = [layer.units]
      params = input[0] * layer.units + layer.units
    }
    if (output === null) {
      isBroken = true
      return null
    }
    shape = output
    return { input, output, params }
  })
}

const DEFAULT_IMAGE_PARAMS = { kernelSize: 3, filters: 16, poolSize: 2, strides: 2, units: 32 } as const
const IMAGE_PARAMS: Partial<Record<ImageLayer_t['_class'], (keyof typeof DEFAULT_IMAGE_PARAMS)[]>> = {
  conv2d      : ['kernelSize', 'filters'],
  maxPooling2d: ['poolSize', 'strides'],
  dense       : ['units'],
}

/**
 * Capas de la red de imágenes: se sigue el tamaño de los datos capa a capa (la imagen de alto × ancho × canales y, tras
 * Flatten, una lista de números) para ver dónde no encajan. Una capa que sobra se da por quitada (y una Dense sin
 * Flatten, por aplanada), que es su arreglo, para no repetir el mismo error en las siguientes.
 */
export function checkImageLayers(layers: ImageLayer_t[], classes: number, inputShape: number[] = [28, 28, 1]): LayerIssue_t<ImageLayer_t>[] {
  const issues: LayerIssue_t<ImageLayer_t>[] = []
  let [height, width] = layers[0]?.inputShape ?? inputShape
  let isFlat = false
  // Las que sobran: la salida es la última de las demás
  const removed = new Set<number>()

  for (const [index, layer] of layers.entries()) {
    const params = IMAGE_PARAMS[layer._class] ?? []
    const wrong = params.find((param) => !isPositiveInteger(layer[param]) || (param === 'units' && Number(layer[param]) > MAX_UNITS))
    if (wrong !== undefined) {
      const value = wrong === 'units' && index === layers.length - 1 ? classes : DEFAULT_IMAGE_PARAMS[wrong]
      issues.push({ kind: 'param', severity: 'error', layer: index, values: { param: wrong, value }, fixed: replaceAt(layers, index, { ...layer, [wrong]: value }) })
      continue
    }
    const remove = () => {
      removed.add(index)
      return { severity: 'error' as const, layer: index, fixed: removeAt(layers, index) }
    }
    switch (layer._class) {
      case 'conv2d':
      case 'maxPooling2d': {
        const type = layer._class === 'conv2d' ? 'Conv 2D' : 'Max Pooling 2D'
        if (isFlat) {
          issues.push({ kind: 'after-flatten', values: { type }, ...remove() })
          break
        }
        const window = (layer._class === 'conv2d' ? layer.kernelSize : layer.poolSize)!
        if (window > Math.min(height, width)) {
          issues.push({ kind: 'too-small', values: { type, height, width, window }, ...remove() })
          break
        }
        // Sin relleno (padding "valid"): la convolución avanza de 1 en 1 y el pooling, de `strides` en `strides`
        const step = layer._class === 'conv2d' ? 1 : layer.strides!
        height = slide(height, window, step)
        width = slide(width, window, step)
        break
      }
      case 'flatten': {
        if (isFlat) issues.push({ kind: 'flatten-again', values: {}, ...remove() })
        isFlat = true
        break
      }
      case 'dense': {
        if (!isFlat) {
          const fixed = [...layers.slice(0, index), { _class: 'flatten', activation: null } as ImageLayer_t, ...layers.slice(index)]
          issues.push({ kind: 'dense-before-flatten', severity: 'error', layer: index, values: {}, fixed })
          isFlat = true
        }
        break
      }
    }
  }

  // La salida: una Dense con una neurona por clase y softmax
  let index = layers.length - 1
  while (removed.has(index)) index--
  const last = layers[index]
  if (last === undefined) return sortIssues(issues)
  // Softmax antes de la salida
  for (const [hidden, layer] of layers.slice(0, index).entries()) {
    if (layer._class === 'dense' && layer.activation === 'softmax' && !removed.has(hidden)) {
      issues.push({ kind: 'hidden-softmax', severity: 'warning', layer: hidden, values: {}, fixed: replaceAt(layers, hidden, { ...layer, activation: 'relu' }) })
    }
  }
  if (last._class !== 'dense') {
    const output: ImageLayer_t[] = [...(isFlat ? [] : [{ _class: 'flatten', activation: null } as ImageLayer_t]), { _class: 'dense', units: classes, activation: 'softmax' }]
    issues.push({ kind: 'output-missing', severity: 'error', layer: index, values: { classes }, fixed: [...layers.slice(0, index + 1), ...output, ...layers.slice(index + 1)] })
  } else if (isPositiveInteger(last.units)) {
    if (last.units !== classes) {
      issues.push({ kind: 'output-units', severity: 'error', layer: index, values: { units: last.units, classes }, fixed: replaceAt(layers, index, { ...last, units: classes }) })
    }
    if (last.activation !== 'softmax') {
      issues.push({ kind: 'output-activation', severity: 'warning', layer: index, values: { activation: last.activation ?? 'linear', expected: 'softmax' }, fixed: replaceAt(layers, index, { ...last, activation: 'softmax' }) })
    }
  }
  return sortIssues(issues)
}

/** Primero los errores y, dentro de cada grupo, en el orden de las capas */
function sortIssues<L>(issues: LayerIssue_t<L>[]): LayerIssue_t<L>[] {
  return [...issues].sort((a, b) => (a.severity === b.severity ? a.layer - b.layer : a.severity === 'error' ? -1 : 1))
}
