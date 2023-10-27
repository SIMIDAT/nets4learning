import React from 'react'
import { Card } from 'react-bootstrap'
import { Trans } from 'react-i18next'

import { VERBOSE } from '@/CONSTANTS'
import { Link } from 'react-router-dom'
import TabularClassificationDatasetProcessForm
  from '@pages/playground/0_TabularClassification/TabularClassificationDatasetProcessForm'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'

export default function TabularClassificationDatasetProcess (props) {
  const {
    /** @type DatasetProcessed_t[] */
    datasets,
    /** @type React.Dispatch<Array<DatasetProcessed_t>> */
    setDatasets,
    /** @type number */
    datasetIndex,
    /** @type React.Dispatch<number> */
    setDatasetIndex
  } = props

  const isFileUploaded = () => {
    if (datasets.length > 0 && datasetIndex >= 0) {
      return datasets[datasetIndex].is_dataset_upload
    }
  }

  if (VERBOSE) console.debug('render TabularClassificationDatasetProcess')
  return <>
    <Card className="mt-3">
      <Card.Header><h3><Trans i18nKey={'Data set processing'} /></h3></Card.Header>
      <Card.Body>
        {(!isFileUploaded()) && <>
          <WaitingPlaceholder title={'pages.playground.generator.waiting-for-file'} />
        </>}
        {(isFileUploaded()) && <>
          <TabularClassificationDatasetProcessForm datasets={datasets}
                                                   setDatasets={setDatasets}
                                                   datasetIndex={datasetIndex}
                                                   setDatasetIndex={setDatasetIndex}
          />
        </>}
      </Card.Body>
      <Card.Footer className="text-end">
        <p className="text-muted mb-0 pb-0">
          <Trans i18nKey="more-information-in-link"
                 components={{
                   link1: <Link className="text-info"
                                to={{
                                  pathname: '/glossary/',
                                  state   : {
                                    action: GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS
                                  }
                                }} />
                 }}
          />
        </p>
        <p className="text-muted mb-0 pb-0">
          <Trans i18nKey="more-information-in-tutorial"
                 components={{
                   link1: <Link className="text-info"
                                to={{
                                  pathname: '/manual/',
                                  state   : {
                                    action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS
                                  }
                                }} />
                 }}
          />
        </p>
      </Card.Footer>
    </Card>
  </>
}
