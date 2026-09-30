import '@styles/ScrollBar.css'
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Plot from './Plot'
import * as dfd from 'danfojs'

import { VERBOSE } from '@/CONSTANTS'
import { PLOTLY_CONFIG_DEFAULT } from '@/CONSTANTS_ChartsJs'


type DataFrameScatterPlotProps = {
  dataframe : dfd.DataFrame,
  selector_x: string,
  selector_y: string,
}

export default function DataFrameScatterPlot(props: DataFrameScatterPlotProps) {
  const { dataframe, selector_x, selector_y } = props

  const { t } = useTranslation()
  const refPlot = useRef<Plot>(null)
  const data = useMemo<Plotly.Data[]>(() => {
    if (dataframe.columns.length > 0)
      if (dataframe.columns.includes(selector_x) && dataframe.columns.includes(selector_y)) {
        const trace: Plotly.Data = {
          x      : dataframe[selector_x].values.map((v: any) => v),
          y      : dataframe[selector_y].values.map((v: any) => v),
          name   : t('{{X_feature}} x {{target}}', { X_feature: selector_x, target: selector_y }),
          mode   : 'markers',
          type   : 'scatter',
          opacity: 1,
          marker : {
            color: 'blue'
          }
        }
        return [trace]
      }
    return []
  }, [dataframe, selector_x, selector_y, t])

  if (VERBOSE) console.debug('render DataFramePlot')
  return <>
    <Plot
      ref={refPlot}
      data={data}
      useResizeHandler={true}
      style={PLOTLY_CONFIG_DEFAULT.STYLES}
      layout={{
        title: {
          text: '',
        },
        ...PLOTLY_CONFIG_DEFAULT.LAYOUT
      }}
    />
  </>
}