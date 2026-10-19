import Plotly from 'plotly.js-dist-min'
import type * as dfd from 'danfojs'
import type { Theme_t } from '@core/theme'
import { DataFrameDescribeNumeric } from '@core/dataframe/DataFrameUtils'

/** Color de la columna objetivo (la que se predice o clasifica) en todas las tablas: el mismo que --n4l-target-color */
export const TARGET_COLOR = '#d63384'

type Palette_t = {
  header      : string
  headerText  : string
  headerMuted : string
  text        : string
  line        : string
  cell        : string
  stripe      : string
  index       : string
  target      : string
  targetStripe: string
  targetText  : string
}

// Los mismos tonos que Bootstrap en cada tema: la tabla se ve como el resto de la página. Las celdas son
// transparentes (se ve el fondo de la tarjeta) y las filas pares un poco más oscuras o claras
export const TABLE_PALETTE: Record<Theme_t, Palette_t> = {
  light: {
    header      : '#e9ecef',
    headerText  : '#212529',
    headerMuted : '#6c757d',
    text        : '#212529',
    line        : '#dee2e6',
    cell        : 'rgba(0, 0, 0, 0)',
    stripe      : 'rgba(0, 0, 0, 0.035)',
    index       : 'rgba(0, 0, 0, 0.06)',
    target      : 'rgba(214, 51, 132, 0.10)',
    targetStripe: 'rgba(214, 51, 132, 0.16)',
    targetText  : '#a61e66',
  },
  dark: {
    header      : '#343a40',
    headerText  : '#f8f9fa',
    headerMuted : '#adb5bd',
    text        : '#dee2e6',
    line        : '#495057',
    cell        : 'rgba(0, 0, 0, 0)',
    stripe      : 'rgba(255, 255, 255, 0.04)',
    index       : 'rgba(255, 255, 255, 0.07)',
    target      : 'rgba(214, 51, 132, 0.20)',
    targetStripe: 'rgba(214, 51, 132, 0.28)',
    targetText  : '#f0a3c8',
  },
}

export type DataFrameTableOptions_t = {
  /**
   * Columna objetivo, que se resalta. Por defecto la última (en los conjuntos de datos suele ser la que se predice o
   * clasifica); null para ninguna. Si no está en el dataframe no se resalta nada
   */
  target?     : string | null
  /** 'row': el objetivo es la fila con ese índice (p. ej. en describe, donde cada fila es una columna) */
  targetAxis? : 'column' | 'row'
  /** Primera columna con el índice de cada fila (por defecto sí) */
  index?      : boolean
  indexHeader?: string
  /** Texto bajo el nombre de cada columna: su dtype o el que se indique */
  subtitles?  : 'dtype' | Record<string, string> | null
  /** Filas a la vista; con más, se desplazan dentro de la tabla */
  maxRows?    : number
  title?      : string
  theme?      : Theme_t
  fontFamily? : string
}

// Plotly no baja de 32 px por fila con letra de 13 px (texto más su margen): con menos, la altura calculada no cuadra
export const CELL_HEIGHT = 32
const HEADER_HEIGHT = 34
const HEADER_HEIGHT_SUBTITLE = 48
const TITLE_HEIGHT = 36
const COLUMN_MIN_WIDTH = 96
const INDEX_COLUMN_WIDTH = 64
export const DEFAULT_MAX_ROWS = 12

// Plotly interpreta algo de HTML en los textos (<b>, <br>…): los nombres y valores se escapan
const escapeHTML = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** La columna (o fila) objetivo que se resalta, si está en el dataframe */
export function resolveTableTarget(dataframe: dfd.DataFrame, options: Pick<DataFrameTableOptions_t, 'target' | 'targetAxis'>): string | null {
  const names = options.targetAxis === 'row' ? dataframe.index.map(String) : dataframe.columns
  const target = options.target === undefined ? names[names.length - 1] : options.target
  return target !== null && target !== undefined && names.includes(target) ? target : null
}

