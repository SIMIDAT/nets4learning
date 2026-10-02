import type { Config, Layout, LayoutAxis } from 'plotly.js'
import type { Theme_t } from '@core/theme'
import { TABLE_PALETTE } from '@core/dataframe/DataFrameTable'

/** Un color por clase (colores de Bootstrap), en el mismo orden en todos los gráficos del análisis */
export const CLASS_COLORS = ['#0d6efd', '#fd7e14', '#198754', '#6f42c1', '#dc3545', '#20c997', '#d63384', '#0dcaf0', '#ffc107', '#6c757d']

export const classColor = (index: number) => CLASS_COLORS[index % CLASS_COLORS.length]

/** Fondo transparente, letra de la página y rejilla del tema: el gráfico se ve como la tarjeta en claro y oscuro */
export function plotlyLayout(theme: Theme_t, layout: Partial<Layout> = {}): Partial<Layout> {
  const palette = TABLE_PALETTE[theme]
  const axis: Partial<LayoutAxis> = { gridcolor: palette.line, zerolinecolor: palette.line, linecolor: palette.line, automargin: true }
  return {
    paper_bgcolor: 'rgba(0, 0, 0, 0)',
    plot_bgcolor : 'rgba(0, 0, 0, 0)',
    font         : { family: typeof document === 'undefined' ? undefined : getComputedStyle(document.body).fontFamily, color: palette.text, size: 12 },
    colorway     : CLASS_COLORS,
    margin       : { l: 56, r: 16, t: 24, b: 48 },
    legend       : { orientation: 'h', x: 0, y: 1.12 },
    hoverlabel   : { font: { size: 12 } },
    ...layout,
    xaxis        : { ...axis, ...layout.xaxis },
    yaxis        : { ...axis, ...layout.yaxis },
  }
}

export const PLOTLY_CONFIG: Partial<Config> = {
  displaylogo           : false,
  responsive            : true,
  modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
}
