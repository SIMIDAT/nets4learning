import React, { useEffect, useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import N4LTablePagination from '@components/table/N4LTablePagination'
import { VERBOSE } from '@/CONSTANTS'
import { Link } from 'react-router-dom'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import TabularClassificationDatasetShowInfo from '@pages/playground/0_TabularClassification/TabularClassificationDatasetShowInfo'

export default function TabularClassificationDatasetShow (props) {
  const { datasets, datasetIndex } = props
  const prefix = 'pages.playground.generator.dataset.'
  const { t } = useTranslation()

  const [dataframe, setDataframe] = useState(new dfd.DataFrame())
  const [showProcessed, setShowProcessed] = useState(false)
  const [showDataset, setShowDataset] = useState(false)

  const handleChange_Dataset = (e) => {
    const checked = e.target.checked
    setShowProcessed(!!checked)
    if (!!checked) {
      setDataframe(datasets[datasetIndex].dataframe_processed)
    } else {
      setDataframe(datasets[datasetIndex].dataframe_original)
    }
  }

  useEffect(() => {
    const canRenderDataset = () => {
      if (datasets && datasets.length > 0 && datasetIndex >= 0) {
        if (datasets[datasetIndex].is_dataset_processed)
          return true
      }
      return false
    }

    const _showDataset = canRenderDataset()
    setShowDataset(_showDataset)
    if (_showDataset) {
      setDataframe(datasets[datasetIndex].dataframe_original)
    }
  }, [datasets, datasetIndex])

  if (VERBOSE) console.debug('render TabularClassificationDatasetShow')
  return <>
    <Card className={'mt-3'}>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={prefix + 'title'} /></h3>
        <div className={'d-flex'}>
          <div key={'default-switch'}>
            <Form.Check type="switch"
                        id={'default-switch'}
                        reverse={true}
                        size={'sm'}
                        name={'switch-webcam'}
                        disabled={!showDataset}
                        label={t('Processed')}
                        value={showProcessed.toString()}
                        onChange={(e) => handleChange_Dataset(e)}
            />
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {!showDataset && <>
          <WaitingPlaceholder title={'pages.playground.generator.waiting-for-process'} />
        </>}
        {showDataset && <>
          <Row>
            <Col className={'overflow-x-auto'}>
              <N4LTablePagination data_head={dataframe.columns}
                                  data_body={DataFrameUtils.DataFrameIterRows(dataframe)}
              />
            </Col>
          </Row>
          <hr />
          <TabularClassificationDatasetShowInfo datasets={datasets}
                                                datasetIndex={datasetIndex} />
        </>}
      </Card.Body>
      <Card.Footer className={'text-end'}>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans i18nKey={'more-information-in-link'}
                 components={{
                   link1: <Link className={'text-info'}
                                to={{
                                  pathname: '/glossary/',
                                  state   : {
                                    action: GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_2_DATASET,
                                  },
                                }} />,
                 }} />
        </p>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans i18nKey={'more-information-in-tutorial'}
                 components={{
                   link1: <Link className={'text-info'}
                                to={{
                                  pathname: '/manual/',
                                  state   : {
                                    action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_2_DATASET,
                                  },
                                }} />,
                 }} />
        </p>
      </Card.Footer>

    </Card>
  </>
}