import { useMemo } from 'react'
import type { Data, Layout } from 'plotly.js'
import Plot from '@components/dataframe/Plot'
import { useTheme } from '@hooks/useTheme'
import { useIdleValue } from '@hooks/useIdleValue'
import { PLOTLY_CONFIG, plotlyLayout } from '@core/dataframe/plotlyTheme'
import N4LChartData, { type ChartDataCell_t } from '@components/chart/N4LChartData'

/** Los datos del gráfico en una tabla («Ver los datos»); sin `caption`, la tabla se llama como el gráfico */
export type PlotTable_t = { caption?: string, columns: string[], rows: ChartDataCell_t[][] }

type N4LPlotProps = {
  data   : Data[]
  layout?: Partial<Layout>
  height?: number
  /** Texto para lectores de pantalla (el gráfico es un SVG sin texto alternativo) */
  label? : string
  table? : PlotTable_t
}

/**
 * Gráfico de Plotly con los colores del tema y todo el ancho de su contenedor. Se dibuja (y se redibuja) cuando el
 * navegador está libre: con muchos gráficos en la página, cada uno va en su propia tarea corta
 */
export default function N4LPlot({ data, layout = {}, height = 360, label, table }: N4LPlotProps) {
  const theme = useTheme()
  const figure = useMemo(() => ({ data, layout: plotlyLayout(theme, { height, autosize: true, ...layout }) }), [data, layout, height, theme])
  const shown = useIdleValue(figure)
  return <>
    <div role={'img'} aria-label={label} data-testid={'Test-N4LPlot'} style={{ minHeight: height }}>
      {shown && <Plot data={shown.data}
        layout={shown.layout}
        config={PLOTLY_CONFIG}
        useResizeHandler={true}
        style={{ width: '100%', height }} />}
    </div>
    {table !== undefined && <N4LChartData caption={table.caption ?? label ?? ''} columns={table.columns} rows={table.rows} />}
  </>
}
