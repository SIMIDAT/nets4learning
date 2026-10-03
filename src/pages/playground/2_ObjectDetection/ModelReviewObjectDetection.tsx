import 'bootstrap/dist/css/bootstrap.min.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, Col, Container, Form, Row, Button } from 'react-bootstrap'
import { Camera as IconCamera } from 'react-bootstrap-icons'
import Webcam from 'react-webcam'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { VERBOSE } from '@/CONSTANTS'
import { TASKS, UPLOAD } from '@/TASKS'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import N4LDownloadProgress from '@components/loading/N4LDownloadProgress'
import { trackDownloads } from '@core/downloadProgress'
import { askBeforeDownload } from '@core/models/downloadConsent'
import N4LMaximizeButton from '@components/maximize/N4LMaximizeButton'
import { useMaximize } from '@components/maximize/useMaximize'
import { MAP_OD_CLASSES } from '@pages/playground/2_ObjectDetection/models'
import { createReviewModelInstance } from '@core/models/createReviewModelInstance'
import { restoreTFBackend } from '@core/tfBackend'
import alertHelper from '@utils/alertHelper'
import type I_MODEL_OBJECT_DETECTION from './models/_model'
import { delay } from '@utils/utils'
import {
  ImageExplainResults,
  ShapImageControls,
  type ImageExplainResult_t,
} from '@core/explainability/ImageExplainPanel'
import { DEFAULT_SHAP_IMAGE_OPTIONS } from '@core/explainability/shapImageOptions'
import { explainErrorKey } from '@core/explainability/explainError'
import { trackEvent } from '@core/analytics'
import { runObjectDetectionExplain } from './explainPrediction/runObjectDetectionExplain'
import WebcamDeviceInfo, { type DetectionStats_t } from './WebcamDeviceInfo'
import N4LGuide from '@components/guide/N4LGuide'
import { objectDetectionReviewGuide } from './modelReviewGuide'

const WebcamComponent = (Webcam as unknown) as React.FC<any>;

// El vídeo de la cámara y el lienzo con las detecciones ocupan todo #webcamContainer y se encajan igual dentro, sin
// recortar (contain): las detecciones caen sobre el vídeo aunque el contenedor no tenga su proporción (maximizado)
// Predicciones por segundo con la cámara, como mucho
const DETECTION_FPS = 20

const WEBCAM_LAYER_STYLE: React.CSSProperties = {
  position : 'absolute',
  inset    : 0,
  width    : '100%',
  height   : '100%',
  objectFit: 'contain',
}

