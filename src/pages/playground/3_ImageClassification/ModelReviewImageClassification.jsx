import React from 'react'
import { Button, Card, Col, Container, Modal, Row } from 'react-bootstrap'
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import ReactGA from 'react-ga4'
import { Trans, withTranslation } from 'react-i18next'
import * as tf from '@tensorflow/tfjs'
import * as tf_mobilenet from '@tensorflow-models/mobilenet'

import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import alertHelper from '@utils/alertHelper'
import {
  LIST_MODELS_IMAGE_CLASSIFICATION,
  UPLOAD,
  MODEL_IMAGE_MNIST,
  MODEL_IMAGE_MOBILENET,
  MODEL_IMAGE_RESNET,
} from '@/DATA_MODEL'

import I_MODEL_IMAGE_CLASSIFICATION from './models/_model'

import CustomCanvasDrawer from './components/customCanvasDrawer'
import { LIST_OF_IMAGES_MNIST } from '@pages/playground/3_ImageClassification/models/MODEL_IMAGE_MNIST'
import { LIST_OF_IMAGES_MOBILENET } from '@pages/playground/3_ImageClassification/models/MODEL_IMAGE_MOBILENET'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

class ModelReviewImageClassification extends React.Component {

  bar_option = {
    responsive: true,
    plugins   : {
      legend: {
        position: 'top',
      },
      title : {
        display: true,
        text   : 'prediction',
      },
    },
  }

