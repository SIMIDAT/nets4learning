import { Trans } from 'react-i18next'
import { Card } from 'react-bootstrap'
import * as dfd from 'danfojs'
import DataFrameDataset from '@components/dataframe/DataFrameDataset'

type DataFrameDatasetCardProps = {
  dataframe: dfd.DataFrame
}

export default function DataFrameDatasetCard(props: DataFrameDatasetCardProps) {
  const { dataframe } = props
  return <>
    <Card className={'mt-3'}>
      <Card.Header>
        <h3><Trans i18nKey={'dataframe.dataset.title'} /></h3>
      </Card.Header>
      <Card.Body>

        <DataFrameDataset dataframe={dataframe} />

      </Card.Body>
    </Card>
  </>
}
