import React, { lazy, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Card, Col, Form, Row } from 'react-bootstrap'
import * as dfd from 'danfojs'

import { VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'

import N4LSummary from '@components/summary/N4LSummary'
import N4LTablePagination from '@components/table/N4LTablePagination'
import N4LEmptyState from '@components/loading/N4LEmptyState'

import TabularClassificationDatasetShowInfo from '@pages/playground/0_TabularClassification/TabularClassificationDatasetShowInfo'
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'
import N4LHelpLink from '@components/helpLink/N4LHelpLink'

// Tablas de Plotly dentro de apartados plegados: se descargan (1,1 MB) al abrirlos, no con la página
const N4LDataFrameDescribe = lazy(() => import('@components/dataframe/N4LDataFrameDescribe'))

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
  const [showProcessed, setShowProcessed] = useState(false)

  const datasetSelected = datasets.index >= 0 ? datasets.datasets[datasets.index] : undefined
  const showDataset = Boolean(datasetSelected?.is_dataset_processed)
  const dataframe = (showProcessed ? datasetSelected?.dataframe_processed : datasetSelected?.dataframe_original) ?? EMPTY_DATAFRAME

  const handleChange_Dataset = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowProcessed(e.target.checked)
  }

  // Columna que se clasifica: se resalta en la tabla y en las estadísticas
  const target = datasetSelected?.data_processed?.column_name_target ?? null

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
          <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-process'} />
        </>}
        {showDataset && <>
          <Row>
            <Col className={'overflow-x-auto'}>
              <N4LTablePagination
                data_head={dataframe.columns}
                data_body={DataFrameUtils.DataFrameIterRows(dataframe)}
                highlight_column={target === null ? -1 : dataframe.columns.indexOf(target)} />
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
                info={datasetSelected && <N4LDataFrameDescribe dataframe={datasetSelected.dataframe_original} target={target} />} />
              <N4LSummary
                title={<Trans i18nKey={prefix + 'details.description-processed'} />}
                info={datasetSelected && <N4LDataFrameDescribe dataframe={datasetSelected.dataframe_processed} target={target} />} />
            </Col>
          </Row>
        </>}
      </Card.Body>
      <Card.Footer className={'text-end'}>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans
            i18nKey={'more-information-in-link'}
            components={{
              link1: <N4LHelpLink page={'glossary'} action={GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_2_DATASET} />,
            }} />
        </p>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans
            i18nKey={'more-information-in-tutorial'}
            components={{
              link1: <N4LHelpLink page={'manual'} action={MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_2_DATASET} />,
            }} />
        </p>
      </Card.Footer>

    </Card>
  </>
}