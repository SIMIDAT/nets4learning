import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Accordion, Button, Card, Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'
import * as _Types from '@core/types'
import { trackPageView } from '@core/analytics'

import type I_MODEL_IMAGE_CLASSIFICATION from './models/_model'
import * as ImageClassificationUtils from './utils/utils'

import N4LLayerDesign from '@components/neural-network/N4LLayerDesign'
import N4LJoyride from '@components/joyride/N4LJoyride'
import N4LDivider from '@components/divider/N4LDivider'
import N4LSectionLayout from '@components/divider/N4LSectionLayout'
import N4LTrainButton from '@components/neural-network/N4LTrainButton'
import { useTrainingProgress } from '@hooks/useTrainingProgress'
import N4LSessionButtons from '@components/session/N4LSessionButtons'
import { downloadSession, parseSession, SessionError } from '@core/session/trainingSession'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

import ImageClassificationClassify from '@pages/playground/3_ImageClassification/ImageClassificationClassify'
import { makeImagePrediction, type ImagePrediction_t } from '@pages/playground/3_ImageClassification/utils/imagePrediction'
import { ImageExplainResults, type ImageExplainResult_t } from '@core/explainability/ImageExplainPanel'
import { explainErrorKey } from '@core/explainability/explainError'
import { runImageClassificationExplainLrp, supportsLrp, warmUpLrp } from '@pages/playground/3_ImageClassification/explainPrediction/runImageClassificationExplain'
import { warmUpModel } from '@core/nn-utils/warmUpModel'
import ImageClassificationManual from '@pages/playground/3_ImageClassification/ImageClassificationManual'
import ImageClassificationEditorLayers from '@pages/playground/3_ImageClassification/ImageClassificationEditorLayers'
import ImageClassificationEditorHyperparameters from '@pages/playground/3_ImageClassification/ImageClassificationEditorHyperparameters'
import ImageClassificationTableModels from '@pages/playground/3_ImageClassification/ImageClassificationTableModels'

