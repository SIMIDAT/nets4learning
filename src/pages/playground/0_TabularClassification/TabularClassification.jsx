import './TabularClassification.css'
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Accordion, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import ReactGA from 'react-ga4'
import * as _dfd from 'danfojs'
import * as tfjs from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'

import * as _Types from '@core/types'
import { UPLOAD } from '@/DATA_MODEL'
import { MAP_TC_CLASSES } from '@pages/playground/0_TabularClassification/models'
import { createTabularClassificationCustomModel } from '@core/controller/00-tabular-classification/TabularClassificationModelController'

import alertHelper from '@utils/alertHelper'

import N4LJoyride from '@components/joyride/N4LJoyride'
import N4LDivider from '@components/divider/N4LDivider'
import N4LLayerDesign from '@components/neural-network/N4LLayerDesign'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

import TabularClassificationManual from '@pages/playground/0_TabularClassification/TabularClassificationManual'
import TabularClassificationDataset from '@pages/playground/0_TabularClassification/TabularClassificationDataset'
import TabularClassificationDatasetShow from '@pages/playground/0_TabularClassification/TabularClassificationDatasetShow'
import TabularClassificationEditorHyperparameters from '@pages/playground/0_TabularClassification/TabularClassificationEditorHyperparameters'
import TabularClassificationEditorLayers from '@pages/playground/0_TabularClassification/TabularClassificationEditorLayers'
import TabularClassificationTableModels from '@pages/playground/0_TabularClassification/TabularClassificationTableModels'
import TabularClassificationPrediction from '@pages/playground/0_TabularClassification/TabularClassificationPrediction'

import I_MODEL_TABULAR_CLASSIFICATION from './models/_model'
import { VERBOSE } from '@/CONSTANTS'

import {
  DEFAULT_LEARNING_RATE,
  DEFAULT_NUMBER_EPOCHS,
  DEFAULT_TEST_SIZE,
  DEFAULT_ID_OPTIMIZATION,
  DEFAULT_ID_LOSS,
  DEFAULT_ID_METRICS,
  DEFAULT_LAYERS,
} from './CONSTANTS'
import TabularClassificationDatasetProcess from '@pages/playground/0_TabularClassification/TabularClassificationDatasetProcess'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'

/**
 * @typedef {Object | null} DataProcessedState_t
 * @property {_dfd.DataFrame} dataframeProcessed
 * @property {string} column_name_target
 * @property {_dfd.DataFrame} X
 * @property {_dfd.DataFrame} y
 * @property {_dfd.MinMaxScaler|_dfd.StandardScaler} scaler
 * @property {Object.<string, _dfd.LabelEncoder>} map_encoder
 * @property {Array} attributes
 * @property {Array<string>} classes
 */

/**
 * Se ha dividido en modelos entrenados y modelos creados,
 * Las siguientes funciones corresponder a subir un modelo, pre procesar los datos, entrenar y predecir
 *
 *                                                            Upload
 * 1. Subir conjunto de datos:                                |
 * handleChange_FileUpload_CSV()                <-------------|
 * handleChange_FileUpload_CSV_reject()         <-------------|
 * $ <TabularClassificationCustomDatasetForm />               |
 *                                                            |
 * > handleChange_cType()                       <-------------|
 *                                                            |
 * -- Preprocesamiento                                        |
 * > handleSubmit_ProcessDataFrame()            <-------------|
 * > > Parser.transform()                       <-------------|
 *                                                            |
 * 2. Entrenar modelo:                                        |
 * handleSubmit_CreateModel()                   <-------------|
 *                                                            |
 * 3. Predecir con el modelo:                                 |
 * $ <TabularClassificationDynamicFormPrediction />           |
 *                                                            |
 * Case 1. -- Cambiar datos de todas las columnas             |
 * > handleChange_ROW()                                       |
 * Case 2. -- Cambiar dato de una columna                     |
 * > handleChange_Float()                                     |
 * > handleChange_Number()                                    |
 * > handleChange_Select()                                    |
 *                                                            |
 * -- Predecir                                                |
 * > handleClick_TestVector()                   <-------------|
 *
 */
