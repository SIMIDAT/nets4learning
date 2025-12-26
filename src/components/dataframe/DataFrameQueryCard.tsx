import { useState } from 'react'
import { Card, Button } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import * as dfd from 'danfojs'

import { VERBOSE } from '@/CONSTANTS'
import DataFrameQueryModalDescription from '@components/dataframe/DataFrameQueryModalDescription'
import DataFrameQuery from '@components/dataframe/DataFrameQuery'
import WaitingPlaceholder from '../loading/WaitingPlaceholder'

type DataFrameQueryCardProps = {
  dataframe           : dfd.DataFrame
  isDataFrameProcessed: boolean
}

export default function DataFrameQueryCard(props: DataFrameQueryCardProps) {

  const { dataframe, isDataFrameProcessed } = props
  const [showDescription, setShowDescription] = useState(false)

  const handleClick_OpenModal_Query = () => {
    setShowDescription(true)
  }

  if (VERBOSE) console.debug('render DataFrameQueryCard')
  return <>
    <Card className={'mt-3'}>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={'dataframe.query.title'} /></h3>
        <div className={'d-flex'}>
          <Button 
            variant={'outline-primary'}
            size={'sm'}
            onClick={handleClick_OpenModal_Query}>
            <Trans i18nKey={'dataframe.query.description.title'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {!isDataFrameProcessed && <>
          <WaitingPlaceholder i18nKey_title={'Waiting'} />
        </>}
        {isDataFrameProcessed && <>
          <DataFrameQuery dataframe={dataframe} />
        </>}
      </Card.Body>
    </Card>

    <DataFrameQueryModalDescription
      showDescription={showDescription}
      setShowDescription={setShowDescription} />
  </>
}