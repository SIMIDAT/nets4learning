// Conjuntos de datos que no son CSV (ARFF, JSON, JSONL y Parquet): se pasan a CSV al subirlos y desde ahí siguen el
// mismo camino que un CSV hasta ser un dataframe (los mismos tipos, los mismos arreglos). Cada formato se lee a una
// tabla (columnas y filas) y la tabla se escribe como CSV.

export type DatasetFormat_t = 'csv' | 'arff' | 'json' | 'jsonl' | 'parquet'

/** Extensiones de cada formato */
const EXTENSIONS: Record<DatasetFormat_t, string[]> = {
  csv    : ['.csv', '.tsv', '.txt'],
  arff   : ['.arff'],
  json   : ['.json'],
  jsonl  : ['.jsonl', '.ndjson'],
  parquet: ['.parquet'],
}

/** Lo que aceptan las zonas de subida (react-dropzone): cada tipo MIME con sus extensiones */
export const DATASET_ACCEPT: Record<string, string[]> = {
  'text/csv'                      : ['.csv'],
  'text/tab-separated-values'     : ['.tsv'],
  'application/x-arff'            : ['.arff'],
  'application/json'              : ['.json'],
  'application/x-ndjson'          : ['.jsonl', '.ndjson'],
  'application/vnd.apache.parquet': ['.parquet'],
}

/** El contenido de un fichero (con FileReader donde Blob no tiene text() ni arrayBuffer(): Safari < 14, jsdom) */
function readFile<T extends string | ArrayBuffer>(file: Blob, as: 'text' | 'arrayBuffer'): Promise<T> {
  if (typeof file[as] === 'function') return file[as]() as Promise<T>
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as T)
    reader.onerror = () => reject(reader.error)
    if (as === 'text') reader.readAsText(file)
    else reader.readAsArrayBuffer(file)
  })
}

export const readFileText = (file: Blob) => readFile<string>(file, 'text')
export const readFileArrayBuffer = (file: Blob) => readFile<ArrayBuffer>(file, 'arrayBuffer')

/** Formato de un fichero por su extensión (null si no es ninguno de los que se leen) */
export function datasetFormat(fileName: string): DatasetFormat_t | null {
  const name = fileName.toLowerCase()
  const format = (Object.keys(EXTENSIONS) as DatasetFormat_t[]).find((key) => EXTENSIONS[key].some((extension) => name.endsWith(extension)))
  return format ?? null
}

/** Una tabla: nombres de columna y filas con un valor por columna */
export type Table_t = { columns: string[], rows: unknown[][] }

const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value)

/** Registros (objetos) a tabla: las columnas son todas las claves, en el orden en que aparecen */
export function recordsToTable(records: unknown[]): Table_t {
  // Una lista de listas: la primera es la cabecera si son todo textos
  if (records.length > 0 && records.every(Array.isArray)) {
    const [first, ...rest] = records as unknown[][]
    if (first.every((value) => typeof value === 'string')) return { columns: first as string[], rows: rest }
    return { columns: first.map((_, index) => `column_${index + 1}`), rows: records as unknown[][] }
  }
  // Una lista de valores sueltos: una columna
  if (records.some((record) => !isObject(record))) return { columns: ['value'], rows: records.map((record) => [record]) }
  const columns: string[] = []
  const seen = new Set<string>()
  for (const record of records as Record<string, unknown>[]) {
    for (const key of Object.keys(record)) {
      if (!seen.has(key)) {
        seen.add(key)
        columns.push(key)
      }
    }
  }
  return { columns, rows: (records as Record<string, unknown>[]).map((record) => columns.map((column) => record[column])) }
}

const isIndexKey = (key: string) => /^\d+$/.test(key)

/**
 * JSON: una lista de registros (lo más habitual) o las formas de `pandas.DataFrame.to_json`: "columns" (la que usa por
 * defecto: { columna: { índice: valor } }), "index" ({ índice: { columna: valor } }), "split" ({ columns, data }) y
 * "list" ({ columna: [valores] }). También una lista de registros dentro de un objeto ({ data: [...] }).
 */
