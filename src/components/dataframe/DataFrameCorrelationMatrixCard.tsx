import * as dfd from 'danfojs'
import DataFrameCard from '@components/dataframe/DataFrameCard'
import DataFrameCorrelationMatrix from '@components/dataframe/DataFrameCorrelationMatrix'
import DataFrameCorrelationMatrixModalDescription from '@components/dataframe/DataFrameCorrelationMatrixModalDescription'

type DataFrameCorrelationMatrixCardProps = {
  dataframe           : dfd.DataFrame
  isDataFrameProcessed: boolean
}

export default function DataFrameCorrelationMatrixCard({ dataframe, isDataFrameProcessed }: DataFrameCorrelationMatrixCardProps) {
  return (
    <DataFrameCard title={'dataframe.correlation-matrix.title'}
      ready={isDataFrameProcessed}
      description={{ buttonKey: 'dataframe.correlation-matrix.description.title', Modal: DataFrameCorrelationMatrixModalDescription }}>
      <DataFrameCorrelationMatrix dataframe={dataframe} />
    </DataFrameCard>
  )
}
