import React, { useState } from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'

import AlertHelper from '@utils/alertHelper'

import WaitingCircle from '@components/loading/WaitingCircle'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'

import { DataFramePlotProvider } from '@components/_context/DataFramePlotContext'
import DataFramePlot from '@components/dataframe/DataFramePlot'
import DataFrameCorrelationMatrixCard from '@components/dataframe/DataFrameCorrelationMatrixCard'
import DataFrameDescribeCard from '@components/dataframe/DataFrameDescribeCard'
import DataFrameQueryCard from '@components/dataframe/DataFrameQueryCard'
import { VERBOSE } from '@/CONSTANTS'

export default function AnalyzeDataFrame () {
  const prefix = 'pages.dataframe.'
  const { t } = useTranslation()

  const [dataframe, setDataFrame] = useState(new dfd.DataFrame())
  const [waiting, setWaiting] = useState(true)

  const handleFileUpload_CSV_Accepted = async (files) => {
    const file_dataframe = new File([files[0]], files[0].name, { type: files[0].type })
    try {
      setWaiting(true)
      const data = await dfd.readCSV(file_dataframe)
      setDataFrame(data)
      await AlertHelper.alertSuccess(t('success.file-upload'))
    } catch (error) {
      console.error(error)
      await AlertHelper.alertError(t('error.parsing-csv'))
    } finally {
      setWaiting(false)
    }
  }

  const handleFileUpload_CSV_Rejected = async (files, event) => {
    console.error({ files, event })
    await AlertHelper.alertError(t('error.file-not-valid', { title: 'Error' }))
  }

  if (VERBOSE) console.debug('render DataFrame')
  return <>
    <main className={'mb-3'} data-title={'DataFrame'}>
      <Container>
        <Row className={"mt-3"}>
          <Col>
            <h1><Trans i18nKey={prefix + 'title'} /></h1>
          </Col>
        </Row>
        <Row className={"mt-3"}>
          <Col>
            <Card>
              <Card.Header><h3><Trans i18nKey={prefix + 'upload-csv'} /></h3></Card.Header>
              <Card.Body>
                <DragAndDrop name={'csv'}
                             id={'dataset-upload'}
                             accept={{ 'text/csv': ['.csv'] }}
                             text={t('drag-and-drop.csv')}
                             labelFiles={t('drag-and-drop.label-files-one')}
                             function_DropAccepted={handleFileUpload_CSV_Accepted}
                             function_DropRejected={handleFileUpload_CSV_Rejected}
                />

                {waiting && dataframe.columns.length !== 0 &&
                  <Row>
                    <Col>
                      <div className={'d-flex justify-content-center'}>
                        <WaitingCircle />
                      </div>
                    </Col>
                  </Row>
                }
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className={'mt-3'}>
          <Col>
            <DataFrameDescribeCard dataframe={dataframe} />
          </Col>
        </Row>

        <Row className={'mt-3'}>
          <Col>
            <DataFramePlotProvider>
              <DataFramePlot dataframe={dataframe} />
            </DataFramePlotProvider>
          </Col>
        </Row>

        <Row className={'mt-3'}>
          <Col>
            <DataFrameCorrelationMatrixCard dataframe={dataframe} />
          </Col>
        </Row>

        <Row className={'mt-3'}>
          <Col>
            <DataFrameQueryCard dataframe={dataframe} />
          </Col>
        </Row>
      </Container>
    </main>
  </>

}