export function parseJSON(text: string): Table_t {
  const data: unknown = JSON.parse(text)
  if (Array.isArray(data)) return recordsToTable(data)
  if (!isObject(data)) throw new Error('JSON: expected a list of records or an object of columns')

  if (Array.isArray(data.columns) && Array.isArray(data.data)) {
    return { columns: (data.columns as unknown[]).map(String), rows: data.data as unknown[][] }
  }
  for (const key of ['data', 'records', 'rows', 'items']) {
    if (Array.isArray(data[key])) return recordsToTable(data[key] as unknown[])
  }

  const keys = Object.keys(data)
  const values = Object.values(data)
  if (keys.length > 0 && values.every(Array.isArray)) {
    const length = Math.max(...values.map((column) => (column as unknown[]).length))
    return { columns: keys, rows: Array.from({ length }, (_, row) => values.map((column) => (column as unknown[])[row])) }
  }
  if (keys.length > 0 && values.every(isObject)) {
    const inner = Object.keys(values[0] as Record<string, unknown>)
    // { índice: { columna: valor } }: las claves de fuera son números y las de dentro no
    if (keys.every(isIndexKey) && !inner.every(isIndexKey)) return recordsToTable(values)
    // { columna: { índice: valor } }
    const index: string[] = []
    const seen = new Set<string>()
    for (const column of values as Record<string, unknown>[]) {
      for (const key of Object.keys(column)) {
        if (!seen.has(key)) {
          seen.add(key)
          index.push(key)
        }
      }
    }
    return { columns: keys, rows: index.map((row) => values.map((column) => (column as Record<string, unknown>)[row])) }
  }
  throw new Error('JSON: expected a list of records or an object of columns')
}

/** JSON Lines: un registro JSON por línea */
export function parseJSONL(text: string): Table_t {
  const records = text.split(/\r?\n/).filter((line) => line.trim() !== '').map((line, index) => {
    try {
      return JSON.parse(line) as unknown
    } catch {
      throw new Error(`JSONL: line ${index + 1} is not valid JSON`)
    }
  })
  return recordsToTable(records)
}

/** Valores de una línea de ARFF separados por comas, con comillas simples o dobles (y \ para escapar dentro) */
function splitARFFValues(line: string): Array<{ value: string, quoted: boolean }> {
  const values: Array<{ value: string, quoted: boolean }> = []
  let current = ''
  let quote: string | null = null
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    if (quote !== null) {
      if (char === '\\' && index + 1 < line.length) current += line[++index]
      else if (char === quote) quote = null
      else current += char
    } else if (char === '\'' || char === '"') {
      quote = char
      quoted = true
      current = ''
    } else if (char === ',') {
      values.push({ value: quoted ? current : current.trim(), quoted })
      current = ''
      quoted = false
    } else if (!quoted) {
      current += char
    }
  }
  values.push({ value: quoted ? current : current.trim(), quoted })
  return values
}

/** El texto partido por las comas que no están entre comillas, sin quitar nada (para las filas dispersas) */
function splitOutsideQuotes(text: string): string[] {
  const parts: string[] = []
  let start = 0
  let quote: string | null = null
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (quote !== null) {
      if (char === '\\') index++
      else if (char === quote) quote = null
    } else if (char === '\'' || char === '"') {
      quote = char
    } else if (char === ',') {
      parts.push(text.slice(start, index))
      start = index + 1
    }
  }
  parts.push(text.slice(start))
  return parts
}

type ARFFAttribute_t = { name: string, type: 'numeric' | 'nominal' | 'string' | 'date', values: string[] }

/** El nombre (con o sin comillas) y el resto de la línea */
function readName(text: string): [string, string] {
  const trimmed = text.trimStart()
  const quote = trimmed[0]
  if (quote === '\'' || quote === '"') {
    const end = trimmed.indexOf(quote, 1)
    if (end > 0) return [trimmed.slice(1, end), trimmed.slice(end + 1).trim()]
  }
  const match = trimmed.match(/^(\S+)\s*(.*)$/)
  return match ? [match[1], match[2].trim()] : [trimmed, '']
}

function parseARFFAttribute(definition: string): ARFFAttribute_t {
  const [name, typeText] = readName(definition)
  const type = typeText.toLowerCase()
  if (typeText.startsWith('{')) {
    const values = splitARFFValues(typeText.slice(1, typeText.lastIndexOf('}'))).map(({ value }) => value)
    return { name, type: 'nominal', values }
  }
  if (type === 'numeric' || type === 'real' || type === 'integer') return { name, type: 'numeric', values: [] }
  if (type === 'string') return { name, type: 'string', values: [] }
  if (type.startsWith('date')) return { name, type: 'date', values: [] }
  throw new Error(`ARFF: attribute "${name}" has an unsupported type (${typeText})`)
}

function arffValue(attribute: ARFFAttribute_t, { value, quoted }: { value: string, quoted: boolean }): unknown {
  if (!quoted && value === '?') return null
  if (attribute.type === 'numeric') {
    const number = Number(value)
    return Number.isNaN(number) ? null : number
  }
  return value
}

