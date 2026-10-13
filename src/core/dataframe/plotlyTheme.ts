import type { Config, Layout, LayoutAxis } from 'plotly.js'
import type { Theme_t } from '@core/theme'
import { TABLE_PALETTE } from '@core/dataframe/DataFrameTable'
import { categoryColor, chartColor, CLASS_ORDER } from '@core/chartColors'

/** Un color por clase, en el mismo orden en todos los gráficos del análisis (con el tono del tema: 3:1 con el fondo) */
export const classColor = (index: number, theme: Theme_t) => categoryColor(CLASS_ORDER, index, theme)

/** El color de la variable objetivo (el rosa de `--n4l-target-color`) */
export const targetColor = (theme: Theme_t) => chartColor('pink', theme)

/** Fondo transparente, letra de la página y rejilla del tema: el gráfico se ve como la tarjeta en claro y oscuro */
export function plotlyLayout(theme: Theme_t, layout: Partial<Layout> = {}): Partial<Layout> {
  const palette = TABLE_PALETTE[theme]
  const axis: Partial<LayoutAxis> = { gridcolor: palette.line, zerolinecolor: palette.line, linecolor: palette.line, automargin: true }
  return {
    paper_bgcolor: 'rgba(0, 0, 0, 0)',
    plot_bgcolor : 'rgba(0, 0, 0, 0)',
    font         : { family: typeof document === 'undefined' ? undefined : getComputedStyle(document.body).fontFamily, color: palette.text, size: 12 },
    colorway     : CLASS_ORDER.map((_, index) => classColor(index, theme)),
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
