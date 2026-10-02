import { useMemo } from 'react'
import type { Data, Layout } from 'plotly.js'
import Plot from '@components/dataframe/Plot'
import { useTheme } from '@hooks/useTheme'
import { useIdleValue } from '@hooks/useIdleValue'
import { PLOTLY_CONFIG, plotlyLayout } from '@core/dataframe/plotlyTheme'

type N4LPlotProps = {
  data   : Data[]
  layout?: Partial<Layout>
  height?: number
  /** Texto para lectores de pantalla (el gráfico es un SVG sin texto alternativo) */
  label? : string
}

/**
 * Gráfico de Plotly con los colores del tema y todo el ancho de su contenedor. Se dibuja (y se redibuja) cuando el
 * navegador está libre: con muchos gráficos en la página, cada uno va en su propia tarea corta
 */
export default function N4LPlot({ data, layout = {}, height = 360, label }: N4LPlotProps) {
  const theme = useTheme()
  const figure = useMemo(() => ({ data, layout: plotlyLayout(theme, { height, autosize: true, ...layout }) }), [data, layout, height, theme])
  const shown = useIdleValue(figure)
  return (
    <div role={'img'} aria-label={label} data-testid={'Test-N4LPlot'} style={{ minHeight: height }}>
      {shown && <Plot data={shown.data}
        layout={shown.layout}
        config={PLOTLY_CONFIG}
        useResizeHandler={true}
        style={{ width: '100%', height }} />}
    </div>
  )
}