  constructor (props) {
    super(props)
    this.t = props.t
    this.dataset = props.dataset
    ReactGA.send({ hitType: 'pageview', page: '/ModelReviewImageClassification/' + this.dataset, title: this.dataset })

    this.model = null
    this.files = {
      json  : null,
      binary: null,
    }
    this.bar_data_default = {
      labels  : [],
      datasets: [{
        label          : '',
        data           : [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.4)',
          'rgba(255, 159, 64, 0.4)',
          'rgba(255, 205, 86, 0.4)',
          'rgba(75, 192, 192, 0.4)',
          'rgba(54, 162, 235, 0.4)',
          'rgba(153, 102, 255, 0.4)',
          'rgba(175, 175, 175, 0.4)',
        ],
        borderColor    : [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)',
          'rgb(153, 102, 255)',
          'rgb(175, 175, 175)',
        ],
        borderWidth    : 1,
      }],
    }
    this.state = {
      modelLoaded: false,
      // mobilenet
      isImageUploaded: false,
      // variables de [mobilenet]
      isModalShow   : false,
      bar_data_image: this.bar_data_default,
      bar_data_modal: this.bar_data_default,
      loading       :
        <>
          <div className="spinner-border"
               role="status"
               style={{
                 fontSize: '0.5em',
                 height  : '1rem',
                 width   : '1rem',
               }}>
            <span className="sr-only"></span>
          </div>
        </>,
    }
    this.info = {
      modal_image : null,
      image_upload: null,
    }

    this.chartRef_modal = React.createRef()
    this.chartRef_image = React.createRef()

    this.handleModal_Close = this.handleModal_Close.bind(this)
    this.handleModal_Entered = this.handleModal_Entered.bind(this)
    this.handleModal_Exited = this.handleModal_Exited.bind(this)

    this.handleClick_ImageUploaded_Predict = this.handleClick_ImageUploaded_Predict.bind(this)
    this.handleClick_ImageByExamples_OpenDrawAndPredict = this.handleClick_ImageByExamples_OpenDrawAndPredict.bind(this)
    this.handleCanvasDraw_Submit = this.handleCanvasDraw_Submit.bind(this)

    this.handleFileUpload_JSON = this.handleFileUpload_JSON.bind(this)
    this.handleFileUpload_Binary = this.handleFileUpload_Binary.bind(this)
    this.handleFileUpload_Image = this.handleFileUpload_Image.bind(this)

    this._model = new I_MODEL_IMAGE_CLASSIFICATION(props.t)
    switch (this.dataset) {
      case MODEL_IMAGE_MNIST.KEY: {
        this._model = new MODEL_IMAGE_MNIST(props.t)
        break
      }
      case MODEL_IMAGE_MOBILENET.KEY: {
        this._model = new MODEL_IMAGE_MOBILENET(props.t)
        break
      }
      case MODEL_IMAGE_RESNET.KEY: {
        this._model = new MODEL_IMAGE_RESNET(props.t)
        break
      }
      default: {
        console.error('Error, opción no disponible')
      }
    }
  }

  componentDidMount () {
    this.loadModel()
      .catch(console.error)
  }

  async loadModel () {
    try {
      const isValid = LIST_MODELS_IMAGE_CLASSIFICATION.some((e) => e === this.dataset)
      if (!isValid) {
        await alertHelper.alertError(this.t('error.model-selected'))
        return
      }

      switch (this.dataset) {
        case UPLOAD: {
          this.model = await tf.loadLayersModel(
            tf.io.browserFiles([this.files.json, this.files.binary]),
          )
          break
        }
        case MODEL_IMAGE_MNIST.KEY: {
          this.model = await tf.loadLayersModel(process.env.REACT_APP_PATH + '/models/03-image-classification/keras-mnist/model.json')
          //this.model = await tf.loadLayersModel(process.env.REACT_APP_PATH + "/models/classification-image/mnist/mymodel.json")
          break
        }
        case MODEL_IMAGE_MOBILENET.KEY: {
          this.model = await tf_mobilenet.load()
          break
        }
        case MODEL_IMAGE_RESNET.KEY: {
          this.model = await tf.loadGraphModel(
            'https://tfhub.dev/google/tfjs-model/imagenet/resnet_v2_50/classification/3/default/1',
            {
              fromTFHub: true, onProgress: (fraction) => {
                console.debug({ fraction })
              }
            },
          )
          break
        }
        default: {
          console.error('Error, opción no válida')
          break
        }
      }
      this.setState({ modelLoaded: true })
      this.setState({ loading: '' })
      await alertHelper.alertSuccess(this.t('alert.model-load-success'))
    } catch (e) {
      console.error(e)
    }
  }

  async PredictMNIST_Image (imageData) {
    let arr = [], arr28 = []
    for (let p = 0; p < imageData.data.length; p += 4) {
      imageData.data[p] = 255 - imageData.data[p]
      imageData.data[p + 1] = 255 - imageData.data[p + 1]
      imageData.data[p + 2] = 255 - imageData.data[p + 2]
      imageData.data[p + 3] = 255
      let valor = imageData.data[p] / 255
      arr28.push([valor])
      if (arr28.length === 28) {
        arr.push(arr28)
        arr28 = []
      }
    }

    let tensor4 = tf.tensor4d([arr])
    let predictions = this.model.predict(tensor4).dataSync()
    let index = predictions.indexOf(Math.max.apply(null, predictions))
    return { predictions, index }
  }

  async PredictMNIST (imageData) {
    let arr = [], arr28 = []
    for (let p = 0; p < imageData.data.length; p += 4) {
      let valor = imageData.data[p + 3] / 255
      arr28.push([valor])
      if (arr28.length === 28) {
        arr.push(arr28)
        arr28 = []
      }
    }

    let tensor4 = tf.tensor4d([arr])
    let predictions = this.model.predict(tensor4).dataSync()
    let index = predictions.indexOf(Math.max.apply(null, predictions))
    return { predictions, index }
  }

  updatePredictionMNIST (predictions) {
    this.setState({
      bar_data_image: {
        labels  : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        datasets: [
          {
            label          : 'MNIST',
            data           : predictions,
            backgroundColor: this.bar_data_default.datasets[0].backgroundColor,
            borderColor    : this.bar_data_default.datasets[0].borderColor,
            borderWidth    : this.bar_data_default.datasets[0].borderWidth,
          },
        ],
      },
    }, () => {
      this.chartRef_image.current.update()
    })
  }

  async handleCanvasDraw_Submit (draw_canvas, _draw_canvas_ctx) {
    // Copia el 'drawCanvas' en originalImage
    const canvas = document.getElementById('originalImage')
    const canvas_ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas_ctx.drawImage(draw_canvas, 0, 0, canvas.width, canvas.height)
    // copiamos con la imagen de 28x28
    canvas_ctx.drawImage(draw_canvas, 10, 10, 28, 28)
    // procesamos con la imagen de 28x28
    let imageData = canvas_ctx.getImageData(10, 10, 28, 28)
    const { predictions } = await this.PredictMNIST(imageData)

    this.updatePredictionMNIST(predictions)
  }

  async handleCanvasDraw_Clear () {
    const originalImage_canvas = document.getElementById('originalImage')
    const originalImage_canvas_ctx = originalImage_canvas.getContext('2d', { willReadFrequently: true })
    originalImage_canvas_ctx.clearRect(0, 0, originalImage_canvas.width, originalImage_canvas.height)
  }

  async handleClick_ImageUploaded_Predict () {
    if (!this.state.isImageUploaded) {
      await alertHelper.alertError(this.t('error.need-to-upload-image'))
      return
    }

    let image = new Image()
    image.src = URL.createObjectURL(this.info.image_upload)
    image.onerror = this.UTILS_image.failed

    const canvas = document.getElementById('originalImage')
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('HTMLCanvasElement')
    }

    // Limpiamos canvas
    const canvas_ctx = canvas.getContext('2d')
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height)

    switch (this.dataset) {
      case UPLOAD: {
        // TODO

        break
      }
      case MODEL_IMAGE_MNIST.KEY: {
        image.onload = async () => {
          // Pegamos la imagen
          this.UTILS_image.drawImageInCanvasWithContainer(image, 'originalImage', 'container_canvas')
          // Transformamos a un canvas de 28x28
          canvas_ctx.drawImage(canvas, 10, 10, 28, 28)
          const imageData = canvas_ctx.getImageData(10, 10, 28, 28)
          // Ejecutamos la predicción usando el canvas de 28x28
          const { predictions } = await this.PredictMNIST_Image(imageData)
          this.updatePredictionMNIST(predictions)
        }
        break
      }
      case MODEL_IMAGE_MOBILENET.KEY: {
        image.onload = async () => {
          // Pegamos la imagen
          this.UTILS_image.drawImageInCanvasWithContainer(image, 'originalImage', 'container_canvas')
          // Ejecutamos la clasificación usando el canvas
          const predictions = await this.model.classify(canvas)
          this.setState({
            bar_data_image: {
              labels  : [''],
              datasets: predictions.map((v, i) => {
                return {
                  label          : v.className,
                  data           : [v.probability],
                  backgroundColor: this.bar_data_default.datasets[0].backgroundColor[i % 7],
                  borderColor    : this.bar_data_default.datasets[0].borderColor[i % 7],
                  borderWidth    : this.bar_data_default.datasets[0].borderWidth,
                }
              }),
            },
          })
        }
        break
      }
      case MODEL_IMAGE_RESNET.KEY: {
        // TODO
        //const originalImage = document.getElementById("originalImage")
        //const originalImage_ctx = originalImage.getContext("2d")
        //
        //const resultCanvas = document.getElementById("resultCanvas")
        //const resultCanvas_ctx = resultCanvas.getContext("2d")
        //
        //resultCanvas.height = 224
        //resultCanvas.width = 224
        //
        //const newCanvas = document.createElement("canvas")
        //const newCanvas_ctx = newCanvas.getContext("2d")
        //newCanvas.width = originalImage.width * 0.75
        //newCanvas.height = originalImage.height * 0.75
        //
        //newCanvas_ctx.drawImage(originalImage, 0, 0, newCanvas.width, newCanvas.height)
        //resultCanvas_ctx.drawImage(newCanvas, 0, 0, newCanvas.width, newCanvas.height)
        //
        //const tensorImage = tf.browser.fromPixels(originalImage)
        //  .resizeNearestNeighbor([224, 224])
        //  .toFloat();
        //const normalize = tensorImage
        //  .sub(tf.scalar(127.5))
        //  .div(tf.scalar(127.5))
        //  .expandDims();
        //const predict = this.model.predict(normalize)
        //const index = predict.as1D().argMax(-1).dataSync()[0]

        // console.log({
        //   data: await predict.data(),
        //   predict,
        //   index,
        //   IMAGENET: datosAuxiliares.IMAGENET[index],
        //   imageNameList: datosAuxiliares.imageNameList[index]
        // })atosAuxiliares.imageNameList[index])
        break
      }
      default: {
        console.error('Error, opción no válida')
        break
      }
    }
  }

  async handleClick_ImageByExamples_OpenDrawAndPredict (image_src) {
    switch (this.dataset) {
      case UPLOAD: {
        break
      }
      case MODEL_IMAGE_MNIST.KEY: {
        this.info.modal_image = image_src
        break
      }
      case MODEL_IMAGE_MOBILENET.KEY: {
        this.info.modal_image = image_src
        break
      }
      case MODEL_IMAGE_RESNET.KEY: {
        // TODO
        break
      }
      default: {
        console.error('Error, opción no disponible')
        break
      }
    }
    this.setState({ isModalShow: true })
  }

  Print_HTML_Examples () {
    let examples
    switch (this.dataset) {
      case UPLOAD: {
        return <></>
      }
      case MODEL_IMAGE_MNIST.KEY: {
        examples = LIST_OF_IMAGES_MNIST.map((image, index) => {
          return <Col className={'border bg-light'} key={index}>
            <img className={'img-fluid w-100 h-100 object-fit-cover'}
                 src={process.env.REACT_APP_PATH + '/assets/' + image}
                 alt={image}
                 onClick={() => {
                   this.handleClick_ImageByExamples_OpenDrawAndPredict(
                     process.env.REACT_APP_PATH + '/assets/' + image,
                   ).then((_) => undefined)
                 }} />
          </Col>
        })
        break
      }
      case MODEL_IMAGE_MOBILENET.KEY: {
        examples = LIST_OF_IMAGES_MOBILENET.map((image, index) => {
          return <Col className={'border bg-light'} key={index}>
            <img className={'img-fluid w-100 h-100 object-fit-cover'}
                 src={process.env.REACT_APP_PATH + '/assets/' + image}
                 alt={image}
                 onClick={() => {
                   this.handleClick_ImageByExamples_OpenDrawAndPredict(
                     process.env.REACT_APP_PATH + '/assets/' + image,
                   ).then((_) => undefined)
                 }} />
          </Col>
        })
        break
      }
      case MODEL_IMAGE_RESNET.KEY: {
        // TODO
        break
      }
      default: {
        console.error('Error, opción no disponible')
        break
      }
    }

    return <>
      <Card className={'mt-3'}>
        <Card.Header>
          <h2><Trans i18nKey={'datasets-models.3-image-classifier.interface.process-examples.title'} /></h2>
        </Card.Header>
        <Card.Body>
          <Container fluid={true}>
            <Row className={(this.isMNIST() ? '' : 'row-cols-3') + ' justify-content-center g-2'}>
              {examples}
            </Row>
          </Container>
        </Card.Body>
      </Card>
    </>
  }

  Print_HTML_Section () {
    switch (this.dataset) {
      case UPLOAD: {
        return <>
          <div>
            <Card.Text><Trans i18nKey={'datasets-models.3-image-classifier.interface.0-upload.title'} /></Card.Text>
            <Card.Text><Trans i18nKey={'datasets-models.3-image-classifier.interface.0-upload.sub-title'} /></Card.Text>
            <Row>
              <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
                <DragAndDrop name={'json'}
                             id={'json-upload'}
                             accept={{ 'application/json': ['.json'] }}
                             text={this.t('drag-and-drop.json')}
                             labelFiles={this.t('drag-and-drop.label-files-one')}
                             function_DropAccepted={this.handleFileUpload_JSON} />
              </Col>
              <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
                <DragAndDrop name={'bin'}
                             id={'weights-upload'}
                             accept={{ 'application/octet-stream': ['.bin'] }}
                             text={this.t('drag-and-drop.binary')}
                             labelFiles={this.t('drag-and-drop.label-files-one')}
                             function_DropAccepted={this.handleFileUpload_Binary} />
              </Col>
            </Row>
          </div>
        </>
      }
      case MODEL_IMAGE_MNIST.KEY:
      case MODEL_IMAGE_RESNET.KEY:
      case MODEL_IMAGE_MOBILENET.KEY: {
        return this._model.DESCRIPTION()
      }
      default: {
        console.error('Error, opción no disponible')
        break
      }
    }
  }

  handleFileUpload_Image (files) {
    try {
      const blob = files[0]
      this.info.image_upload = new File([blob], blob.name, { type: blob.type })
      this.setState({ isImageUploaded: true })
    } catch (error) {
      console.error(error)
    }
  }

  handleFileUpload_JSON (files) {
    this.files.json = new File([files[0]], files[0].name, { type: files[0].type })
  }

  handleFileUpload_Binary (files) {
    this.files.binary = new File([files[0]], files[0].name, { type: files[0].type })
  }

  handleModal_Close () {
    this.setState({ isModalShow: false })
  }

  async handleModal_Entered () {
    const canvas = document.getElementById('modal_canvas_image')
    const canvas_ctx = canvas.getContext('2d')
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height)

    switch (this.dataset) {
      case UPLOAD: {
        break
      }
      case MODEL_IMAGE_MNIST.KEY: {
        // Dibujar en el canvas del modal
        let image = new Image()
        image.src = this.info.modal_image
        image.onerror = this.UTILS_image.failed
        image.onload = async () => {
          // Dibujamos la imagen en el canvas
          this.UTILS_image.drawImageInCanvasWithContainer(image, 'modal_canvas_image', 'modal_canvas_container')

          // Transformar la imagen en un canvas de 28x28
          canvas_ctx.drawImage(canvas, 10, 10, 28, 28)
          const imageData = canvas_ctx.getImageData(10, 10, 28, 28)

          // PREDICT
          const { predictions } = await this.PredictMNIST_Image(imageData)

          // SHOW Results
          this.setState({
            bar_data_modal: {
              labels  : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
              datasets: [
                {
                  label          : 'Predicción MNIST',
                  data           : predictions,
                  backgroundColor: this.bar_data_default.datasets[0].backgroundColor,
                  borderColor    : this.bar_data_default.datasets[0].borderColor,
                  borderWidth    : this.bar_data_default.datasets[0].borderWidth,
                },
              ],
            },
          }, () => {
            this.chartRef_modal.current.update()
          })
        }
        break
      }
      case MODEL_IMAGE_MOBILENET.KEY: {
        // DRAW
        let image = new Image()
        image.src = this.info.modal_image
        image.onerror = this.UTILS_image.failed
        image.onload = async () => {
          // Dibujamos la imagen en el canvas
          this.UTILS_image.drawImageInCanvasWithContainer(image, 'modal_canvas_image', 'modal_canvas_container')

          // PREDICT
          const predictions = await this.model.classify(image)

          // SHOW Results
          this.setState({
            bar_data_modal: {
              labels  : [''],
              datasets: predictions.map((v, i) => {
                return {
                  label          : v.className,
                  data           : [v.probability],
                  backgroundColor: this.bar_data_default.datasets[0].backgroundColor[i % 7],
                  borderColor    : this.bar_data_default.datasets[0].borderColor[i % 7],
                  borderWidth    : this.bar_data_default.datasets[0].borderWidth,
                }
              }),
            },
          }, () => {
            this.chartRef_modal.current.update()
          })
        }
        break
      }
      case MODEL_IMAGE_RESNET.KEY: {
        // TODO
        break
      }
      default: {
        console.error('Error, opción no disponible')
        break
      }
    }
  }

  handleModal_Exited () {

  }

  isMNIST () {
    return this.dataset === MODEL_IMAGE_MNIST.KEY
  }

  UTILS_image = {
    drawImageInCanvasWithContainer: (image, canvas_id, _container_canvas_id) => {
      const canvas = document.getElementById(canvas_id)
      const canvas_ctx = canvas.getContext('2d')
      // const container_w = document.getElementById(container_canvas_id).getBoundingClientRect().width
      const original_ratio = image.width / image.height
      let designer_width = 200
      let designer_height = 200
      let designer_ratio = designer_width / designer_height
      if (original_ratio > designer_ratio) {
        designer_height = designer_width / original_ratio
      } else {
        designer_width = designer_height * original_ratio
      }
      image.width = designer_width
      image.height = designer_height
      // Dibujamos a tam original
      canvas.width = image.width
      canvas.height = image.height
      canvas_ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    },
    failed                        : (event) => {
      console.error(event)
    },
  }

  barOption_i18n () {
    this.bar_option.plugins.title.text = this.t('prediction')
    return this.bar_option
  }

  render () {
    return (
      <>
        <Container>
          <Row className={'mt-2'}>
            <Col>
              <div className="d-flex justify-content-between">
                <h1><Trans i18nKey={`modality.3`} /></h1>
              </div>
            </Col>
          </Row>
        </Container>
        <Container id={'ModelReviewClassicImageClassification'}>
          <Row>
            <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
              <Card className={'sticky-top mt-3 border-info'}>
                <Card.Body>
                  <Card.Title>
                    <Trans i18nKey={this._model.TITLE} /> {this.state.loading}
                  </Card.Title>
                  {this.Print_HTML_Section()}
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={12} md={12} xl={9} xxl={9}>
              <Row>
                <Col xs={12} sm={12} md={12} xl={12} xxl={12}>
                  {this.Print_HTML_Examples()}
                </Col>
                <Col className={'d-grid'}
                     xs={this.isMNIST() ? 12 : 12}
                     sm={this.isMNIST() ? 12 : 12}
                     md={this.isMNIST() ? 6 : 12}
                     xl={this.isMNIST() ? 6 : 12}
                     xxl={this.isMNIST() ? 6 : 12}>
                  <Card className={'mt-3'}>
                    <Card.Header>
                      <h3><Trans i18nKey={'datasets-models.3-image-classifier.interface.process-image.title'} /></h3>
                    </Card.Header>
                    <Card.Body className={'d-grid'} style={{ alignContent: 'space-between' }}>
                      <DragAndDrop name={'doc'}
                                   text={this.t('drag-and-drop.image')}
                                   labelFiles={this.t('drag-and-drop.label-files-one')}
                                   accept={{
                                     'image/png': ['.png'],
                                     'image/jpg': ['.jpg'],
                                   }}
                                   function_DropAccepted={this.handleFileUpload_Image} />

                      <div className="d-flex gap-2 justify-content-center mx-auto">
                        <Button type={'button'}
                                onClick={this.handleClick_ImageUploaded_Predict}
                                variant={'primary'}>
                          <Trans i18nKey={'datasets-models.3-image-classifier.interface.process-image.validate'} />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                {
                  this.isMNIST() &&
                  <>
                    <Col className={'d-grid'}
                         xs={12} sm={12} md={6} xl={6} xxl={6}>
                      <Card className={'mt-3'}>
                        <Card.Header>
                          <h3><Trans i18nKey={'datasets-models.3-image-classifier.interface.process-draw.title'} /></h3>
                        </Card.Header>
                        <Card.Body>
                          <CustomCanvasDrawer
                            submitFunction={async (canvas, canvas_ctx) => {
                              await this.handleCanvasDraw_Clear()
                              await this.handleCanvasDraw_Submit(canvas, canvas_ctx)
                            }}
                            clearFunction={async () => {
                              await this.handleCanvasDraw_Clear()
                            }} />
                        </Card.Body>
                      </Card>
                    </Col>
                  </>
                }
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
                                    width={200} height={200}
                                    className={'nets4-border-1'}></canvas>
                          </Col>
                          <Col className={'col-12 d-flex justify-content-center'}>
                            <canvas id="resultCanvas"
                                    style={{ display: 'none' }}
                                    width={250} height={250}
                                    className={'nets4-border-1'}></canvas>
                          </Col>
                          <Col className={'col-12 d-flex justify-content-center'}>
                            <canvas id="imageCanvas"
                                    style={{ display: 'none' }}
                                    width={250} height={250}
                                    className={'nets4-border-1'}></canvas>
                          </Col>
                        </Row>
                      </Col>
                      <Col className={'d-flex align-items-center justify-content-center'}>
                        <Bar ref={this.chartRef_image}
                             options={this.barOption_i18n()}
                             data={this.state.bar_data_image} />
                      </Col>
                    </Row>
                  </Container>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>

        <Modal show={this.state.isModalShow}
               fullscreen={'md-down'}
               onHide={this.handleModal_Close}
               onEntered={this.handleModal_Entered}
               onExited={this.handleModal_Exited}
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
                            style={{ aspectRatio: '1', width: '75%' }}
                            className={'nets4-border-1'}></canvas>
                  </div>
                </Col>
                <Col xs={12} sm={7} md={7} xl={9} xxl={9}>
                  <div className={'d-flex align-items-center justify-content-center'}>
                    <Bar ref={this.chartRef_modal}
                         options={this.barOption_i18n()}
                         data={this.state.bar_data_modal} />
                  </div>
                </Col>
              </Row>
            </Container>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.handleModal_Close}>
              <Trans i18nKey={'datasets-models.3-image-classifier.interface.button-accept'} />
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    )
  }
}

export default withTranslation()(ModelReviewImageClassification)