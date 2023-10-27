import React, { useContext } from 'react'

import { VERBOSE } from '@/CONSTANTS'
import LinearRegressionContext from '@context/LinearRegressionContext'
import { DataFramePlotProvider } from '@components/_context/DataFramePlotContext'
import DataFramePlot from '@components/dataframe/DataFramePlot'

export default function LinearRegressionDatasetPlot () {

  const { datasetLocal } = useContext(LinearRegressionContext)

  if(VERBOSE) console.debug('render LinearRegressionDatasetPlot')
  return <>
    <DataFramePlotProvider>
      <DataFramePlot dataframe={datasetLocal.dataframe_processed} />
    </DataFramePlotProvider>
  </>
}