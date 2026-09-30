import * as dfd from 'danfojs'

type QueryArgument_t = number | string | dfd.Series
// danfojs acepta strings en eq/ne en tiempo de ejecución aunque sus tipos no lo reflejen
type Other_t = Parameters<dfd.Series['eq']>[0]

/** Únicos métodos de Series que se pueden encadenar en una consulta */
const QUERY_METHODS = new Map<string, (series: dfd.Series, other: QueryArgument_t) => dfd.Series>([
  ['gt', (series, other) => series.gt(other as Other_t)],
  ['lt', (series, other) => series.lt(other as Other_t)],
  ['ge', (series, other) => series.ge(other as Other_t)],
  ['le', (series, other) => series.le(other as Other_t)],
  ['eq', (series, other) => series.eq(other as Other_t)],
  ['ne', (series, other) => series.ne(other as Other_t)],
  ['and', (series, other) => series.and(other)],
  ['or', (series, other) => series.or(other)],
])

const NUMBER_REGEX = /^-?\d+(\.\d+)?(e[+-]?\d+)?/i
const METHOD_REGEX = /^[A-Za-z]+/

/**
 * Convierte una consulta escrita por el usuario, p. ej. `.gt(5).and(df["Longitud petalo"].lt(2))`,
 * en la condición booleana que espera `dataframe.query()`, aplicada sobre `dataframe[column_name]`.
 *
 * No ejecuta código: solo admite números, strings y `df["columna"]` como argumentos,
 * y solo los métodos de QUERY_METHODS.
 *
 * @throws {Error} si la consulta no sigue esa sintaxis
 */
export function parseDataFrameQuery(dataframe: dfd.DataFrame, column_name: string, query: string): dfd.Series {
  let pos = 0

  const error = (message: string) => new Error(`Invalid query at position ${pos}: ${message}`)
  const skipSpaces = () => {
    while (pos < query.length && /\s/.test(query[pos])) pos++
  }
  const peek = (token: string) => {
    skipSpaces()
    return query.startsWith(token, pos)
  }
  const consume = (token: string) => {
    if (!peek(token)) throw error(`expected "${token}"`)
    pos += token.length
  }

  const getColumn = (name: string): dfd.Series => {
    if (!dataframe.columns.includes(name)) throw error(`unknown column "${name}"`)
    return dataframe.column(name)
  }

  const parseString = (): string => {
    skipSpaces()
    const quote = query[pos]
    if (quote !== '"' && quote !== '\'') throw error('expected a string')
    const end = query.indexOf(quote, pos + 1)
    if (end === -1) throw error('unterminated string')
    const value = query.slice(pos + 1, end)
    pos = end + 1
    return value
  }

  const parseColumn = (): dfd.Series => {
    consume('df[')
    const name = parseString()
    consume(']')
    return getColumn(name)
  }

  const parseArgument = (): QueryArgument_t => {
    if (peek('df[')) return parseChain(parseColumn())
    if (peek('"') || peek('\'')) return parseString()
    const match = NUMBER_REGEX.exec(query.slice(pos))
    if (!match) throw error('expected a number, a string or df["column"]')
    pos += match[0].length
    return Number(match[0])
  }

  const parseChain = (series: dfd.Series): dfd.Series => {
    while (peek('.')) {
      pos++
      skipSpaces()
      const name = METHOD_REGEX.exec(query.slice(pos))?.[0] ?? ''
      const method = QUERY_METHODS.get(name)
      if (!method) throw error(`method not allowed "${name}"`)
      pos += name.length
      consume('(')
      const argument = parseArgument()
      consume(')')
      series = method(series, argument)
    }
    return series
  }

  const column = getColumn(column_name)
  if (!peek('.')) throw error('expected a condition such as ".gt(5)"')
  const condition = parseChain(column)
  skipSpaces()
  if (pos < query.length) throw error(`unexpected "${query.slice(pos)}"`)
  return condition
}
