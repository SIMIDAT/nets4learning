import React, { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Card, Col, Form, Row } from 'react-bootstrap'
import * as dfd from 'danfojs'

import * as _Types from '@/core/types'
import { VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'
import { TABLE_PLOT_STYLE_CONFIG } from '@/CONSTANTS_DanfoJS'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'

import N4LSummary from '@components/summary/N4LSummary'
import N4LTablePagination from '@components/table/N4LTablePagination'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

import TabularClassificationDatasetShowInfo from '@pages/playground/0_TabularClassification/TabularClassificationDatasetShowInfo'

/**
 * @typedef {object} PropsTabularClassificationDatasetShow
 * @property {Array<DatasetProcessed_t>} datasets
 * @property {number} datasetIndex
 */

/**
 * 
 * @param {PropsTabularClassificationDatasetShow} props 
 * @returns 
 */
export default function TabularClassificationDatasetShow(props) {
  const { datasets, datasetIndex } = props
  const prefix = 'pages.playground.generator.dataset.'
  const { t } = useTranslation()
  const dataframe_original_plotID = useId()
  const dataframe_processed_plotID = useId()

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

  /**
   * 
   * @param {DatasetProcessed_t} _datasetSelected 
   */
  const _updateDataFrameDescribe = (_datasetSelected) => {
    const dataframe_original = _datasetSelected.dataframe_original
    const dataframe_processed = _datasetSelected.dataframe_processed

    dataframe_original
      .describe()
      .T
      .plot(dataframe_original_plotID)
      .table({ config: TABLE_PLOT_STYLE_CONFIG })
    dataframe_processed
      .describe()
      .T
      .plot(dataframe_processed_plotID)
      .table({ config: TABLE_PLOT_STYLE_CONFIG })
  }

  useEffect(() => {
    let canRenderDataset = false
    if (datasets && datasets.length > 0 && datasetIndex >= 0) {
      if (datasets[datasetIndex].is_dataset_processed) {
        canRenderDataset = true
      }
    }
    if (canRenderDataset) {
      setDataframe(datasets[datasetIndex].dataframe_original)
    }
    setShowDataset(canRenderDataset)
  }, [datasets, datasetIndex])

  if (VERBOSE) console.debug('render TabularClassificationDatasetShow')
  return <>
    <Card className={'mt-3'}>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={prefix + 'title'} /></h3>
        <div className={'ms-2 d-flex align-items-center gap-4'}>
          <Form.Check type="switch"
            id={'tabular-classification-switch-dataframe-processed'}
            reverse={true}
            size={'sm'}
            name={'tabular-classification-switch-dataframe-processed'}
            disabled={!showDataset}
            label={t('Processed')}
            value={showProcessed.toString()}
            onChange={(e) => handleChange_Dataset(e)}
          />
        </div>
      </Card.Header>
      <Card.Body>
        {!showDataset && <>
          <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-process'} />
        </>}
        {showDataset && <>
          <Row>
            <Col className={'overflow-x-auto'}>
              <N4LTablePagination
                data_head={dataframe.columns}
                data_body={DataFrameUtils.DataFrameIterRows(dataframe)} />
            </Col>
          </Row>
          <hr />
          <TabularClassificationDatasetShowInfo 
            datasets={datasets} 
            datasetIndex={datasetIndex} />
          <hr />
          <Row>
            <Col>
              <N4LSummary
                title={<Trans i18nKey={prefix + 'details.description-original'} />}
                info={<div id={dataframe_original_plotID}></div>} />
              <N4LSummary
                title={<Trans i18nKey={prefix + 'details.description-processed'} />}
                info={<div id={dataframe_processed_plotID}></div>} />
            </Col>
          </Row>
        </>}
      </Card.Body>
      <Card.Footer className={'text-end'}>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans 
            i18nKey={'more-information-in-link'}
            components={{
              link1: <Link 
                        className={'text-info'}
                        state={{
                          action: GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_2_DATASET,
                        }}
                        to={{
                          pathname: '/glossary/',
                        }} />,
            }} />
        </p>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans 
            i18nKey={'more-information-in-tutorial'}
            components={{
              link1: <Link 
                        className={'text-info'}
                        state={{
                          action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_2_DATASET,
                        }}
                        to={{
                          pathname: '/manual/',
                        }} />,
            }} />
        </p>
      </Card.Footer>

    </Card>
  </>
}