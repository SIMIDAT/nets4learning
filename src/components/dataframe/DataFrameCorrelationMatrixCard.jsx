import React, { useState } from 'react'
import { Card, Button } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import DataFrameCorrelationMatrixModalDescription from '@components/dataframe/DataFrameCorrelationMatrixModalDescription'
import DataFrameCorrelationMatrix from '@components/dataframe/DataFrameCorrelationMatrix'

export default function DataFrameCorrelationMatrixCard ({ dataframe }) {

  const [showDescription, setShowDescription] = useState(false)

  const { t } = useTranslation()

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
        {dataframe.columns.length === 0 &&
          <WaitingPlaceholder title={t('Waiting')} />
        }

        <DataFrameCorrelationMatrix dataframe={dataframe} />

      </Card.Body>
    </Card>

    <DataFrameCorrelationMatrixModalDescription showDescription={showDescription}
                                                setShowDescription={setShowDescription}
    />
  </>
}
