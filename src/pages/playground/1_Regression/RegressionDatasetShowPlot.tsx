
import { VERBOSE } from '@/CONSTANTS'
import { useRegressionContext } from '@context/useRegressionContext'
import { DataFramePlotProvider } from '@components/_context/DataFramePlotContext'
import DataFramePlot from '@components/dataframe/DataFramePlot'

export default function RegressionDatasetShowPlot() {
  const {
    datasets,
  } = useRegressionContext()

  const dataset = datasets.data[datasets.index]
  if (!dataset || !dataset.dataframe_processed) {
    console.warn('RegressionDatasetShowPlot: no dataset or no processed dataframe')
    return <></>
  }

  if (VERBOSE) console.debug('render RegressionDatasetShowPlot')
  return <>
    <DataFramePlotProvider>
      <DataFramePlot
        dataframe={datasets.data[datasets.index].dataframe_processed}
        isDataFrameProcessed={datasets.data[datasets.index].is_dataset_processed}
      />
    </DataFramePlotProvider>
  </>
}