import { backward, forward, initNetwork, lossOf, update, type BackwardTrace_t, type StepNetwork_t } from '@core/nn-utils/stepByStep'

// El laboratorio 2D (/lab): una red pequeña que aprende a separar dos clases de puntos en un plano, con la frontera de
// decisión a la vista mientras entrena. Usa la misma red y las mismas cuentas que Paso a paso (src/core/nn-utils/
// stepByStep.ts): paso hacia delante, retropropagación y descenso del gradiente, aquí por mini-lotes.

export type LabDataset_t = 'blobs' | 'circles' | 'xor' | 'spiral'
export const LAB_DATASETS: readonly LabDataset_t[] = ['blobs', 'circles', 'xor', 'spiral']

/** Lo que entra en la red: las coordenadas y, si se eligen, otras características calculadas con ellas */
export type LabFeature_t = 'x' | 'y' | 'x2' | 'y2' | 'xy'
export const LAB_FEATURES: readonly LabFeature_t[] = ['x', 'y', 'x2', 'y2', 'xy']

/** Un punto del plano, en [-1, 1] × [-1, 1], con su clase */
export type LabPoint_t = { x: number, y: number, label: 0 | 1 }

export type LabConfig_t = {
  features    : LabFeature_t[]
  /** Neuronas de cada capa oculta (vacío: ninguna, la entrada va directa a la salida) */
  hidden      : number[]
  activation  : string
  learningRate: number
  batchSize   : number
}

/** Números aleatorios repetibles (mulberry32): la misma semilla da los mismos datos */
export function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const gaussian = (random: () => number) => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
const clamp = (value: number) => Math.max(-1, Math.min(1, value))

/**
 * Los puntos de un conjunto de juguete, la mitad de cada clase. `noise` (de 0 a 0,5) los desordena: con más ruido, las
 * clases se mezclan y es más fácil aprenderse los puntos de memoria
 */
export function makeDataset(kind: LabDataset_t, { count = 200, noise = 0.1, seed = 1 } = {}): LabPoint_t[] {
  const random = seededRandom(seed)
  const points: LabPoint_t[] = []
  const half = Math.floor(count / 2)
  for (let i = 0; i < count; i++) {
    const label: 0 | 1 = i < half ? 0 : 1
    let x: number
    let y: number
    switch (kind) {
      case 'blobs': {
        const centre = label === 0 ? -0.45 : 0.45
        x = centre + gaussian(random) * (0.15 + noise * 0.6)
        y = centre + gaussian(random) * (0.15 + noise * 0.6)
        break
      }
      case 'circles': {
        // Dentro, un círculo; fuera, un anillo
        const radius = label === 1 ? random() * 0.45 : 0.6 + random() * 0.3
        const angle = random() * 2 * Math.PI
        x = radius * Math.cos(angle) + gaussian(random) * noise * 0.5
        y = radius * Math.sin(angle) + gaussian(random) * noise * 0.5
        break
      }
      case 'xor': {
        // Cuadrantes opuestos, de la misma clase (sin puntos pegados a los ejes)
        const sx = random() < 0.5 ? -1 : 1
        const sy = label === 1 ? sx : -sx
        x = sx * (0.08 + random() * 0.85) + gaussian(random) * noise * 0.5
        y = sy * (0.08 + random() * 0.85) + gaussian(random) * noise * 0.5
        break
      }
      case 'spiral': {
        // Dos espirales, una dentro de la otra
        const k = (label === 0 ? i : i - half) / half
        const radius = 0.05 + 0.85 * k
        const angle = 1.75 * k * 2 * Math.PI + (label === 0 ? 0 : Math.PI)
        x = radius * Math.sin(angle) + gaussian(random) * noise * 0.3
        y = radius * Math.cos(angle) + gaussian(random) * noise * 0.3
        break
      }
    }
    points.push({ x: clamp(x), y: clamp(y), label })
  }
  // Mezclados, para repartirlos entre entrenamiento y prueba
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]]
  }
  return points
}

/** Los puntos de entrenamiento y los de prueba: la mitad cada uno (para ver si generaliza o se los aprende de memoria) */
export const splitDataset = (points: LabPoint_t[]) => ({
  train: points.slice(0, Math.ceil(points.length / 2)),
  test : points.slice(Math.ceil(points.length / 2)),
})

