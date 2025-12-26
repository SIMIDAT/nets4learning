import { useEffect, useId } from 'react'
import * as dfd from 'danfojs'

import { TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2 } from '@/CONSTANTS_DanfoJS'

export default function DataFrameShow(props: { dataframe: dfd.DataFrame }) {
  const { dataframe } = props
  const dataframeID = useId()

  useEffect(() => {
    dataframe
      .plot(dataframeID)
      .table({ config: TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2 })
  }, [dataframe, dataframeID])

  return <>
    <div id={dataframeID}></div>
  </>
}