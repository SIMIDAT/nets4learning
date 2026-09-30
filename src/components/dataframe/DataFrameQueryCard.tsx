import * as dfd from 'danfojs'
import { VERBOSE } from '@/CONSTANTS'
import DataFrameCard from '@components/dataframe/DataFrameCard'
import DataFrameQuery from '@components/dataframe/DataFrameQuery'
import DataFrameQueryModalDescription from '@components/dataframe/DataFrameQueryModalDescription'

type DataFrameQueryCardProps = {
  dataframe           : dfd.DataFrame
  isDataFrameProcessed: boolean
}

export default function DataFrameQueryCard({ dataframe, isDataFrameProcessed }: DataFrameQueryCardProps) {
  if (VERBOSE) console.debug('render DataFrameQueryCard')
  return (
    <DataFrameCard title={'dataframe.query.title'}
      ready={isDataFrameProcessed}
      description={{ buttonKey: 'dataframe.query.description.title', Modal: DataFrameQueryModalDescription }}>
      <DataFrameQuery dataframe={dataframe} />
    </DataFrameCard>
  )
}
