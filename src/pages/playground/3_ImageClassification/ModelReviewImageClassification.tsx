import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import * as tfjs from '@tensorflow/tfjs'
import { Trans, useTranslation } from 'react-i18next'

import type I_MODEL_IMAGE_CLASSIFICATION from './models/_model'
import type { ImageClassificationResult_t } from './models/_model'
import type { SpriteImageDataset } from './models/SpriteImageDataset'
import { VERBOSE } from '@/CONSTANTS'
import { TASKS, UPLOAD } from '@/TASKS'
import alertHelper from '@utils/alertHelper'
import N4LDownloadProgress from '@components/loading/N4LDownloadProgress'
import { trackDownloads } from '@core/downloadProgress'
import { askBeforeDownload } from '@core/models/downloadConsent'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'

import ModelReviewImageClassificationDraw from '@pages/playground/3_ImageClassification/ModelReviewImageClassificationDraw'
import { MAP_IC_CLASSES } from '@pages/playground/3_ImageClassification/models'
import { createReviewModelInstance } from '@core/models/createReviewModelInstance'
import { grayscaleToImageData, UTILS_image } from '@pages/playground/3_ImageClassification/utils/utils'

import {
  ImageExplainResults,
  ShapImageControls,
  type ImageExplainResult_t,
} from '@core/explainability/ImageExplainPanel'
import { DEFAULT_SHAP_IMAGE_OPTIONS } from '@core/explainability/shapImageOptions'
import { explainErrorKey } from '@core/explainability/explainError'
import N4LModelSummaryButton from '@components/neural-network/N4LModelSummaryButton'
import N4LPageHeader from '@components/neural-network/N4LPageHeader'
import N4LModelCard from '@components/neural-network/N4LModelCard'
import N4LModelAside from '@components/neural-network/N4LModelAside'
import { imageClassificationReviewGuide } from './modelReviewGuide'
import N4LClassificationChart from '@components/neural-network/N4LClassificationChart'
import N4LVirtualSelect, { type VirtualSelectOption_t } from '@components/select/N4LVirtualSelect'
import { warmUpModel } from '@core/nn-utils/warmUpModel'
import { trackEvent } from '@core/analytics'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import {
  runImageClassificationExplain,
  runImageClassificationExplainLrp,
  warmUpLrp,
  supportsLrp,
} from '@pages/playground/3_ImageClassification/explainPrediction/runImageClassificationExplain'

/** Lo clasificado: la salida del modelo y, si es una imagen del conjunto de test, su clase real */
type Result_t = ImageClassificationResult_t & { actualIndex: number | null }

