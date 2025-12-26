import { Card } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import * as dfd from 'danfojs'

import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import DataFrameShow from './DataFrameShow'

type DataFrameShowCardProps = {
  dataframe           : dfd.DataFrame
  isDataFrameProcessed: boolean
}

export default function DataFrameShowCard(props: DataFrameShowCardProps) {
  const { dataframe, isDataFrameProcessed } = props
  return <>
    <Card className={'mt-3'}>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={'dataframe.dataframe.title'} /></h3>
      </Card.Header>
      <Card.Body>
        {!isDataFrameProcessed &&
          <WaitingPlaceholder i18nKey_title={'Waiting'} />
        }
        {isDataFrameProcessed && <>
          <DataFrameShow dataframe={dataframe} />
        </>}
      </Card.Body>
    </Card>
  </>
}