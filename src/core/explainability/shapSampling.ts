/**
 * Utilidades de muestreo compartidas por las páginas de explicabilidad (tabular, regresión…).
 * Mantienen instancia y background en el MISMO espacio que recibe el modelo en predict.
 */

/**
 * Convierte las filas de un DataFrame de danfojs a number[][].
 * danfojs tipa `.values` como una mezcla de number|string|boolean, así que
 * forzamos cada celda a número (igual que hace el predict con parseFloat).
 * Las filas con alguna celda no numérica (p. ej. una categoría sin codificar) se
 * descartan: el modelo no puede evaluarlas y contaminarían el background con NaN.
 */
export function dataframeRowsToNumbers(values: unknown): number[][] {
  return dataframeRowsWithDisplay(values, null).rows
}

/**
 * Como `dataframeRowsToNumbers`, pero conserva a la vez los valores legibles de cada fila (p. ej.
 * `dataframe_X`, antes del escalado) filtrando las dos tablas juntas para que sigan alineadas.
 * `display` es null si no se pasa o no tiene el mismo número de filas que `values`.
 */
export function dataframeRowsWithDisplay(
  values: unknown,
  displayValues: unknown,
): { rows: number[][], display: Array<Array<string | number>> | null } {
  if (!Array.isArray(values)) return { rows: [], display: null }
  const raw = values as unknown[][]
  const rawDisplay = Array.isArray(displayValues) && displayValues.length === raw.length
    ? (displayValues as Array<Array<string | number>>)
    : null
  const rows: number[][] = []
  const display: Array<Array<string | number>> = []
  raw.forEach((row, i) => {
    const numeric = Array.isArray(row) ? row.map(Number) : []
    if (numeric.length === 0 || !numeric.every(Number.isFinite)) return
    rows.push(numeric)
    if (rawDisplay) display.push(rawDisplay[i])
  })
  return { rows, display: rawDisplay ? display : null }
}

/** Nombre legible de una feature: "petal_length" → "Petal Length". */
export const formatFeatureName = (name: unknown) =>
  String(name).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

/** Muestreo aleatorio sin reemplazo (Fisher-Yates parcial): n filas distintas del pool. */
export function sampleRowsWithoutReplacement(pool: number[][], n: number): number[][] {
  return sampleIndicesWithoutReplacement(pool.length, n).map((i) => pool[i])
}

/** Muestreo aleatorio sin reemplazo de `n` índices distintos de `[0, length)`. */
export function sampleIndicesWithoutReplacement(length: number, n: number): number[] {
  const indices = Array.from({ length }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices.slice(0, Math.min(n, length))
}

/**
 * Background de SHAP para explicaciones por segmentos (imagen/detección): una única fila
 * con todos los segmentos ocultos. KernelSHAP evalúa el modelo `nSamples × filas` veces,
 * así que repetir filas idénticas solo multiplica el coste sin cambiar el resultado.
 */
export function buildMaskedBackground(numSegments: number): number[][] {
  return [Array(numSegments).fill(0)]
}

/**
 * Background de SHAP: muestra de hasta `nRows` filas del dataset (mismo espacio que la
 * instancia). Si el pool está vacío, cae a un background de ceros como red de seguridad.
 */
export function buildShapBackground(pool: number[][], nFeatures: number, nRows = 50): number[][] {
  const valid = pool.filter((row) => row.length === nFeatures)
  if (valid.length > 0) return sampleRowsWithoutReplacement(valid, Math.min(nRows, valid.length))
  return Array(nRows)
    .fill(null)
    .map(() => Array(nFeatures).fill(0))
}

/**
 * KernelSHAP resuelve una regresión con una incógnita por segmento: con menos muestras que
 * ~2·segmentos el sistema queda indeterminado y los valores salen arbitrarios. Garantiza ese
 * mínimo aunque el usuario pida menos.
 */
export function minShapSamples(numSegments: number, requested: number): number {
  return Math.max(requested, 2 * numSegments + 2)
}
