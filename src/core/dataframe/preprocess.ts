import * as dfd from 'danfojs'
import { columnKind, extent, isMissing, toNumbers, valueCounts } from '@core/dataframe/eda'

// Preprocesado de un conjunto de datos para un modelo: qué hacer con cada columna, con los valores ausentes, con las
// filas repetidas y con la escala de los atributos numéricos. Trabaja con las filas tal cual (sin danfo) y devuelve un
// dataframe nuevo, así que se puede recalcular en cada cambio del formulario.

export type ColumnAction_t = 'keep' | 'label-encoder' | 'drop'
export type MissingStrategy_t = 'keep' | 'drop-rows' | 'impute'
export type Scaler_t = 'none' | 'min-max' | 'standard'

export type PreprocessOptions_t = {
  columns   : Record<string, ColumnAction_t>
  missing   : MissingStrategy_t
  duplicates: boolean
  scaler    : Scaler_t
  /** El objetivo no se escala (es lo que se predice) */
  target    : string | null
}

export type PreprocessResult_t = {
  dataframe  : dfd.DataFrame
  /** Columnas codificadas: cada valor y su número */
  encodings  : Record<string, string[]>
  /** Valor con el que se rellenaron los ausentes de cada columna */
  imputed    : Record<string, string | number>
  removedRows: { duplicates: number, missing: number }
  /** Transformación aplicada a cada columna que queda (para enseñarla bajo su nombre) */
  applied    : Record<string, string>
}

/** Lo razonable por defecto: el texto se codifica como números y lo numérico se deja igual */
export function defaultColumnAction(values: unknown[], dtype: string): ColumnAction_t {
  return columnKind(values, dtype) === 'categorical' ? 'label-encoder' : 'keep'
}

export function preprocessDataFrame(dataframe: dfd.DataFrame, options: PreprocessOptions_t): PreprocessResult_t {
  const columns = dataframe.columns
    .map((name, index) => ({ name, index, dtype: dataframe.dtypes[index] }))
    .filter(({ name }) => (options.columns[name] ?? 'keep') !== 'drop' || name === options.target)
  let rows = dataframe.values as unknown[][]

  const removedRows = { duplicates: 0, missing: 0 }
  if (options.duplicates) {
    const seen = new Set<string>()
    const unique = rows.filter((row) => {
      const key = JSON.stringify(row)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    removedRows.duplicates = rows.length - unique.length
    rows = unique
  }
  if (options.missing === 'drop-rows') {
    const complete = rows.filter((row) => columns.every(({ index }) => !isMissing(row[index])))
    removedRows.missing = rows.length - complete.length
    rows = complete
  }

  const encodings: Record<string, string[]> = {}
  const imputed: Record<string, string | number> = {}
  const applied: Record<string, string> = {}
  const data: Record<string, unknown[]> = {}
  for (const { name, index, dtype } of columns) {
    let values = rows.map((row) => row[index])
    const kind = columnKind(values, dtype)
    if (options.missing === 'impute' && values.some(isMissing)) {
      // Media en las numéricas y el valor más frecuente en las de texto
      const fill = kind === 'numeric' ? mean(toNumbers(values)) : valueCounts(values, 1)[0]?.value
      if (fill !== undefined && !Number.isNaN(fill)) {
        imputed[name] = fill
        values = values.map((value) => (isMissing(value) ? fill : value))
      }
    }
    const action = options.columns[name] ?? defaultColumnAction(values, dtype)
    if (action === 'label-encoder') {
      // Un número por valor, en el orden en que aparecen (como el LabelEncoder de danfo)
      const classes: string[] = []
      values = values.map((value) => {
        if (isMissing(value)) return NaN
        const key = String(value)
        let code = classes.indexOf(key)
        if (code === -1) code = classes.push(key) - 1
        return code
      })
      encodings[name] = classes
      applied[name] = 'label-encoder'
    } else if (kind === 'numeric') {
      values = toNumbers(values)
      applied[name] = dtype === 'string' ? 'float32' : dtype
    } else {
      applied[name] = dtype
    }
    if (options.scaler !== 'none' && name !== options.target && (kind === 'numeric' || action === 'label-encoder')) {
      values = scale(values as number[], options.scaler)
      applied[name] += ` · ${options.scaler}`
    }
    data[name] = values
  }
  return { dataframe: new dfd.DataFrame(data), encodings, imputed, removedRows, applied }
}

const mean = (values: number[]) => {
  const present = values.filter((value) => !Number.isNaN(value))
  return present.length === 0 ? NaN : present.reduce((sum, value) => sum + value, 0) / present.length
}

/** Min-max a [0, 1] o estandarización (media 0, desviación 1, como StandardScaler) */
function scale(values: number[], scaler: Exclude<Scaler_t, 'none'>): number[] {
  const present = values.filter((value) => !Number.isNaN(value))
  if (present.length === 0) return values
  if (scaler === 'min-max') {
    const [min, max] = extent(present)
    const range = max - min
    return values.map((value) => (range === 0 ? 0 : (value - min) / range))
  }
  const average = mean(present)
  const std = Math.sqrt(present.reduce((sum, value) => sum + (value - average) ** 2, 0) / present.length)
  return values.map((value) => (std === 0 ? 0 : (value - average) / std))
}

/** El dataframe como texto CSV (comillas solo donde hacen falta) */
export function dataframeToCSV(dataframe: dfd.DataFrame): string {
  const cell = (value: unknown) => {
    if (value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value))) return ''
    const text = String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [dataframe.columns.map(cell).join(',')]
  for (const row of dataframe.values as unknown[][]) lines.push(row.map(cell).join(','))
  return lines.join('\n') + '\n'
}
