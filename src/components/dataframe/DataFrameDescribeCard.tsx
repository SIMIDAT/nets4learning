import * as dfd from 'danfojs'
import DataFrameCard from '@components/dataframe/DataFrameCard'
import DataFrameDescribe from '@components/dataframe/DataFrameDescribe'
import DataFrameDescribeModalDescription from '@components/dataframe/DataFrameDescribeModalDescription'

type DataFrameDescribeCardProps = {
  dataframe           : dfd.DataFrame
  isDataFrameProcessed: boolean
}

export default function DataFrameDescribeCard({ dataframe, isDataFrameProcessed }: DataFrameDescribeCardProps) {
  return (
    <DataFrameCard title={'dataframe.describe.title'}
      ready={isDataFrameProcessed}
      description={{ buttonKey: 'dataframe.describe.description.title', Modal: DataFrameDescribeModalDescription }}>
      <DataFrameDescribe dataframe={dataframe} />
    </DataFrameCard>
  )
}
