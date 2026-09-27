import createPlotlyComponent from 'react-plotly.js/factory'
import type PlotComponent from 'react-plotly.js'
import Plotly from 'plotly.js-dist-min'

/**
 * Componente `<Plot>` de react-plotly.js creado con el mismo Plotly que usa danfojs
 * (`plotly.js-dist-min`). Importar `react-plotly.js` directamente arrastra `plotly.js` completo:
 * una segunda copia de Plotly en el bundle. El tipo es el de la clase original (admite `ref`).
 */
const Plot = createPlotlyComponent(Plotly) as unknown as typeof PlotComponent
type Plot = PlotComponent

export default Plot
