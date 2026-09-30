import * as dfd from 'danfojs'
import DataFrameCard from '@components/dataframe/DataFrameCard'
import DataFrameDataset from '@components/dataframe/DataFrameDataset'

type DataFrameDatasetCardProps = {
  dataframe: dfd.DataFrame
}

export default function DataFrameDatasetCard({ dataframe }: DataFrameDatasetCardProps) {
  return (
    <DataFrameCard title={'dataframe.dataset.title'}>
      <DataFrameDataset dataframe={dataframe} />
    </DataFrameCard>
  )
}
