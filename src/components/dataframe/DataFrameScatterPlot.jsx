import '@styles/ScrollBar.css'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Plot from 'react-plotly.js'

import { VERBOSE } from '@/CONSTANTS'

import { PLOTLY_CONFIG_DEFAULT } from '@/CONSTANTS_ChartsJs'

export default function DataFrameScatterPlot ({ dataframe, selector_x, selector_y }) {

  const { t } = useTranslation()
  const refPlot = useRef()
  const [data, setData] = useState([])

  useEffect(() => {
    if (dataframe.columns.length > 0)
      if (dataframe.columns.includes(selector_x) && dataframe.columns.includes(selector_y)) {
        const trace = {
          x      : dataframe[selector_x].values.map((v) => v),
          y      : dataframe[selector_y].values.map((v) => v),
          name   : t('{{X_feature}} x {{target}}', { X_feature: selector_x, target: selector_y }),
          mode   : 'markers',
          type   : 'scatter',
          opacity: 1,
          marker : {
            color: 'blue'
          }
        }
        setData([trace])
      }
  }, [dataframe, selector_x, selector_y, t])

  if (VERBOSE) console.debug('render DataFramePlot')
  return <>
    <Plot ref={refPlot}
          data={data}
          useResizeHandler={true}
          style={PLOTLY_CONFIG_DEFAULT.STYLES}
          layout={{
            title: '',
            ...PLOTLY_CONFIG_DEFAULT.LAYOUT
          }}
    />
  </>
}