/** Lo que entra en la red para un punto */
export const featureValues = (features: LabFeature_t[], x: number, y: number) => features.map((feature) => {
  switch (feature) {
    case 'x': return x
    case 'y': return y
    case 'x2': return x * x
    case 'y2': return y * y
    case 'xy': return x * y
  }
})

/** La red: las capas ocultas elegidas y una salida de dos neuronas con softmax (la probabilidad de cada clase) */
export const createLabNetwork = (config: Pick<LabConfig_t, 'features' | 'hidden' | 'activation'>, seed = 1): StepNetwork_t =>
  initNetwork(config.features.length, [
    ...config.hidden.map((units) => ({ units, activation: config.activation })),
    { units: 2, activation: 'softmax' },
  ], seed)

const target = (label: 0 | 1) => (label === 0 ? [1, 0] : [0, 1])

function addInto(sum: BackwardTrace_t, gradients: BackwardTrace_t) {
  sum.gradWeights.forEach((layer, l) => layer.forEach((row, j) => row.forEach((_, i) => { row[i] += gradients.gradWeights[l][j][i] })))
  sum.gradBiases.forEach((layer, l) => layer.forEach((_, j) => { layer[j] += gradients.gradBiases[l][j] }))
}

function scale(gradients: BackwardTrace_t, factor: number): BackwardTrace_t {
  return {
    deltas     : gradients.deltas,
    gradWeights: gradients.gradWeights.map((layer) => layer.map((row) => row.map((value) => value * factor))),
    gradBiases : gradients.gradBiases.map((layer) => layer.map((value) => value * factor)),
  }
}

/**
 * Una época: los puntos de entrenamiento, mezclados, en lotes de `batchSize`. Con cada lote, la media de los
 * gradientes de sus puntos y un paso de descenso del gradiente
 */
export function trainEpoch(network: StepNetwork_t, points: LabPoint_t[], config: LabConfig_t, random: () => number): StepNetwork_t {
  const order = points.map((_, index) => index)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]]
  }
  let current = network
  for (let start = 0; start < order.length; start += config.batchSize) {
    const batch = order.slice(start, start + config.batchSize)
    let sum: BackwardTrace_t | null = null
    for (const index of batch) {
      const { x, y, label } = points[index]
      const trace = forward(current, featureValues(config.features, x, y))
      const gradients = backward(current, trace, target(label), 'cross-entropy')
      if (sum === null) sum = scale(gradients, 1)
      else addInto(sum, gradients)
    }
    if (sum !== null) current = update(current, scale(sum, 1 / batch.length), config.learningRate)
  }
  return current
}

/** La probabilidad de la clase 1 en un punto del plano */
export const probability = (network: StepNetwork_t, features: LabFeature_t[], x: number, y: number) =>
  forward(network, featureValues(features, x, y)).a.at(-1)![1]

/** La pérdida media (entropía cruzada) y los aciertos de la red con unos puntos */
export function evaluate(network: StepNetwork_t, points: LabPoint_t[], features: LabFeature_t[]): { loss: number, accuracy: number } {
  if (points.length === 0) return { loss: 0, accuracy: 0 }
  let loss = 0
  let right = 0
  for (const { x, y, label } of points) {
    const output = forward(network, featureValues(features, x, y)).a.at(-1)!
    loss += lossOf('cross-entropy', output, target(label))
    if ((output[1] >= 0.5 ? 1 : 0) === label) right++
  }
  return { loss: loss / points.length, accuracy: right / points.length }
}

/** La probabilidad de la clase 1 en el centro de cada celda de una rejilla de `size` × `size` sobre el plano (fila a fila, de arriba abajo) */
export function boundaryGrid(network: StepNetwork_t, features: LabFeature_t[], size = 40): Float32Array {
  const grid = new Float32Array(size * size)
  for (let row = 0; row < size; row++) {
    const y = 1 - ((row + 0.5) / size) * 2
    for (let column = 0; column < size; column++) {
      const x = ((column + 0.5) / size) * 2 - 1
      grid[row * size + column] = probability(network, features, x, y)
    }
  }
  return grid
}
