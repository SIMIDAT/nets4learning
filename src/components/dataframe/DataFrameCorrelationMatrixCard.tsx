import { useState } from 'react'
import { Card, Button } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import * as dfd from 'danfojs'

import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import DataFrameCorrelationMatrixModalDescription from '@components/dataframe/DataFrameCorrelationMatrixModalDescription'
import DataFrameCorrelationMatrix from '@components/dataframe/DataFrameCorrelationMatrix'

type DataFrameCorrelationMatrixCardProps = {
  dataframe           : dfd.DataFrame
  isDataFrameProcessed: boolean
}

export default function DataFrameCorrelationMatrixCard(props: DataFrameCorrelationMatrixCardProps) {
  const { dataframe, isDataFrameProcessed } = props

  const [showDescription, setShowDescription] = useState(false)

  const handleClick_OpenModal_CorrelationMatrix = () => {
    setShowDescription(true)
  }

  return <>
    <Card className={'mt-3'}>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={'dataframe.correlation-matrix.title'} /></h3>
        <div className="d-flex">
          <Button variant={'outline-primary'}
            size={'sm'}
            onClick={handleClick_OpenModal_CorrelationMatrix}>
            <Trans i18nKey={'dataframe.correlation-matrix.description.title'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {!isDataFrameProcessed &&
          <WaitingPlaceholder i18nKey_title={'Waiting'} />
        }
        {isDataFrameProcessed &&
          <DataFrameCorrelationMatrix dataframe={dataframe} />
        }
      </Card.Body>
    </Card>

    <DataFrameCorrelationMatrixModalDescription
      showDescription={showDescription}
      setShowDescription={setShowDescription}
    />
  </>
}
