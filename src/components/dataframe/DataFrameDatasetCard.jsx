import { Card } from 'react-bootstrap'
import DataFrameDataset from '@components/dataframe/DataFrameDataset'
import { Trans } from 'react-i18next'

export default function DataFrameDatasetCard ({ dataframe }) {

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