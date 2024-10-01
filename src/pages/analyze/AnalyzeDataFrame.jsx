import React, { useState } from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'

import AlertHelper from '@utils/alertHelper'

import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import WaitingPlaceholder from '@/components/loading/WaitingPlaceholder'

import { DataFramePlotProvider } from '@components/_context/DataFramePlotContext'
import PreProcessDataFrameCard from '@components/dataframe/PreProcessDataFrameCard'
// import DataFrameEchartCard from '@components/dataframe/DataFrameEchartCard'
import DataFramePlot from '@components/dataframe/DataFramePlot'
import DataFrameCorrelationMatrixCard from '@components/dataframe/DataFrameCorrelationMatrixCard'
import DataFrameShowCard from '@components/dataframe/DataFrameShowCard'
import DataFrameDescribeCard from '@components/dataframe/DataFrameDescribeCard'
import DataFrameQueryCard from '@components/dataframe/DataFrameQueryCard'
import { VERBOSE } from '@/CONSTANTS'

export default function AnalyzeDataFrame() {
  const prefix = 'pages.dataframe.'
  const { t } = useTranslation()

  const [dataFrameOriginal, setDataFrameOriginal] = useState(new dfd.DataFrame())
  const [dataFrameProcessed, setDataFrameProcessed] = useState(new dfd.DataFrame())
  const [isDataFrameProcessed, setIsDataFrameProcessed] = useState(false)
  const [isDataFrameUpload, setIsDataFrameUpload] = useState(false)

  const handleFileUpload_CSV_Accepted = async (files) => {
    const file_dataframe = new File([files[0]], files[0].name, { type: files[0].type })
    try {
      let _dataframe = await dfd.readCSV(file_dataframe)
      setDataFrameOriginal(_dataframe)
      setIsDataFrameUpload(true)
      await AlertHelper.alertSuccess(t('success.file-upload'))
    } catch (error) {
      console.error(error)
      await AlertHelper.alertError(t('error.parsing-csv'))
      setIsDataFrameUpload(false)
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
        <Row className={'mt-3'}>
          <Col>
            <h1><Trans i18nKey={prefix + 'title'} /></h1>
          </Col>
        </Row>

        <Row className={'mt-3'}>
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
                {!isDataFrameUpload && <>
                  <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-file'} />
                </>}  
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className={'mt-3'}>
          <Col>
            <PreProcessDataFrameCard 
              isDataFrameUpload={isDataFrameUpload}

              dataFrameOriginal={dataFrameOriginal} 
              setDataFrameOriginal={setDataFrameOriginal}
              dataFrameProcessed={dataFrameProcessed} 
              setDataFrameProcessed={setDataFrameProcessed} 
              isDataFrameProcessed={isDataFrameProcessed}
              setIsDataFrameProcessed={setIsDataFrameProcessed} />
          </Col>
        </Row>

        <Row className={'mt-3'}>
          <Col>
            <DataFrameShowCard 
              dataframe={dataFrameProcessed}
              isDataFrameProcessed={isDataFrameProcessed} />
          </Col>
        </Row>

        <Row className={'mt-3'}>
          <Col>
            <DataFrameDescribeCard
              dataframe={dataFrameProcessed}
              isDataFrameProcessed={isDataFrameProcessed} />
          </Col>
        </Row>

        <Row className={'mt-3'}>
          <Col>
            <DataFramePlotProvider>
              <DataFramePlot
                dataframe={dataFrameProcessed} 
                isDataFrameProcessed={isDataFrameProcessed} />
            </DataFramePlotProvider>
          </Col>
        </Row>

        {/*
        <Row className={'mt-3'}>
          <Col>
            <DataFrameEchartCard 
              dataframe={dataFrameProcessed}
              isDataFrameProcessed={isDataFrameProcessed} />
          </Col>
        </Row>
        */}

        <Row className={'mt-3'}>
          <Col>
            <DataFrameCorrelationMatrixCard
              dataframe={dataFrameProcessed}
              isDataFrameProcessed={isDataFrameProcessed} />
          </Col>
        </Row>

        <Row className={'mt-3'}>
          <Col>
            <DataFrameQueryCard
              dataframe={dataFrameProcessed}
              isDataFrameProcessed={isDataFrameProcessed} />
          </Col>
        </Row>
      </Container>
    </main>
  </>

}