type ModelReviewImageClassificationProps = {
  dataset: string
}
export default function ModelReviewImageClassification({ dataset }: ModelReviewImageClassificationProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prefix = 'datasets-models.3-image-classifier.interface.'
  const prefixForm = 'pages.playground.generator.dynamic-form-dataset.'

  const [iModelInstance, setIModelInstance] = useState<I_MODEL_IMAGE_CLASSIFICATION | null>(null)
  const [model, setModel] = useState<tfjs.LayersModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Imagen clasificada (también es la base del mapa de calor de la explicación)
  // Compilar los shaders de LRP tras cargar el modelo (warmUpLrp)
  const lrpWarmUp_ref = useRef<Promise<void>>(Promise.resolve())
  const canvas_original_image_ref = useRef<HTMLCanvasElement>(null)
  const result_ref = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<Result_t | null>(null)

  const [imageUpload, setImageUpload] = useState<File | null>(null)

  // MNIST y KMNIST: sus imágenes de test se pueden clasificar desde un selector (el dataset se descarga al pedirlo)
  const [testDataset, setTestDataset] = useState<SpriteImageDataset | null>(null)
  const [isLoadingTestDataset, setIsLoadingTestDataset] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<number | null>(null)

  // === Explicabilidad (SHAP / LRP) ===
  // Imagen clasificada que se explicará (misma ImageData que recibió el modelo).
  const imgData_ref = useRef<ImageData | null>(null)
  const [hasExplainInput, setHasExplainInput] = useState(false)
  const [explainResult, setExplainResult] = useState<ImageExplainResult_t | null>(null)
  const [showExplain, setShowExplain] = useState(false)
  const [isCalculo, setIsCalculo] = useState(false)
  // Los modelos de dibujos (MNIST, KMNIST) solo ofrecen LRP; el resto elige entre SHAP y LRP (si el modelo implementa LRP).
  const [explainMethod, setExplainMethod] = useState<'shap' | 'lrp'>('shap')
  const [lrpAvailable, setLrpAvailable] = useState(false)
  const [shapOptions, setShapOptions] = useState(DEFAULT_SHAP_IMAGE_OPTIONS)


  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init][ dataset, t, history ]')
    const init = async () => {
      const _iModelInstance = await createReviewModelInstance(MAP_IC_CLASSES, dataset, (ModelClass) => new ModelClass(t), navigate)
      if (_iModelInstance === null) return
      try {
        setIModelInstance(_iModelInstance)
        // Con ahorro de datos o conexión lenta, antes se pregunta; luego, con el progreso real (MobileNet pesa unos 16 MB)
        await askBeforeDownload(TASKS.IMAGE_CLASSIFICATION, dataset)
        const _model = await trackDownloads(() => _iModelInstance.ENABLE_MODEL(), 'model_load') as tfjs.LayersModel
        // Shaders compilados antes de poder clasificar: la primera clasificación ya no bloquea la página
        if (_model instanceof tfjs.LayersModel) await warmUpModel(_model)
        setModel(_model)
        setLrpAvailable(supportsLrp(_iModelInstance))
        setIsLoading(false)
        // Los de LRP, mientras tanto (ya se puede clasificar); "Explicar" espera a que acaben
        if (_model instanceof tfjs.LayersModel) lrpWarmUp_ref.current = warmUpLrp(_iModelInstance, _model)
        await alertHelper.alertSuccess(t('model-loaded-successfully'))
      } catch (error) {
        console.error('Error', error)
      }
    }

    init().then()
  }, [dataset, t, navigate])

  // MNIST y KMNIST: se puede dibujar la entrada y la explicación es siempre con LRP
  const isDrawable = iModelInstance?.DRAWABLE ?? false
  // Guía paso a paso de la página (con voz): solo con el botón "Guía"
  const hasSummary = model instanceof tfjs.LayersModel
  const guideSteps = useMemo(() => (iModelInstance === null
    ? null
    : imageClassificationReviewGuide(t, dataset, { drawable: isDrawable, summary: hasSummary })), [t, dataset, iModelInstance, isDrawable, hasSummary])

  // region CLASIFICACIÓN
  /** Clasifica la entrada del modelo y la deja como entrada de la explicación */
  const classify = async (imageData: ImageData, actualIndex: number | null = null) => {
    if (iModelInstance === null || model === null) return
    const { predictions } = await iModelInstance.CLASSIFY_IMAGE(model, imageData)
    setResult({ ...iModelInstance.PREDICTION_RESULT(predictions), actualIndex })
    setExplainInput(imageData)
  }

  // El resultado queda debajo de las imágenes de ejemplo: se lleva a la vista al clasificar desde ahí
  const scrollToResult = () => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    result_ref.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' })
  }

  /** Pinta una imagen en el canvas del resultado y clasifica lo que se ve en él */
  const classifyImage = (src: string) => new Promise<void>((resolve) => {
    const canvas = canvas_original_image_ref.current
    if (canvas === null || iModelInstance === null) {
      resolve()
      return
    }
    const image = new Image()
    image.addEventListener('error', (e: Event) => {
      UTILS_image.failed(e)
      resolve()
    })
    image.onload = async () => {
      const canvas_ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      canvas_ctx.clearRect(0, 0, canvas.width, canvas.height)
      UTILS_image.drawImageInCanvasWithContainer(image, canvas)
      await classify(await iModelInstance.GET_IMAGE_DATA(canvas, canvas_ctx))
      resolve()
    }
    image.src = src
  })

  const handleClick_Example = async (image_src: string) => {
    setSelectedInstance(null)
    await classifyImage(image_src)
    trackEvent('predict', { input: 'sample' })
    scrollToResult()
  }

  const handleFileUpload_Image = (files: File[]) => {
    const blob = files[0]
    if (blob) setImageUpload(new File([blob], blob.name, { type: blob.type }))
  }

  const handleClick_ImageUploaded_Predict = async () => {
    if (imageUpload === null) {
      await alertHelper.alertError(t('error.need-to-upload-image'))
      return
    }
    setSelectedInstance(null)
    await classifyImage(URL.createObjectURL(imageUpload))
    trackEvent('predict', { input: 'image' })
  }

  const handleClassify_Drawing = async (imageData: ImageData) => {
    setSelectedInstance(null)
    await classify(imageData)
    trackEvent('predict', { input: 'drawing' })
  }

  const handleClick_LoadTestDataset = async () => {
    if (iModelInstance === null) return
    setIsLoadingTestDataset(true)
    try {
      setTestDataset(await iModelInstance.LOAD_DATASET())
    } catch (error) {
      console.error(error)
      await alertHelper.alertError(t('error.load-dataset'))
    } finally {
      setIsLoadingTestDataset(false)
    }
  }

  const testOptions = useMemo<VirtualSelectOption_t[]>(() => {
    if (testDataset === null || iModelInstance === null) return []
    return testDataset.testClasses().map((label, index) => ({ value: index, label: `#${index} · ${iModelInstance.CLASS_LABELS[label] ?? label}` }))
  }, [testDataset, iModelInstance])

  /** Una imagen de test tal cual (28×28, la entrada exacta del modelo), ampliada en el canvas del resultado */
  const handleChange_TestImage = async (index: number) => {
    const canvas = canvas_original_image_ref.current
    if (testDataset === null || canvas === null) return
    const { pixels, label } = testDataset.testExample(index)
    const imageData = grayscaleToImageData(pixels, 28, 28)
    const small = document.createElement('canvas')
    small.width = 28
    small.height = 28
    small.getContext('2d')?.putImageData(imageData, 0, 0)
    canvas.width = 200
    canvas.height = 200
    const canvas_ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    canvas_ctx.imageSmoothingEnabled = false
    canvas_ctx.drawImage(small, 0, 0, canvas.width, canvas.height)
    setSelectedInstance(index)
    await classify(imageData, label)
    trackEvent('predict', { input: 'test_sample' })
    scrollToResult()
  }
  // endregion

  // Nueva imagen clasificada: pasa a ser la entrada de la explicabilidad y se descarta
  // la explicación anterior.
  const setExplainInput = (imageData: ImageData | null) => {
    imgData_ref.current = imageData
    setHasExplainInput(imageData !== null)
    clearExplainResult()
  }

  // Limpia el heatmap previo (al volver a dibujar/escribir un número, o al borrar el lienzo).
  const clearExplainResult = () => {
    setShowExplain(false)
    setExplainResult(null)
  }

  const handleRequest_ExplainPrediction = async () => {
    if (showExplain) {
      setShowExplain(false)
      return
    }

    const imageData = imgData_ref.current
    const modelInstance = model
    if (!imageData || !modelInstance || iModelInstance === null) {
      await alertHelper.alertInfo(t('info.insert-input'))
      return
    }

    const useLrp = isDrawable || explainMethod === 'lrp'
    if (useLrp && !lrpAvailable) {
      await alertHelper.alertError(t('ui.explain.lrp-not-available'))
      return
    }

    trackEvent('explain', { method: useLrp ? 'lrp' : 'shap' })
    setIsCalculo(true)
    try {
      // Hasta que acaba el calentamiento, los programas de LRP no se pueden usar
      if (useLrp) await lrpWarmUp_ref.current
      const result = useLrp
        ? await runImageClassificationExplainLrp({ iModel: iModelInstance, modelInstance, imageData })
        : await runImageClassificationExplain({ iModel: iModelInstance, modelInstance, imageData, ...shapOptions })

      setExplainResult({
        method            : useLrp ? 'lrp' : 'shap',
        values            : result.shapValues,
        labels            : result.selectedLabels,
        // Con MNIST/KMNIST las etiquetas son índices; MobileNet ya devuelve el nombre de la clase
        labelTexts        : result.selectedLabels.map((label) => iModelInstance.CLASS_LABELS[Number(label)] ?? String(label)),
        galleryImages     : result.debugImages,
        imageSrc          : canvas_original_image_ref.current?.toDataURL(),
        segmentationMap   : result.segmentationMapArray,
        segmentationWidth : imageData.width,
        segmentationHeight: imageData.height,
        baseValues        : result.baseValues,
        predictedValues   : result.predictedValues,
      })
      setShowExplain(true)
    } catch (error) {
      console.error('Error calculating explainability', { error })
      await alertHelper.alertError(t(explainErrorKey(error)))
    } finally {
      setIsCalculo(false)
    }
  }

  if (VERBOSE) console.debug('render ModelReviewImageClassification')
  return (
    <>
      <Container className={'n4l-container-wide'} id={'ModelReviewImageClassification'} data-testid={'Test-ModelReviewImageClassification'}>
        <N4LPageHeader title={<Trans i18nKey={'modality.3'} />} guideId={'image-classification.' + dataset} guideSteps={guideSteps} className={'mt-2'} />
        <Row>
          <Col>
            <N4LDownloadProgress isLoading={isLoading} />
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
            <N4LModelAside>
              <N4LModelCard title={iModelInstance !== null && <Trans i18nKey={iModelInstance.TITLE} />}
                actions={<N4LModelSummaryButton model={model} title={iModelInstance !== null ? t(iModelInstance.TITLE) : ''} />}>
                {dataset !== UPLOAD && iModelInstance?.DESCRIPTION()}
              </N4LModelCard>
              {/* Cómo se explica la predicción (SHAP o LRP) */}
              <Card className={'border-success'} data-guide={'explain-about'}>
                <Card.Header>
                  <h2 className={'h5 mb-0'}>
                    <Trans i18nKey={'pages.playground.0-tabular-classification.general.explain-panel-title'} />
                  </h2>
                </Card.Header>
                <Card.Body>
                  <p className={'small mb-0'}>
                    {isDrawable || explainMethod === 'lrp'
                      ? t('ui.explain.about-lrp')
                      : t('ui.explain.about-shap')}
                  </p>
                </Card.Body>
              </Card>
            </N4LModelAside>
          </Col>
          <Col xs={12} sm={12} md={12} xl={9} xxl={9}>
            {/* IMÁGENES DE EJEMPLO (y, en MNIST y KMNIST, las del conjunto de test) */}
            <Card className={'mt-3'} data-guide={'examples'}>
              <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
                <h2>
                  <Trans i18nKey={prefix + 'process-examples.title'} />
                </h2>
                {isDrawable && testDataset === null &&
                  <Button size={'sm'} variant={'outline-primary'} onClick={handleClick_LoadTestDataset} disabled={isLoadingTestDataset || model === null} data-testid={'Test-LoadTestDataset'} data-guide={'test-images'}>
                    {isLoadingTestDataset && <Spinner size={'sm'} className={'me-2'} />}
                    <Trans i18nKey={prefix + (isLoadingTestDataset ? 'test-images.loading' : 'test-images.load')} />
                  </Button>}
                {isDrawable && testDataset !== null &&
                  <div className={'n4l-card-header-controls n4l-instance-select'} data-guide={'test-images'}>
                    <N4LVirtualSelect options={testOptions}
                      value={selectedInstance}
                      onChange={handleChange_TestImage}
                      size={'sm'}
                      placeholder={t('pages.playground.generator.classify.select-image')}
                      searchPlaceholder={t(prefixForm + 'search-entity')}
                      noResultsText={t(prefixForm + 'no-entity')}
                      countText={(shown, total) => t(prefixForm + 'entity-count', { shown, total })} />
                  </div>}
              </Card.Header>
              <Card.Body>
                <p className={'text-body-secondary small'}><Trans i18nKey={prefix + 'process-examples.help'} /></p>
                {/* Dibujos de 28×28: una fila de miniaturas; fotos (MobileNet): tres por fila */}
                <div className={isDrawable ? 'n4l-example-grid n4l-example-grid-small' : 'n4l-example-grid'}>
                  {(iModelInstance?.LIST_IMAGES_EXAMPLES() ?? []).map((image, index) => {
                    const path_image = import.meta.env.VITE_PATH + '/assets/' + image
                    return (
                      <button key={index} type={'button'} className={'n4l-example-image'} onClick={() => handleClick_Example(path_image)}
                        disabled={model === null} aria-label={t(prefix + 'process-examples.classify-example', { index: index + 1 })}>
                        <img className={'img-fluid w-100 h-100 object-fit-cover'} src={path_image} alt={''} />
                      </button>
                    )
                  })}
                </div>
              </Card.Body>
            </Card>

            {/* SUBIR UNA IMAGEN Y DIBUJAR */}
            <Row>
              <Col className={'d-grid'} xs={12} md={isDrawable ? 6 : 12}>
                <Card className={'mt-3'} data-guide={'upload'}>
                  <Card.Header>
                    <h3>
                      <Trans i18nKey={prefix + 'process-image.title'} />
                    </h3>
                  </Card.Header>
                  <Card.Body className={'d-grid'} style={{ alignContent: 'space-between' }}>
                    <DragAndDrop
                      id={'drop-zone-image-instance'}
                      name={'doc'}
                      text={t('drag-and-drop.image')}
                      labelFiles={t('drag-and-drop.label-files-one')}
                      accept={{
                        'image/png': ['.png'],
                        'image/jpg': ['.jpg'],
                      }}
                      function_DropAccepted={handleFileUpload_Image}
                    />
                    <div className="d-flex gap-2 justify-content-center mx-auto">
                      <Button type={'button'} onClick={handleClick_ImageUploaded_Predict} variant={'primary'} disabled={model === null}>
                        <Trans i18nKey={prefix + 'process-image.validate'} />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              {isDrawable && (
                <ModelReviewImageClassificationDraw
                  canvasResultRef={canvas_original_image_ref}
                  onClassify={handleClassify_Drawing}
                  onResetExplain={clearExplainResult}
                />
              )}
            </Row>

            {/* CLASIFICACIÓN */}
            <Card className={'mt-3'} ref={result_ref} data-guide={'result'}>
              <Card.Header>
                <h3>
                  <Trans i18nKey={'Classify'} />
                </h3>
              </Card.Header>
              <Card.Body>
                {result === null && <N4LEmptyState i18nKey={'pages.playground.generator.classify.waiting'} />}
                {/* El canvas siempre está montado: las imágenes se pintan en él antes de clasificarlas */}
                <Row className={result === null ? 'd-none' : 'g-4 align-items-center'}>
                  <Col xs={12} md={4} className={'d-flex justify-content-center'}>
                    <canvas
                      id="originalImage"
                      ref={canvas_original_image_ref}
                      width={200}
                      height={200}
                      className={'nets4-border-1'}
                    ></canvas>
                  </Col>
                  <Col xs={12} md={8}>
                    {result !== null &&
                      <N4LClassificationChart values={result.values} classLabels={result.labels} actualIndex={result.actualIndex} topK={result.topK} />}
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className={'mt-3'} data-testid={'explainability-card'} data-guide={'explain'}>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h3>{t('pages.playground.0-tabular-classification.general.explain-panel-title')} ({isDrawable || explainMethod === 'lrp' ? 'LRP' : 'SHAP'})</h3>
                {!isDrawable && (
                  <div className="d-flex align-items-center gap-2">
                    <span className="small">{t('ui.explain.method')}:</span>
                    <Button
                      type="button"
                      size="sm"
                      variant={explainMethod === 'shap' ? 'primary' : 'outline-primary'}
                      onClick={() => setExplainMethod('shap')}
                    >
                      SHAP
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={explainMethod === 'lrp' ? 'primary' : 'outline-primary'}
                      onClick={() => setExplainMethod('lrp')}
                      disabled={!lrpAvailable}
                    >
                      LRP
                    </Button>
                  </div>
                )}
              </Card.Header>
              <Card.Body>
                {showExplain && explainResult && <ImageExplainResults result={explainResult} />}
                {!hasExplainInput && <N4LEmptyState i18nKey={'ui.explain.waiting-for-prediction'} />}
                <div className="mt-3">
                  {!isDrawable && explainMethod === 'shap' && (
                    <ShapImageControls idPrefix={'ic-explain'} options={shapOptions} onChange={setShapOptions} />
                  )}
                  <Button
                    type="button"
                    variant={'outline-primary'}
                    onClick={handleRequest_ExplainPrediction}
                    disabled={isCalculo || !hasExplainInput}
                    data-testid={'Test-ExplainButton'}
                    data-calculating={isCalculo}
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
      </Container>
    </>
  )
}
