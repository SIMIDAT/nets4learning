import React, { useEffect, useId, useState } from 'react'
import { Link } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'
import { Card, Col, Form, Row } from 'react-bootstrap'
import * as dfd from 'danfojs'

import * as _Types from '@core/types'
import { VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'
import { TABLE_PLOT_STYLE_CONFIG } from '@/CONSTANTS_DanfoJS'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'

import N4LSummary from '@components/summary/N4LSummary'
import N4LTablePagination from '@components/table/N4LTablePagination'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

import TabularClassificationDatasetShowInfo from '@pages/playground/0_TabularClassification/TabularClassificationDatasetShowInfo'
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'

/**
 * @typedef {object} PropsTabularClassificationDatasetShow
 * @property {Array<DatasetProcessed_t>} datasets
 * @property {number} datasetIndex
 */


const EMPTY_DATAFRAME = new dfd.DataFrame()

/**
 * 
 * @param {TabularClassificationDatasetShowProps} props 
 * @returns 
 */
export default function TabularClassificationDatasetShow() {
    const { datasets } = useTabularClassificationContext()
  const prefix = 'pages.playground.generator.dataset.'
  const { t } = useTranslation()
  const dataframe_original_plotID = useId()
  const dataframe_processed_plotID = useId()

  const [showProcessed, setShowProcessed] = useState(false)

  const datasetSelected = datasets.index >= 0 ? datasets.datasets[datasets.index] : undefined
  const showDataset = Boolean(datasetSelected?.is_dataset_processed)
  const dataframe = (showProcessed ? datasetSelected?.dataframe_processed : datasetSelected?.dataframe_original) ?? EMPTY_DATAFRAME

  const handleChange_Dataset = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowProcessed(e.target.checked)
  }

  useEffect(() => {

    /**
     * @param {_Types.DatasetProcessed_t} _datasetSelected 
     */
    const _updateDataFrameDescribe = (_datasetSelected: _Types.DatasetProcessed_t) => {
      const options = { config: TABLE_PLOT_STYLE_CONFIG, emptyText: t('dataframe.describe.no-numeric') }
      DataFrameUtils.DataFrameDescribePlot(_datasetSelected.dataframe_original, dataframe_original_plotID, options)
      DataFrameUtils.DataFrameDescribePlot(_datasetSelected.dataframe_processed, dataframe_processed_plotID, options)
    }
    const currentDataset = datasets?.datasets?.[datasets.index];

    // Guard: Ensure data is ready AND the DOM element exists
    const originalEl = document.getElementById(dataframe_original_plotID);
    const processedEl = document.getElementById(dataframe_processed_plotID);

    if (showDataset && currentDataset && originalEl && processedEl) {
      _updateDataFrameDescribe(currentDataset);
    }
  }, [showDataset, datasets, dataframe_original_plotID, dataframe_processed_plotID, t])

  if (VERBOSE) console.debug('render TabularClassificationDatasetShow')
  return <>
    <Card className={'mt-3'}>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={prefix + 'title'} /></h3>
        <div className={'ms-2 d-flex align-items-center gap-4'}>
          <Form.Check
            type="switch"
            id={'tabular-classification-switch-dataframe-processed'}
            reverse={true}
            // size={'sm'}
            name={'tabular-classification-switch-dataframe-processed'}
            disabled={!showDataset}
            label={t('Processed')}
            value={showProcessed.toString()}
            onChange={handleChange_Dataset}
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
          />
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