import type * as PlotlyTypes from 'plotly.js'

// Plotly para danfojs (vite.config.ts: danfoLazyDeps). danfo lo importa al cargarse para df.plot(), y con él llegaban
// 1,1 MB en todas las páginas con dataframes aunque no dibujaran nada. Así se descarga la primera vez que danfo dibuja
// de verdad ("Más gráficos" del AED); el resto de la aplicación importa plotly.js-dist-min como siempre.
// danfo solo usa Plotly.newPlot y no mira lo que devuelve.

type NewPlot_t = typeof PlotlyTypes.newPlot

export const newPlot = (...args: Parameters<NewPlot_t>) =>
  import('plotly.js-dist-min').then(({ default: Plotly }) => Plotly.newPlot(...args))

export default { newPlot }