/**
 * ARFF (el formato de Weka): las columnas salen de los @attribute (numéricos, nominales {a, b}, texto y fechas) y las
 * filas de @data, normales o dispersas ({índice valor, …}: lo que falta es 0 o el primer valor nominal). "?" es un
 * valor ausente y las líneas que empiezan por % son comentarios.
 */
export function parseARFF(text: string): Table_t {
  const attributes: ARFFAttribute_t[] = []
  const rows: unknown[][] = []
  let inData = false
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('%')) continue
    if (!inData) {
      const lower = line.toLowerCase()
      if (lower.startsWith('@attribute')) attributes.push(parseARFFAttribute(line.slice('@attribute'.length)))
      else if (lower.startsWith('@data')) inData = true
      continue
    }
    if (attributes.length === 0) throw new Error('ARFF: no @attribute before @data')
    if (line.startsWith('{') && line.endsWith('}')) {
      // Fila dispersa: { índice valor, … }
      const row: unknown[] = attributes.map((attribute) => (attribute.type === 'numeric' ? 0 : attribute.type === 'nominal' ? attribute.values[0] ?? null : ''))
      for (const pair of splitOutsideQuotes(line.slice(1, -1))) {
        if (pair.trim() === '') continue
        const [index, rest] = readName(pair)
        const position = Number(index)
        if (!Number.isInteger(position) || position < 0 || position >= attributes.length) throw new Error(`ARFF: bad sparse index in "${line}"`)
        row[position] = arffValue(attributes[position], splitARFFValues(rest)[0])
      }
      rows.push(row)
      continue
    }
    // Fila normal (sin el peso de la instancia, si lo lleva al final: ",{2}")
    const values = splitARFFValues(line.replace(/,\s*\{[^}]*\}\s*$/, ''))
    if (values.length !== attributes.length) throw new Error(`ARFF: expected ${attributes.length} values but found ${values.length} in "${line}"`)
    rows.push(attributes.map((attribute, index) => arffValue(attribute, values[index])))
  }
  if (attributes.length === 0) throw new Error('ARFF: no @attribute found')
  return { columns: attributes.map(({ name }) => name), rows }
}

/** Un valor de Parquet como dato de tabla: enteros grandes (BigInt) a número, fechas a ISO, binarios fuera */
function parquetValue(value: unknown): unknown {
  if (typeof value === 'bigint') return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString()
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Uint8Array) return null
  return value
}

/** Parquet (con cualquier compresión): hyparquet se descarga solo cuando hace falta */
export async function parseParquet(buffer: ArrayBuffer): Promise<Table_t> {
  const [{ parquetMetadata, parquetReadObjects, parquetSchema }, { compressors }] = await Promise.all([
    import('hyparquet'),
    import('hyparquet-compressors'),
  ])
  const columns = parquetSchema(parquetMetadata(buffer)).children.map(({ element }) => element.name)
  const records = await parquetReadObjects({ file: buffer, compressors })
  return { columns, rows: records.map((record) => columns.map((column) => parquetValue(record[column]))) }
}

/** Un valor como celda de CSV: con comillas si lleva comas, comillas, saltos de línea o espacios en los extremos */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  if (typeof value === 'bigint' || typeof value === 'boolean') return String(value)
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return /[",\r\n]/.test(text) || text !== text.trim() ? `"${text.replace(/"/g, '""')}"` : text
}

export function tableToCSV({ columns, rows }: Table_t): string {
  return [columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\n') + '\n'
}

/**
 * El fichero de un conjunto de datos como CSV: los CSV tal cual; ARFF, JSON, JSONL y Parquet, convertidos (con el mismo
 * nombre y extensión .csv).
 */
export async function datasetFileToCSV(file: File): Promise<File> {
  const format = datasetFormat(file.name) ?? 'csv'
  if (format === 'csv') return file
  let table: Table_t
  if (format === 'parquet') table = await parseParquet(await readFileArrayBuffer(file))
  else if (format === 'arff') table = parseARFF(await readFileText(file))
  else if (format === 'jsonl') table = parseJSONL(await readFileText(file))
  else table = parseJSON(await readFileText(file))
  if (table.columns.length === 0) throw new Error(`${format.toUpperCase()}: the file has no columns`)
  return new File([tableToCSV(table)], file.name.replace(/\.[^.]+$/, '') + '.csv', { type: 'text/csv' })
}
