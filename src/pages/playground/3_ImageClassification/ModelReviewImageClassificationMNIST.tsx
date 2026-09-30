import { Trans } from 'react-i18next'
import { Card, Col } from 'react-bootstrap'
import { DEFAULT_BAR_DATA } from '@pages/playground/3_ImageClassification/CONSTANTS'
import CustomCanvasDrawer from '@pages/playground/3_ImageClassification/components/customCanvasDrawer'
import { toImageData } from '@pages/playground/3_ImageClassification/utils/utils'
import type * as tfjs from '@tensorflow/tfjs'
import type I_MODEL_IMAGE_CLASSIFICATION from './models/_model'

type Props = {
  iModelInstance   : I_MODEL_IMAGE_CLASSIFICATION | null,
  model            : tfjs.LayersModel | null,
  iChartRef_image  : React.RefObject<any>,
  setBarDataImage  : React.Dispatch<React.SetStateAction<any>>,
  /** Canvas de resultado donde se muestra el dígito dibujado. */
  canvasResultRef  : React.RefObject<HTMLCanvasElement | null>,
  onImageDataReady?: (imageData: ImageData) => void,
  onResetExplain?  : () => void,
}
export default function ModelReviewImageClassificationMNIST (props: Props) {
  const {
    iModelInstance,
    model,
    iChartRef_image,
    setBarDataImage,
    canvasResultRef,
    onImageDataReady,
    onResetExplain
  } = props

  const handleCanvasDraw_Clear = async () => {
    const canvas = canvasResultRef.current
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleCanvasDraw_Submit = async (draw_canvas: HTMLCanvasElement, _draw_canvas_ctx: CanvasRenderingContext2D, canvas_small?: HTMLCanvasElement) => {
    // Mostramos el dibujo en el canvas de resultado y reducimos a 28×28 en un canvas aparte:
    // antes la miniatura se pintaba encima del dibujo grande y se leían los dos mezclados.
    const canvas = canvasResultRef.current
    canvas?.getContext('2d')?.drawImage(draw_canvas, 0, 0, canvas.width, canvas.height)
    const imageData = toImageData(draw_canvas, 28, 28)
    // Miniatura 28×28: lo que realmente recibe el modelo (CustomCanvasDrawer la deja vacía si no se pinta aquí).
    canvas_small?.getContext('2d')?.putImageData(imageData, 0, 0)
    if (iModelInstance === null) return
    const { predictions } = await iModelInstance.CLASSIFY(model, imageData)

    updatePredictionMNIST(predictions)

    // Notificamos la imagen dibujada al padre para la explicabilidad
    if (typeof onImageDataReady === 'function') {
      onImageDataReady(imageData)
    }
  }

  const updatePredictionMNIST = (predictions: number[]) => {
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
            submitFunction={async (canvas: HTMLCanvasElement | null, canvas_ctx: CanvasRenderingContext2D | null, canvas_small: HTMLCanvasElement | null) => {
              if (canvas === null || canvas_ctx === null) {
                console.error("canvas or canvas_ctx is null")
                return
              }
              await handleCanvasDraw_Clear()
              await handleCanvasDraw_Submit(canvas, canvas_ctx, canvas_small ?? undefined)
            }}
            clearFunction={async () => {
              await handleCanvasDraw_Clear()
              onResetExplain?.()
            }}
            onDrawStart={() => onResetExplain?.()}/>
        </Card.Body>
      </Card>
    </Col>
  </>
}
