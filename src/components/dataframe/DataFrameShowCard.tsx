import * as dfd from 'danfojs'
import DataFrameCard from '@components/dataframe/DataFrameCard'
import DataFrameShow from './DataFrameShow'

type DataFrameShowCardProps = {
  dataframe           : dfd.DataFrame
  isDataFrameProcessed: boolean
}

export default function DataFrameShowCard({ dataframe, isDataFrameProcessed }: DataFrameShowCardProps) {
  return (
    <DataFrameCard title={'dataframe.dataframe.title'} ready={isDataFrameProcessed}>
      <DataFrameShow dataframe={dataframe} />
    </DataFrameCard>
  )
}
