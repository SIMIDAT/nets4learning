import React, { useEffect, useRef, useState } from 'react'
import { Accordion, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'
import * as _Types from '@core/types'
import ReactGA from 'react-ga4'

import I_MODEL_IMAGE_CLASSIFICATION from './models/_model'
import * as ImageClassificationUtils from './utils/utils'

import N4LLayerDesign from '@components/neural-network/N4LLayerDesign'
import N4LJoyride from '@components/joyride/N4LJoyride'
import N4LDivider from '@components/divider/N4LDivider'

import ImageClassificationClassify from '@pages/playground/3_ImageClassification/ImageClassificationClassify'
import { ImageExplainResults, type ImageExplainResult_t } from '@core/explainability/ImageExplainPanel'
import { explainErrorKey } from '@core/explainability/explainError'
import { runImageClassificationExplainLrp, supportsLrp } from '@pages/playground/3_ImageClassification/explainPrediction/runImageClassificationExplain'
import ImageClassificationManual from '@pages/playground/3_ImageClassification/ImageClassificationManual'
import ImageClassificationEditorLayers from '@pages/playground/3_ImageClassification/ImageClassificationEditorLayers'
import ImageClassificationEditorHyperparameters from '@pages/playground/3_ImageClassification/ImageClassificationEditorHyperparameters'
import ImageClassificationTableModels from '@pages/playground/3_ImageClassification/ImageClassificationTableModels'

import alertHelper from '@utils/alertHelper'
import { UPLOAD } from '@/TASKS'
import { VERBOSE } from '@/CONSTANTS'
import {
  DEFAULT_NUMBER_EPOCHS,
  DEFAULT_LEARNING_RATE,
  DEFAULT_ID_OPTIMIZATION,
  DEFAULT_ID_LOSS,
  DEFAULT_ID_METRICS,
  DEFAULT_LAYERS,
  DEFAULT_TEST_SIZE,
} from './CONSTANTS'
import { MAP_IC_CLASSES } from '@pages/playground/3_ImageClassification/models'
import { hasModel, loadModelClass } from '@core/models/modelRegistry'
import { useNavigate } from 'react-router'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'

/**
 * @typedef {Object} ImageClassificationProps_t
 * @property {string} dataset
 */
type ImageClassificationProps_t = {
  dataset: string;
}
/**
 * @param {ImageClassificationProps_t} props
 */
export default function ImageClassification(props: ImageClassificationProps_t) {
  const { dataset } = props
  const { t } = useTranslation()
  const navigate = useNavigate()
  const iModelInstance = useRef(new I_MODEL_IMAGE_CLASSIFICATION(t))

  const prefix = 'pages.playground.generator.'

  // TODO: DEPENDIENDO DEL TIPO QUE SEA SE PRE CARGAN UNOS AJUSTES U OTROS


  const [Layers, setLayers] = useState(DEFAULT_LAYERS)

  const [idOptimizer, setIdOptimizer] = useState<IdOptimizer_t>(DEFAULT_ID_OPTIMIZATION)
  const [idLoss, setIdLoss] = useState<IdLoss_t | IdMetric_t>(DEFAULT_ID_LOSS)
  const [idMetricsList, setIdMetricsList] = useState<(IdLoss_t | IdMetric_t)[]>(DEFAULT_ID_METRICS)

  const [LearningRate, setLearningRate] = useState(DEFAULT_LEARNING_RATE)
  const [NumberEpochs, setNumberEpochs] = useState(DEFAULT_NUMBER_EPOCHS)
  const [TestSize, setTestSize] = useState(DEFAULT_TEST_SIZE)

  const joyrideButton_ref = useRef<any | null>({})
  /**
   * @type {ReturnType<typeof useState<tfjs.Sequential>>}
   */
  const [Model, setModel] = useState<tfjs.Sequential | null>(null)

  // === Explicabilidad (LRP) — en el train solo se ofrece LRP ===
  // Entrada exacta que recibió el modelo (28×28) y la imagen base del mapa de calor.
  const explainInput_ref = useRef<{ imageData: ImageData, imageSrc: string } | null>(null)
  const [hasExplainInput, setHasExplainInput] = useState(false)
  const [explainResult, setExplainResult] = useState<ImageExplainResult_t | null>(null)
  const [showExplain, setShowExplain] = useState(false)
  const [isCalculo, setIsCalculo] = useState(false)

  // Limpia el heatmap previo (al volver a dibujar/escribir un número, o al borrar el lienzo).
  const clearExplainResult = () => {
    setShowExplain(false)
    setExplainResult(null)
  }

  /**
   * @type {ReturnType<typeof useState<Array<_Types.ImageClassificationGeneratedModel_t>>>}
   */
  const [GeneratedModels, setGeneratedModels] = useState<Array<_Types.ImageClassificationGeneratedModel_t>>([])

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: `/ImageClassification/${dataset}`, title: dataset })
  }, [dataset])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init][ dataset, t ]')
    const init = async () => {
      await tfjs.ready()
      if (dataset === UPLOAD) {
        console.error('Error, upload not valid')
      } else if (hasModel(MAP_IC_CLASSES, dataset)) {
        const _iModelClass = await loadModelClass(MAP_IC_CLASSES, dataset)
        iModelInstance.current = new _iModelClass(t)
        setLayers(iModelInstance.current.DEFAULT_LAYERS())
      } else {
        console.error('Error, opción not valid')
        navigate('/404')
      }
    }
    init()
      .then(() => {
        if (VERBOSE) console.debug('End init Image classification')
      })
    return () => { tfvis.visor().close() }
  }, [dataset, navigate, t])

  // region CREACIÓN DEL MODELO
  const handleSubmit_Play = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (Layers[0]._class !== 'conv2d') {
      await alertHelper.alertWarning(t('warning.the-first-layer-need-to-be-__value__', { value: 'conv2d' }))
      return
    }
    try {
      const params = {
        learningRate : LearningRate,
        numberEpochs : NumberEpochs,
        testSize     : TestSize,
        idLoss       : idLoss,
        idOptimizer  : idOptimizer,
        idMetricsList: idMetricsList,
        layers       : Layers,
      }
      const tranin_model = await iModelInstance.current.TRAIN_MODEL(params)
      if (tranin_model === null) {
        await alertHelper.alertError(t('alert.model-train-error'))
        return
      }
      const { model, history } = tranin_model
      setModel(model)
      setGeneratedModels((oldModels: Array<_Types.ImageClassificationGeneratedModel_t>) => {
        const newModel: _Types.ImageClassificationGeneratedModel_t = {
          model  : model,
          history: history,
          params : {
            learning_rate  : LearningRate,
            n_epochs       : NumberEpochs,
            test_size      : TestSize,
            layers         : Layers,
            id_optimizer   : idOptimizer,
            id_loss        : idLoss,
            id_metrics_list: idMetricsList,
          },
        }
        return [
          ...oldModels,
          newModel
        ]
      })
      await alertHelper.alertSuccess(t('alert.model-train-success'))
    } catch (error) {
      console.error(error)
    }
  }
  // endregion

  // region PRUEBA DEL MODELO
  /**
   * Reduce el lienzo a 28×28 (entrada del modelo), muestra esa versión en `canvas_small` como
   * vista previa y predice. Devuelve la ImageData usada, que también es la entrada de LRP.
   */
  const predictDrawing = (canvas: HTMLCanvasElement, canvas_small: HTMLCanvasElement, model: tfjs.Sequential) => {
    const { canvasToImageData, resampleImageData, thresholdImageData, imageDataToMnistTensor4d } = ImageClassificationUtils
    const imgData = thresholdImageData(resampleImageData(canvasToImageData(canvas), 28, 28))
    canvas_small.getContext('2d')?.putImageData(imgData, 0, 0)
    const predictions = Array.from(tfjs.tidy(() => (model.predict(imageDataToMnistTensor4d(imgData)) as tfjs.Tensor).dataSync()))
    return { imgData, index: predictions.indexOf(Math.max(...predictions)) }
  }

  const handleSubmit_VectorTest = async (canvas: HTMLCanvasElement | null, context: CanvasRenderingContext2D | null, canvas_small: HTMLCanvasElement | null) => {
    if (Model === null) {
      await alertHelper.alertWarning('Antes debes de crear y entrenar el modelo.')
      return
    }
    if (canvas === null || canvas_small === null || context === null) {
      console.error('Error, canvas or context is null')
      return
    }

    const { imgData, index: prediction_index } = predictDrawing(canvas, canvas_small, Model)
    setExplainInput(imgData, canvas)
    await alertHelper.alertInfo(t('info.the-class-is-__value__', { value: prediction_index }),
      {
        text  : '',
        footer: '',
        html  : <>¿El número es un {prediction_index}?</>
      })

  }

  const handleSubmit_VectorTestImageUpload = async (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, canvas_small: HTMLCanvasElement) => {
    if (Model === null) {
      await alertHelper.alertWarning(t('warning.need-a-model'))
      return
    }
    if (canvas === null || canvas_small === null || context === null) {
      console.error('Error, canvas or context is null')
      return
    }

    const { imgData, index } = predictDrawing(canvas, canvas_small, Model)

    setExplainInput(imgData, canvas)
    await alertHelper.alertInfo('Resultado de la clasificación', {
      text  : '',
      footer: '',
      html  : <>¿El número es un {index}?</>
    })
  }
  // endregion

  // region EXPLAINABILITY (LRP)
  // Guarda la imagen clasificada (la misma ImageData que recibió el modelo) y descarta la
  // explicación anterior. Se llama tras cada clasificación.
  const setExplainInput = (imageData: ImageData, canvas: HTMLCanvasElement) => {
    explainInput_ref.current = { imageData, imageSrc: canvas.toDataURL() }
    setHasExplainInput(true)
    clearExplainResult()
  }

  const handleRequest_ExplainPrediction = async () => {
    if (showExplain) {
      setShowExplain(false)
      return
    }

    const input = explainInput_ref.current
    if (!input || !Model) {
      await alertHelper.alertInfo(t('info.insert-input'))
      return
    }
    if (!supportsLrp(iModelInstance.current)) {
      await alertHelper.alertError(t('ui.explain.lrp-not-available'))
      return
    }

    setIsCalculo(true)
    try {
      const result = await runImageClassificationExplainLrp({
        iModel       : iModelInstance.current,
        modelInstance: Model,
        imageData    : input.imageData,
      })
      setExplainResult({
        method         : 'lrp',
        values         : result.shapValues,
        labels         : result.selectedLabels,
        galleryImages  : result.debugImages,
        imageSrc       : input.imageSrc,
        segmentationMap: result.segmentationMapArray,
        predictedValues: result.predictedValues,
      })
      setShowExplain(true)
    } catch (error) {
      console.error('Error calculating explainability', { error })
      await alertHelper.alertError(t(explainErrorKey(error)))
    } finally {
      setIsCalculo(false)
    }
  }
  // endregion

  if (VERBOSE) console.debug('render ImageClassification')
  return (
    <>
      <N4LJoyride
        joyrideButton_ref={joyrideButton_ref}
        JOYRIDE_state={iModelInstance.current.JOYRIDE()}
        TASK={'image-classification'}
        KEY={'ImageClassification'}
      />

      {/* MANUAL */}
      <Container>
        <Row className={'mt-3'}>
          <Col xl={12}>
            <div className="d-flex justify-content-between">
              <h1><Trans i18nKey={'modality.3'} /></h1>
              <Button
                size={'sm'}
                variant={'outline-primary'}
                onClick={joyrideButton_ref.current.handleClick_StartJoyride}>
                <Trans i18nKey={'datasets-models.3-image-classification.joyride.title'} />
              </Button>
            </div>
          </Col>
        </Row>

        <N4LDivider i18nKey={'hr.information'} />


        <Row className={'mt-3'}>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            <Accordion>
              <Accordion.Item eventKey={'manual'} className={'joyride-step-1-manual'}>
                <Accordion.Header><h2>Manual</h2></Accordion.Header>
                <Accordion.Body>
                  <ImageClassificationManual />
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey={'description-dataset'} className={'joyride-step-2-dataset-info'}>
                <Accordion.Header>
                  <h3><Trans i18nKey={dataset !== UPLOAD ? iModelInstance.current.TITLE : prefix + 'dataset.upload-dataset'} /></h3>
                </Accordion.Header>
                <Accordion.Body>
                  {iModelInstance.current.DESCRIPTION()}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Col>
        </Row>

        <N4LDivider i18nKey={'hr.model'} />

        {/* EDITOR */}
        <Form onSubmit={handleSubmit_Play} id={'ImageClassification'}>

          <Row className={'mt-3'}>
            <Col xl={12} className={'joyride-step-5-layer'}>
              <N4LLayerDesign layers={Layers} />
            </Col>
          </Row>

          <Row>
            {/* LAYERS */}
            <Col xl={6} className={'mt-3'}>
              <ImageClassificationEditorLayers
                Layers={Layers}
                setLayers={setLayers} />
            </Col>

            {/* GENERAL PARAMETERS */}
            <Col xl={6} className={'mt-3'}>
              <ImageClassificationEditorHyperparameters
                setIdOptimizer={setIdOptimizer}
                setIdLoss={setIdLoss}
                idMetricsList={idMetricsList}
                setIdMetricsList={setIdMetricsList}
                setNumberEpochs={setNumberEpochs}
                setLearningRate={setLearningRate}
                setTestSize={setTestSize}
              />
            </Col>
          </Row>

          <Row className={'mt-3'}>
            <Col>
              {/* BLOCK  BUTTON */}
              <div className="d-grid gap-2">
                <Button variant={'primary'}
                  size={'lg'}
                  type={'submit'}>
                  <Trans i18nKey={prefix + 'models.button-submit'} />
                </Button>
              </div>
            </Col>
          </Row>

        </Form>

        <N4LDivider i18nKey={'hr.generated-models'} />

        {/* GENERATED MODELS */}
        <Row className={'mt-3'}>
          <Col className={'joyride-step-8-list-of-models'}>
            <ImageClassificationTableModels
              rowsPerPage={3}
              GeneratedModels={GeneratedModels}
            />
          </Col>
        </Row>

        <N4LDivider i18nKey={'hr.classify'} />

        {/* BLOCK 2 */}
        <Row className={'mt-3'}>
          <Col className={'joyride-step-9-classify'}>
            <ImageClassificationClassify
              handleSubmit_VectorTest={handleSubmit_VectorTest}
              handleSubmit_VectorTestImageUpload={handleSubmit_VectorTestImageUpload}
              GeneratedModels={GeneratedModels}
              onResetExplain={clearExplainResult}
            />
          </Col>
        </Row>

        {/* EXPLAINABILITY (LRP) */}
        <Row className={'mt-3'}>
          <Col xl={12}>
            <Card data-testid={'explainability-card'}>
              <Card.Header>
                <h3>{t('pages.playground.0-tabular-classification.general.explain-panel-title')} (LRP)</h3>
              </Card.Header>
              <Card.Body>
                {showExplain && explainResult && <ImageExplainResults result={explainResult} />}

                <div className="mt-3">
                  <Button
                    type="button"
                    variant={'outline-info'}
                    onClick={handleRequest_ExplainPrediction}
                    disabled={isCalculo || !hasExplainInput}
                  >
                    {isCalculo
                      ? t('ui.explain.calculating')
                      : showExplain
                        ? t('ui.explain.hideExplanation')
                        : t('ui.explain.explainPrediction')}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {import.meta.env.VITE_ENVIRONMENT === 'development' &&
          <Row className={'mt-3'}>
            <Col>
              <Card>
                <Card.Header><h3>DEBUG</h3></Card.Header>
                <Card.Body>
                  <pre>{JSON.stringify(GeneratedModels)}</pre>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        }
      </Container>
    </>
  )
}
