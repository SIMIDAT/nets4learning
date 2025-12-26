import { useContext } from 'react'
import { Card } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import { Link } from 'react-router-dom'

import RegressionContext from '@context/RegressionContext'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import { DEFAULT_SELECTOR_DATASET_INDEX, VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS } from '@/CONSTANTS_ACTIONS'
import RegressionDatasetProcessForm from './RegressionDatasetProcessForm'

export default function RegressionDatasetProcess() {

  const {
    datasets,
  } = useContext(RegressionContext)

  const showDatasetProcess = () => {
    return datasets 
      && datasets.data.length > 0 
      && datasets.index !== DEFAULT_SELECTOR_DATASET_INDEX
      && datasets.index >= 0 
      && datasets.data[datasets.index].is_dataset_upload
  }

  if (VERBOSE) console.debug('render RegressionDatasetProcess')
  return <>
    <Card className="mt-3">
      <Card.Header><h3><Trans i18nKey={'Data set processing'} /></h3></Card.Header>
      <Card.Body>
        {!showDatasetProcess() && <>
          <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-file'} />
        </>}

        {showDatasetProcess() && <>
          <RegressionDatasetProcessForm  />
        </>}
      </Card.Body>
      <Card.Footer className="text-end">
        <p className="text-muted mb-0 pb-0">
          <Trans i18nKey="more-information-in-link"
            components={{
              link1: <Link className="text-info"
                  state={{
                    action: GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS
                  }}
                  to={{
                    pathname: '/glossary/',
                  }}
                />
            }}
          />
        </p>
      </Card.Footer>
    </Card>
  </>
}