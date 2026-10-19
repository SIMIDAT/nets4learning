// Las funciones de activación del glosario para dibujarlas: las mismas fórmulas y parámetros que se enseñan en cada
// tarjeta y en sus gráficas de PyTorch (x entre -6 y 6)

export const ACTIVATION_DOMAIN: [number, number] = [-6, 6]

const SELU_ALPHA = 1.6732632423543772
const SELU_SCALE = 1.0507009873554805
const LEAKY_SLOPE = 0.01

const softplus = (x: number) => Math.log1p(Math.exp(x))

export type ActivationFunction_t = {
  /** Nombre en la fórmula: Sigmoid(x), ReLU(x)… */
  name   : string
  fn     : (x: number) => number
  /** Parámetros con los que se dibuja (los de PyTorch por defecto), si los tiene */
  params?: string
}

/** Por clave del término (pages.glossary.activation-functions.table.<clave>) */
export const ACTIVATION_FUNCTIONS: Record<string, ActivationFunction_t> = {
  'linear'      : { name: 'Linear', fn: (x) => x },
  'sigmoid'     : { name: 'Sigmoid', fn: (x) => 1 / (1 + Math.exp(-x)) },
  'hard-sigmoid': { name: 'Hardsigmoid', fn: (x) => (x <= -3 ? 0 : x >= 3 ? 1 : x / 6 + 1 / 2) },
  'relu'        : { name: 'ReLU', fn: (x) => Math.max(0, x) },
  'relu6'       : { name: 'ReLU6', fn: (x) => Math.min(Math.max(0, x), 6) },
  'leaky-relu'  : { name: 'LeakyReLU', fn: (x) => (x > 0 ? x : LEAKY_SLOPE * x), params: `negative_slope = ${LEAKY_SLOPE}` },
  'elu'         : { name: 'ELU', fn: (x) => (x > 0 ? x : Math.exp(x) - 1), params: 'α = 1' },
  'tanh'        : { name: 'Tanh', fn: Math.tanh },
  'soft-plus'   : { name: 'Softplus', fn: softplus, params: 'β = 1' },
  'mish'        : { name: 'Mish', fn: (x) => x * Math.tanh(softplus(x)) },
  'selu'        : { name: 'SELU', fn: (x) => SELU_SCALE * (Math.max(0, x) + Math.min(0, SELU_ALPHA * (Math.exp(x) - 1))) },
}

/** x que corresponde a un punto del recorrido (0: el principio del dominio, 1: el final) */
export const activationX = (progress: number) => ACTIVATION_DOMAIN[0] + progress * (ACTIVATION_DOMAIN[1] - ACTIVATION_DOMAIN[0])

/** Puntos de la curva entre el principio del dominio y x (incluido), para dibujarla hasta ahí */
export function activationCurve(fn: (x: number) => number, x: number, step = 0.05): Array<{ x: number, y: number }> {
  const [start] = ACTIVATION_DOMAIN
  const points: Array<{ x: number, y: number }> = []
  for (let i = 0; start + i * step < x; i++) {
    const value = start + i * step
    points.push({ x: value, y: fn(value) })
  }
  points.push({ x, y: fn(x) })
  return points
}

/** Rango del eje y para todo el dominio (fijo: el eje no salta mientras se dibuja), con un margen */
export function activationRange(fn: (x: number) => number): [number, number] {
  const values = activationCurve(fn, ACTIVATION_DOMAIN[1]).map(({ y }) => y)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const margin = Math.max((max - min) * 0.1, 0.1)
  // Extremos redondos: enteros si el rango es amplio (ReLU, ELU…), décimas si es pequeño (Sigmoid, Tanh…)
  const unit = max - min > 3 ? 1 : 10
  return [Math.floor((min - margin) * unit) / unit, Math.ceil((max + margin) * unit) / unit]
}
