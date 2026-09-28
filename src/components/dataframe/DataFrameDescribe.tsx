import { useEffect, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2 } from '@/CONSTANTS_DanfoJS'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import * as dfd from 'danfojs'

export default function DataFrameDescribe(props: { dataframe: dfd.DataFrame }) {
  const { dataframe } = props
  const dataframeID = useId()
  const { t } = useTranslation()

  useEffect(() => {
    if (dataframe.columns.length > 0) {
      DataFrameUtils.DataFrameDescribePlot(dataframe, dataframeID, {
        config   : TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2,
        emptyText: t('dataframe.describe.no-numeric'),
        transpose: true,
      })
    }
  }, [dataframe, dataframeID, t])

  return <>
    <div id={dataframeID}></div>
  </>
}
