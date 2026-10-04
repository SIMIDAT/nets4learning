// Agrupamiento (clustering) con k-means, sin TF.js: los conjuntos de la aplicación son pequeños (cientos de filas) y así
// cada paso se puede guardar y enseñar. También lo que hace falta para entenderlo: escalar, proyectar a 2D (PCA) para
// dibujarlo, la silueta, el codo y comparar los grupos con las clases reales cuando las hay.

export type Point_t = number[]

/** Números pseudoaleatorios con semilla (mulberry32): la misma semilla, los mismos grupos */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6D2B79F5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export const squaredDistance = (a: Point_t, b: Point_t) => a.reduce((total, value, index) => total + (value - b[index]) ** 2, 0)

/** k-means++: el primer centroide al azar y cada uno de los siguientes, con más probabilidad cuanto más lejos esté */
export function kmeansPlusPlus(points: Point_t[], k: number, random: () => number): Point_t[] {
  const centroids: Point_t[] = [points[Math.floor(random() * points.length)]]
  while (centroids.length < k) {
    const distances = points.map((point) => Math.min(...centroids.map((centroid) => squaredDistance(point, centroid))))
    const total = distances.reduce((sum, value) => sum + value, 0)
    if (total === 0) {
      centroids.push(points[Math.floor(random() * points.length)])
      continue
    }
    let target = random() * total
    const index = distances.findIndex((distance) => (target -= distance) <= 0)
    centroids.push(points[index === -1 ? points.length - 1 : index])
  }
  return centroids.map((centroid) => [...centroid])
}

/** El grupo de cada punto: el del centroide más cercano */
export function assign(points: Point_t[], centroids: Point_t[]): number[] {
  return points.map((point) => {
    let best = 0
    let bestDistance = Infinity
    centroids.forEach((centroid, index) => {
      const distance = squaredDistance(point, centroid)
      if (distance < bestDistance) {
        best = index
        bestDistance = distance
      }
    })
    return best
  })
}

/** Inercia: la suma de las distancias al cuadrado de cada punto a su centroide (cuanto menor, más compactos) */
export const inertia = (points: Point_t[], centroids: Point_t[], assignments: number[]) =>
  points.reduce((total, point, index) => total + squaredDistance(point, centroids[assignments[index]]), 0)

export type KMeansStep_t = {
  centroids  : Point_t[]
  assignments: number[]
  inertia    : number
}

export type KMeansResult_t = KMeansStep_t & {
  /** Cada iteración, empezando por los centroides iniciales: para verlo paso a paso */
  steps    : KMeansStep_t[]
  converged: boolean
}

/**
 * k-means: asignar cada punto al centroide más cercano y mover cada centroide a la media de sus puntos, hasta que nadie
 * cambie de grupo (o MAX iteraciones). Un grupo que se queda vacío conserva su centroide.
 */
export function kmeans(points: Point_t[], { k, seed = 1, maxIterations = 50 }: { k: number, seed?: number, maxIterations?: number }): KMeansResult_t {
  if (points.length === 0 || k < 1) throw new Error('kmeans: no points or k < 1')
  const random = seededRandom(seed)
  let centroids = kmeansPlusPlus(points, Math.min(k, points.length), random)
  let assignments = assign(points, centroids)
  const steps: KMeansStep_t[] = [{ centroids, assignments, inertia: inertia(points, centroids, assignments) }]
  let converged = false
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    centroids = centroids.map((centroid, cluster) => {
      const members = points.filter((_point, index) => assignments[index] === cluster)
      if (members.length === 0) return centroid
      return centroid.map((_value, dimension) => members.reduce((sum, point) => sum + point[dimension], 0) / members.length)
    })
    const next = assign(points, centroids)
    const changed = next.some((cluster, index) => cluster !== assignments[index])
    assignments = next
    steps.push({ centroids, assignments, inertia: inertia(points, centroids, assignments) })
    if (!changed) {
      converged = true
      break
    }
  }
  return { ...steps[steps.length - 1], steps, converged }
}

/** Cada columna con media 0 y desviación 1 (las que no varían, a 0): si no, las de valores grandes deciden solas */
export function standardize(points: Point_t[]): Point_t[] {
  const dimensions = points[0]?.length ?? 0
  const means = Array.from({ length: dimensions }, (_value, dimension) => points.reduce((sum, point) => sum + point[dimension], 0) / points.length)
  const stds = means.map((mean, dimension) => Math.sqrt(points.reduce((sum, point) => sum + (point[dimension] - mean) ** 2, 0) / points.length))
  return points.map((point) => point.map((value, dimension) => (stds[dimension] === 0 ? 0 : (value - means[dimension]) / stds[dimension])))
}

/**
 * Silueta media (de −1 a 1): para cada punto, cuánto más cerca está de los de su grupo que de los del grupo vecino.
 * Con muchos puntos se calcula con una muestra (es cuadrática).
 */