type ModelReviewObjectDetectionProps = {
  dataset: string
}
export default function ModelReviewObjectDetection(props: ModelReviewObjectDetectionProps) {
  const { dataset } = props
  const isWebView = navigator.userAgent.toLowerCase().indexOf('wv') !== -1

  const { t } = useTranslation()
  const navigate = useNavigate()

  const [isLoading, setLoading] = useState(true)
  const [isCameraEnable, setCameraEnable] = useState(false)
  /**
   * @type {ReturnType<typeof useState<'denied' | 'granted' | 'prompt'>>}
   */
  const [cameraPermission, setCameraPermission] = useState('prompt')
  const [processImage, setProcessImage] = useState({
    isProcessing: false,
    isProcessed : false,
  })

  const [deviceId, setDeviceId] = useState('default')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

  const [iModelInstance, setIModelInstance] = useState<I_MODEL_OBJECT_DETECTION | null>(null)
  // Proporción (ancho / alto) de los fotogramas de la cámara: la toma su contenedor, así el vídeo lo llena sin bandas.
  // Sale del propio vídeo y no de getSettings().aspectRatio, que Firefox no da (el contenedor quedaba cuadrado)
  const [cameraAspect, setCameraAspect] = useState(16 / 9)
  // La tarjeta de la cámara, a pantalla completa
  const webcamMaximize = useMaximize()
  // Predicciones hechas con la cámara y lo que han tardado: los lee la información del dispositivo
  const detectionStats_ref = useRef<DetectionStats_t>({ predictions: 0, totalMs: 0 })
  // Guía paso a paso de la página (con voz): solo con el botón "Guía"
  const guideSteps = useMemo(() => (iModelInstance === null ? null : objectDetectionReviewGuide(t, dataset)), [t, dataset, iModelInstance])

  /**
   * @type {ReturnType<typeof useRef<number>>}
   */
  const requestAnimation_ref = useRef<number>(null)
  /**
   * @type {ReturnType<typeof useRef<HTMLDivElement>>}
   */
  const WebCamContainer_ref = useRef<HTMLDivElement>(null)
  /**
   * @type {ReturnType<typeof useRef<Webcam>>}
   */
  const WebCam_ref = useRef<Webcam>(null)
  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const canvas_ref = useRef<HTMLCanvasElement>(null)
  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const canvasImage_ref = useRef<HTMLCanvasElement>(null)
  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>} 
   */
  const originalCanvas_ref = useRef<HTMLCanvasElement>(null);
  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const processCanvas_ref = useRef<HTMLCanvasElement>(null);

  // === Explicabilidad (SHAP) ===
  const imgData_ref = useRef<ImageData | null>(null)
  const [explainResult, setExplainResult] = useState<ImageExplainResult_t | null>(null)
  const [showExplain, setShowExplain] = useState(false)
  const [isCalculo, setIsCalculo] = useState(false)
  const [shapOptions, setShapOptions] = useState({ ...DEFAULT_SHAP_IMAGE_OPTIONS, maskValue: 0 })


  const handleDevices = useCallback(async () => {
    if (VERBOSE) console.debug('useCallback[handleDevices]')
    if (!navigator?.mediaDevices?.getUserMedia) {
      console.warn('navigator.mediaDevices.getUserMedia is not supported')
      return
    }
    if (!navigator?.mediaDevices?.enumerateDevices) {
      console.warn('navigator.mediaDevices.enumerateDevices is not supported')
      return
    }
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    })
    mediaStream.getTracks().forEach((track) => {
      track.stop()
    })
    const mediaDevices: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices()
    setDevices(mediaDevices.filter(({ kind }) => kind === 'videoinput'))
  }, [setDevices])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[]')

    async function checkCameraPermission() {
      if (isWebView) {
        await handleDevices()
      }
      if (!navigator?.permissions?.query) {
        console.error('navigator.permissions.query | not supported.')
        return
      }
      const permission = await navigator.permissions.query({ name: 'camera' })
      setCameraPermission(permission.state)

      if (permission.state === 'prompt' || permission.state === 'denied') {
        setDevices([])
      }
      if (permission.state === 'granted') {
        await handleDevices()
      }
      permission.onchange = async (ev) => {
        if (VERBOSE) console.debug(`permission state has changed to ${permission.state}`, {
          ev: ev,
        })
        setCameraPermission(permission.state)

        if (permission.state === 'granted') {
          setDeviceId('default')
          await handleDevices()
        }
        if (permission.state === 'prompt' || permission.state === 'denied') {
          setDeviceId('default')
          setDevices([])
          setCameraEnable(false)
        }
      }
    }

    checkCameraPermission().then(() => undefined)
  }, [isWebView, handleDevices])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init][ dataset, t, history ]')
    async function init() {
      // Los modelos de pose (pose-detection) registran WebGPU con más prioridad: se vuelve al backend elegido en el menú
      await restoreTFBackend()
      const _iModelInstance = await createReviewModelInstance(MAP_OD_CLASSES, dataset, (ModelClass) => new ModelClass(t), navigate)
      if (_iModelInstance === null) return
      try {
        setIModelInstance(_iModelInstance)
        // Con ahorro de datos o conexión lenta, antes se pregunta; luego, con el progreso real (COCO-SSD pesa unos 18 MB)
        await askBeforeDownload(TASKS.OBJECT_DETECTION, dataset)
        await trackDownloads(() => _iModelInstance.ENABLE_MODEL(), 'model_load')
        setLoading(false)
        await alertHelper.alertSuccess(t('model-loaded-successfully'))
      } catch (error) {
        console.error('Error', error)
      }
    }

    init().then(() => undefined)

    return () => { }
  }, [dataset, t, navigate])


  const processWebcam = useCallback(() => {
    if (
      WebCam_ref.current === null ||
      WebCam_ref.current.video === null ||
      WebCam_ref.current.video.readyState !== 4 ||
      typeof WebCam_ref.current === 'undefined'
    ) {
      return null
    }
    if (
      canvas_ref.current === null ||
      typeof canvas_ref.current === 'undefined'
    ) {
      return null
    }
    // Get Video Properties
    const video = WebCam_ref.current.video

    // Set canvas width (solo si cambia: asignarlo, aunque sea el mismo valor, vuelve a crear el lienzo)
    if (canvas_ref.current.width !== video.videoWidth) canvas_ref.current.width = video.videoWidth
    if (canvas_ref.current.height !== video.videoHeight) canvas_ref.current.height = video.videoHeight

    const ctx = canvas_ref.current.getContext('2d') as CanvasRenderingContext2D
    ctx.clearRect(0, 0, canvas_ref.current.width, canvas_ref.current.height)
    // ctx.setTransform(-1, 0, 0, 1, canvas_ref.current.width, 0)

    return { ctx, video }
  }, [])

  /**
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {ImageData|HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input_img_or_video 
   * @param {{ flipHorizontal: boolean }} config 
   */
  const processData = useCallback(async (
    ctx: CanvasRenderingContext2D,
    input_img_or_video: ImageData | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    config: { flipHorizontal: boolean }
  ) => {
    if (iModelInstance === null) return
    const predictions = await iModelInstance.PREDICTION(input_img_or_video, config)
    iModelInstance.RENDER(ctx, predictions)
  }, [iModelInstance])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[isCameraEnable]', { isCameraEnable })
    if (isCameraEnable === false) {
      if (VERBOSE) console.debug(`stop AnimationFrame(${requestAnimation_ref.current});`)
      if (requestAnimation_ref.current !== null) {
        cancelAnimationFrame(requestAnimation_ref.current)
      }
    }

    // La predicción puede acabar después de apagar la cámara o cambiar de modelo: entonces no se pinta
    let isCancelled = false
    try {
      const fps = DETECTION_FPS
      let fpsInterval: number, now: number, then: number, elapsed: number
      // Una predicción cada vez: si la anterior no ha terminado se salta el fotograma. Si no, mientras el modelo
      // espera a la GPU (lecturas asíncronas) empezaban predicciones nuevas que se pisaban y el vídeo iba a saltos.
      let isPredicting = false
      const animate = async () => {
        if (isCameraEnable) {
          requestAnimation_ref.current = requestAnimationFrame(animate)
          now = Date.now()
          elapsed = now - then
          const video = WebCam_ref.current?.video
          if (elapsed > fpsInterval && !isPredicting && iModelInstance !== null && video?.readyState === 4) {
            then = now - (elapsed % fpsInterval)
            isPredicting = true
            try {
              const start = performance.now()
              const predictions = await iModelInstance.PREDICTION(video, { flipHorizontal: iModelInstance.mirror ?? false })
              detectionStats_ref.current.predictions += 1
              detectionStats_ref.current.totalMs += performance.now() - start
              if (isCancelled) return
              // El canvas se limpia justo antes de pintar: limpiarlo antes de predecir lo dejaba vacío mientras tanto
              const _processWebcam = processWebcam()
              if (_processWebcam !== null) iModelInstance.RENDER(_processWebcam.ctx, predictions)
            } catch (error) {
              console.error(error)
            } finally {
              isPredicting = false
            }
          }
        }
      }
      // Comienza la animación al cargar el componente
      const startAnimating = async (fps: number) => {
        fpsInterval = 1000 / fps
        then = Date.now()
        await animate()
        if (VERBOSE) console.debug('start animation')
      }
      startAnimating(fps)
    } catch (error) {
      console.error(error)
      if (requestAnimation_ref.current !== null) {
        cancelAnimationFrame(requestAnimation_ref.current)
      }
    }

    // Limpia la animación cuando el componente se desmonta
    return () => {
      if (VERBOSE) console.debug(`delete AnimationFrame(${requestAnimation_ref.current});`)
      isCancelled = true
      if (requestAnimation_ref.current !== null) {
        cancelAnimationFrame(requestAnimation_ref.current)
      }
    }
  }, [isCameraEnable, iModelInstance, processWebcam])

  // Analíticas: cuánto tiempo se usa la cámara en tiempo real
  useEffect(() => {
    if (!isCameraEnable) return
    const startedAt = performance.now()
    trackEvent('webcam_start')
    return () => trackEvent('webcam_end', { duration_sec: Math.round((performance.now() - startedAt) / 1000) })
  }, [isCameraEnable])

  const handleChange_Camera = (e: React.ChangeEvent<HTMLInputElement>) => {
    const webcamChecked = e.target.checked
    setCameraEnable(!!webcamChecked)
  }

  const handleChange_Device = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const _deviceId = e.target.value
    setDeviceId(_deviceId)
  }

  // La cámara ya emite: el permiso está concedido aunque permissions.query no lo diga (Firefox, con el permiso dado
  // solo para esta visita, sigue diciendo "prompt": el selector pedía permisos y la lista de cámaras se quedaba vacía)
  const handleUserMedia = async () => {
    setCameraPermission('granted')
    if (!navigator?.mediaDevices?.enumerateDevices) return
    const mediaDevices = await navigator.mediaDevices.enumerateDevices()
    setDevices(mediaDevices.filter(({ kind }) => kind === 'videoinput'))
  }

  // Al llegar los primeros fotogramas y cada vez que cambian de tamaño (otra cámara, el móvil girado)
  const handleVideoSize = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const { videoWidth, videoHeight } = event.currentTarget
    if (videoWidth > 0 && videoHeight > 0) setCameraAspect(videoWidth / videoHeight)
  }

  const onUserMediaErrorEvent = (error: any) => {
    console.error({ error })
    if (requestAnimation_ref.current !== null) {
      cancelAnimationFrame(requestAnimation_ref.current)
    }

  }

  const handleClick_getScreenshot = async () => {
    if (WebCam_ref.current === null) {
      console.error('WebCam_ref.current is null')
      return
    }
    const imageSrc = WebCam_ref.current.getCanvas()?.toDataURL('image/png')
    if (!imageSrc) {
      console.error('Webcam canvas not available')
      return
    }
    // Descarga la captura como fichero
    const a = document.createElement('a')
    a.href = imageSrc
    a.download = 'Image'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleChangeFileUpload = async (_files: File[]) => {
    if (!_files.length) return;

    if (VERBOSE) {
      console.debug('ModelReviewObjectDetection -> handleChangeFileUpload', { _files });
    }

    // 1. Get Canvas Elements via Refs (Recommended React way)
    // Ensure these refs are defined at the top of your component
    const originalCanvas = originalCanvas_ref.current;
    const processCanvas = processCanvas_ref.current;
    const resultCanvas = canvasImage_ref.current;

    if (!originalCanvas || !resultCanvas || !processCanvas) {
      console.error("Canvas references not found");
      return;
    }

    const originalCtx = originalCanvas.getContext('2d');
    const resultCtx = resultCanvas.getContext('2d');

    if (!originalCtx || !resultCtx) {
      console.error("Canvas 2D context not available");
      return;
    }

    if (iModelInstance === null) {
      console.error("Model not loaded");
      return;
    }

    // 2. Reload Model
    await iModelInstance.ENABLE_MODEL();

    const objectUrl = URL.createObjectURL(_files[0]);
    const img = new Image();

    img.onload = async () => {
      try {
        setProcessImage({ isProcessing: true, isProcessed: false });

        const { width, height } = img;

        // Sync canvas dimensions
        [originalCanvas, processCanvas, resultCanvas].forEach(canvas => {
          canvas.width = width;
          canvas.height = height;
        });

        // Draw original image
        originalCtx.drawImage(img, 0, 0, width, height);

        // FIX: Changed second 'width' to 'height'
        const imgData = originalCtx.getImageData(0, 0, width, height);

        // Guardamos la imagen para la explicabilidad y descartamos la explicación anterior
        imgData_ref.current = imgData
        setExplainResult(null)
        setShowExplain(false)

        // Draw result image
        resultCtx.drawImage(img, 0, 0, width, height);

        // Process detection
        // Una imagen subida no se muestra en espejo (la webcam sí): nunca se refleja.
        await processData(resultCtx, imgData, { flipHorizontal: false });
        trackEvent('predict', { input: 'image' })

        await delay(2000); // Artificial delay if needed for UI/UX

        setProcessImage({ isProcessing: false, isProcessed: true });
      } catch (error) {
        console.error("Processing failed:", error);
        setProcessImage({ isProcessing: false, isProcessed: false });
      } finally {
        // 3. Clean up memory
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      console.error('Error: Failed to load image from file.');
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  };

  const disabledPermissionsCamera = () => {
    if (isWebView) {
      const permissionsInWebview = devices.length > 0
      return isLoading || isCameraEnable || !permissionsInWebview
    }
    if (!isWebView) {
      return (
        isLoading ||
        isCameraEnable ||
        cameraPermission === 'denied' ||
        cameraPermission === 'prompt'
      )
    }
    return isLoading || isCameraEnable || isWebView
  }

  const handleRequest_ExplainPrediction = async () => {
    if (showExplain) {
      setShowExplain(false)
      return
    }

    const imageData = imgData_ref.current
    if (!imageData || iModelInstance === null) {
      await alertHelper.alertInfo(t('info.insert-input'))
      return
    }

    trackEvent('explain', { method: 'shap' })
    setIsCalculo(true)
    try {
      const result = await runObjectDetectionExplain({
        model: iModelInstance,
        imageData,
        ...shapOptions,
      })

      setExplainResult({
        method            : 'shap',
        values            : result.shapValues,
        labels            : result.selectedLabels,
        labelTexts        : result.labelTexts,
        galleryImages     : result.debugImages,
        imageSrc          : canvasImage_ref.current?.toDataURL(),
        segmentationMap   : result.segmentationMapArray,
        segmentationWidth : imageData.width,
        segmentationHeight: imageData.height,
        baseValues        : result.baseValues,
        predictedValues   : result.predictedValues,
        segmentLabelKeys  : result.segmentLabelKeys,
        noteKey           : iModelInstance.EXPLAIN_NOTE_KEY,
      })
      setShowExplain(true)
    } catch (error) {
      console.error('Error calculating explainability', { error })
      await alertHelper.alertError(t(explainErrorKey(error)))
    } finally {
      setIsCalculo(false)
    }
  }

  if (VERBOSE) console.debug('render ModelReviewObjectDetection')
  return (
    <>
      <Container className={'n4l-container-wide'} id={'ModelReviewObjectDetection'} data-testid={'Test-ModelReviewObjectDetection'}>
        <Row className={'mt-2'}>
          <Col>
            <h1>
              <Trans i18nKey={'modality.2'} />
            </h1>
          </Col>
        </Row>

        <Row>
          <Col>
            <N4LDownloadProgress isLoading={isLoading} />
          </Col>
        </Row>

        <Row>
          <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
            <div className={'sticky-top'} style={{ zIndex: 0 }}>
              <Card className={'mt-3 mb-3 border-info'} data-guide={'model'}>
                <Card.Header
                  className={'d-flex align-items-center justify-content-between'}
                >
                  <h2>
                    {iModelInstance !== null && <Trans i18nKey={iModelInstance.TITLE} />}
                  </h2>
                </Card.Header>
                <Card.Body>
                  {guideSteps !== null && <N4LGuide id={'object-detection.' + dataset} steps={guideSteps} />}
                  {dataset !== UPLOAD && iModelInstance?.DESCRIPTION()}
                </Card.Body>
              </Card>

              {/* Panel narrativo del método (idéntico patrón al review tabular). OD usa SHAP. */}
              <Card className={'mb-3 border-success'} data-guide={'explain-about'}>
                <Card.Header>
                  <h2 className={'h5 mb-0'}>
                    <Trans i18nKey={'pages.playground.0-tabular-classification.general.explain-panel-title'} />
                  </h2>
                </Card.Header>
                <Card.Body>
                  <p className={'small mb-0'}>{t('ui.explain.about-shap')}</p>
                </Card.Body>
              </Card>
            </div>
          </Col>

          <Col xs={12} sm={12} md={12} xl={9} xxl={9}>
            <Col xs={12} sm={12} md={12} xl={12} xxl={12}>
              <Card className={'mt-3 ' + webcamMaximize.className} data-testid={'Test-WebcamCard'} data-guide={'webcam'}>
                <Card.Header className={'d-flex align-items-center justify-content-between'}>
                  <h3>
                    <Trans i18nKey='datasets-models.2-object-detection.interface.process-webcam.title' />
                  </h3>
                  <div className={'d-flex align-items-center gap-2 n4l-card-header-controls'} data-guide={'webcam-controls'}>

                    <div key={'default-switch'}>
                      <Form.Check
                        type="switch"
                        id={'default-switch'}
                        reverse={true}
                        name={'switch-webcam'}
                        label={t(
                          'datasets-models.2-object-detection.interface.process-webcam.button'
                        )}
                        checked={isCameraEnable}
                        disabled={isLoading || cameraPermission === 'denied'}
                        onChange={handleChange_Camera}
                      />
                    </div>
                    <Form.Group
                      controlId={'select-device'}
                      className={'flex-grow-1'}
                    >
                      <Form.Select
                        aria-label={'select-device'}
                        size={'sm'}
                        value={deviceId}
                        disabled={disabledPermissionsCamera()}
                        onChange={handleChange_Device}
                      >
                        {isWebView && (
                          <>
                            <option value={'default'} disabled>
                              <Trans
                                i18nKey={'Default Android permissions'}
                              />
                            </option>
                          </>
                        )}
                        {!isWebView && (
                          <>
                            {cameraPermission === 'granted' && (
                              <option value={'default'} disabled>
                                <Trans i18nKey={'Default'} />
                              </option>
                            )}
                            {(cameraPermission === 'prompt' ||
                              cameraPermission === 'denied') && (
                                <option value={'default'} disabled>
                                  <Trans i18nKey={'Need permissions'} />
                                </option>
                              )}
                          </>
                        )}
                        {devices.map((device, index) => {
                          return (
                            <option
                              key={'device-id-' + index}
                              value={device.deviceId}
                            >
                              {device.label !== ''
                                ? device.label
                                : 'Camera ' + index}
                            </option>
                          )
                        })}
                      </Form.Select>
                    </Form.Group>
                    <Button size={'sm'}
                      disabled={!isCameraEnable}
                      variant={'outline-primary'}
                      aria-label={t('ui.take-screenshot')}
                      title={t('ui.take-screenshot')}
                      onClick={handleClick_getScreenshot}>
                      <IconCamera aria-hidden={true} />
                    </Button>
                    <N4LMaximizeButton maximized={webcamMaximize.maximized} onToggle={webcamMaximize.toggle} />
                  </div>
                </Card.Header>
                <Card.Body>
                  {/* Con la cámara encendida sobra: ya se ve */}
                  {!isCameraEnable && <Card.Title className={'text-center'}>
                    <Trans
                      i18nKey={
                        'datasets-models.2-object-detection.interface.process-webcam.sub-title'
                      }
                    />
                  </Card.Title>}
                  {/* Directamente en el cuerpo de la tarjeta: maximizada, la cámara ocupa el alto que queda y el vídeo y
                      el lienzo (con su tamaño y object-fit: contain) se encajan igual dentro */}
                  {isCameraEnable && (
                    <div
                      id={'webcamContainer'}
                      ref={WebCamContainer_ref}
                      className={'ratio n4l-maximized-fill'}
                      style={{
                        position           : 'relative',
                        overflow           : 'hidden',
                        // El alto de .ratio de Bootstrap, con la proporción exacta de la cámara
                        '--bs-aspect-ratio': `${100 / cameraAspect}%`,
                      } as React.CSSProperties}
                    >
                      <WebcamComponent
                        ref={WebCam_ref}
                        forceScreenshotSourceSize={true}
                        onUserMedia={handleUserMedia}
                        onUserMediaError={onUserMediaErrorEvent}
                        onLoadedMetadata={handleVideoSize}
                        onResize={handleVideoSize}
                        videoConstraints={{
                          deviceId: deviceId,
                          width   : {
                            min  : 640,
                            ideal: 1280,
                            max  : 1920
                          },
                          height: {
                            min  : 480,
                            ideal: 720,
                            max  : 1080
                          }
                        }}
                        mirrored={iModelInstance?.mirror ?? false}
                        style={WEBCAM_LAYER_STYLE}
                      />
                      <canvas ref={canvas_ref} style={WEBCAM_LAYER_STYLE}></canvas>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer data-guide={'device-info'}>
                  <WebcamDeviceInfo getVideo={() => WebCam_ref.current?.video}
                    devices={devices}
                    cameraPermission={cameraPermission}
                    isWebView={isWebView}
                    mirrored={iModelInstance?.mirror ?? false}
                    model={iModelInstance ? t(iModelInstance.TITLE) : '—'}
                    fpsLimit={DETECTION_FPS}
                    stats={detectionStats_ref} />
                </Card.Footer>
              </Card>
            </Col>

            <Col xs={12} sm={12} md={12} xl={12} xxl={12}>
              <Card className={'mt-3'} data-guide={'image'}>
                <Card.Header>
                  <h3>
                    <Trans
                      i18nKey={
                        'datasets-models.2-object-detection.interface.process-image.title'
                      }
                    />
                  </h3>
                </Card.Header>
                <Card.Body>
                  <Card.Title>
                    <Trans
                      i18nKey={
                        'datasets-models.2-object-detection.interface.process-image.sub-title'
                      }
                    />
                  </Card.Title>
                  <Container fluid={true} id={'container-canvas'}>
                    <Row className={'mt-3'}>
                      <Col>
                        <DragAndDrop
                          id={'drop-zone-object-detection'}
                          name={'doc'}
                          text={t('drag-and-drop.image')}
                          labelFiles={t('drag-and-drop.label-files-one')}
                          accept={{
                            'image/png' : ['.png'],
                            'image/jpg' : ['.jpg'],
                            'image/webp': ['.webp'],
                          }}
                          function_DropAccepted={handleChangeFileUpload}
                        />
                      </Col>
                    </Row>
                    <hr />
                    {processImage.isProcessing && <>
                      <Trans>Loading</Trans>
                    </>}
                    <Row
                      className={'mt-3'}
                      style={{
                        display : processImage.isProcessed ? '' : 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        // paddingBottom: '56.25%'
                      }}
                    >
                      <Col className={'col-12 d-flex justify-content-center'}>
                        <canvas
                          id="0_originalImageCanvas"
                          ref={originalCanvas_ref}
                          className={'d-none'}
                          width={250}
                          height={250}
                        ></canvas>
                      </Col>
                      <Col className={'col-12 d-flex justify-content-center'}>
                        <canvas
                          id="1_processImageCanvas"
                          ref={processCanvas_ref}
                          className={'d-none'}
                          width={250}
                          height={250}
                        ></canvas>
                      </Col>
                      <Col className={'col-12 d-flex justify-content-center'}>
                        <canvas
                          id="resultCanvas"
                          ref={canvasImage_ref}
                          className={'ratio'}
                          style={{
                            //position: 'absolute',
                            width : '100%',
                            height: '100%',
                          }}
                        ></canvas>
                      </Col>
                    </Row>
                  </Container>
                </Card.Body>
              </Card>

              <Card className={'mt-3'} data-testid={'explainability-card'} data-guide={'explain'}>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h3>{t('ui.explain.title')}</h3>
                </Card.Header>
                <Card.Body>
                  {showExplain && explainResult && (
                    <ImageExplainResults result={explainResult} />
                  )}

                  <div className="mt-3">
                    <ShapImageControls idPrefix={'od-explain'} options={shapOptions} onChange={setShapOptions} />
                    <Button
                      type="button"
                      variant={'outline-primary'}
                      onClick={handleRequest_ExplainPrediction}
                      disabled={isCalculo || !processImage.isProcessed}
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
          </Col>
        </Row>
      </Container>
    </>
  )
}
