// Una red densa pequeña calculada a mano, sin TF.js, para enseñar el entrenamiento paso a paso: cada suma ponderada,
// cada activación, el error y cómo vuelve hacia atrás (retropropagación) hasta cambiar cada peso. Con TF.js todo eso
// pasa dentro de model.fit y no se puede ver.

/** Más nodos (entradas y neuronas) no se dibujan: ni el navegador ni quien lo mira lo seguirían */
export const MAX_STEP_NODES = 64

/** La tasa de aprendizaje del paso a paso con un modelo ya entrenado (sus páginas no tienen editor de hiperparámetros) */
export const PRETRAINED_LEARNING_RATE = 0.01

export type StepLayer_t = { units: number, activation: string }

/** Pesos de cada capa: weights[capa][neurona][entrada] y biases[capa][neurona] */
export type StepNetwork_t = {
  inputs : number
  layers : StepLayer_t[]
  weights: number[][][]
  biases : number[][]
}

/** Clasificación: entropía cruzada (con softmax en la salida); regresión: error cuadrático medio */
export type StepLoss_t = 'cross-entropy' | 'mse'

/** Lo que calcula el paso hacia delante: la suma ponderada (z) y la activación (a) de cada neurona, capa a capa */
export type ForwardTrace_t = { input: number[], z: number[][], a: number[][] }

/** Lo que calcula el paso hacia atrás: el delta de cada neurona (∂pérdida/∂z) y el gradiente de cada peso y sesgo */
export type BackwardTrace_t = { deltas: number[][], gradWeights: number[][][], gradBiases: number[][] }

/** Neuronas que se dibujarían: las de entrada más las de cada capa */
export const countNodes = (inputs: number, layers: StepLayer_t[]) => inputs + layers.reduce((sum, { units }) => sum + units, 0)

