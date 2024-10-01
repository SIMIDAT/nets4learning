import React from 'react'
import { useParams } from 'react-router'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'

import TestComponentAdvanced from '@components/TestComponentAdvanced'
import alertHelper from '@/utils/alertHelper'
import DragAndDrop from '@/components/dragAndDrop/DragAndDrop'
import { VERBOSE } from '@/CONSTANTS'


export default function TestPageAdvanced () {

  const { id, option, example } = useParams()
  const { t } = useTranslation()

  const handleChange_FileUpload_CSV = async (files, _event) => {
    try {
      if (files.length < 1) {
        console.error(t('error.load-json-csv'))
        return
      }
      const file = new File([files[0]], files[0].name, { type: files[0].type })
      const _dataframeOriginal = await dfd.readJSON(file)
      const _dataframeProcessed = await dfd.readJSON(file)

      console.log({ _dataframeOriginal, _dataframeProcessed})

      await alertHelper.alertSuccess(t('alert.file-upload-success'))
    } catch (error) {
      console.error(error)
    }
  }

  const handleClick_testDataFrame = () => {
    const df = new dfd.DataFrame({'date': [new Date()]})
    console.log({df})
  }

  const handleChange_FileUpload_CSV_reject = (files, _event) => {
    if (VERBOSE) console.debug({ files })
  }

  
  return <>
    <Container className={'mt-3'}>
      <Row>
        <Col>

          <Card>
            <Card.Header><h2>TestPage-Advanced</h2></Card.Header>
            <Card.Body>
              <p><span data-testid={'Test-TestPageAdvanced-id'}>{id}</span></p>
              <p><span data-testid={'Test-TestPageAdvanced-option'}>{option}</span></p>
              <p><span data-testid={'Test-TestPageAdvanced-example'}>{example}</span></p>
              <Button onClick={handleClick_testDataFrame}>DataFrame</Button>

              <TestComponentAdvanced />

              <hr />

              <DragAndDrop id={'drop-zone-regression-dataset'}
                   name={'csv'}
                   accept={{ 'text/csv': ['.csv'], 'text/json': ['.json'] }}
                   text={t('drag-and-drop.csv')}
                   labelFiles={t('drag-and-drop.label-files-one')}
                   function_DropAccepted={handleChange_FileUpload_CSV}
                   function_DropRejected={handleChange_FileUpload_CSV_reject} />

            </Card.Body>
          </Card>

        </Col>
      </Row>
    </Container>
  </>
}
