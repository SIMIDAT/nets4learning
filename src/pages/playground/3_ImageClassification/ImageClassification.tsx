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
import ShapHeatmap from '@core/explainability/ImageHeatMapChart'
import { runImageClassificationExplainLrp } from '@pages/playground/3_ImageClassification/explainPrediction/runObjectDetectionExplain'
import ImageClassificationManual from '@pages/playground/3_ImageClassification/ImageClassificationManual'
import ImageClassificationEditorLayers from '@pages/playground/3_ImageClassification/ImageClassificationEditorLayers'
import ImageClassificationEditorHyperparameters from '@pages/playground/3_ImageClassification/ImageClassificationEditorHyperparameters'
import ImageClassificationTableModels from '@pages/playground/3_ImageClassification/ImageClassificationTableModels'

import alertHelper from '@utils/alertHelper'
import { UPLOAD } from '@/DATA_MODEL'
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
  const imgData_ref = useRef<ImageData | null>(null)
  const imageSrc_ref = useRef<string | undefined>(undefined)
  const segmentationMap_ref = useRef<Int32Array | number[] | null>(null)
  const [showExplain, setShowExplain] = useState(false)
  const [isCalculo, setIsCalculo] = useState(false)
  const [explainLabels, setExplainLabels] = useState<Array<string | number>>([])
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [explanationData, setExplanationData] = useState<number[][] | null>(null)

  // Limpia el heatmap previo (al volver a dibujar/escribir un número, o al borrar el lienzo).
  const clearExplainResult = () => {
    if (!showExplain && explanationData === null) return
    setShowExplain(false)
    setExplanationData(null)
    setGalleryImages([])
    setExplainLabels([])
    segmentationMap_ref.current = null
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
      } else if (dataset in MAP_IC_CLASSES) {
        const _iModelClass = MAP_IC_CLASSES[dataset]
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
  const handleSubmit_VectorTest = async (canvas: HTMLCanvasElement | null, context: CanvasRenderingContext2D | null, canvas_small: HTMLCanvasElement | null) => {
    if (Model === null) {
      await alertHelper.alertWarning('Antes debes de crear y entrenar el modelo.')
      return
    }
    if (canvas === null || canvas_small === null || context === null) {
      console.error('Error, canvas or context is null')
      return
    }

    ImageClassificationUtils.resample_single(canvas, 28, 28, canvas_small)
    const context_small = canvas_small.getContext('2d') as CanvasRenderingContext2D

    const imgData = context_small.getImageData(0, 0, 28, 28)
    let arr = [] // El arreglo completo
    let arr28 = [] //Al llegar a 28 posiciones se pone en 'arr' como un nuevo índice
    for (let p = 0; p < imgData.data.length; p += 4) {
      const value = imgData.data[p + 3] / 255
      arr28.push([value]) //Agregar al arr28 y normalizar a 0-1. Aparte guarda dentro de un arreglo en el índice 0... again
      if (arr28.length === 28) {
        arr.push(arr28)
        arr28 = []
      }
    }

    arr = [arr]
    // Meter el arreglo en otro arreglo porque si no tio tensorflow se enoja >:(
    // Nah básicamente Debe estar en un arreglo nuevo en el índice 0, por ser un tensor4d en forma 1, 28, 28, 1
    const tensor4 = tfjs.tensor4d(arr) as tfjs.Tensor4D
    const predictions = (Model.predict(tensor4) as tfjs.Tensor).dataSync()
    const prediction_index = predictions.indexOf(Math.max(...predictions))
    console.log({ predictions, prediction_index })
    await captureForExplain(canvas, context)
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

    ImageClassificationUtils.resample_single(canvas, 28, 28, canvas_small)
    const context_small = canvas_small.getContext('2d') as CanvasRenderingContext2D

    const imgData = context_small.getImageData(0, 0, 28, 28)
    const arr = [] //El arreglo completo
    let arr28 = [] //Al llegar a 28 posiciones se pone en 'arr' como un nuevo índice
    for (let p = 0; p < imgData.data.length; p += 4) {
      const value = imgData.data[p + 3] / 255
      arr28.push([value])
      // Agregar al arr28 y normalizar a 0-1. Aparte guarda dentro de un arreglo en el indice 0... again
      if (arr28.length === 28) {
        arr.push(arr28)
        arr28 = []
      }
    }

    const tensor4 = tfjs.tensor4d([arr]) as tfjs.Tensor4D
    const predictions = (Model.predict(tensor4) as tfjs.Tensor).dataSync()
    const index = predictions.indexOf(Math.max(...predictions))
    console.log((predictions))

    await captureForExplain(canvas, context)
    await alertHelper.alertInfo('Resultado de la clasificación', {
      text  : '',
      footer: '',
      html  : <>¿El número es un {index}?</>
    })
  }
  // endregion

  // region EXPLAINABILITY (SHAP / LRP)
  // Captura la imagen clasificada (a resolución completa) y su dataURL base, y resetea
  // resultados de explicabilidad previos. Se llama tras cada clasificación.
  const captureForExplain = async (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
    try {
      imgData_ref.current = await iModelInstance.current.GET_IMAGE_DATA(canvas, context)
      imageSrc_ref.current = canvas.toDataURL()
    } catch (err) {
      console.warn('No se pudo capturar la imagen para explicabilidad', err)
      imgData_ref.current = null
      imageSrc_ref.current = undefined
    }
    segmentationMap_ref.current = null
    setExplainLabels([])
    setGalleryImages([])
    setExplanationData(null)
    setShowExplain(false)
  }

  const canUseLrp = () => {
    const modelApi = iModelInstance.current as unknown as {
      GET_ACTIVATIONS_IMAGE?: unknown
      CALCULATE_LRP_PROPAGATION?: unknown
    }
    return (
      typeof modelApi?.GET_ACTIVATIONS_IMAGE === 'function' &&
      typeof modelApi?.CALCULATE_LRP_PROPAGATION === 'function'
    )
  }

  const handleRequest_ExplainPrediction = async (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (showExplain) {
      setShowExplain(false)
      return
    }

    setIsCalculo(true)
    try {
      const currentImageData = imgData_ref.current
      const currentModel = Model
      if (!currentImageData || !currentModel) {
        await alertHelper.alertInfo(t('info.insert-input'))
        setIsCalculo(false)
        return
      }

      if (!canUseLrp()) {
        await alertHelper.alertError('LRP no está disponible para este modelo')
        setIsCalculo(false)
        return
      }

      const result = await runImageClassificationExplainLrp({
        iModel: iModelInstance.current,
        modelInstance: currentModel,
        imageData: currentImageData,
      })

      segmentationMap_ref.current = result.segmentationMapArray
      setExplainLabels(result.selectedLabels)
      setGalleryImages(result.debugImages)
      setExplanationData(result.shapValues)
      setShowExplain(true)
      setIsCalculo(false)
    } catch (error) {
      console.error('Error calculating explainability', { error })
      await alertHelper.alertError(t('Error calculating explainability'))
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
                {showExplain && galleryImages.length > 0 && (
                  <div className="mb-4">
                    <h5>{t('ui.explain.perturbationSamples')}</h5>
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        overflowX: 'auto',
                        padding: '10px',
                        background: '#f9f9f9',
                        borderRadius: '8px',
                        minHeight: '100px',
                      }}
                    >
                      {galleryImages.map((imgSrc, idx) => (
                        <div key={idx} style={{ flex: '0 0 auto', textAlign: 'center' }}>
                          <img
                            src={imgSrc}
                            style={{ height: 80, border: '1px solid #ccc', borderRadius: '4px', objectFit: 'contain' }}
                            alt={`sample-${idx}`}
                          />
                          <div style={{ fontSize: '10px', color: '#666' }}>#{idx + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showExplain && explanationData && (
                  <Row>
                    {explanationData.map((shapVals, idx) => {
                      const label = explainLabels && explainLabels.length > idx ? explainLabels[idx] : idx + 1
                      return (
                        <Col key={idx} md={6} lg={4} className="mb-3">
                          <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                            <h6 style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                              {t('ui.explain.class', { index: String(label) })}
                            </h6>
                            <ShapHeatmap
                              imageSrc={imageSrc_ref.current}
                              shapValues={shapVals}
                              segmentationMap={segmentationMap_ref.current}
                            />
                          </div>
                        </Col>
                      )
                    })}
                  </Row>
                )}

                <div className="mt-3">
                  <Button
                    type="button"
                    variant={'outline-info'}
                    onClick={handleRequest_ExplainPrediction}
                    disabled={isCalculo || !imgData_ref.current || !canUseLrp()}
                  >
                    {isCalculo
                      ? t('ui.explain.calculating')
                      : showExplain
                        ? t('ui.explain.hideExplanation')
                        : t('ui.explain.explainPrediction')}
                  </Button>
                </div>

                {showExplain && (!explanationData || explanationData.length === 0) && !isCalculo && (
                  <p className="text-center text-muted">{t('ui.explain.noData')}</p>
                )}
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