/** Números aleatorios repetibles (mulberry32): la misma semilla da los mismos pesos iniciales */
function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6D2B79F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Pesos iniciales como los de TF.js (Glorot uniforme) y sesgos a cero */
export function initNetwork(inputs: number, layers: StepLayer_t[], seed = 42): StepNetwork_t {
  const random = seededRandom(seed)
  const weights: number[][][] = []
  let fanIn = inputs
  for (const { units } of layers) {
    const limit = Math.sqrt(6 / (fanIn + units))
    weights.push(Array.from({ length: units }, () => Array.from({ length: fanIn }, () => (random() * 2 - 1) * limit)))
    fanIn = units
  }
  return { inputs, layers, weights, biases: layers.map(({ units }) => new Array<number>(units).fill(0)) }
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
const softplus = (x: number) => (x > 20 ? x : Math.log1p(Math.exp(x)))
const SELU_ALPHA = 1.6732632423543772
const SELU_SCALE = 1.0507009873554805

/** La activación de una capa (softmax mira toda la capa; las demás, cada neurona por separado) */
export function activate(activation: string, z: number[]): number[] {
  if (activation === 'softmax') {
    const max = Math.max(...z)
    const exps = z.map((value) => Math.exp(value - max))
    const sum = exps.reduce((total, value) => total + value, 0)
    return exps.map((value) => value / sum)
  }
  return z.map((x) => {
    switch (activation) {
      case 'relu': return Math.max(0, x)
      case 'relu6': return Math.min(Math.max(0, x), 6)
      case 'sigmoid': return sigmoid(x)
      case 'hardSigmoid': return Math.min(Math.max(0.2 * x + 0.5, 0), 1)
      case 'tanh': return Math.tanh(x)
      case 'elu': return x > 0 ? x : Math.expm1(x)
      case 'selu': return SELU_SCALE * (x > 0 ? x : SELU_ALPHA * Math.expm1(x))
      case 'softplus': return softplus(x)
      case 'softsign': return x / (1 + Math.abs(x))
      case 'swish': return x * sigmoid(x)
      case 'mish': return x * Math.tanh(softplus(x))
      default: return x // linear
    }
  })
}

/** Lleva hacia atrás a través de la activación: de ∂pérdida/∂a a ∂pérdida/∂z */
export function activationBackward(activation: string, z: number[], a: number[], gradA: number[]): number[] {
  if (activation === 'softmax') {
    const dot = gradA.reduce((sum, g, k) => sum + g * a[k], 0)
    return a.map((value, j) => value * (gradA[j] - dot))
  }
  return z.map((x, j) => {
    const derivative = (() => {
      switch (activation) {
        case 'relu': return x > 0 ? 1 : 0
        case 'relu6': return x > 0 && x < 6 ? 1 : 0
        case 'sigmoid': return a[j] * (1 - a[j])
        case 'hardSigmoid': return x > -2.5 && x < 2.5 ? 0.2 : 0
        case 'tanh': return 1 - a[j] * a[j]
        case 'elu': return x > 0 ? 1 : Math.exp(x)
        case 'selu': return SELU_SCALE * (x > 0 ? 1 : SELU_ALPHA * Math.exp(x))
        case 'softplus': return sigmoid(x)
        case 'softsign': return 1 / (1 + Math.abs(x)) ** 2
        case 'swish': {
          const s = sigmoid(x)
          return s + x * s * (1 - s)
        }
        case 'mish': {
          const t = Math.tanh(softplus(x))
          return t + x * (1 - t * t) * sigmoid(x)
        }
        default: return 1 // linear
      }
    })()
    return gradA[j] * derivative
  })
}

/** Paso hacia delante: cada neurona suma sus entradas por sus pesos, más el sesgo (z), y aplica su activación (a) */
export function forward(network: StepNetwork_t, input: number[]): ForwardTrace_t {
  const z: number[][] = []
  const a: number[][] = []
  let previous = input
  network.layers.forEach(({ activation }, l) => {
    const sums = network.weights[l].map((row, j) => row.reduce((sum, w, i) => sum + w * previous[i], network.biases[l][j]))
    z.push(sums)
    previous = activate(activation, sums)
    a.push(previous)
  })
  return { input, z, a }
}

// log(0) no existe: las probabilidades se recortan como en TF.js
const EPSILON = 1e-7

/** Cuánto se equivoca la red con este ejemplo */
export function lossOf(kind: StepLoss_t, output: number[], target: number[]): number {
  if (kind === 'cross-entropy') {
    return -target.reduce((sum, y, k) => sum + y * Math.log(Math.min(Math.max(output[k], EPSILON), 1 - EPSILON)), 0)
  }
  return output.reduce((sum, value, k) => sum + (value - target[k]) ** 2, 0) / output.length
}

/** ∂pérdida/∂salida */
function lossGradient(kind: StepLoss_t, output: number[], target: number[]): number[] {
  if (kind === 'cross-entropy') return target.map((y, k) => -y / Math.min(Math.max(output[k], EPSILON), 1 - EPSILON))
  return output.map((value, k) => (2 * (value - target[k])) / output.length)
}

/**
 * Paso hacia atrás (retropropagación): el error de la salida vuelve capa a capa. El delta de una neurona es cuánto
 * cambiaría la pérdida si cambiara su suma z; el gradiente de un peso, su delta por la entrada que multiplica.
 */
export function backward(network: StepNetwork_t, trace: ForwardTrace_t, target: number[], kind: StepLoss_t): BackwardTrace_t {
  const L = network.layers.length
  const deltas: number[][] = new Array(L)
  let gradA = lossGradient(kind, trace.a[L - 1], target)
  for (let l = L - 1; l >= 0; l--) {
    deltas[l] = activationBackward(network.layers[l].activation, trace.z[l], trace.a[l], gradA)
    if (l > 0) {
      gradA = trace.a[l - 1].map((_, i) => network.weights[l].reduce((sum, row, j) => sum + row[i] * deltas[l][j], 0))
    }
  }
  const gradWeights = deltas.map((delta, l) => {
    const previous = l === 0 ? trace.input : trace.a[l - 1]
    return delta.map((d) => previous.map((value) => d * value))
  })
  return { deltas, gradWeights, gradBiases: deltas.map((delta) => [...delta]) }
}

/** Descenso del gradiente: cada peso se mueve un poco en contra de su gradiente (w ← w − η·g) */
export function update(network: StepNetwork_t, gradients: BackwardTrace_t, learningRate: number): StepNetwork_t {
  return {
    ...network,
    weights: network.weights.map((layer, l) => layer.map((row, j) => row.map((w, i) => w - learningRate * gradients.gradWeights[l][j][i]))),
    biases : network.biases.map((layer, l) => layer.map((b, j) => b - learningRate * gradients.gradBiases[l][j])),
  }
}

/**
 * Las fases de un paso de entrenamiento, en el orden en que se enseñan: la entrada, cada capa hacia delante, el error,
 * cada capa hacia atrás (de la salida a la primera) y la actualización de los pesos.
 */
export type StepPhase_t =
  | { kind: 'input' }
  | { kind: 'forward', layer: number }
  | { kind: 'loss' }
  | { kind: 'backward', layer: number }
  | { kind: 'update' }

export function stepPhases(layers: number): StepPhase_t[] {
  return [
    { kind: 'input' },
    ...Array.from({ length: layers }, (_, layer) => ({ kind: 'forward' as const, layer })),
    { kind: 'loss' },
    ...Array.from({ length: layers }, (_, i) => ({ kind: 'backward' as const, layer: layers - 1 - i })),
    { kind: 'update' },
  ]
}
