import { useEffect, useRef, useState } from 'react'
import { Button } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import { UTILS_image } from '@pages/playground/3_ImageClassification/utils/utils'

const PREVIEW_SIZE = 200

type ImagePickerProps = {
  /** Imagen elegida del conjunto de prueba (la entrada exacta del modelo): se enseña ampliada */
  image     : ImageData | null
  /** Clasificar lo que se ve: la imagen subida (o la del conjunto) en el canvas de la vista previa */
  onClassify: (canvas: HTMLCanvasElement) => void | Promise<void>
  /** Al subir una imagen (deja de ser la del conjunto) */
  onUpload? : () => void
}

/**
 * En lugar del lienzo de dibujo, para las imágenes en color (CIFAR-10…): una vista previa con la imagen elegida del
 * conjunto o una subida, que se clasifica con el botón
 */
export default function ImagePicker({ image, onClassify, onUpload }: ImagePickerProps) {
  const { t } = useTranslation()
  const prefix = 'datasets-models.3-image-classifier.interface.'
  const canvas_ref = useRef<HTMLCanvasElement>(null)
  const [hasImage, setHasImage] = useState(false)

  // Una imagen del conjunto: ampliada sin suavizar (se ven sus píxeles, como los ve la red)
  useEffect(() => {
    const canvas = canvas_ref.current
    if (canvas === null || image === null) return
    const small = document.createElement('canvas')
    small.width = image.width
    small.height = image.height
    small.getContext('2d')?.putImageData(image, 0, 0)
    canvas.width = PREVIEW_SIZE
    canvas.height = PREVIEW_SIZE
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    context.imageSmoothingEnabled = false
    context.drawImage(small, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE)
    setHasImage(true)
  }, [image])

  const handleDrop = (files: File[]) => {
    const canvas = canvas_ref.current
    if (files.length === 0 || canvas === null) return
    onUpload?.()
    const picture = new Image()
    picture.onload = () => {
      UTILS_image.drawImageInCanvasWithContainer(picture, canvas)
      setHasImage(true)
      URL.revokeObjectURL(picture.src)
    }
    picture.src = URL.createObjectURL(files[0])
  }

  return (
    <div className={'d-grid gap-3'} data-testid={'Test-ImagePicker'}>
      <div className={'d-flex justify-content-center'}>
        <canvas ref={canvas_ref} width={PREVIEW_SIZE} height={PREVIEW_SIZE} className={'nets4-border-1'}
          style={{ imageRendering: 'pixelated', maxWidth: '100%' }} aria-label={t(prefix + 'process-image.title')} />
      </div>
      <DragAndDrop id={'drop-zone-image-train'} name={'image'} text={t('drag-and-drop.image')} labelFiles={t('drag-and-drop.label-files-one')}
        accept={{ 'image/png': ['.png'], 'image/jpg': ['.jpg', '.jpeg'] }} function_DropAccepted={handleDrop} />
      <div className={'d-flex justify-content-center'}>
        <Button variant={'primary'} disabled={!hasImage} onClick={() => canvas_ref.current !== null && onClassify(canvas_ref.current)}
          data-testid={'Test-ImagePicker-Classify'}>
          <Trans i18nKey={prefix + 'process-image.validate'} />
        </Button>
      </div>
    </div>
  )
}
