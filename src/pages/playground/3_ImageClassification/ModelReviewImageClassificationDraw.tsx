import { Trans } from 'react-i18next'
import { Card, Col } from 'react-bootstrap'
import CustomCanvasDrawer from '@pages/playground/3_ImageClassification/components/customCanvasDrawer'
import { toImageData } from '@pages/playground/3_ImageClassification/utils/utils'

type Props = {
  /** Canvas del resultado, donde se muestra el dibujo clasificado (y la base del mapa de calor) */
  canvasResultRef: React.RefObject<HTMLCanvasElement | null>,
  /** Recibe la entrada del modelo (28×28) para clasificarla */
  onClassify     : (imageData: ImageData) => void | Promise<void>,
  onResetExplain?: () => void,
}

/** Lienzo para dibujar la entrada de los modelos de 28x28 en escala de grises (MNIST, KMNIST). */
export default function ModelReviewImageClassificationDraw ({ canvasResultRef, onClassify, onResetExplain }: Props) {

  const handleCanvasDraw_Submit = async (draw_canvas: HTMLCanvasElement, canvas_small: HTMLCanvasElement | null) => {
    // El dibujo se muestra en el canvas del resultado (cuadrado, como el lienzo) y se reduce a 28×28 en un canvas
    // aparte: antes la miniatura se pintaba encima del dibujo grande y se leían los dos mezclados.
    const canvas = canvasResultRef.current
    if (canvas !== null) {
      canvas.width = 200
      canvas.height = 200
      canvas.getContext('2d')?.drawImage(draw_canvas, 0, 0, canvas.width, canvas.height)
    }
    const imageData = toImageData(draw_canvas, 28, 28)
    // Miniatura 28×28: lo que realmente recibe el modelo (CustomCanvasDrawer la deja vacía si no se pinta aquí).
    canvas_small?.getContext('2d')?.putImageData(imageData, 0, 0)
    await onClassify(imageData)
  }

  return <>
    <Col className={'d-grid'} xs={12} md={6}>
      <Card className={'mt-3'}>
        <Card.Header>
          <h3><Trans i18nKey={'datasets-models.3-image-classifier.interface.process-draw.title'}/></h3>
        </Card.Header>
        <Card.Body>
          <CustomCanvasDrawer
            submitFunction={async (canvas: HTMLCanvasElement | null, canvas_ctx: CanvasRenderingContext2D | null, canvas_small: HTMLCanvasElement | null) => {
              if (canvas === null || canvas_ctx === null) {
                console.error('canvas or canvas_ctx is null')
                return
              }
              await handleCanvasDraw_Submit(canvas, canvas_small)
            }}
            clearFunction={() => onResetExplain?.()}
            onDrawStart={() => onResetExplain?.()}/>
        </Card.Body>
      </Card>
    </Col>
  </>
}