export function silhouette(points: Point_t[], assignments: number[], { sample = 1000, seed = 1 } = {}): number {
  const clusters = new Set(assignments).size
  if (clusters < 2) return 0
  let indices = points.map((_point, index) => index)
  if (indices.length > sample) {
    const random = seededRandom(seed)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    indices = indices.slice(0, sample)
  }
  const scores = indices.map((i) => {
    const sums = new Map<number, { total: number, count: number }>()
    indices.forEach((j) => {
      if (i === j) return
      const cluster = assignments[j]
      const entry = sums.get(cluster) ?? { total: 0, count: 0 }
      entry.total += Math.sqrt(squaredDistance(points[i], points[j]))
      entry.count += 1
      sums.set(cluster, entry)
    })
    const own = sums.get(assignments[i])
    if (own === undefined || own.count === 0) return 0
    const a = own.total / own.count
    const b = Math.min(...[...sums.entries()].filter(([cluster]) => cluster !== assignments[i]).map(([, { total, count }]) => total / count))
    return Number.isFinite(b) && Math.max(a, b) > 0 ? (b - a) / Math.max(a, b) : 0
  })
  return scores.reduce((sum, value) => sum + value, 0) / scores.length
}

/** El codo: la inercia con k = 1, 2… (baja siempre; el «codo» es donde deja de bajar mucho) */
export const elbow = (points: Point_t[], ks: number[], seed = 1) => ks.map((k) => ({ k, inertia: kmeans(points, { k, seed }).inertia }))

/**
 * Proyección a 2D (análisis de componentes principales) para dibujar los puntos: las dos direcciones en las que más
 * varían los datos, por el método de la potencia. `explained`: la parte de la varianza que recoge cada una.
 */
export function pca2(points: Point_t[]): { project: (point: Point_t) => [number, number], explained: [number, number] } {
  const dimensions = points[0]?.length ?? 0
  const means = Array.from({ length: dimensions }, (_value, dimension) => points.reduce((sum, point) => sum + point[dimension], 0) / points.length)
  const centered = points.map((point) => point.map((value, dimension) => value - means[dimension]))
  const covariance = Array.from({ length: dimensions }, (_row, i) => Array.from({ length: dimensions }, (_column, j) =>
    centered.reduce((sum, point) => sum + point[i] * point[j], 0) / Math.max(1, points.length - 1)))
  const totalVariance = covariance.reduce((sum, row, i) => sum + row[i], 0)
  const multiply = (matrix: number[][], vector: number[]) => matrix.map((row) => row.reduce((sum, value, j) => sum + value * vector[j], 0))
  const normalize = (vector: number[]) => {
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
    return vector.map((value) => value / norm)
  }
  const components: number[][] = []
  const variances: number[] = []
  let matrix = covariance
  for (let component = 0; component < Math.min(2, dimensions); component++) {
    let vector = normalize(Array.from({ length: dimensions }, (_value, index) => 1 + index * 0.1))
    for (let iteration = 0; iteration < 200; iteration++) vector = normalize(multiply(matrix, vector))
    const variance = multiply(matrix, vector).reduce((sum, value, index) => sum + value * vector[index], 0)
    components.push(vector)
    variances.push(variance)
    // Se quita esa dirección para encontrar la siguiente
    matrix = matrix.map((row, i) => row.map((value, j) => value - variance * vector[i] * vector[j]))
  }
  while (components.length < 2) components.push(Array.from({ length: dimensions }, () => 0))
  const project = (point: Point_t): [number, number] => {
    const shifted = point.map((value, dimension) => value - means[dimension])
    return [0, 1].map((c) => components[c].reduce((sum, weight, dimension) => sum + weight * shifted[dimension], 0)) as [number, number]
  }
  const explained = [0, 1].map((c) => (totalVariance > 0 ? (variances[c] ?? 0) / totalVariance : 0)) as [number, number]
  return { project, explained }
}

/** Un grupo es una «mezcla» si su clase mayoritaria no llega a esta parte de sus filas */
export const MIXED_SHARE = 2 / 3

/**
 * Grupos frente a clases reales: cuántos de cada clase cayeron en cada grupo (`table`, una fila por grupo), los totales,
 * la clase mayoritaria de cada grupo y qué parte del grupo es, la pureza y el índice de Rand ajustado
 */
export function compareWithLabels(assignments: number[], labels: string[], k: number) {
  const classes = [...new Set(labels)].sort()
  const table = Array.from({ length: k }, () => classes.map(() => 0))
  assignments.forEach((cluster, index) => { table[cluster][classes.indexOf(labels[index])] += 1 })
  const n = assignments.length
  const classTotals = classes.map((_class, column) => table.reduce((sum, row) => sum + row[column], 0))
  const groups = table.map((row) => {
    const size = row.reduce((sum, value) => sum + value, 0)
    const majority = row.indexOf(Math.max(...row))
    const share = size === 0 ? 0 : row[majority] / size
    return { size, majority, share, isMixed: size > 0 && share < MIXED_SHARE }
  })
  // Pureza: si cada grupo se llamara como su clase más frecuente, qué parte acertaría
  const purity = table.reduce((sum, row) => sum + Math.max(...row), 0) / n
  // ARI: 1 = los mismos grupos que las clases; ~0 = como al azar
  const choose2 = (value: number) => (value * (value - 1)) / 2
  const sumCells = table.flat().reduce((sum, value) => sum + choose2(value), 0)
  const sumRows = groups.reduce((sum, { size }) => sum + choose2(size), 0)
  const sumColumns = classTotals.reduce((sum, total) => sum + choose2(total), 0)
  const expected = (sumRows * sumColumns) / choose2(n)
  const maximum = (sumRows + sumColumns) / 2
  const ari = maximum === expected ? 1 : (sumCells - expected) / (maximum - expected)
  return { classes, table, classTotals, groups, purity, ari }
}

export type LabelComparison_t = ReturnType<typeof compareWithLabels>
