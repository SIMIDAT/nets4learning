import React from 'react'
import { Trans } from 'react-i18next'
import { Card, Col } from 'react-bootstrap'
import { DEFAULT_BAR_DATA } from '@pages/playground/3_ImageClassification/CONSTANTS'
import CustomCanvasDrawer from '@pages/playground/3_ImageClassification/components/customCanvasDrawer'

export default function ModelReviewImageClassificationMNIST (props) {
  const {
    iModelRef,
    iModelRef_model,
    iChartRef_image,
    setBarDataImage
  } = props

  const handleCanvasDraw_Clear = async () => {
    const originalImage_canvas = document.getElementById('originalImage')
    const originalImage_canvas_ctx = originalImage_canvas.getContext('2d', { willReadFrequently: true })
    originalImage_canvas_ctx.clearRect(0, 0, originalImage_canvas.width, originalImage_canvas.height)
  }

  const handleCanvasDraw_Submit = async (draw_canvas) => {
    const canvas = document.getElementById('originalImage')
    const canvas_ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas_ctx.drawImage(draw_canvas, 0, 0, canvas.width, canvas.height)
    canvas_ctx.drawImage(draw_canvas, 10, 10, 28, 28)
    const imageData = canvas_ctx.getImageData(10, 10, 28, 28)
    const { predictions } = await iModelRef.current.CLASSIFY(iModelRef_model.current, imageData)

    updatePredictionMNIST(predictions)
  }

  const updatePredictionMNIST = (predictions) => {
    setBarDataImage(() => {
      return {
        labels  : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        datasets: [{
          label          : 'MNIST',
          data           : predictions,
          backgroundColor: DEFAULT_BAR_DATA.datasets[0].backgroundColor,
          borderColor    : DEFAULT_BAR_DATA.datasets[0].borderColor,
          borderWidth    : DEFAULT_BAR_DATA.datasets[0].borderWidth,
        }],
      }
    })
    iChartRef_image.current.update()
  }

  return <>
    <Col className={'d-grid'}
         xs={12} sm={12} md={6} xl={6} xxl={6}>
      <Card className={'mt-3'}>
        <Card.Header>
          <h3><Trans i18nKey={'datasets-models.3-image-classifier.interface.process-draw.title'}/></h3>
        </Card.Header>
        <Card.Body>
          <CustomCanvasDrawer
            submitFunction={async (canvas, canvas_ctx) => {
              await handleCanvasDraw_Clear()
              await handleCanvasDraw_Submit(canvas, canvas_ctx)
            }}
            clearFunction={async () => {
              await handleCanvasDraw_Clear()
            }}/>
        </Card.Body>
      </Card>
    </Col>
  </>
}
