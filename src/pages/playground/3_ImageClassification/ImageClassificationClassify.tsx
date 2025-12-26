import React, { useEffect, useState } from 'react'
import { Button, Card, Col, Row } from 'react-bootstrap'
import CustomCanvasDrawer from '@pages/playground/3_ImageClassification/components/customCanvasDrawer'
import { Trans } from 'react-i18next'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import { VERBOSE } from '@/CONSTANTS'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import type { DropEvent, FileRejection } from 'react-dropzone'

/**
 * @typedef ImageClassificationClassifyProps_t
 * @property {Function} GeneratedModels
 * @property {(canvas: HTMLCanvasElement | null, context: CanvasRenderingContext2D | null) => void | Promise<void>} handleSubmit_VectorTest
 * @property {(canvas: HTMLCanvasElement | null, context: CanvasRenderingContext2D | null) => void | Promise<void>} handleSubmit_VectorTestImageUpload
 */
type ImageClassificationClassifyProps_t = {
  GeneratedModels?                  : any[],
  handleSubmit_VectorTest           : (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, canvas_small: HTMLCanvasElement) => void | Promise<void>,
  handleSubmit_VectorTestImageUpload: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, canvas_small: HTMLCanvasElement) => void | Promise<void>,
}

/**
 * 
 * @param {ImageClassificationClassifyProps_t} props 
 * @returns 
 */
export default function ImageClassificationClassify(props: ImageClassificationClassifyProps_t) {
  const {
    handleSubmit_VectorTest,
    handleSubmit_VectorTestImageUpload,
    GeneratedModels = [],
  } = props

  const canvas_image_ref = React.useRef<HTMLCanvasElement | null>(null)
  const canvas_image_28x28_ref = React.useRef<HTMLCanvasElement | null>(null)

  const [showComponent, setShowComponent] = useState(false)

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[GeneratedModels]')
    if (GeneratedModels.length > 0) {
      setShowComponent(true) // eslint-disable-line
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
              <CustomCanvasDrawer
                submitFunction={handleSubmit_VectorTest}
                clearFunction={() => {
                }}
              />
            </Col>
          </Row>
          <Row className="mt-4" style={{display: 'none'}}>
            <Col>
              <DragAndDrop
                name="image-upload-dropzone"
                id="image-upload-dropzone"
                accept={{ 'image/*': [] }}
                text={'Drag and drop an image here, or click to select an image'}
                function_DropRejected={(rejectedFiles: FileRejection[], event: DropEvent) => {
                  console.error('Rejected files:', rejectedFiles, event)
                }}
                function_DropAccepted={(acceptedFiles: File[], _event: DropEvent) => {
                  if (canvas_image_ref.current === null || canvas_image_28x28_ref.current === null) {
                    console.error('canvas_image_ref or canvas_image_28x28_ref is null')
                    return
                  }
                  const file = acceptedFiles[0]
                  const img = new Image()
                  img.onload = () => {
                    const ctx = canvas_image_ref.current!.getContext('2d')
                    if (ctx) {
                      ctx.clearRect(0, 0, canvas_image_ref.current!.width, canvas_image_ref.current!.height)
                      ctx.drawImage(img, 0, 0, canvas_image_ref.current!.width, canvas_image_ref.current!.height)
                    }

                    const ctx28 = canvas_image_28x28_ref.current!.getContext('2d')
                    if (ctx28) {
                      ctx28.clearRect(0, 0, canvas_image_28x28_ref.current!.width, canvas_image_28x28_ref.current!.height)
                      ctx28.drawImage(img, 0, 0, canvas_image_28x28_ref.current!.width, canvas_image_28x28_ref.current!.height)
                    }
                  }
                  img.src = URL.createObjectURL(file)
                }}
              />
            </Col>
          </Row>
          <Row style={{display: 'none'}}>
            <Col className={'d-flex justify-content-center'}>
              <canvas
                ref={canvas_image_ref}
                id="ImageClassificationClassify-CanvasImage"
                height="100"
                width="100"
                className={'nets4-border-1'}></canvas>
            </Col>
            <Col className={'d-flex justify-content-center'}>
              <canvas
                ref={canvas_image_28x28_ref}
                id="ImageClassificationClassify-CanvasImage-28x28"
                width="28"
                height="28"
                className={'nets4-border-1'}></canvas>
            </Col>
          </Row>
          <Row style={{display: 'none'}}>
            <Col>
              <div className="d-grid gap-2 mt-3">
                <Button
                  variant={'primary'}
                  onClick={() => {
                    console.log('Validate Image Upload')
                    const canvas = canvas_image_ref.current
                    const canvas_small = canvas_image_28x28_ref.current
                    if (canvas === null || canvas_small === null) {
                      console.error('Canvas, context, or small canvas is null')
                      return
                    }
                    const context = canvas.getContext('2d') as CanvasRenderingContext2D
                    handleSubmit_VectorTestImageUpload(canvas, context, canvas_small)
                  }}>
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
