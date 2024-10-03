import 'bootstrap/dist/css/bootstrap.min.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, Col, Container, Form, Row, Button } from 'react-bootstrap'
import { Camera as IconCamera } from 'react-bootstrap-icons'
import ReactGA from 'react-ga4'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import Webcam from 'react-webcam'
import * as tfjs from '@tensorflow/tfjs'

import { VERBOSE } from '@/CONSTANTS'
import { UPLOAD } from '@/DATA_MODEL'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import FakeProgressBar from '@components/loading/FakeProgressBar'
import { MAP_OD_CLASSES } from '@pages/playground/2_ObjectDetection/models'
import alertHelper from '@utils/alertHelper'
import I_MODEL_OBJECT_DETECTION from './models/_model'
import { delay } from '@/utils/utils'

tfjs.setBackend('webgl').then(() => {
  // console.debug('setBackend: WebGL')
})

/**
 * @typedef {'ratio-9x16'|'ratio-2x3'|'ratio-3x4'|'ratio-1x1'|'ratio-4x3'|'ratio-3x2'|'ratio-16x9'} Ratio_t
 */

export default function ModelReviewObjectDetection({ dataset }) {
  const isWebView = navigator.userAgent.toLowerCase().indexOf('wv') !== -1

  const { t } = useTranslation()
  const history = useHistory()

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
  const [devices, setDevices] = useState([])

  const iModelRef = useRef(new I_MODEL_OBJECT_DETECTION(t))
  /**
   * @type {ReturnType<typeof useState<Ratio_t>>}
   */
  const [ratioCamera, setRatioCamera] = useState('ratio-16x9' )
  const requestAnimation_ref = useRef()
  /**
   * @type {ReturnType<typeof useRef<HTMLDivElement>>}
   */
  const WebCamContainer_ref = useRef(null)
  /**
   * @type {ReturnType<typeof useRef<Webcam>>}
   */
  const WebCam_ref = useRef(null)
  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const canvas_ref = useRef(null)
  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const canvasImage_ref = useRef(null)

  useEffect(() => {
    ReactGA.send({
      hitType: 'pageview',
      page   : '/ModelReviewObjectDetection/' + dataset,
      title  : dataset,
    })
  }, [dataset])

  const handleDevices = useCallback(async () => {
    if (VERBOSE) console.debug('useCallback[handleDevices]')
    if (!navigator?.mediaDevices?.getUserMedia) {
      console.log('not support navigator?.mediaDevices?.getUserMedia')
      return
    }
    if (!navigator?.mediaDevices?.enumerateDevices) {
      console.log('not support navigator?.mediaDevices?.enumerateDevices')
      return
    }
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    })
    mediaStream.getTracks().forEach((track) => {
      track.stop()
    })
    const mediaDevices = await navigator.mediaDevices.enumerateDevices()
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
        console.log(`permission state has changed to ${permission.state}`, {
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
    if (VERBOSE) console.debug('useEffect[dataset, t]')

    async function init() {
      await tfjs.ready()
      if (tfjs.getBackend() !== 'webgl') {
        console.error(
          'Error tensorflow backend webgl not installed in your browser'
        )
        return
      }
      try {
        if (dataset === UPLOAD) {
          console.error('Error, data set not valid')
        } else if (dataset in MAP_OD_CLASSES) {
          const _iModelClass = MAP_OD_CLASSES[dataset]
          iModelRef.current = new _iModelClass(t)
          await iModelRef.current.ENABLE_MODEL()
          setLoading(false)
          await alertHelper.alertSuccess(t('model-loaded-successfully'))
        } else {
          console.error('Error, option not valid', { ID: dataset })
          history.push('/404')
        }
      } catch (error) {
        console.error('Error', error)
      }
    }

    init().then(() => undefined)

    return () => {}
  }, [dataset, t, history])

  // useEffect(() => {
  //   const eventListener = (event) => {
  //     const type = event.target.type;
  //     if (type.includes('landscape')) {
  //       switch (ratioCamera) {
  //         case 'ratio-9x16':
  //           setRatioCamera('ratio-16x9');
  //           break;
  //         case 'ratio-3x4':
  //           setRatioCamera('ratio-4x3');
  //           break;
  //         case 'ratio-2x3':
  //           setRatioCamera('ratio-3x2');
  //           break;
  //       }
  //     } else {
  //       switch (ratioCamera) {
  //         case 'ratio-16x9':
  //           setRatioCamera('ratio-9x16');
  //           break;
  //         case 'ratio-4x3':
  //           setRatioCamera('ratio-3x4');
  //           break;
  //         case 'ratio-3x2':
  //           setRatioCamera('ratio-2x3');
  //           break;
  //       }
  //     }
  //   }
  //   screen.orientation.addEventListener('change', eventListener);
  //   return () => {
  //     screen.orientation.removeEventListener('change', eventListener);
  //   }
  // }, [/*ratioCamera*/]);

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[isCameraEnable]', { isCameraEnable })
    if (isCameraEnable === false) {
      console.debug(`stop AnimationFrame(${requestAnimation_ref.current});`)
      cancelAnimationFrame(requestAnimation_ref.current)
    }

    try {
      let fps = 20
      let fpsInterval, now, then, elapsed
      const animate = async () => {
        if (isCameraEnable) {
          requestAnimation_ref.current = requestAnimationFrame(animate)
          now = Date.now()
          elapsed = now - then
          if (elapsed > fpsInterval) {
            then = now - (elapsed % fpsInterval)
            const _processWebcam = processWebcam()
            if (_processWebcam !== null)
              await processData(_processWebcam.ctx, _processWebcam.video, { flipHorizontal: true })
          }
        }
      }
      // Comienza la animación al cargar el componente
      const startAnimating = async (fps) => {
        fpsInterval = 1000 / fps
        then = Date.now()
        await animate()
        console.debug('start animation')
      }
      startAnimating(fps)
    } catch (error) {
      console.error(error)
      cancelAnimationFrame(requestAnimation_ref.current)
    }

    // Limpia la animación cuando el componente se desmonta
    return () => {
      console.log(`delete AnimationFrame(${requestAnimation_ref.current});`)
      cancelAnimationFrame(requestAnimation_ref.current)
    }
  }, [isCameraEnable])

  const processWebcam = () => {
    if (
      WebCam_ref.current === null ||
      typeof WebCam_ref.current === 'undefined' ||
      WebCam_ref.current.video.readyState !== 4
    ) {
      return null
    }
    // Get Video Properties
    const video = WebCam_ref.current.video

    // Set canvas width
    canvas_ref.current.width = WebCam_ref.current.video.videoWidth
    canvas_ref.current.height = WebCam_ref.current.video.videoHeight

    const ctx = canvas_ref.current.getContext('2d')
    ctx.clearRect(0, 0, canvas_ref.current.width, canvas_ref.current.height)
    // ctx.setTransform(-1, 0, 0, 1, canvas_ref.current.width, 0)

    return { ctx, video }
  }

  /**
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {ImageData|HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input_img_or_video 
   * @param {{ flipHorizontal: boolean }} config 
   */
  const processData = async (ctx, input_img_or_video, config) => {
    const predictions = await iModelRef.current.PREDICTION(input_img_or_video, config)
    iModelRef.current.RENDER(ctx, predictions)
  }

  const handleChange_Camera = (e) => {
    const webcamChecked = e.target.checked
    setCameraEnable(!!webcamChecked)
  }

  const handleChange_Device = (e) => {
    const _deviceId = e.target.value
    setDeviceId(_deviceId)
  }

  const onUserMediaEvent = (mediaStream) => {
    const aspectRatio = mediaStream.getVideoTracks()[0].getSettings().aspectRatio || 1
    if (aspectRatio >= 0.5 && aspectRatio < 0.6) {
      setRatioCamera('ratio-9x16')
    } else if (aspectRatio >= 0.6 && aspectRatio < 0.7) {
      setRatioCamera('ratio-2x3')
    } else if (aspectRatio >= 0.7 && aspectRatio < 0.8) {
      setRatioCamera('ratio-3x4')
    } else if (aspectRatio === 1) {
      setRatioCamera('ratio-1x1')
    } else if (aspectRatio >= 1.3 && aspectRatio < 1.4) {
      setRatioCamera('ratio-4x3')
    } else if (aspectRatio >= 1.4 && aspectRatio < 1.6) {
      setRatioCamera('ratio-3x2')
    } else if (aspectRatio >= 1.7 && aspectRatio < 1.8) {
      setRatioCamera('ratio-16x9')
    } else {
      setRatioCamera('ratio-1x1')
    }
    // mediaStream.scale(-1, 1)
  }

  const onUserMediaErrorEvent = (error) => {
    console.error({ error })
    cancelAnimationFrame(requestAnimation_ref.current)
  }

  const handleClick_getScreenshot = async () => {
    //const imageSrc = WebCam_ref.current.getScreenshot()
    const imageSrc = WebCam_ref.current.getCanvas().toDataURL('image/png"')
    const img = new Image()
    img.src = imageSrc
    img.download = imageSrc
    const a = document.createElement('a')
    a.innerHTML = ' '
    a.target = '_blank'
    a.href = img.src
    a.download = 'Image'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleChangeFileUpload = async (_files) => {
    if (VERBOSE) { 
      console.debug('ModelReviewObjectDetection -> handleChangeFileUpload', { _files })
    }
    let files = _files

    /**
     * @type {HTMLCanvasElement}
     */
    const originalImageCanvas = (/** @type {HTMLCanvasElement} */(document.getElementById('0_originalImageCanvas')))
    const originalImageCanvas_ctx = originalImageCanvas.getContext('2d')

    const processImageCanvas = (/** @type {HTMLCanvasElement} */(document.getElementById('1_processImageCanvas')))
    //const processImageCanvas_ctx = processImageCanvas.getContext('2d')

    const resultCanvas = canvasImage_ref.current
    const resultCanvas_ctx = resultCanvas.getContext('2d')
    //const { width, height } = document.getElementById('container-canvas').getBoundingClientRect()

    //let designer_width = width
    //let designer_height = height

    // For bug fix, you need to reload the model :/
    await iModelRef.current.ENABLE_MODEL()

    async function draw() {

      try {
        setProcessImage({
          isProcessing: true,
          isProcessed : false,
        })
        const width = this.width
        const height = this.height
        originalImageCanvas.width = this.width
        originalImageCanvas.height = this.height
        processImageCanvas.width = this.width
        processImageCanvas.height = this.height
        resultCanvas.width = this.width
        resultCanvas.height = this.height
        originalImageCanvas_ctx.drawImage(this, 0, 0, width, height)
        const imgData = originalImageCanvas_ctx.getImageData(0, 0, width, width)
        //await processData(processImageCanvas_ctx, imgData, { flipHorizontal: false })
        resultCanvas_ctx.drawImage(this, 0, 0, width, height)
        await processData(resultCanvas_ctx, imgData, { flipHorizontal: false })
        await delay(2000)
        
      } catch (error) {
        setProcessImage({
          isProcessing: true,
          isProcessed : false,
        })
      } finally {
        setProcessImage({
          isProcessing: false,
          isProcessed : true,
        })
      }

    }

    function failed() {
      console.error('Error, not created the image')
    }

    const img = new Image()
    img.src = URL.createObjectURL(files[0])
    img.onload = draw
    img.onerror = failed
  }

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

  if (VERBOSE) console.debug('render ModelReviewObjectDetection')
  return (
    <>
      <Container id={'ModelReviewObjectDetection'} data-testid={'Test-ModelReviewObjectDetection'}>
        <Row className={'mt-2'}>
          <Col>
            <h1>
              <Trans i18nKey={'modality.2'} />
            </h1>
          </Col>
        </Row>

        <Row>
          <Col>
            <FakeProgressBar isLoading={isLoading} />
          </Col>
        </Row>

        <Row>
          <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
            <Card className={'sticky-top mt-3 mb-3 border-info'}>
              <Card.Header
                className={'d-flex align-items-center justify-content-between'}
              >
                <h2>
                  <Trans i18nKey={iModelRef.current.TITLE} />
                </h2>
                {/*{process.env.REACT_APP_SHOW_NEW_FEATURE === 'true' &&*/}
                {/*  <div className="d-flex">*/}
                {/*    <Button size={'sm'}*/}
                {/*            variant={'outline-info'}*/}
                {/*            onClick={handleClick_openSummary}>Summary</Button>*/}
                {/*  </div>*/}
                {/*}*/}
              </Card.Header>
              <Card.Body>
                {dataset !== UPLOAD && <>{iModelRef.current.DESCRIPTION()}</>}
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={12} xl={9} xxl={9}>
            <Col xs={12} sm={12} md={12} xl={12} xxl={12}>
              <Card className={'mt-3'}>
                <Card.Header>
                  <div className='d-flex align-items-center justify-content-between'>
                    <h3>
                      <Trans i18nKey='datasets-models.2-object-detection.interface.process-webcam.title' />
                    </h3>
                    <div className='d-flex align-items-center justify-content-end'>
                 
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
                          onChange={(e) => handleChange_Camera(e)}
                        />
                      </div>
                      <Form.Group
                        controlId={'select-device'}
                        className={'ms-3 w-50'}
                      >
                        <Form.Select
                          aria-label={'select-device'}
                          size={'sm'}
                          value={deviceId}
                          disabled={disabledPermissionsCamera()}
                          onChange={(e) => handleChange_Device(e)}
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
                          className='ms-2'
                          variant={'outline-info'}
                          onClick={handleClick_getScreenshot}>
                              <IconCamera  color="royalblue"/>
                          </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Card.Title className={'text-center'}>
                    <Trans
                      i18nKey={
                        'datasets-models.2-object-detection.interface.process-webcam.sub-title'
                      }
                    />
                  </Card.Title>
                  <Row className={'mt-3'}>
                    <Col>
                      {isCameraEnable && (
                        <>
                          <div
                            id={'webcamContainer'}
                            ref={WebCamContainer_ref}
                            className={'ratio ' + ratioCamera}
                            style={{
                              position: 'relative',
                              overflow: 'hidden',
                              // paddingBottom: '56.25%'
                            }}
                          >
                            <Webcam
                              ref={WebCam_ref}
                              forceScreenshotSourceSize
                              onUserMedia={onUserMediaEvent}
                              onUserMediaError={onUserMediaErrorEvent}
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
                              mirrored={iModelRef.current.mirror}
                              style={{
                                position: 'absolute',
                                width   : '100%',
                                height  : '100%',
                              }}
                            />
                            <canvas
                              ref={canvas_ref}
                              style={{
                                objectFit: 'contain',
                                position : 'absolute',
                                width    : '100%',
                                height   : '100%',
                              }}
                            ></canvas>
                          </div>
                        </>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
                <Card.Footer>
                  <details>
                    <summary>{t('Device info')}</summary>
                    <ol>
                      {devices.map((device, index) => {
                        return (
                          <li key={index}>
                            {device.kind} | {device.label}
                          </li>
                        )
                      })}
                    </ol>
                  </details>
                </Card.Footer>
              </Card>
            </Col>

            <Col xs={12} sm={12} md={12} xl={12} xxl={12}>
              <Card className={'mt-3'}>
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
                          className={'d-none'}
                          width={250}
                          height={250}
                          ></canvas>
                      </Col>
                      <Col className={'col-12 d-flex justify-content-center'}>
                        <canvas
                          id="1_processImageCanvas"
                          className={'d-none'}
                          width={250}
                          height={250}
                        ></canvas>
                      </Col>
                      <Col className={'col-12 d-flex justify-content-center'}>
                        <canvas
                          id="resultCanvas"
                          ref={canvasImage_ref}
                          className={'ratio ' + ratioCamera}
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
            </Col>
          </Col>
        </Row>
      </Container>
    </>
  )
}
