import type * as dfd from 'danfojs'

// Análisis exploratorio de datos (AED): perfil de cada columna y del conjunto, sin dibujar nada (se prueba sin
// navegador). Los valores ausentes se reconocen como en los CSV del proyecto: celdas vacías, "?" (UCI) o NaN.

const MISSING_TOKENS = new Set(['', '?', 'NA', 'N/A', 'nan', 'NaN', 'null'])
const NUMBER_PATTERN = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/

export function isMissing(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'number') return Number.isNaN(value)
  if (typeof value === 'string') return MISSING_TOKENS.has(value.trim())
  return false
}

export type ColumnKind_t = 'numeric' | 'categorical'
export type Histogram_t = { edges: number[], counts: number[] }
export type NumericStats_t = {
  mean    : number
  std     : number
  min     : number
  q1      : number
  median  : number
  q3      : number
  max     : number
  /** Valores fuera de [q1 − 1,5·RIC, q3 + 1,5·RIC] */
  outliers: number
}
export type ValueCount_t = { value: string, count: number }
export type ColumnProfile_t = {
  name    : string
  dtype   : string
  kind    : ColumnKind_t
  /** Valores presentes (sin los ausentes) */
  count   : number
  missing : number
  distinct: number
  numeric?: NumericStats_t
  /** Valores más frecuentes (hasta 10), de más a menos */
  top     : ValueCount_t[]
}
export type DataFrameProfile_t = {
  rows         : number
  columns      : number
  profiles     : ColumnProfile_t[]
  missingCells : number
  duplicateRows: number
}

/** Cuantil q (0–1) de valores ordenados, con interpolación lineal (como pandas) */
export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN
  const position = (sorted.length - 1) * q
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
}

/**
 * Mínimo y máximo con un bucle: `Math.min(...valores)` pasa cada valor como argumento y, con cientos de miles de filas,
 * desborda la pila ("Maximum call stack size exceeded")
 */
export function extent(values: ArrayLike<number>): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (value < min) min = value
    if (value > max) max = value
  }
  return [min, max]
}

/**
 * Histograma con `bins` intervalos iguales entre el mínimo y el máximo. Si los valores son enteros y hay pocos
 * distintos, un intervalo por entero (así un 3 no cae entre dos barras).
 */
export function histogram(values: number[], bins?: number): Histogram_t {
  const present = values.filter((value) => !Number.isNaN(value))
  if (present.length === 0) return { edges: [], counts: [] }
  const [min, max] = extent(present)
  const integers = present.every(Number.isInteger)
  if (bins === undefined && integers && max - min <= 30) {
    const edges = Array.from({ length: max - min + 2 }, (_, i) => min - 0.5 + i)
    const counts = new Array(max - min + 1).fill(0)
    for (const value of present) counts[value - min]++
    return { edges, counts }
  }
  // Sturges: suficiente para ver la forma sin barras vacías con pocos datos
  const count = bins ?? Math.min(30, Math.max(5, Math.ceil(Math.log2(present.length) + 1)))
  if (min === max) return { edges: [min - 0.5, max + 0.5], counts: [present.length] }
  const width = (max - min) / count
  const edges = Array.from({ length: count + 1 }, (_, i) => min + i * width)
  const counts = new Array(count).fill(0)
  for (const value of present) counts[Math.min(count - 1, Math.floor((value - min) / width))]++
  return { edges, counts }
}

/** Cuántos valores caen en cada intervalo de `edges` (el último incluye su borde derecho) */
export function binCounts(values: ArrayLike<number>, edges: number[]): number[] {
  const bins = edges.length - 1
  const counts = new Array<number>(Math.max(bins, 0)).fill(0)
  if (bins < 1) return counts
  const min = edges[0]
  const width = (edges[bins] - min) / bins
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (Number.isNaN(value) || value < min || value > edges[bins]) continue
    counts[Math.min(bins - 1, Math.floor((value - min) / width))]++
  }
  return counts
}

export type BoxStats_t = {
  q1        : number
  median    : number
  q3        : number
  /** Bigotes: el menor y el mayor valor dentro de [q1 − 1,5·RIC, q3 + 1,5·RIC] */
  lowerfence: number
  upperfence: number
  mean      : number
  /** Valores atípicos (como mucho `maxOutliers`, repartidos por todo el rango) */
  outliers  : number[]
  count     : number
}

/**
 * Lo que dibuja un diagrama de caja, calculado aquí: Plotly lo calcula a partir de cada punto y, con cientos de miles
 * de filas, eso bloquea la página más de un segundo
 */
