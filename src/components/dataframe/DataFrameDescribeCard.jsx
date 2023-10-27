import { useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import DataFrameDescribe from '@components/dataframe/DataFrameDescribe'
import DataFrameDescribeModalDescription from '@components/dataframe/DataFrameDescribeModalDescription'

export default function DataFrameDescribeCard ({ dataframe }) {

  const { t } = useTranslation()
  const [showDescription, setShowDescription] = useState(false)

  const handleClick_OpenModal_Describe = () => {
    setShowDescription(true)
  }

  return <>
    <Card className={'mt-3'}>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={'dataframe.describe.title'} /></h3>
        <div className={'d-flex'}>
          <Button variant={'outline-primary'}
                  size={'sm'}
                  onClick={handleClick_OpenModal_Describe}>
            <Trans i18nKey={'dataframe.describe.description.title'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {dataframe.columns.length === 0 &&
          <WaitingPlaceholder title={t('Waiting')} />
        }
        <DataFrameDescribe dataframe={dataframe} />
      </Card.Body>
    </Card>

    <DataFrameDescribeModalDescription showDescription={showDescription}
                                       setShowDescription={setShowDescription}
    />
  </>
}