/** Traza, layout y ancho mínimo de la tabla de Plotly de un dataframe (sin dibujar: se puede probar sin navegador) */
export function buildDataFrameTable(dataframe: dfd.DataFrame, options: DataFrameTableOptions_t = {}) {
  const palette = TABLE_PALETTE[options.theme ?? 'light']
  const columns = dataframe.columns
  const dtypes = dataframe.dtypes
  const rowLabels = dataframe.index.map(String)
  const rowsCount = rowLabels.length
  const showIndex = options.index ?? true
  const target = resolveTableTarget(dataframe, options)
  const targetColumn = options.targetAxis === 'row' || target === null ? -1 : columns.indexOf(target)
  const targetRow = options.targetAxis === 'row' && target !== null ? rowLabels.indexOf(target) : -1

  const subtitleOf = (column: string, position: number) => {
    if (options.subtitles === 'dtype') return dtypes[position]
    return options.subtitles?.[column]
  }
  const hasSubtitles = columns.some((column, position) => subtitleOf(column, position) !== undefined)

  // Columnas de la tabla: [índice], columnas del dataframe
  const headerValues = columns.map((column, position) => {
    const subtitle = subtitleOf(column, position)
    const subtitleColor = position === targetColumn ? 'rgba(255, 255, 255, 0.85)' : palette.headerMuted
    return [subtitle === undefined
      ? `<b>${escapeHTML(column)}</b>`
      : `<b>${escapeHTML(column)}</b><br><span style="font-size:11px;color:${subtitleColor}">${escapeHTML(subtitle)}</span>`]
  })
  const cellValues = columns.map((column) => (dataframe[column].values as unknown[])
    .map((value) => (typeof value === 'string' ? escapeHTML(value) : value)))
  const isNumeric = dtypes.map((dtype) => dtype === 'int32' || dtype === 'float32')
  const formats = dtypes.map((dtype) => (dtype === 'float32' ? '.4~f' : ''))
  const aligns = isNumeric.map((numeric) => (numeric ? 'right' : 'left'))
  const headerFill = columns.map((_, position) => (position === targetColumn ? TARGET_COLOR : palette.header))
  const headerFont = columns.map((_, position) => (position === targetColumn ? '#ffffff' : palette.headerText))
  const cellFill = columns.map((_, position) => rowLabels.map((_label, row) => {
    const isTarget = position === targetColumn || row === targetRow
    if (isTarget) return row % 2 === 1 ? palette.targetStripe : palette.target
    return row % 2 === 1 ? palette.stripe : palette.cell
  }))
  // Con una fila objetivo, el color del texto va celda a celda; si no, por columna
  const cellFont: Array<string | string[]> = columns.map((_, position) => (targetRow === -1
    ? (position === targetColumn ? palette.targetText : palette.text)
    : rowLabels.map((_label, row) => (row === targetRow ? palette.targetText : palette.text))))
  const widths = columns.map(() => COLUMN_MIN_WIDTH)

  if (showIndex) {
    headerValues.unshift([`<b>${escapeHTML(options.indexHeader ?? '#')}</b>`])
    cellValues.unshift(rowLabels.map((label) => `<b>${escapeHTML(label)}</b>`))
    formats.unshift('')
    aligns.unshift('left')
    headerFill.unshift(palette.header)
    headerFont.unshift(palette.headerText)
    cellFill.unshift(rowLabels.map((_label, row) => (row === targetRow ? palette.targetStripe : palette.index)))
    cellFont.unshift(targetRow === -1 ? palette.text : rowLabels.map((_label, row) => (row === targetRow ? palette.targetText : palette.text)))
    // El índice de describe (nombres de columnas) necesita más sitio que un número de fila
    widths.unshift(rowLabels.some((label) => label.length > 6) ? COLUMN_MIN_WIDTH * 1.4 : INDEX_COLUMN_WIDTH)
  }

  const headerHeight = hasSubtitles ? HEADER_HEIGHT_SUBTITLE : HEADER_HEIGHT
  const titleHeight = options.title ? TITLE_HEIGHT : 0
  const visibleRows = Math.max(1, Math.min(rowsCount, options.maxRows ?? DEFAULT_MAX_ROWS))
  const fontFamily = options.fontFamily ?? 'system-ui, sans-serif'

  const data = {
    type       : 'table',
    columnwidth: widths,
    header     : {
      values: headerValues,
      align : aligns,
      height: headerHeight,
      fill  : { color: headerFill },
      font  : { family: fontFamily, size: 13, color: headerFont },
      line  : { color: palette.line, width: 1 },
    },
    cells: {
      values: cellValues,
      format: formats,
      align : aligns,
      height: CELL_HEIGHT,
      fill  : { color: cellFill },
      font  : { family: fontFamily, size: 13, color: cellFont },
      line  : { color: palette.line, width: 1 },
    },
  }
  const layout = {
    autosize     : true,
    height       : titleHeight + headerHeight + visibleRows * CELL_HEIGHT + 4,
    margin       : { l: 1, r: 1, t: titleHeight + 1, b: 1 },
    paper_bgcolor: 'rgba(0, 0, 0, 0)',
    font         : { family: fontFamily, color: palette.text },
    title        : options.title
      ? { text: escapeHTML(options.title), x: 0, xanchor: 'left', font: { size: 15, color: palette.text } }
      : undefined,
  }
  return { data, layout, minWidth: widths.reduce((sum, width) => sum + width, 0), target }
}