export default function TabularClassification (props) {
  const { dataset } = props
  const navigate  = useNavigate()

  const prefix = 'pages.playground.generator.'
  const prefixManual = 'pages.playground.0-tabular-classification.generator.'
  const { t } = useTranslation()

  // Layers
  const [layers, setLayers] = useState(DEFAULT_LAYERS)

  // Params
  const [learningRate, setLearningRate] = useState(DEFAULT_LEARNING_RATE)
  const [numberEpochs, setNumberEpochs] = useState(DEFAULT_NUMBER_EPOCHS)
  const [testSize, setTestSize] = useState(DEFAULT_TEST_SIZE)
  const [idOptimizer, setIdOptimizer] = useState(DEFAULT_ID_OPTIMIZATION) // OPTIMIZER_TYPE
  const [idLoss, setIdLoss] = useState(DEFAULT_ID_LOSS) // LOSS_TYPE
  const [idMetrics, setIdMetrics] = useState(DEFAULT_ID_METRICS) // METRICS_TYPE

  // Datasets
  /** 
   * @type {ReturnType<typeof useState<Array<_Types.DatasetProcessed_t>>>}
   */
  const [datasets, setDatasets] = useState([])
  const [datasetIndex, setDatasetIndex] = useState(-1)
  // Models upload && review
  const [isTraining, setIsTraining] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Array<_Types.TabularClassificationGeneratedModel_t>>>}
   */
  const [generatedModels, setGeneratedModels] = useState([])
  const [generatedModelsIndex, setGeneratedModelsIndex] = useState(-1)
  // Model review
  /**
   * @type {ReturnType<typeof useState<tfjs.Sequential | null>>}
   */
  const [Model, setModel] = useState(null)

  // Class && Controllers
  const iModelInstance = useRef(new I_MODEL_TABULAR_CLASSIFICATION(t))

  // Prediction
  const [inputDataToPredict, setInputDataToPredict] = useState([])
  const [inputVectorToPredict, setInputVectorToPredict] = useState([])
  const [predictionBar, setPredictionBar] = useState({
    classes: [],
    labels : [],
    data   : [],
  })
  /**
   * @type {ReturnType<typeof useRef<_Types.Joyride_t|_Types.Joyride_void_t>>}
   */
  const joyrideButton_ref = useRef({})

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: `/TabularClassification/${dataset}`, title: dataset })
  }, [dataset])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init][ dataset, t, history ]')
    const init = async () => {
      await tfjs.ready()
      if (dataset === UPLOAD) {
        console.info('ENABLE Upload csv | TabularClassification')
      } else if (dataset in MAP_TC_CLASSES) {
        const _iModelClass = MAP_TC_CLASSES[dataset]
        iModelInstance.current = new _iModelClass(t)
        setLayers(iModelInstance.current.DEFAULT_LAYERS())
        const _datasets = await iModelInstance.current.DATASETS()
        setDatasets(_datasets)
        setDatasetIndex(0)
      } else {
        console.error('Error, option not valid', { ID: dataset })
        navigate('/404')
      }
    }
    init()
      .then(() => {
        if (VERBOSE) console.debug('end init Tabular classification')
      })
    return () => { tfvis.visor().close() }
  }, [dataset, t, navigate])

  // region MODEL
  const handleSubmit_CreateModel = async (event) => {
    event.preventDefault()
    if (datasets.length === 0) {
      await alertHelper.alertError(t('error.need-dataset'))
      return
    }

    const dataset_processed = datasets[datasetIndex]
    const { data_processed } = dataset_processed

    const last_layer_units = layers[layers.length - 1].units ?? 0
    const classes_length = data_processed.classes.length

    if (last_layer_units !== classes_length) {
      await alertHelper.alertWarning(t('error.tensor-shape'), {
        footer: '',
        text  : '',
        html  : <Trans i18nKey={'error.tensor-shape-change'} values={{ last_layer_units: last_layer_units, class_length: classes_length }} />,
      })
      return
    }

    try {
      setIsTraining(true)
      let _learningRate = learningRate / 100
      let _numberOfEpoch = numberEpochs
      let _testSize = testSize / 100
      let _layerList = layers
      let _idOptimizer = idOptimizer
      let _idLoss = idLoss
      let _idMetrics = idMetrics

      const { model, history } = await createTabularClassificationCustomModel({
        dataset_processed: dataset_processed,
        learningRate     : _learningRate,
        numberOfEpoch    : _numberOfEpoch,
        testSize         : _testSize,
        layerList        : _layerList,
        idOptimizer      : _idOptimizer,
        idLoss           : _idLoss,
        idMetrics        : _idMetrics,
      })
      /**@type {_Types.TabularClassificationGeneratedModel_t} */
      const newModel = {
        model        : model,
        history      : history,
        layerList    : _layerList,
        learningRate : _learningRate,
        testSize     : _testSize,
        numberOfEpoch: _numberOfEpoch,
        idOptimizer  : _idOptimizer,
        idLoss       : _idLoss,
        idMetrics    : _idMetrics,
      }
      setGeneratedModels((oldArray) => ([
        ...oldArray,
        newModel 
      ]))
      setIsTraining(false)

      setModel(model)
      await alertHelper.alertSuccess(t('alert.model-train-success'))
    } catch (error) {
      console.error(error)
    } finally {
      setIsTraining(false)
    }
  }
  // endregion

  // region Prediction
  const handleSubmit_PredictVector = async (e) => {
    e.preventDefault()
    if (dataset === UPLOAD) {
      if (datasets.length === 0) {
        await alertHelper.alertError('First you must load a dataset')
        return
      }
    }
    if (Model === undefined) {
      await alertHelper.alertError('First you must load a model')
      return
    }
    try {
      const { data_processed } = datasets[datasetIndex]
      const { scaler, classes } = data_processed
      const input_vector_to_predict_scaled = scaler.transform(inputVectorToPredict)
      const tensor = tfjs.tensor([input_vector_to_predict_scaled])
      const prediction = Model.predict(tensor)
      const predictionDataSync = (/** @type {tfjs.Tensor} */(prediction)).dataSync()
      const predictionWithArgMaxDataSync = (/** @type {tfjs.Tensor} */(prediction)).argMax(-1).dataSync()
      if (VERBOSE) console.debug({ prediction, predictionDataSync, predictionWithArgMaxDataSync })
      setPredictionBar((_prevState) => {
        return {
          classes: classes,
          labels : classes,
          data   : [...predictionDataSync],
        }
      })
    } catch (error) {
      console.error(error)
      await alertHelper.alertError('Error, model not valid')
    }
  }
  // endregion

  if (VERBOSE) console.debug('render TabularClassificationCustomDataset')
  return (
    <>
      <N4LJoyride joyrideButton_ref={joyrideButton_ref}
                  JOYRIDE_state={iModelInstance.current.JOYRIDE()}
                  TASK={'tabular-classification'}
                  KEY={'TabularClassification'}
      />

      <Container className={'mb-3'}>
        <Row className={'mt-3 mb-3'}>
          <Col xl={12}>
            <div className="d-flex justify-content-between">
              <h1><Trans i18nKey={'modality.0'} /></h1>
              {process.env.REACT_APP_SHOW_NEW_FEATURE === 'true' &&
                <Button size={'sm'}
                        variant={'outline-primary'}
                        onClick={joyrideButton_ref.current.handleClick_StartJoyride}>
                  <Trans i18nKey={'datasets-models.0-tabular-classification.joyride.title'} />
                </Button>
              }
            </div>
          </Col>
        </Row>

        {/* INFORMATION */}
        <N4LDivider i18nKey={'hr.information'} />
        <Row className={'mt-3'}>
          <Col>
            <Accordion defaultActiveKey={dataset === UPLOAD ? ['dataset_info'] : []}>
              <Accordion.Item className={'joyride-step-manual'} key={UPLOAD} eventKey={'manual'}>
                <Accordion.Header>
                  <h2><Trans i18nKey={prefixManual + 'manual.title'} /></h2>
                </Accordion.Header>
                <Accordion.Body><TabularClassificationManual /></Accordion.Body>
              </Accordion.Item>
              <Accordion.Item className={'joyride-step-dataset-info'} key={'1'} eventKey={'dataset_info'}>
                <Accordion.Header>
                  <h2><Trans i18nKey={dataset !== UPLOAD ? iModelInstance.current.TITLE : prefix + 'dataset.upload-dataset'} /></h2>
                </Accordion.Header>
                <Accordion.Body>
                  <TabularClassificationDataset dataset={dataset}

                                                datasets={datasets}
                                                setDatasets={setDatasets}

                                                datasetIndex={datasetIndex}
                                                setDatasetIndex={setDatasetIndex}

                                                iModelInstance={iModelInstance.current}
                  />
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Col>
        </Row>

        {/* PROCESS DATASET */}
        {dataset === UPLOAD && <>
          <N4LDivider i18nKey={'hr.process-dataset'} />
          <Row className={'mt-3 joyride-step-process-dataset'}>
            <Col>
              <TabularClassificationDatasetProcess datasets={datasets}
                                                   setDatasets={setDatasets}
                                                   datasetIndex={datasetIndex}
                                                   setDatasetIndex={setDatasetIndex} />
            </Col>
          </Row>
        </>}

        {/* SHOW DATASET */}
        <N4LDivider i18nKey={'hr.dataset'} />
        <Row className={'mt-3 joyride-step-dataset'}>
          <Col>
            <TabularClassificationDatasetShow datasets={datasets}
                                              datasetIndex={datasetIndex} />
          </Col>
        </Row>

        {/* GENERATOR */}
        <N4LDivider i18nKey={'hr.model'} />
        {datasetIndex < 0 && <>
          <Card>
            <Card.Header className={'d-flex align-items-center justify-content-between'}>
              <h3><Trans i18nKey={'pages.playground.generator.layer-design'} /></h3>
            </Card.Header>
            <Card.Body>
              <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-process'} />
            </Card.Body>
          </Card>
        </>}
        {datasetIndex >= 0 &&
          <Form onSubmit={handleSubmit_CreateModel} id={'TabularClassificationCustomDataset'}>
            {/* BLOCK 1 */}
            <Row className={'mt-3'}>
              <Col xl={12} className={'joyride-step-layer'}>
                <N4LLayerDesign layers={layers}
                                show={datasetIndex >= 0}
                                glossary_action={GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_0_LAYER_DESIGN}
                                manual_action={MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_0_LAYER_DESIGN} />
              </Col>
            </Row>

            <Row className={'mt-3'}>
              {/* LAYERS EDITOR */}
              <Col className={'mt-3 joyride-step-editor-layers'} xl={6}>
                <TabularClassificationEditorLayers layers={layers}
                                                   setLayers={setLayers}
                                                   datasets={datasets}
                                                   datasetIndex={datasetIndex}
                />
              </Col>

              {/* HYPERPARAMETERS EDITOR */}
              <Col className={'mt-3 joyride-step-editor-trainer'} xl={6}>
                <TabularClassificationEditorHyperparameters setLearningRate={setLearningRate}
                                                            setNumberEpochs={setNumberEpochs}
                                                            setTestSize={setTestSize}
                                                            setIdOptimizer={setIdOptimizer}
                                                            setIdLoss={setIdLoss}
                                                            setIdMetrics={setIdMetrics}
                />
              </Col>
            </Row>

            {/* BLOCK BUTTON SUBMIT */}
            <Row className={'mt-3'}>
              <Col xl={12}>
                <div className="d-grid gap-2">
                  <Button variant={'primary'}
                          size={'lg'}
                          type={'submit'}
                          disabled={isTraining || (!datasets[datasetIndex].is_dataset_processed)}>
                    <Trans i18nKey={prefix + 'models.button-submit'} />
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        }

        {/* TABLE MODELS */}
        <N4LDivider i18nKey={'hr.generated-models'} />
        <Row className={'mt-3 joyride-step-list-of-models'}>
          <Col>
            <TabularClassificationTableModels listModels={generatedModels}
                                              isTraining={isTraining} />

          </Col>
        </Row>

        {/* PREDICTION */}
        <N4LDivider i18nKey={'hr.predict'} />
        <Row className={'mt-3 joyride-step-classify-visualization'}>
          <Col xl={12}>
            <TabularClassificationPrediction dataset={dataset}  // conjunto de datos
                                             datasets={datasets} // listado de conjuntos de datos procesados
                                             datasetIndex={datasetIndex} // el conjunto de datos procesado que se quiere usar

                                             Model={Model} // modelo de tensorflowjs
                                             setModel={setModel} // actualizar el modelo de tensorflowjs

                                             generatedModels={generatedModels}
                                             setGeneratedModels={setGeneratedModels}

                                             generatedModelsIndex={generatedModelsIndex}
                                             setGeneratedModelsIndex={setGeneratedModelsIndex}

                                             inputDataToPredict={inputDataToPredict}
                                             setInputDataToPredict={setInputDataToPredict}
                                             inputVectorToPredict={inputVectorToPredict}
                                             setInputVectorToPredict={setInputVectorToPredict}

                                             predictionBar={predictionBar}

                                             handleSubmit_PredictVector={handleSubmit_PredictVector} />
          </Col>
        </Row>
      </Container>
    </>
  )
}
