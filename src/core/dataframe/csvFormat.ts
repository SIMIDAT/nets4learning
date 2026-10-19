// Formato de un CSV que sube el usuario: con qué separa las columnas y si los números llevan coma decimal. Se
// reconocen:
//   - "," (lo habitual);
//   - ";", ";" con tabuladores o "|", y con ";" la coma decimal ("2,6"), como los que exporta Excel en español;
//   - comas con espacios alrededor como separador y la coma decimal pegada a los números ("2,6   , 1360"), como los
//     CSV "alineados" por algunos editores.

/** Separadores que se prueban */
const DELIMITERS = [',', ';', '\t', '|'] as const

/** Líneas (no vacías) que se miran para decidir */
const SAMPLE_LINES = 50

/** Proporción de líneas que tienen que tener tantos separadores como la cabecera */
const CONSISTENCY = 0.9

export type CSVFormat_t = {
  /** Separador con el que leer `text` */
  delimiter   : string
  /** Los números pueden llevar coma decimal: las columnas como "2,6" pasan a ser numéricas */
  decimalComma: boolean
  /** El texto listo para leer con `delimiter` (el mismo, salvo si se han cambiado las comas con espacios) */
  text        : string
}

const isSpace = (char: string | undefined) => char === ' ' || char === '\t'

/** Una coma con espacios a algún lado (o al final de la línea) es un separador; pegada a dos cifras, decimal */
const isSpacedComma = (line: string, index: number) =>
  line[index] === ',' && (isSpace(line[index - 1]) || isSpace(line[index + 1]) || index === line.length - 1 || line[index + 1] === '\r')

/** Posiciones de los separadores de la línea que están fuera de las comillas */
function delimiterPositions(line: string, isDelimiter: (line: string, index: number) => boolean): number[] {
  const positions: number[] = []
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    if (line[index] === '"') quoted = !quoted
    else if (!quoted && isDelimiter(line, index)) positions.push(index)
  }
  return positions
}

/** Casi todas las líneas tienen tantos separadores como la cabecera (y la cabecera tiene alguno) */
function isConsistent(counts: number[]): boolean {
  const header = counts[0]
  if (header === undefined || header === 0) return false
  return counts.filter((count) => count === header).length >= Math.ceil(counts.length * CONSISTENCY)
}

/**
 * Cómo leer el texto de un CSV. Gana el separador que aparece en la cabecera y el mismo número de veces en casi todas
 * las líneas (fuera de las comillas); si hay varios, el que da más columnas. Si ninguno cuadra pero sí las comas con
 * espacios, esas comas se cambian por un separador que no aparezca en el texto. Si nada cuadra, la coma (y papaparse
 * dirá qué fila falla).
 */
export function detectCSVFormat(text: string): CSVFormat_t {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '').slice(0, SAMPLE_LINES)

  let best: { delimiter: string, fields: number } | null = null
  for (const delimiter of DELIMITERS) {
    const counts = lines.map((line) => delimiterPositions(line, (value, index) => value[index] === delimiter).length)
    if (isConsistent(counts) && (best === null || counts[0] > best.fields)) best = { delimiter, fields: counts[0] }
  }
  if (best !== null) return { delimiter: best.delimiter, decimalComma: best.delimiter === ';', text }

  if (isConsistent(lines.map((line) => delimiterPositions(line, isSpacedComma).length))) {
    const delimiter = ['\t', ';', '|', '\u001F'].find((char) => !text.includes(char)) ?? '\u001F'
    const replaced = text.split('\n').map((line) => {
      const positions = new Set(delimiterPositions(line, isSpacedComma))
      return positions.size === 0 ? line : Array.from(line, (char, index) => (positions.has(index) ? delimiter : char)).join('')
    }).join('\n')
    return { delimiter, decimalComma: true, text: replaced }
  }

  return { delimiter: ',', decimalComma: false, text }
}

const DECIMAL_COMMA = /^[-+]?\d+,\d+(?:[eE][-+]?\d+)?$/

/** "2,6" → 2.6; los números ya leídos se quedan como están; lo demás, null */
export function parseDecimalComma(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed === '') return null
  const number = Number(DECIMAL_COMMA.test(trimmed) ? trimmed.replace(',', '.') : trimmed)
  return Number.isNaN(number) ? null : number
}

/** Una columna es de números con coma decimal si alguno la lleva y todos los demás valores son números */
export function isDecimalCommaColumn(values: unknown[]): boolean {
  let hasDecimalComma = false
  for (const value of values) {
    if (value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value))) continue
    if (typeof value === 'number') continue
    if (typeof value !== 'string') return false
    const trimmed = value.trim()
    if (trimmed === '') continue
    if (DECIMAL_COMMA.test(trimmed)) hasDecimalComma = true
    else if (Number.isNaN(Number(trimmed))) return false
  }
  return hasDecimalComma
}