const readTheme = (): Theme_t => (document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light')

/**
 * Dibuja el dataframe como tabla de Plotly en el elemento (o el elemento con ese id). Si las columnas no caben, la
 * tabla mantiene un ancho mínimo y el contenedor se desplaza en horizontal
 */
export function DataFrameTablePlot(element: HTMLElement | string, dataframe: dfd.DataFrame, options: DataFrameTableOptions_t = {}) {
  const container = typeof element === 'string' ? document.getElementById(element) : element
  if (container === null) return
  const { data, layout, minWidth } = buildDataFrameTable(dataframe, {
    ...options,
    theme     : options.theme ?? readTheme(),
    fontFamily: options.fontFamily ?? getComputedStyle(document.body).fontFamily,
  })
  container.classList.add('n4l-dataframe-table')
  let plot = container.querySelector<HTMLDivElement>(':scope > .n4l-dataframe-table-plot')
  if (plot === null) {
    container.textContent = ''
    plot = document.createElement('div')
    plot.className = 'n4l-dataframe-table-plot'
    container.append(plot)
  }
  plot.style.minWidth = `${minWidth}px`
  void Plotly.react(plot, [data as unknown as Plotly.Data], layout as unknown as Partial<Plotly.Layout>, { displayModeBar: false, responsive: true })
}

/** Ajusta la tabla al ancho de su contenedor (p. ej. al abrir un <details> en el que se dibujó sin ancho) */
export function DataFrameTableResize(element: HTMLElement | null) {
  const plot = element?.querySelector<HTMLDivElement>(':scope > .n4l-dataframe-table-plot')
  // Oculta (pestaña o <details> cerrado) no se puede ajustar: ya se ajustará al verse
  if (plot && plot.querySelector('.main-svg') && plot.offsetParent !== null) {
    // Los tipos dicen void, pero devuelve una promesa que se rechaza si el gráfico ya no se ve
    void Promise.resolve(Plotly.Plots.resize(plot) as unknown).catch(() => undefined)
  }
}

/** Libera la tabla de Plotly del elemento (sus eventos de redimensionado) */
export function DataFrameTablePurge(element: HTMLElement | null) {
  const plot = element?.querySelector<HTMLDivElement>(':scope > .n4l-dataframe-table-plot')
  if (plot) Plotly.purge(plot)
}

/**
 * Estadísticas descriptivas de las columnas numéricas con una fila por columna (más fácil de leer cuando hay muchas)
 * y redondeadas; null si no hay columnas numéricas
 */
export function DataFrameDescribeTable(dataframe: dfd.DataFrame): dfd.DataFrame | null {
  const describe = DataFrameDescribeNumeric(dataframe)
  return describe === null ? null : describe.T.round(3)
}
