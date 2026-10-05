import React from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import CustomCanvasDrawer from '@pages/playground/3_ImageClassification/components/customCanvasDrawer'
import { Trans, useTranslation } from 'react-i18next'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import type { DropEvent, FileRejection } from 'react-dropzone'
import N4LClassificationChart from '@components/neural-network/N4LClassificationChart'
import N4LVirtualSelect, { type VirtualSelectOption_t } from '@components/select/N4LVirtualSelect'
import type { ImagePrediction_t } from './utils/imagePrediction'
import ImagePicker from './components/ImagePicker'

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
  onResetExplain?                   : () => void,
  /** Al borrar el lienzo */
  onClear?                          : () => void,
  /** Última clasificación (null hasta clasificar un dibujo) */
  prediction?                       : ImagePrediction_t | null,
  classLabels?                      : string[],
  /** Modelo de la tabla con el que se clasifica (desde 0) */
  selectedModelIndex?               : number,
  onChangeModel?                    : (index: number) => void,
  /** Al empezar a dibujar */
  onDrawStart?                      : () => void,
  /** Imágenes de test del dataset que se pueden clasificar (vacío mientras no se ha descargado) */
  instanceOptions?                  : VirtualSelectOption_t[],
  selectedInstance?                 : number | null,
  onChangeInstance?                 : (index: number) => void,
  /** Imagen elegida, que se pinta en el lienzo */
  instanceImage?                    : ImageData | null,
  /** Clase real de la imagen clasificada, si es del dataset */
  actualClassIndex?                 : number | null,
  /** Imágenes en gris: se dibuja en el lienzo. Si no (en color), se sube una imagen o se elige una del conjunto */
  drawable?                         : boolean,
  /** Sin lienzo: clasificar la imagen de la vista previa */
  onClassifyImage?                  : (canvas: HTMLCanvasElement) => void | Promise<void>,
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
    onResetExplain,
    onClear,
    prediction = null,
    classLabels = [],
    selectedModelIndex = GeneratedModels.length - 1,
    onChangeModel,
    onDrawStart,
    instanceOptions = [],
    selectedInstance = null,
    onChangeInstance,
    instanceImage = null,
    actualClassIndex = null,
    drawable = true,
    onClassifyImage,
  } = props
  const prefixForm = 'pages.playground.generator.dynamic-form-dataset.'
  const { t } = useTranslation()

  const canvas_image_ref = React.useRef<HTMLCanvasElement | null>(null)
  const canvas_image_28x28_ref = React.useRef<HTMLCanvasElement | null>(null)

  const showComponent = GeneratedModels.length > 0

  return <>
    <Card className="mt-3">
      <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
        <h3>
          <Trans i18nKey={'Classify'} />
          {showComponent && selectedModelIndex >= 0 &&
            <>{' '}| <Trans i18nKey={'model.__index__'} values={{ index: selectedModelIndex + 1 }} /></>}
        </h3>
        <div className={'d-flex flex-wrap gap-2 n4l-card-header-controls'}>
          {showComponent && onChangeInstance !== undefined && instanceOptions.length > 0 &&
            <div className={'n4l-instance-select'}>
              <N4LVirtualSelect options={instanceOptions}
                value={selectedInstance}
                onChange={onChangeInstance}
                size={'sm'}
                placeholder={t('pages.playground.generator.classify.select-image')}
                searchPlaceholder={t(prefixForm + 'search-entity')}
                noResultsText={t(prefixForm + 'no-entity')}
                countText={(shown, total) => t(prefixForm + 'entity-count', { shown, total })} />
            </div>}
          {showComponent && onChangeModel !== undefined &&
          <Form.Group controlId={'image-classification-model'}>
            <Form.Select aria-label={t('selector-model')}
              size={'sm'}
              value={selectedModelIndex}
              onChange={(e) => onChangeModel(Number(e.target.value))}>
              {GeneratedModels.map((_model, index) => (
                <option key={index} value={index}>{t('model.__index__', { index: index + 1 })}</option>
              ))}
            </Form.Select>
          </Form.Group>}
        </div>
      </Card.Header>
      <Card.Body>
        {!showComponent && <>
          <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-training'} />
        </>}
        {showComponent && <>
          <Row className={'g-4'}>
            <Col lg={5}>
              {drawable
                ? <CustomCanvasDrawer
                  submitFunction={handleSubmit_VectorTest}
                  clearFunction={() => {
                    onResetExplain?.()
                    onClear?.()
                  }}
                  onDrawStart={() => {
                    onResetExplain?.()
                    onDrawStart?.()
                  }}
                  image={instanceImage}
                />
                : <ImagePicker image={instanceImage} onClassify={(canvas) => onClassifyImage?.(canvas)}
                  onUpload={() => {
                    onResetExplain?.()
                    onDrawStart?.()
                  }} />}
            </Col>
            <Col lg={7}>
              {prediction === null
                ? <N4LEmptyState i18nKey={'pages.playground.generator.classify.waiting'} />
                : <N4LClassificationChart values={prediction.values} index={prediction.index} classLabels={classLabels} actualIndex={actualClassIndex} />}
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
