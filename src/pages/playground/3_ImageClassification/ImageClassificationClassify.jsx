import React, { useEffect, useState } from 'react'
import { Button, Card, Col, Row } from 'react-bootstrap'
import CustomCanvasDrawer from '@pages/playground/3_ImageClassification/components/customCanvasDrawer'
import { Trans } from 'react-i18next'
import WaitingPlaceholder from '@/components/loading/WaitingPlaceholder'
import { VERBOSE } from '@/CONSTANTS'

/**
 * @typedef ImageClassificationClassifyProps_t
 * @property {Function} GeneratedModels
 * @property {Function} handleSubmit_VectorTest
 * @property {React.ChangeEventHandler<HTMLInputElement>} handleChange_FileUpload
 * @property {React.MouseEventHandler<HTMLButtonElement>} handleSubmit_VectorTestImageUpload
 */

/**
 * 
 * @param {ImageClassificationClassifyProps_t} props 
 * @returns 
 */
export default function ImageClassificationClassify (props) {
  const {
    handleSubmit_VectorTest,
    handleChange_FileUpload,
    handleSubmit_VectorTestImageUpload,
    GeneratedModels = [],
  } = props

  const [showComponent, setShowComponent] = useState(false)
  
  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[GeneratedModels]')
    if (GeneratedModels.length > 0) {
      setShowComponent(true)
    }
  }, [GeneratedModels.length])

  return <>
    <Card className="mt-3">
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <Trans i18nKey={'Classify'} />
      </Card.Header>
      <Card.Body>
        {!showComponent && <>
            <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-training'} />
          </>}
        {showComponent && <>
          <Row>
            <Col>
              <CustomCanvasDrawer submitFunction={handleSubmit_VectorTest}
                                  clearFunction={() => {
                                  }}
              />
            </Col>
          </Row>
          <Row style={{ display: 'none' }}>
            <Col>
              <input style={{ marginBottom: '2rem' }}
                    type="file"
                    name="doc"
                    onChange={handleChange_FileUpload} />

              <Row>
                <Col className={'d-flex justify-content-center'}>
                  <canvas id="imageCanvas"
                          height="100"
                          width="100"
                          className={'nets4-border-1'}></canvas>
                </Col>
                <Col className={'d-flex justify-content-center'}>
                  <canvas id="smallcanvas"
                          width="28"
                          height="28"
                          className={'nets4-border-1'}></canvas>
                </Col>
              </Row>

              <div className="d-grid gap-2 mt-3">
                <Button variant={'primary'}
                        onClick={handleSubmit_VectorTestImageUpload}>
                  <Trans i18nKey={'Validate'} />
                </Button>
              </div>
            </Col>
          </Row>
        </>}

      </Card.Body>
    </Card>
  </>
}