import alertHelper from '@utils/alertHelper'
import { TASKS, UPLOAD } from '@/TASKS'
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
import type { SpriteImageDataset } from '@pages/playground/3_ImageClassification/models/SpriteImageDataset'
import type { VirtualSelectOption_t } from '@components/select/N4LVirtualSelect'

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
  const training = useTrainingProgress()
  // Secciones de la página en orden: numeran los separadores (N4LDivider)
  const steps = ['hr.information', 'hr.model', 'hr.generated-models', 'hr.classify', 'hr.explainability']
  const navigate = useNavigate()
  const [iModelInstance, setIModelInstance] = useState<I_MODEL_IMAGE_CLASSIFICATION | null>(null)

  const prefix = 'pages.playground.generator.'

  // TODO: DEPENDIENDO DEL TIPO QUE SEA SE PRE CARGAN UNOS AJUSTES U OTROS


  const [Layers, setLayers] = useState(DEFAULT_LAYERS)

  const [idOptimizer, setIdOptimizer] = useState<IdOptimizer_t>(DEFAULT_ID_OPTIMIZATION)
  const [idLoss, setIdLoss] = useState<IdLoss_t | IdMetric_t>(DEFAULT_ID_LOSS)
  const [idMetricsList, setIdMetricsList] = useState<(IdLoss_t | IdMetric_t)[]>(DEFAULT_ID_METRICS)

  const [LearningRate, setLearningRate] = useState(DEFAULT_LEARNING_RATE)
  const [NumberEpochs, setNumberEpochs] = useState(DEFAULT_NUMBER_EPOCHS)
  const [TestSize, setTestSize] = useState(DEFAULT_TEST_SIZE)

  // region SESIÓN: exportar e importar capas e hiperparámetros
  // Cambia al importar para volver a montar el editor de hiperparámetros con los valores nuevos
  const [sessionVersion, setSessionVersion] = useState(0)

  const handleClick_ExportSession = () => {
    downloadSession({
      app            : 'nets4learning',
      version        : 1,
      task           : TASKS.IMAGE_CLASSIFICATION,
      dataset        : dataset,
      layers         : Layers,
      hyperparameters: { learningRate: LearningRate, epochs: NumberEpochs, testSize: TestSize, optimizer: idOptimizer, loss: idLoss, metrics: idMetricsList },
    })
  }

  const handleImport_Session = async (text: string) => {
    try {
      const { layers: importedLayers, hyperparameters: h } = parseSession(text, TASKS.IMAGE_CLASSIFICATION)
      // Las capas de imágenes tienen tipo (conv2d, maxPooling2d, flatten, dense) y sus propios parámetros
      if (!importedLayers.every((layer) => typeof layer._class === 'string')) throw new SessionError('session.error-not-session')
      setLayers(importedLayers as unknown as typeof Layers)
      setLearningRate(h.learningRate)
      setNumberEpochs(h.epochs)
      setTestSize(h.testSize)
      setIdOptimizer(h.optimizer as IdOptimizer_t)
      setIdLoss(h.loss as IdLoss_t)
      setIdMetricsList(h.metrics as IdMetric_t[])
      setSessionVersion((version) => version + 1)
      await alertHelper.alertSuccess(t('session.imported'))
    } catch (error) {
      await alertHelper.alertError(t(error instanceof SessionError ? error.i18nKey : 'session.error-not-session'))
    }
  }
  // endregion

  const joyrideButton_ref = useRef<_Types.JoyrideHandle_t>({})
  /**
   * @type {ReturnType<typeof useState<tfjs.Sequential>>}
   */
  const [Model, setModel] = useState<tfjs.Sequential | null>(null)
  // Modelo de la tabla con el que se clasifica (el último entrenado, salvo que se elija otro) y su última predicción
  const [selectedModelIndex, setSelectedModelIndex] = useState(-1)
  const [prediction, setPrediction] = useState<ImagePrediction_t | null>(null)
  // Imágenes de test del dataset (las que no se usan para entrenar): se pueden clasificar en lugar de dibujar
  const [testDataset, setTestDataset] = useState<SpriteImageDataset | null>(null)
  const [selectedInstance, setSelectedInstance] = useState<number | null>(null)
  const [instanceImage, setInstanceImage] = useState<ImageData | null>(null)
  // Clase real de lo clasificado, si es una imagen del dataset (no un dibujo)
  const [actualClassIndex, setActualClassIndex] = useState<number | null>(null)

  // === Explicabilidad (LRP) — en el train solo se ofrece LRP ===
  // Entrada exacta que recibió el modelo (28×28) y la imagen base del mapa de calor.
  const explainInput_ref = useRef<{ imageData: ImageData, imageSrc: string } | null>(null)
  // Compilar los shaders de LRP del último modelo entrenado (warmUpLrp)
  const lrpWarmUp_ref = useRef<Promise<void>>(Promise.resolve())
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
    trackPageView(`/ImageClassification/${dataset}`, dataset)
  }, [dataset])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init][ dataset, t ]')
    const init = async () => {
      await tfjs.ready()
      if (dataset === UPLOAD) {
        console.error('Error, upload not valid')
      } else if (hasModel(MAP_IC_CLASSES, dataset)) {
        const _iModelClass = await loadModelClass(MAP_IC_CLASSES, dataset)
        const _iModelInstance = new _iModelClass(t)
        setIModelInstance(_iModelInstance)
        setLayers(_iModelInstance.DEFAULT_LAYERS())
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

  const classLabel = (index: number) => iModelInstance?.CLASS_LABELS[index] ?? String(index)

  // region CREACIÓN DEL MODELO
  const handleSubmit_Play = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (iModelInstance === null) return
    if (Layers[0]._class !== 'conv2d') {
      await alertHelper.alertWarning(t('warning.the-first-layer-need-to-be-__value__', { value: 'conv2d' }))
      return
    }
    training.start()
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
      const tranin_model = await iModelInstance.TRAIN_MODEL(params, training.callbacks)
      if (tranin_model === null) {
        await alertHelper.alertError(t('alert.model-train-error'))
        return
      }
      const { model, history, evaluation } = tranin_model
      setGeneratedModels((oldModels: Array<_Types.ImageClassificationGeneratedModel_t>) => {
        const newModel: _Types.ImageClassificationGeneratedModel_t = {
          model     : model,
          history   : history,
          evaluation: evaluation && { classes: iModelInstance.CLASS_LABELS, ...evaluation },
          params    : {
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
      // Shaders del modelo nuevo compilados antes de clasificar con él, y los de LRP mientras tanto ("Explicar" espera)
      await warmUpModel(model)
      lrpWarmUp_ref.current = warmUpLrp(iModelInstance, model)
      // Se clasifica con el modelo recién entrenado (durante el entrenamiento no se añaden otros)
      await selectModel(GeneratedModels.length, model)
      // El entrenamiento ya lo ha descargado: sus imágenes de test pasan al selector
      setTestDataset(await iModelInstance.LOAD_DATASET())
      await alertHelper.alertSuccess(t('alert.model-train-success'))
    } catch (error) {
      console.error(error)
    } finally {
      training.finish()
    }
  }
  // endregion

  // region PRUEBA DEL MODELO
  /** Salida del modelo para una imagen de 28×28 (lectura asíncrona: con WebGPU las síncronas detienen la GPU) */
  const predictImageData = async (model: tfjs.Sequential, imgData: ImageData) => {
    const output = tfjs.tidy(() => model.predict(ImageClassificationUtils.imageDataToMnistTensor4d(imgData)) as tfjs.Tensor)
    const values = Array.from(await output.data<'float32'>())
    output.dispose()
    return values
  }

  /**
   * Reduce el lienzo a 28×28 (entrada del modelo), muestra esa versión en `canvas_small` como
   * vista previa y predice. Devuelve la ImageData usada, que también es la entrada de LRP.
   */
  const predictDrawing = async (canvas: HTMLCanvasElement, canvas_small: HTMLCanvasElement, model: tfjs.Sequential) => {
    const { canvasToImageData, resampleImageData, thresholdImageData } = ImageClassificationUtils
    const imgData = thresholdImageData(resampleImageData(canvasToImageData(canvas), 28, 28))
    canvas_small.getContext('2d')?.putImageData(imgData, 0, 0)
    return { imgData, values: await predictImageData(model, imgData) }
  }

  /** Pasa a clasificar con otro modelo y, si ya hay un dibujo clasificado, lo vuelve a clasificar con él para comparar */
  const selectModel = async (index: number, model: tfjs.Sequential) => {
    setModel(model)
    setSelectedModelIndex(index)
    clearExplainResult()
    const input = explainInput_ref.current
    setPrediction(input === null ? null : makeImagePrediction(await predictImageData(model, input.imageData), index))
  }

  const handleChange_Model = async (index: number) => {
    await selectModel(index, GeneratedModels[index].model)
  }

  // Al borrar el lienzo no queda nada clasificado: ni resultado ni entrada que explicar
  const handleClear_Drawing = () => {
    explainInput_ref.current = null
    setHasExplainInput(false)
    setPrediction(null)
    setSelectedInstance(null)
    setInstanceImage(null)
    setActualClassIndex(null)
  }

  // Al dibujar encima de una imagen del dataset deja de ser esa imagen
  const handleDrawStart = () => {
    setSelectedInstance(null)
    setActualClassIndex(null)
  }

  const instanceOptions = useMemo<VirtualSelectOption_t[]>(() => {
    if (testDataset === null || iModelInstance === null) return []
    return testDataset.testClasses().map((label, index) => ({ value: index, label: `#${index} · ${iModelInstance.CLASS_LABELS[label] ?? label}` }))
  }, [testDataset, iModelInstance])

  /** Pinta en el lienzo una imagen de test y la clasifica tal cual (sin pasar por el lienzo: es la entrada exacta) */
  const handleChange_Instance = async (index: number) => {
    if (testDataset === null) return
    const { pixels, label } = testDataset.testExample(index)
    const imageData = ImageClassificationUtils.grayscaleToImageData(pixels, 28, 28)
    setSelectedInstance(index)
    setInstanceImage(imageData)
    setActualClassIndex(label)
    explainInput_ref.current = { imageData, imageSrc: ImageClassificationUtils.imageDataToDataUrl(imageData, 200) }
    setHasExplainInput(true)
    clearExplainResult()
    if (Model !== null) setPrediction(makeImagePrediction(await predictImageData(Model, imageData), selectedModelIndex))
  }

  const handleSubmit_VectorTest = async (canvas: HTMLCanvasElement | null, context: CanvasRenderingContext2D | null, canvas_small: HTMLCanvasElement | null) => {
    if (Model === null) {
      await alertHelper.alertWarning(t('error.need-model'))
      return
    }
    if (canvas === null || canvas_small === null || context === null) {
      console.error('Error, canvas or context is null')
      return
    }

    const { imgData, values } = await predictDrawing(canvas, canvas_small, Model)
    setExplainInput(imgData, canvas)
    setPrediction(makeImagePrediction(values, selectedModelIndex))
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

    const { imgData, values } = await predictDrawing(canvas, canvas_small, Model)
    setExplainInput(imgData, canvas)
    setPrediction(makeImagePrediction(values, selectedModelIndex))
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
    if (!input || !Model || iModelInstance === null) {
      await alertHelper.alertInfo(t('info.insert-input'))
      return
    }
    if (!supportsLrp(iModelInstance)) {
      await alertHelper.alertError(t('ui.explain.lrp-not-available'))
      return
    }

    setIsCalculo(true)
    try {
      // Hasta que acaba el calentamiento, los programas de LRP no se pueden usar
      await lrpWarmUp_ref.current
      const result = await runImageClassificationExplainLrp({
        iModel       : iModelInstance,
        modelInstance: Model,
        imageData    : input.imageData,
      })
      setExplainResult({
        method         : 'lrp',
        values         : result.shapValues,
        labels         : result.selectedLabels,
        labelTexts     : result.selectedLabels.map((label) => classLabel(Number(label))),
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

  // La clase del modelo se carga bajo demanda en el init; hasta entonces se muestra la carga.
  if (iModelInstance === null) {
    return <WaitingPlaceholder />
  }

  if (VERBOSE) console.debug('render ImageClassification')
  return (
    <>
      <N4LJoyride
        joyrideButton_ref={joyrideButton_ref}
        JOYRIDE_state={iModelInstance.JOYRIDE()}
        TASK={'image-classification'}
        KEY={'ImageClassification'}
      />

      {/* MANUAL */}
      <N4LSectionLayout steps={steps}>
        <Row className={'mt-3'}>
          <Col xl={12}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h1><Trans i18nKey={'modality.3'} /></h1>
              <div className={'d-flex flex-wrap gap-2'}>
                <N4LSessionButtons onExport={handleClick_ExportSession} onImport={handleImport_Session} />
                <Button className={'text-nowrap'}
                  size={'sm'}
                  variant={'outline-primary'}
                  onClick={() => joyrideButton_ref.current.handleClick_StartJoyride?.()}>
                  <Trans i18nKey={'datasets-models.3-image-classification.joyride.title'} />
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        <N4LDivider i18nKey={'hr.information'} steps={steps} />


        <Row className={'mt-3'}>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            <Accordion>
              <Accordion.Item eventKey={'manual'} className={'joyride-step-1-manual'}>
                <Accordion.Header as={'h2'} className={'n4l-accordion-h2'}>
                  <Trans i18nKey={'pages.playground.3-image-classification.generator.manual.title'} />
                </Accordion.Header>
                <Accordion.Body>
                  <ImageClassificationManual />
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey={'description-dataset'} className={'joyride-step-2-dataset-info'}>
                <Accordion.Header as={'h3'} className={'n4l-accordion-h3'}>
                  <Trans i18nKey={dataset !== UPLOAD ? iModelInstance.TITLE : prefix + 'dataset.upload-dataset'} />
                </Accordion.Header>
                <Accordion.Body>
                  {iModelInstance.DESCRIPTION()}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Col>
        </Row>

        <N4LDivider i18nKey={'hr.model'} steps={steps} />

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
                key={sessionVersion}
                learningRate={LearningRate}
                numberEpochs={NumberEpochs}
                testSize={TestSize}
                idOptimizer={idOptimizer}
                idLoss={idLoss}
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
              <N4LTrainButton isTraining={training.isTraining}
                progress={training.progress}
                isStopping={training.isStopping}
                onStop={training.stop}>
                <Trans i18nKey={prefix + 'models.button-submit'} />
              </N4LTrainButton>
            </Col>
          </Row>

        </Form>

        <N4LDivider i18nKey={'hr.generated-models'} steps={steps} />

        {/* GENERATED MODELS */}
        <Row className={'mt-3'}>
          <Col className={'joyride-step-8-list-of-models'}>
            <ImageClassificationTableModels
              rowsPerPage={3}
              GeneratedModels={GeneratedModels}
            />
          </Col>
        </Row>

        <N4LDivider i18nKey={'hr.classify'} steps={steps} />

        {/* BLOCK 2 */}
        <Row className={'mt-3'}>
          <Col className={'joyride-step-9-classify'}>
            <ImageClassificationClassify
              handleSubmit_VectorTest={handleSubmit_VectorTest}
              handleSubmit_VectorTestImageUpload={handleSubmit_VectorTestImageUpload}
              GeneratedModels={GeneratedModels}
              onResetExplain={clearExplainResult}
              onClear={handleClear_Drawing}
              onDrawStart={handleDrawStart}
              instanceOptions={instanceOptions}
              selectedInstance={selectedInstance}
              onChangeInstance={handleChange_Instance}
              instanceImage={instanceImage}
              actualClassIndex={actualClassIndex}
              prediction={prediction}
              classLabels={iModelInstance.CLASS_LABELS}
              selectedModelIndex={selectedModelIndex}
              onChangeModel={handleChange_Model}
            />
          </Col>
        </Row>

        {/* EXPLAINABILITY (LRP) */}
        <N4LDivider i18nKey={'hr.explainability'} steps={steps} />

        <Row className={'mt-3'}>
          <Col xl={12}>
            <Card data-testid={'explainability-card'}>
              <Card.Header>
                <h3>{t('pages.playground.0-tabular-classification.general.explain-panel-title')} (LRP)</h3>
              </Card.Header>
              <Card.Body>
                {showExplain && explainResult && <ImageExplainResults result={explainResult} />}

                {!hasExplainInput && <N4LEmptyState i18nKey={'ui.explain.waiting-for-prediction'} />}
                <div className="mt-3">
                  <Button
                    type="button"
                    variant={'outline-primary'}
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
      </N4LSectionLayout>
    </>
  )
}