export function boxStats(values: ArrayLike<number>, maxOutliers = 500): BoxStats_t | null {
  const sorted: number[] = []
  for (let i = 0; i < values.length; i++) if (!Number.isNaN(values[i])) sorted.push(values[i])
  if (sorted.length === 0) return null
  sorted.sort((a, b) => a - b)
  const q1 = quantile(sorted, 0.25)
  const q3 = quantile(sorted, 0.75)
  const low = q1 - 1.5 * (q3 - q1)
  const high = q3 + 1.5 * (q3 - q1)
  let lowerfence = sorted[0], upperfence = sorted[sorted.length - 1], sum = 0
  const outliers: number[] = []
  for (const value of sorted) {
    sum += value
    if (value < low || value > high) outliers.push(value)
  }
  for (const value of sorted) if (value >= low) { lowerfence = value; break }
  for (let i = sorted.length - 1; i >= 0; i--) if (sorted[i] <= high) { upperfence = sorted[i]; break }
  // Muchos atípicos: una muestra regular (ordenados, así se ven los extremos y el reparto)
  const step = outliers.length / maxOutliers
  const shown = outliers.length <= maxOutliers ? outliers : Array.from({ length: maxOutliers }, (_, i) => outliers[Math.floor(i * step)])
  return { q1, median: quantile(sorted, 0.5), q3, lowerfence, upperfence, mean: sum / sorted.length, outliers: shown, count: sorted.length }
}

/** Centro de cada intervalo y su ancho, para dibujar un histograma ya calculado como barras */
export function binCenters(edges: number[]): { centers: number[], width: number } {
  const centers = edges.slice(0, -1).map((edge, i) => (edge + edges[i + 1]) / 2)
  return { centers, width: edges.length > 1 ? edges[1] - edges[0] : 1 }
}

/**
 * Orden natural ("2" antes que "10"). Un solo comparador para todo: `localeCompare` con opciones crea uno en cada
 * comparación, y ordenar los valores de California housing (20 640 filas) tardaba 1,3 s en vez de 0,2 s
 */
export const naturalCompare = new Intl.Collator(undefined, { numeric: true }).compare

const byFrequency = (a: ValueCount_t, b: ValueCount_t) => b.count - a.count || naturalCompare(a.value, b.value)

