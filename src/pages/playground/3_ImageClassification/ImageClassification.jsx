// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import { Accordion, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'

import ReactGA from 'react-ga4'

import I_MODEL_IMAGE_CLASSIFICATION from './models/_model'
import * as ImageClassificationUtils from './utils/utils'

import N4LLayerDesign from '@components/neural-network/N4LLayerDesign'
import N4LJoyride from '@components/joyride/N4LJoyride'
import N4LDivider from '@components/divider/N4LDivider'

import ImageClassificationClassify from '@pages/playground/3_ImageClassification/ImageClassificationClassify'
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

export default function ImageClassification (props) {
  const { dataset } = props
  const { t } = useTranslation()
  const navigate = useNavigate()
  const iModelInstance = useRef(new I_MODEL_IMAGE_CLASSIFICATION(t))

  const prefix = 'pages.playground.generator.'

  // TODO: DEPENDIENDO DEL TIPO QUE SEA SE PRE CARGAN UNOS AJUSTES U OTROS

  /**
   * @typedef {Object} Layer_t
   * @property {string} _class // MaxPooling2D or Conv2D
   * // if _class === Conv2D
   * @property {number} kernelSize
   * @property {number} filters
   * @property {number} strides
   * @property {string} activation
   *
   * @property {string} kernelInitializer
   * @property {number} poolSize
   * @property {number} strides
   */
  const [Layers, setLayers] = useState(DEFAULT_LAYERS)

  const [idOptimizer, setIdOptimizer] = useState(DEFAULT_ID_OPTIMIZATION)
  const [idLoss, setIdLoss] = useState(DEFAULT_ID_LOSS)
  const [idMetricsList, setIdMetricsList] = useState(DEFAULT_ID_METRICS)

  const [LearningRate, setLearningRate] = useState(DEFAULT_LEARNING_RATE)
  const [NumberEpochs, setNumberEpochs] = useState(DEFAULT_NUMBER_EPOCHS)
  const [TestSize, setTestSize] = useState(DEFAULT_TEST_SIZE)

  const joyrideButton_ref = useRef({})
  /**
   * @type {ReturnType<typeof useState<tfjs.Sequential>>}
   */
  const [Model, setModel] = useState(null)

  /**
   * @typedef GeneratedModels_t
   * @property {string} optimizer
   * @property {string} loss
   * @property {string} metric
   */
  /**
   * @type {ReturnType<typeof useState<Array<GeneratedModels_t>>>}
   */
  const [GeneratedModels, setGeneratedModels] = useState([])

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
  const handleSubmit_Play = async (event) => {
    event.preventDefault()
    if (Layers[0]._class !== 'conv2d') {
      await alertHelper.alertWarning('warning.the-first-layer-need-to-be-__value__', { value: 'conv2d' })
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
      const { model, history } = await iModelInstance.current.TRAIN_MODEL(params)
      setModel(model)
      setGeneratedModels(oldModels => [...oldModels, {
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
        }
      }])
      await alertHelper.alertSuccess(t('alert.model-train-success'))
    } catch (error) {
      console.error(error)
    }
  }
  // endregion

  // region PRUEBA DEL MODELO
  const handleSubmit_VectorTest = async () => {
    if (Model === undefined) {
      await alertHelper.alertWarning('Antes debes de crear y entrenar el modelo.')
    } else {
      const canvas = document.getElementById('drawCanvas')
      const smallcanvas = document.getElementById('smallcanvas')
      const ctx2 = smallcanvas.getContext('2d')
      ImageClassificationUtils.resample_single(canvas, 28, 28, smallcanvas)

      const imgData = ctx2.getImageData(0, 0, 28, 28)
      let arr = [] // El arreglo completo
      let arr28 = [] //Al llegar a 28 posiciones se pone en 'arr' como un nuevo índice
      for (let p = 0; p < imgData.data.length; p += 4) {
        let valor = imgData.data[p + 3] / 255
        arr28.push([valor]) //Agregar al arr28 y normalizar a 0-1. Aparte guarda dentro de un arreglo en el índice 0... again
        if (arr28.length === 28) {
          arr.push(arr28)
          arr28 = []
        }
      }

      arr = [arr]
      // Meter el arreglo en otro arreglo porque si no tio tensorflow se enoja >:(
      // Nah básicamente Debe estar en un arreglo nuevo en el índice 0, por ser un tensor4d en forma 1, 28, 28, 1
      const tensor4 = tfjs.tensor4d(arr)
      const resultados = Model.predict(tensor4).dataSync()
      const mayorIndice = resultados.indexOf(Math.max.apply(null, resultados))
      await alertHelper.alertInfo(t('info.the-class-is-__value__', { value: mayorIndice }))
    }
  }

  const handleSubmit_VectorTestImageUpload = async () => {
    if (Model === undefined) {
      await alertHelper.alertWarning(t('warning.need-a-model'))
    } else {
      const canvas = document.getElementById('imageCanvas')
      const smallcanvas = document.getElementById('smallcanvas')
      const ctx2 = smallcanvas.getContext('2d')
      ImageClassificationUtils.resample_single(canvas, 28, 28, smallcanvas)

      const imgData = ctx2.getImageData(0, 0, 28, 28)
      let arr = [] //El arreglo completo
      let arr28 = [] //Al llegar a 28 posiciones se pone en 'arr' como un nuevo índice
      for (let p = 0; p < imgData.data.length; p += 4) {
        let valor = imgData.data[p + 3] / 255
        arr28.push([valor])
        // Agregar al arr28 y normalizar a 0-1. Aparte guarda dentro de un arreglo en el indice 0... again
        if (arr28.length === 28) {
          arr.push(arr28)
          arr28 = []
        }
      }

      arr = [arr]
      // Meter el arreglo en otro arreglo porque si no tio tensorflow se enoja >:(
      //Nah básicamente Debe estar en un arreglo nuevo en el índice 0, por ser un tensor4d en forma 1, 28, 28, 1
      const tensor4 = tfjs.tensor4d(arr)
      const resultados = Model.predict(tensor4).dataSync()
      const mayorIndice = resultados.indexOf(Math.max.apply(null, resultados))

      // document.getElementById('demo').innerHTML = mayorIndice

      await alertHelper.alertInfo('¿El número es un ' + mayorIndice + '?', mayorIndice)
    }
  }
  // endregion

  // region UTILS
  const handleChange_FileUpload = async (e) => {
    const tgt = e.target || window.event.srcElement
    const files = tgt.files

    const canvas = document.getElementById('imageCanvas')
    const ctx = canvas.getContext('2d')

    function draw () {
      canvas.width = 200
      canvas.height = 200
      ctx.drawImage(this, 0, 0)
    }

    function failed () {
      console.error('The provided file couldn\'t be loaded as an Image media')
    }

    const img = new Image()
    img.onload = draw
    img.onerror = failed
    img.src = URL.createObjectURL(files[0])
  }
  // endregion

  if (VERBOSE) console.debug('render ImageClassification')
  return (
    <>
      <N4LJoyride joyrideButton_ref={joyrideButton_ref}
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
              <Button size={'sm'}
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
              <ImageClassificationEditorLayers Layers={Layers}
                                               setLayers={setLayers} />
            </Col>

            {/* GENERAL PARAMETERS */}
            <Col xl={6} className={'mt-3'}>
              <ImageClassificationEditorHyperparameters setIdOptimizer={setIdOptimizer}
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
            <ImageClassificationTableModels GeneratedModels={GeneratedModels} />
          </Col>
        </Row>

        <N4LDivider i18nKey={'hr.classify'} />

        {/* BLOCK 2 */}
        <Row className={'mt-3'}>
          <Col className={'joyride-step-9-classify'}>
            <ImageClassificationClassify handleSubmit_VectorTest={handleSubmit_VectorTest}
                                         handleChange_FileUpload={handleChange_FileUpload}
                                         handleSubmit_VectorTestImageUpload={handleSubmit_VectorTestImageUpload}
                                         GeneratedModels={GeneratedModels} />
          </Col>
        </Row>

        {process.env.REACT_APP_ENVIRONMENT === 'development' &&
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
