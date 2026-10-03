import type { DataFrame_t } from '@core/types'

/** Lo que se cuenta de una columna en el formulario de procesamiento: qué tipo es y cómo son sus valores */
export type ColumnProfile_t = {
  name    : string
  /** El dtype de danfo: int32, float32, string o boolean */
  type    : string
  numeric : boolean
  /** Cuántos valores distintos tiene (sin contar los vacíos) */
  distinct: number
  /** Los primeros valores distintos, en el orden en que aparecen */
  sample  : string[]
  /** Solo las numéricas */
  min?    : number
  max?    : number
  mean?   : number
}

// Cuántos valores distintos se enseñan como ejemplo
const SAMPLE = 4

const isMissing = (value: unknown) => value === null || value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))

/** El perfil de cada columna de un dataframe, en su orden */
export function profileColumns(dataframe: DataFrame_t): ColumnProfile_t[] {
  const dtypes = dataframe.dtypes as string[]
  return dataframe.columns.map((name, index) => {
    const values = (dataframe[name].values as unknown[]).filter((value) => !isMissing(value))
    const type = dtypes[index]
    const numeric = type === 'int32' || type === 'float32'
    const distinct = new Set<string>()
    const sample: string[] = []
    for (const value of values) {
      const text = String(value)
      if (!distinct.has(text) && sample.length < SAMPLE) sample.push(text)
      distinct.add(text)
    }
    if (!numeric || values.length === 0) return { name, type, numeric, distinct: distinct.size, sample }
    const numbers = values.map(Number)
    let min = Infinity
    let max = -Infinity
    let sum = 0
    for (const value of numbers) {
      if (value < min) min = value
      if (value > max) max = value
      sum += value
    }
    return { name, type, numeric, distinct: distinct.size, sample, min, max, mean: sum / numbers.length }
  })
}
