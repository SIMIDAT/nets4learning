// Salida de un clasificador: un valor por clase. Se usa al mostrar la predicción en la clasificación tabular y en la
// de imágenes.

/** Índice de la clase elegida: la de mayor valor (-1 si no hay valores) */
export function argMax(values: number[]): number {
  if (values.length === 0) return -1
  return values.indexOf(Math.max(...values))
}

/** Si la salida es una distribución de probabilidad (última capa softmax): valores entre 0 y 1 que suman 1 */
export function isProbabilityDistribution(values: number[]): boolean {
  if (values.length === 0) return false
  const sum = values.reduce((total, value) => total + value, 0)
  return values.every((value) => value >= 0 && value <= 1) && Math.abs(sum - 1) < 0.01
}
