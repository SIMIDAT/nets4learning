import { useEffect, useId } from 'react'
import { TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2 } from '@/CONSTANTS_DanfoJS'
import * as dfd from 'danfojs'

export default function DataFrameDescribe(props: { dataframe: dfd.DataFrame }) {
  const { dataframe } = props
  const dataframeID = useId()

  useEffect(() => {
    if (dataframe.columns.length > 0) {
      dataframe
        .describe()
        .T
        .plot(dataframeID)
        .table({ config: TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2 })
    }
  }, [dataframe, dataframeID])

  return <>
    <div id={dataframeID}></div>
  </>
}