/** Cuántas veces aparece cada valor (sin los ausentes) */
export function countValues(values: unknown[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const value of values) {
    if (isMissing(value)) continue
    const key = String(value)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

/**
 * Los `limit` valores más frecuentes, de más a menos (empates en orden natural). Sin ordenar todos: en una columna
 * continua hay casi tantos valores distintos como filas y solo se enseñan unos pocos
 */
export function topValues(counts: Map<string, number>, limit = Infinity): ValueCount_t[] {
  if (counts.size <= limit) return [...counts].map(([value, count]) => ({ value, count })).sort(byFrequency)
  const top: ValueCount_t[] = []
  for (const [value, count] of counts) {
    const item = { value, count }
    if (top.length === limit && byFrequency(item, top[limit - 1]) >= 0) continue
    // Inserción en su sitio (limit es pequeño)
    let position = top.length
    while (position > 0 && byFrequency(item, top[position - 1]) < 0) position--
    top.splice(position, 0, item)
    if (top.length > limit) top.pop()
  }
  return top
}

/** Frecuencia de cada valor (o de los `limit` más frecuentes), de más a menos frecuente */
export function valueCounts(values: unknown[], limit?: number): ValueCount_t[] {
  return topValues(countValues(values), limit)
}

/** Valores de una columna como números (NaN donde falta o no es un número), en el orden de las filas */
export function toNumbers(values: unknown[]): number[] {
  return values.map((value) => {
    if (isMissing(value)) return NaN
    if (typeof value === 'number') return value
    if (typeof value === 'boolean') return value ? 1 : 0
    return NUMBER_PATTERN.test(String(value).trim()) ? Number(value) : NaN
  })
}

/**
 * Numérica si danfo la lee como número o si todo lo que no falta son números (una columna con "?" llega como texto:
 * Bare_Nuclei en breast-cancer-wisconsin.csv)
 */
export function columnKind(values: unknown[], dtype: string): ColumnKind_t {
  if (dtype === 'int32' || dtype === 'float32') return 'numeric'
  if (dtype === 'boolean') return 'categorical'
  const present = values.filter((value) => !isMissing(value))
  return present.length > 0 && present.every((value) => NUMBER_PATTERN.test(String(value).trim())) ? 'numeric' : 'categorical'
}

export function profileColumn(name: string, values: unknown[], dtype: string): ColumnProfile_t {
  const kind = columnKind(values, dtype)
  const counts = countValues(values)
  let count = 0
  for (const frequency of counts.values()) count += frequency
  const profile: ColumnProfile_t = {
    name,
    dtype,
    kind,
    count,
    missing : values.length - count,
    distinct: counts.size,
    top     : topValues(counts, 10),
  }
  if (kind === 'numeric') {
    const numbers = toNumbers(values).filter((value) => !Number.isNaN(value))
    const sorted = [...numbers].sort((a, b) => a - b)
    if (sorted.length > 0) {
      const mean = numbers.reduce((sum, value) => sum + value, 0) / numbers.length
      // Desviación típica muestral (n − 1), la de describe() de danfo y pandas
      const variance = numbers.length > 1 ? numbers.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (numbers.length - 1) : 0
      const q1 = quantile(sorted, 0.25)
      const q3 = quantile(sorted, 0.75)
      const iqr = q3 - q1
      profile.numeric = {
        mean,
        std     : Math.sqrt(variance),
        min     : sorted[0],
        q1,
        median  : quantile(sorted, 0.5),
        q3,
        max     : sorted[sorted.length - 1],
        outliers: numbers.filter((value) => value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr).length,
      }
    }
  }
  return profile
}

/** Una columna con sus valores en el orden de las filas: lo que viaja al worker del análisis (sin danfo) */
export type ColumnData_t = { name: string, dtype: string, values: unknown[] }

/** Las columnas de un dataframe de danfo */
export function dataframeColumns(dataframe: dfd.DataFrame): ColumnData_t[] {
  const rows = dataframe.values as unknown[][]
  return dataframe.columns.map((name, index) => ({ name, dtype: dataframe.dtypes[index], values: rows.map((row) => row[index]) }))
}

export function profileColumns(columns: ColumnData_t[]): DataFrameProfile_t {
  if (columns.length === 0) return { rows: 0, columns: 0, profiles: [], missingCells: 0, duplicateRows: 0 }
  const profiles = columns.map(({ name, values, dtype }) => profileColumn(name, values, dtype))
  const rows = columns[0].values.length
  const seen = new Set<string>()
  let duplicateRows = 0
  for (let row = 0; row < rows; row++) {
    const key = JSON.stringify(columns.map(({ values }) => values[row]))
    if (seen.has(key)) duplicateRows++
    else seen.add(key)
  }
  return {
    rows,
    columns     : columns.length,
    profiles,
    missingCells: profiles.reduce((sum, { missing }) => sum + missing, 0),
    duplicateRows,
  }
}

export function profileDataFrame(dataframe: dfd.DataFrame): DataFrameProfile_t {
  return profileColumns(dataframeColumns(dataframe))
}

/** Correlación de Pearson con las filas en las que están los dos valores; NaN si no se puede calcular */
export function pearson(x: number[], y: number[]): number {
  let n = 0, sumX = 0, sumY = 0
  for (let i = 0; i < x.length; i++) {
    if (Number.isNaN(x[i]) || Number.isNaN(y[i])) continue
    n++; sumX += x[i]; sumY += y[i]
  }
  if (n < 2) return NaN
  const meanX = sumX / n, meanY = sumY / n
  let cov = 0, varX = 0, varY = 0
  for (let i = 0; i < x.length; i++) {
    if (Number.isNaN(x[i]) || Number.isNaN(y[i])) continue
    cov += (x[i] - meanX) * (y[i] - meanY)
    varX += (x[i] - meanX) ** 2
    varY += (y[i] - meanY) ** 2
  }
  return varX === 0 || varY === 0 ? NaN : cov / Math.sqrt(varX * varY)
}

export type CorrelationMatrix_t = { names: string[], matrix: number[][] }

export function correlationMatrix(columns: Array<{ name: string, values: number[] }>): CorrelationMatrix_t {
  const matrix = columns.map((a, i) => columns.map((b, j) => (i === j ? 1 : pearson(a.values, b.values))))
  return { names: columns.map(({ name }) => name), matrix }
}

export type ProblemType_t = 'classification' | 'regression'

/** Clasificación si el objetivo es texto o un entero con pocos valores (códigos de clase); si no, regresión */
export function problemType(target: ColumnProfile_t): ProblemType_t {
  if (target.kind === 'categorical') return 'classification'
  const integers = target.top.every(({ value }) => Number.isInteger(Number(value)))
  return integers && target.distinct <= 10 ? 'classification' : 'regression'
}

export type DataWarning_t =
  | { type: 'missing', column: string, count: number, ratio: number }
  | { type: 'constant', column: string }
  | { type: 'identifier', column: string }
  | { type: 'outliers', column: string, count: number, ratio: number }
  | { type: 'imbalance', column: string, minority: string, ratio: number }
  | { type: 'correlation', column: string, other: string, value: number }
  | { type: 'duplicates', count: number }

/**
 * Avisos sobre la calidad de los datos: ausentes, columnas constantes o que parecen identificadores, muchos valores
 * atípicos, clases desequilibradas, atributos casi iguales (|r| ≥ 0,9) y filas repetidas
 */
export function dataWarnings(profile: DataFrameProfile_t, target: string | null, correlations?: CorrelationMatrix_t,
  options: { problem?: ProblemType_t | null, identifiers?: string[] } = {}): DataWarning_t[] {
  const warnings: DataWarning_t[] = []
  if (profile.duplicateRows > 0) warnings.push({ type: 'duplicates', count: profile.duplicateRows })
  for (const column of profile.profiles) {
    if (column.missing > 0) warnings.push({ type: 'missing', column: column.name, count: column.missing, ratio: column.missing / profile.rows })
    if (column.distinct <= 1) warnings.push({ type: 'constant', column: column.name })
    // Texto o enteros todos distintos con bastantes filas: un nombre o un número de registro, no un atributo
    const allDistinct = column.distinct === column.count && column.count >= 20
    const integerOrText = column.kind === 'categorical' || column.top.every(({ value }) => Number.isInteger(Number(value)))
    // O lo que la ficha del conjunto dice que es un identificador (Sample_code_number se repite y no lo parece)
    const isIdentifier = (allDistinct && integerOrText) || options.identifiers?.includes(column.name)
    if (isIdentifier && column.name !== target) warnings.push({ type: 'identifier', column: column.name })
    // Solo en variables con muchos valores: en una binaria (1/2) o con pocos códigos, la regla del RIC marca como
    // atípico todo lo que no es el valor más frecuente
    if (column.numeric && column.distinct > 10 && column.numeric.outliers / column.count >= 0.05) {
      warnings.push({ type: 'outliers', column: column.name, count: column.numeric.outliers, ratio: column.numeric.outliers / column.count })
    }
  }
  const targetProfile = profile.profiles.find(({ name }) => name === target)
  // Con más de 10 clases, top no las tiene todas y no se sabe cuál es la minoritaria
  const problem = options.problem === undefined && targetProfile ? problemType(targetProfile) : options.problem
  if (targetProfile && problem === 'classification' && targetProfile.distinct > 1 && targetProfile.distinct <= 10) {
    const classes = targetProfile.top
    const minority = classes[classes.length - 1]
    const ratio = minority.count / classes[0].count
    if (ratio < 0.2) warnings.push({ type: 'imbalance', column: targetProfile.name, minority: minority.value, ratio })
  }
  if (correlations) {
    correlations.names.forEach((name, i) => correlations.names.forEach((other, j) => {
      const value = correlations.matrix[i][j]
      if (j > i && name !== target && other !== target && Math.abs(value) >= 0.9) warnings.push({ type: 'correlation', column: name, other, value })
    }))
  }
  return warnings
}

/** Todo lo que el análisis calcula de un conjunto (sin depender de la variable objetivo) */
export type DataFrameAnalysis_t = {
  profile     : DataFrameProfile_t
  /** Valores de cada columna numérica (NaN donde faltan) */
  numbers     : Record<string, number[]>
  correlations: CorrelationMatrix_t
}

/** Perfil, valores numéricos y correlaciones: lo pesado del AED, en un solo paso (lo ejecuta el worker del análisis) */
export function analyzeColumns(columns: ColumnData_t[]): DataFrameAnalysis_t {
  const profile = profileColumns(columns)
  const numbers: Record<string, number[]> = {}
  profile.profiles.forEach(({ kind }, index) => {
    if (kind === 'numeric') numbers[columns[index].name] = toNumbers(columns[index].values)
  })
  const correlations = correlationMatrix(Object.entries(numbers).map(([name, values]) => ({ name, values })))
  return { profile, numbers, correlations }
}
