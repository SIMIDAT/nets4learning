import Papa from 'papaparse'

import { detectCSVFormat, isDecimalCommaColumn, parseDecimalComma } from '@core/dataframe/csvFormat'
import { datasetFileToCSV, readFileText } from '@core/dataframe/datasetFormats'

// Leer el fichero que sube el usuario hasta tener sus columnas y filas, sin danfo (va en un worker,
// datasetReader.worker.ts): pasar a CSV si es otro formato, averiguar el separador, papaparse con las mismas opciones
// que usa danfo y los arreglos de las columnas. En el hilo principal solo queda crear el DataFrame.

/** Columnas y filas (un valor por columna) */
export type DatasetRows_t = { columns: string[], rows: unknown[][] }

/** Tipos de columna de danfo */
export type Dtype_t = 'string' | 'float32' | 'int32' | 'boolean' | 'datetime' | 'undefined'

/** Lo que devuelve el worker: listo para `new dfd.DataFrame(rows, { columns, dtypes })` */
export type DatasetRead_t = DatasetRows_t & { dtypes: Dtype_t[] }

const isMissing = (value: unknown) =>
  value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value)) || (typeof value === 'string' && value.trim() === '')

const isText = (value: unknown) => typeof value === 'string' && value.trim() !== '' && Number.isNaN(Number(value))

/** Quita las columnas sin nombre (o con el que papaparse da a las repetidas: "_1"…) que no tienen ningún valor */
export function dropEmptyColumns({ columns, rows }: DatasetRows_t): DatasetRows_t {
  const keep = columns.map((column, i) => !((column.trim() === '' || /^_\d+$/.test(column)) && rows.every((row) => isMissing(row[i]))))
  if (keep.every(Boolean)) return { columns, rows }
  return { columns: columns.filter((_, i) => keep[i]), rows: rows.map((row) => row.filter((_, i) => keep[i])) }
}

/** Las columnas de números con coma decimal ("2,6", que papaparse deja como texto) pasan a ser numéricas */
export function convertDecimalComma({ columns, rows }: DatasetRows_t): DatasetRows_t {
  const convert = columns.map((_, i) => isDecimalCommaColumn(rows.map((row) => row[i])))
  if (!convert.some(Boolean)) return { columns, rows }
  return { columns, rows: rows.map((row) => row.map((value, i) => (convert[i] ? parseDecimalComma(value) : value))) }
}

/**
 * Columnas con números y textos (la de "Doors" de car.csv: 2, 3, 4, "5more") pasan a ser de texto entero: danfo
 * deduce el tipo de cada columna con las primeras filas y, si son números, los textos que vienen después rompen
 * describe() y las conversiones. Los ausentes se quedan como están (el asType de danfo fallaba con ellos).
 */
export function textMixedColumns({ columns, rows }: DatasetRows_t): DatasetRows_t {
  const mixed = columns.map((_, i) => rows.some((row) => isText(row[i])) && rows.some((row) => typeof row[i] === 'number'))
  if (!mixed.some(Boolean)) return { columns, rows }
  return { columns, rows: rows.map((row) => row.map((value, i) => (mixed[i] && typeof value === 'number' ? String(value) : value))) }
}

/**
 * El tipo de cada columna, con las mismas reglas que danfo (texto si algún valor lo es; decimal si alguno lo es o falta
 * alguno; entero; booleano; fecha) pero mirando todas las filas y no solo las 500 primeras. Se le pasa al DataFrame:
 * así no tiene que deducirlo y una columna de texto con valores como "2" no acaba siendo numérica.
 */
export function columnDtypes({ columns, rows }: DatasetRows_t): Dtype_t[] {
  return columns.map((_, i) => {
    let text = false, float = false, int = false, bool = false, date = false
    for (const row of rows) {
      const value = row[i]
      if (typeof value === 'boolean') bool = true
      else if (isMissing(value)) float = true
      else if (value instanceof Date) date = true
      else if (!Number.isNaN(Number(value))) {
        if (String(value).includes('.')) float = true
        else int = true
      } else text = true
      if (text) break
    }
    return text ? 'string' : float ? 'float32' : int ? 'int32' : bool ? 'boolean' : date ? 'datetime' : 'undefined'
  })
}

/** Papaparse como lo usa danfo (cabecera, tipos, sin líneas vacías y los mismos errores), con el separador dado */
function parseCSV(text: string, delimiter: string): DatasetRows_t {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header         : true,
    dynamicTyping  : true,
    skipEmptyLines : 'greedy',
    delimiter,
    // Sin los espacios con que algunos CSV alinean las columnas
    transformHeader: (header) => header.trim(),
    transform      : (value) => value.trim(),
  })
  if (result.data.length === 0) throw new Error('No data found in CSV file')
  if (result.errors.length > 0) throw new Error('CSV parsing errors: ' + result.errors.slice(0, 5).map(({ message }) => message).join(', '))
  const columns = result.meta.fields ?? []
  return { columns, rows: result.data.map((record) => columns.map((column) => record[column] ?? null)) }
}

/**
 * Un fichero de datos subido por el usuario como columnas y filas: CSV con "," o ";" (y coma decimal) o alineado con
 * comas y espacios; ARFF, JSON, JSONL o Parquet pasados antes a CSV. Sin columnas vacías sin nombre y sin columnas
 * mixtas, y con el tipo de cada columna.
 */
export async function readDatasetRows(file: File): Promise<DatasetRead_t> {
  const csv = await datasetFileToCSV(file)
  const format = detectCSVFormat(await readFileText(csv))
  let table = dropEmptyColumns(parseCSV(format.text, format.delimiter))
  if (format.decimalComma) table = convertDecimalComma(table)
  table = textMixedColumns(table)
  return { ...table, dtypes: columnDtypes(table) }
}
