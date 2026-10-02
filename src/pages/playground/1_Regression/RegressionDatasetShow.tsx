import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { DataFrame } from 'danfojs'

import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import { DEFAULT_SELECTOR_DATASET_INDEX, VERBOSE } from '@/CONSTANTS'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import N4LTablePagination from '@components/table/N4LTablePagination'
import N4LSummary from '@components/summary/N4LSummary'
import N4LDataFrameTable from '@components/dataframe/N4LDataFrameTable'
import N4LDataFrameDescribe from '@components/dataframe/N4LDataFrameDescribe'
import { useRegressionContext } from '@context/useRegressionContext'

const EMPTY_DATAFRAME = new DataFrame()

export default function RegressionDatasetShow() {
  const {
    datasets,
    setDatasets,
  } = useRegressionContext()

  const { t } = useTranslation()

  // i18n
  const prefix = 'pages.playground.generator.dataset.'

  const [showProcessed, setShowProcessed] = useState(false)

  const datasetSelected = datasets.index !== DEFAULT_SELECTOR_DATASET_INDEX && datasets.index >= 0 ? datasets.data[datasets.index] : undefined
  const showDataset = Boolean(datasetSelected?.is_dataset_processed)
  const dataframe = (showProcessed ? datasetSelected?.dataframe_processed : datasetSelected?.dataframe_original) ?? EMPTY_DATAFRAME

  /**
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e 
   */
  const handleChange_DatasetProcessed = (e: ChangeEvent<HTMLInputElement>) => {
    setShowProcessed(e.target.checked)
  }

  /**
   * 
   * @param {React.ChangeEvent<HTMLSelectElement>} e 
   */
  const handleChange_DatasetSelected = async (e: ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value)
    setDatasets((prevState) => {
      return {
        ...prevState,
        data : [...prevState.data],
        index: index
      }
    })
  }


  // Columna que se predice: se resalta en las tablas y en las estadísticas
  const target = datasetSelected?.data_processed?.column_name_target ?? null

  if (VERBOSE) console.debug('render RegressionDatasetShow')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={prefix + 'title'} /></h3>
        <div className={'ms-2 d-flex align-items-center gap-4'}>
          <Form.Check
            type="switch"
            id={'regression-switch-dataframe-processed'}
            reverse={true}
            name={'regression-switch-dataframe-processed'}
            disabled={!showDataset}
            label={t('Processed')}
            value={showProcessed.toString()}
            onChange={(e) => handleChange_DatasetProcessed(e)}
          />
          <Form.Group controlId={'dataset'}>
            <Form.Select
              aria-label={'dataset'}
              size={'sm'}
              value={datasets.index}
              disabled={!showDataset}
              onChange={(e) => handleChange_DatasetSelected(e)}
            >
              <option value={-1} disabled={true}>Select Dataset</option>
              {datasets.data
                .map(({ csv }, index) => {
                  return <option key={'option_' + index} value={index}>{csv}</option>
                })}
            </Form.Select>
          </Form.Group>
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
          <Row>
            <Col>
              {datasets.data.length >= 1 && datasets.index !== DEFAULT_SELECTOR_DATASET_INDEX && datasets.index >= 0 && !datasets.data[datasets.index].is_dataset_upload && <>
                {/* TEXTO DEL DATASET car.info */}
                <N4LSummary
                  title={<Trans i18nKey={prefix + 'details.info'} />}
                  info={datasets.data[datasets.index].container_info} />
              </>}
              <N4LSummary
                title={<Trans i18nKey={prefix + 'details.dataframe-processed'} />}
                info={datasetSelected && <N4LDataFrameTable dataframe={datasetSelected.dataframe_processed} target={target} subtitles={'dtype'} />} />
              <N4LSummary title={<Trans i18nKey={prefix + 'details.description-processed'} />}
                info={datasetSelected && <N4LDataFrameDescribe dataframe={datasetSelected.dataframe_processed} target={target} />} />
            </Col>
          </Row>
        </>}

        {/*<N4LSummary title={<Trans i18nKey={prefix + "details.histogram-processed"} />} info={<DataFrameHistogram dataframe={datasetLocal.dataframe_processed} />} />*/}
        {/*<N4LSummary title={<Trans i18nKey={prefix + "details.violin-processed"} />} info={<DataFrameViolin dataframe={datasetLocal.dataframe_processed} />} />*/}
        {/*<N4LSummary title={<Trans i18nKey={prefix + "details.box-processed"} />} info={<DataFrameBox dataframe={datasetLocal.dataframe_processed} />} />*/}

      </Card.Body>
    </Card>
  </>
}