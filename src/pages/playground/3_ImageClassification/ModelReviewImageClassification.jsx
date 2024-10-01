import React, { useEffect, useRef, useState } from 'react'
import { Button, Card, Col, Container, Modal, Row } from 'react-bootstrap'
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useHistory } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import ReactGA from 'react-ga4'

import alertHelper from '@utils/alertHelper'

import { UPLOAD, MODEL_IMAGE_MNIST } from '@/DATA_MODEL'
import I_MODEL_IMAGE_CLASSIFICATION from './models/_model'
import FakeProgressBar from '@components/loading/FakeProgressBar'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'

import ModelReviewImageClassificationMNIST from '@pages/playground/3_ImageClassification/ModelReviewImageClassificationMNIST'
import { MAP_IC_CLASSES } from '@pages/playground/3_ImageClassification/models'
import { DEFAULT_BAR_DATA } from '@pages/playground/3_ImageClassification/CONSTANTS'
import { UTILS_image } from '@pages/playground/3_ImageClassification/utils/utils'
import { VERBOSE } from '@/CONSTANTS'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function ModelReviewImageClassification ({ dataset }) {

  const { t } = useTranslation()
  const history = useHistory()

  const iModelRef = useRef(new I_MODEL_IMAGE_CLASSIFICATION(t))
  const iModelRef_model = useRef()

  const iChartRef_modal = useRef()
  const iChartRef_image = useRef()

  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const originalImage_ref = useRef(null)
  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const resultCanvas_ref = useRef(null)
  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const imageCanvas_ref = useRef(null)
  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const modalCanvasImage_ref = useRef(null)


  const [isLoading, setIsLoading] = useState(true)

  const [isImageUploaded, setIsImageUploaded] = useState(false)
  const [isModalShow, setIsModelShow] = useState(false)
  const [info, setInfo] = useState({ image_upload: null, modal_image: null })

  const [barDataImage, setBarDataImage] = useState(DEFAULT_BAR_DATA)
  const [barDataModal, setBarDataModal] = useState(DEFAULT_BAR_DATA)

  const bar_option = {
    responsive: true,
    plugins   : {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text   : t('prediction'),
      }
    },
  }

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: '/ModelReviewImageClassification/' + dataset, title: dataset })
  }, [dataset])

  useEffect(() => {
    const init = async () => {
      if (dataset === UPLOAD) {
        console.error('Error, data set not valid')
      } else if (dataset in MAP_IC_CLASSES) {
        const _iModelClass = MAP_IC_CLASSES[dataset]
        iModelRef.current = new _iModelClass(t)
        iModelRef_model.current = await iModelRef.current.ENABLE_MODEL()
        setIsLoading(false)
        await alertHelper.alertSuccess(t('model-loaded-successfully'))
      } else {
        console.error('Error, option not valid', { ID: dataset })
        history.push('/404')
      }
    }

    init().then()

  }, [dataset, t, history])


  useEffect(() => {
    console.debug('useEffect [barDataModal]')
    if (iChartRef_modal.current) {
      iChartRef_modal.current.update()
    }
  }, [barDataModal])

  useEffect(() => {
    console.debug('useEffect [barDataImage]')
    if (iChartRef_image.current) {
      iChartRef_image.current.update()
    }
  }, [barDataImage])

  const isMNIST = () => {
    return dataset === MODEL_IMAGE_MNIST.KEY
  }

  const handleClick_ImageByExamples_OpenDrawAndPredict = (image_src) => {
    setInfo((prevState) => {
      return {
        modal_image : image_src,
        image_upload: prevState.image_upload
      }
    })

    setIsModelShow(true)
  }

  const handleFileUpload_Image = (files) => {
    try {
      const blob = files[0]
      setInfo((prevState) => {
        return {
          image_upload: new File([blob], blob.name, { type: blob.type }), modal_image: prevState.modal_image
        }
      })
      setIsImageUploaded(true)
    } catch (error) {
      console.error(error)
    }
  }

  const handleModal_Close = () => {
    setIsModelShow(false)
  }
  const handleModal_Exited = () => {

  }

  const handleModal_Entered = async () => {
    // const canvas = document.getElementById('modal_canvas_image')
    const canvas = modalCanvasImage_ref.current
    const canvas_ctx = canvas.getContext('2d')
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height)
    let image = new Image()
    image.src = info.modal_image
    image.onerror = UTILS_image.failed
    image.onload = async () => {
      UTILS_image.drawImageInCanvasWithContainer(image, canvas.id)
      const imageData = await iModelRef.current.GET_IMAGE_DATA(canvas, canvas_ctx)
      const { predictions } = await iModelRef.current.CLASSIFY_IMAGE(iModelRef_model.current, imageData)
      const barDataPrediction = await iModelRef.current.PREDICTION_FORMAT(predictions)
      setBarDataModal(barDataPrediction)
    }
  }

  const handleClick_ImageUploaded_Predict = async () => {
    if (!isImageUploaded) {
      await alertHelper.alertError(t('error.need-to-upload-image'))
      return
    }
    const image = new Image()
    image.src = URL.createObjectURL(info.image_upload)
    image.onerror = UTILS_image.failed

    // const canvas = document.getElementById('originalImage')
    const canvas = originalImage_ref.current
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('HTMLCanvasElement')
    }

    const canvas_ctx = canvas.getContext('2d')
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height)
    image.onload = async () => {
      UTILS_image.drawImageInCanvasWithContainer(image, canvas.id)
      const imageData = await iModelRef.current.GET_IMAGE_DATA(canvas, canvas_ctx)
      const { predictions } = await iModelRef.current.CLASSIFY_IMAGE(iModelRef_model.current, imageData)
      const barDataPrediction = await iModelRef.current.PREDICTION_FORMAT(predictions)
      setBarDataImage(barDataPrediction)
    }
  }

  if (VERBOSE) console.debug('render ModelReviewImageClassification')
  return <>
    <Container id={'ModelReviewImageClassification'} data-testid={'Test-ModelReviewImageClassification'}>
      <Row className={'mt-2'}>
        <Col>
          <div className="d-flex justify-content-between">
            <h1><Trans i18nKey={'modality.3'} /></h1>
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
          <FakeProgressBar isLoading={isLoading} />
        </Col>
      </Row>
      <Row>
        <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
          <Card className={'sticky-top mt-3 border-info'}>
            <Card.Header>
              <h2><Trans i18nKey={iModelRef.current.TITLE} /></h2>
            </Card.Header>
            <Card.Body>
              {(dataset === UPLOAD) ? <></> : iModelRef.current.DESCRIPTION()}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={12} md={12} xl={9} xxl={9}>
          <Row>
            <Col>
              <Card className={'mt-3'}>
                <Card.Header>
                  <h2><Trans i18nKey={'datasets-models.3-image-classifier.interface.process-examples.title'} /></h2>
                </Card.Header>
                <Card.Body>
                  <Container fluid={true}>
                    <Row className={(isMNIST() ? '' : 'row-cols-3') + ' justify-content-center g-2'}>
                      {iModelRef
                        .current
                        .LIST_IMAGES_EXAMPLES()
                        .map((image, index) => {
                          const path_image = process.env.REACT_APP_PATH + '/assets/' + image
                          return <Col className={'border'} key={index}>
                            <img className={'img-fluid w-100 h-100 object-fit-cover'}
                                 src={process.env.REACT_APP_PATH + '/assets/' + image}
                                 alt={image}
                                 onClick={async () => {
                                   await handleClick_ImageByExamples_OpenDrawAndPredict(path_image)
                                 }} />
                          </Col>
                        })}
                    </Row>
                  </Container>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col className={'d-grid'}
                 xs={isMNIST() ? 12 : 12}
                 sm={isMNIST() ? 12 : 12}
                 md={isMNIST() ? 6 : 12}
                 xl={isMNIST() ? 6 : 12}
                 xxl={isMNIST() ? 6 : 12}>
              <Card className={'mt-3'}>
                <Card.Header>
                  <h3><Trans i18nKey={'datasets-models.3-image-classifier.interface.process-image.title'} /></h3>
                </Card.Header>
                <Card.Body className={'d-grid'} style={{ alignContent: 'space-between' }}>
                  <DragAndDrop name={'doc'}
                               text={t('drag-and-drop.image')}
                               labelFiles={t('drag-and-drop.label-files-one')}
                               accept={{
                                 'image/png': ['.png'],
                                 'image/jpg': ['.jpg'],
                               }}
                               function_DropAccepted={handleFileUpload_Image} />

                  <div className="d-flex gap-2 justify-content-center mx-auto">
                    <Button type={'button'}
                            onClick={handleClick_ImageUploaded_Predict}
                            variant={'primary'}>
                      <Trans i18nKey={'datasets-models.3-image-classifier.interface.process-image.validate'} />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            {isMNIST() && <>
              <ModelReviewImageClassificationMNIST dataset={dataset}
                                                   iModelRef={iModelRef}
                                                   iModelRef_model={iModelRef_model}
                                                   iChartRef_image={iChartRef_image}
                                                   setBarDataImage={setBarDataImage}
              />
            </>}
          </Row>


          <Card className={'mt-3'}>
            <Card.Header>
              <h3><Trans i18nKey={'datasets-models.3-image-classifier.interface.result'} /></h3></Card.Header>
            <Card.Body>
              <Container fluid={true}>
                <Row>
                  <Col className={'d-flex align-items-center justify-content-center'}
                       id={'container_canvas'}>
                    <Row>
                      <Col className={'col-12 d-flex justify-content-center'}>
                        <canvas id="originalImage"
                                ref={originalImage_ref}
                                width={200}
                                height={200}
                                className={'nets4-border-1'}></canvas>
                      </Col>
                      <Col className={'col-12 d-flex justify-content-center'}>
                        <canvas id="resultCanvas"
                                ref={resultCanvas_ref}
                                style={{ display: 'none' }}
                                width={250}
                                height={250}
                                className={'nets4-border-1'}></canvas>
                      </Col>
                      <Col className={'col-12 d-flex justify-content-center'}>
                        <canvas id="imageCanvas"
                                ref={imageCanvas_ref}
                                style={{ display: 'none' }}
                                width={250}
                                height={250}
                                className={'nets4-border-1'}></canvas>
                      </Col>
                    </Row>
                  </Col>
                  <Col className={'d-flex align-items-center justify-content-center'}>
                    <Bar ref={iChartRef_image}
                         options={bar_option}
                         data={barDataImage} />
                  </Col>
                </Row>
              </Container>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>

    <Modal show={isModalShow}
           fullscreen={'md-down'}
           onHide={handleModal_Close}
           onEntered={handleModal_Entered}
           onExited={handleModal_Exited}
           size={'xl'}
           aria-labelledby="contained-modal-title-vcenter"
           centered>
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          <Trans i18nKey={'datasets-models.3-image-classifier.interface.modal.title'} />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ display: 'flex', alignItems: 'center' }}>
        <Container fluid={true}>
          <Row style={{ alignItems: 'center' }}>
            <Col xs={12} sm={5} md={5} xl={3} xxl={3}>
              <div className={'d-flex align-items-center justify-content-center'}
                   id={'modal_canvas_container'}>
                <canvas id="modal_canvas_image"
                        ref={modalCanvasImage_ref}
                        className={'nets4-border-1'}></canvas>
              </div>
            </Col>
            <Col xs={12} sm={7} md={7} xl={9} xxl={9}>
              <div className={'d-flex align-items-center justify-content-center'}>
                <Bar ref={iChartRef_modal}
                     options={bar_option}
                     data={barDataModal} />
              </div>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleModal_Close}>
          <Trans i18nKey={'datasets-models.3-image-classifier.interface.button-accept'} />
        </Button>
      </Modal.Footer>
    </Modal>
  </>
}
