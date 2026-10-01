import { Card } from 'react-bootstrap'
import { Trans } from 'react-i18next'

import { useRegressionContext } from '@context/useRegressionContext'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import { DEFAULT_SELECTOR_DATASET_INDEX, VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS } from '@/CONSTANTS_ACTIONS'
import RegressionDatasetProcessForm from './RegressionDatasetProcessForm'
import N4LHelpLink from '@components/helpLink/N4LHelpLink'

export default function RegressionDatasetProcess() {

  const {
    datasets,
  } = useRegressionContext()

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
          <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-file'} />
        </>}

        {showDatasetProcess() && <>
          <RegressionDatasetProcessForm  />
        </>}
      </Card.Body>
      <Card.Footer className="text-end">
        <p className="text-muted mb-0 pb-0">
          <Trans i18nKey="more-information-in-link"
            components={{
              link1: <N4LHelpLink page={'glossary'} action={GLOSSARY_ACTIONS.REGRESSION.STEP_1_UPLOAD_AND_PROCESS} />
            }}
          />
        </p>
      </Card.Footer>
    </Card>
  </>
}