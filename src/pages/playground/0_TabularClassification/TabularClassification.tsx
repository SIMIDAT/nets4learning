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
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'

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
const DEFAULT_PREDICTION_BAR: _Types.TabularClassificationPredictionBar_t = {
  classes: [],
  labels : [],
  data   : [],
}
type Props = {
  dataset: string
}
export default function TabularClassification(props: Props) {
  const { dataset } = props
  const navigate = useNavigate()

  const prefix = 'pages.playground.generator.'
  const prefixManual = 'pages.playground.0-tabular-classification.generator.'
  const { t } = useTranslation()

  // Layers
  const [layers, setLayers] = useState<_Types.Layer_t[]>(DEFAULT_LAYERS)

  // Params
  const [learningRate, setLearningRate] = useState(DEFAULT_LEARNING_RATE)
  const [numberEpochs, setNumberEpochs] = useState(DEFAULT_NUMBER_EPOCHS)
  const [testSize, setTestSize] = useState(DEFAULT_TEST_SIZE)
  // OPTIMIZER_TYPE
  const [idOptimizer, setIdOptimizer] = useState<IdOptimizer_t>(DEFAULT_ID_OPTIMIZATION)
  // LOSS_TYPE
  const [idLoss, setIdLoss] = useState<IdLoss_t>(DEFAULT_ID_LOSS)
  // METRICS_TYPE
  const [idMetrics, setIdMetrics] = useState<IdMetric_t>(DEFAULT_ID_METRICS)

  // Datasets
  /** 
   * @type {ReturnType<typeof useState<Array<_Types.DatasetProcessed_t>>>}
   */
  const [datasets_processed, setDatasetsProcessed] = useState<{ index: number, datasets: Array<_Types.DatasetProcessed_t> }>({ index: -1, datasets: [] })
  // Models upload && review
  const [isTraining, setIsTraining] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Array<_Types.TabularClassificationGeneratedModel_t>>>}
   */
  const [generatedModels, setGeneratedModels] = useState<_Types.TabularClassificationGeneratedModel_t[]>([])
  const [generatedModelsIndex, setGeneratedModelsIndex] = useState(-1)
  // Model review
  /**
   * @type {ReturnType<typeof useState<tfjs.Sequential | null>>}
   */
  const [Model, setModel] = useState<tfjs.Sequential | null>(null)

  // Class && Controllers
  const iModelInstance = useRef<I_MODEL_TABULAR_CLASSIFICATION | null>(new MAP_TC_CLASSES[dataset](t, () => { console.log('callback') }))

  // Prediction
  const [inputDataToPredict, setInputDataToPredict] = useState<Array<_Types.N4LDataFrameType>>([])
  const [inputVectorToPredict, setInputVectorToPredict] = useState<Array<_Types.N4LDataFrameType>>([])
  const [predictionBar, setPredictionBar] = useState(DEFAULT_PREDICTION_BAR)
  /**
   * @type {ReturnType<typeof useRef<_Types.Joyride_t|_Types.Joyride_void_t>>}
   */
  const joyrideButton_ref = useRef<_Types.Joyride_t | _Types.Joyride_void_t>({})

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: `/TabularClassification/${dataset}`, title: dataset })
  }, [dataset])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init][ dataset, t, history ]')
    const init = async () => {
      await tfjs.ready()
      if (dataset in MAP_TC_CLASSES) {
        const _iModelClass = MAP_TC_CLASSES[dataset]
        iModelInstance.current = new _iModelClass(t, () => { console.log('callback') })
        if (iModelInstance.current === null) {
          console.error('Error, iModelInstance is null')
          return
        }
        const _datasets = await iModelInstance.current.DATASETS()
        const _default_layers = iModelInstance.current.DEFAULT_LAYERS()
        setLayers(_default_layers)
        setDatasetsProcessed({ index: 0, datasets: _datasets })
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
  const handleSubmit_CreateModel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (datasets_processed.datasets.length === 0) {
      await alertHelper.alertError(t('error.need-dataset'))
      return
    }
    if (datasets_processed.index < 0 || datasets_processed.index >= datasets_processed.datasets.length) {
      await alertHelper.alertError(t('error.need-dataset'))
      return
    }

    const { data_processed } = datasets_processed.datasets[datasets_processed.index]
    if (!data_processed || !data_processed.classes) {
      await alertHelper.alertError(t('error'))
      console.error('Error, dataset not processed')
      return
    }

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
      const _dataset_processed = datasets_processed.datasets[datasets_processed.index]
      const _learningRate = learningRate / 100
      const _numberOfEpoch = numberEpochs
      const _testSize = testSize / 100
      const _layerList = layers
      const _idOptimizer = idOptimizer
      const _idLoss = idLoss
      const _idMetrics = idMetrics

      const { model, history } = await createTabularClassificationCustomModel({
        dataset_processed: _dataset_processed,
        learningRate     : _learningRate,
        numberOfEpoch    : _numberOfEpoch,
        testSize         : _testSize,
        layerList        : _layerList,
        idOptimizer      : _idOptimizer,
        idLoss           : _idLoss,
        idMetrics        : _idMetrics,
      })
      /**@type {_Types.TabularClassificationGeneratedModel_t} */
      const newModel: _Types.TabularClassificationGeneratedModel_t = {
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
  const handleSubmit_PredictVector = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (dataset === UPLOAD) {
      if (datasets_processed.datasets.length === 0) {
        await alertHelper.alertError('First you must load a dataset')
        return
      }
    }
    if (Model === undefined || Model === null) {
      await alertHelper.alertError('First you must load a model')
      return
    }
    try {
      const { data_processed } = datasets_processed.datasets[datasets_processed.index]
      if (!data_processed) {
        await alertHelper.alertError('Error, dataset not processed')
        console.error('Error, dataset not processed')
        return
      }
      const { scaler, classes } = data_processed
      if (!scaler || !classes) {
        await alertHelper.alertError('Error, dataset not processed')
        console.error('Error, dataset not processed')
        return
      }
      const input_vector_to_predict_scaled = scaler.transform(inputVectorToPredict)
      const tensor = tfjs.tensor([input_vector_to_predict_scaled])
      // FIX 
      // TypeScript error
      const prediction = Model.predict(tensor) as tfjs.Tensor
      const predictionDataSync = prediction.dataSync()
      const predictionWithArgMaxDataSync = prediction.argMax(-1).dataSync()
      if (VERBOSE) {
        console.debug({ prediction, predictionDataSync, predictionWithArgMaxDataSync })
      }
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
  if (iModelInstance.current === null) {
    console.info('Error, iModelInstance is null on render')
    return <>Error</>
  }

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
              {import.meta.env.VITE_SHOW_NEW_FEATURE === 'true' &&
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
                <Accordion.Body>
                  <TabularClassificationManual />
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item className={'joyride-step-dataset-info'} key={'1'} eventKey={'dataset_info'}>
                <Accordion.Header>
                  <h2><Trans i18nKey={dataset !== UPLOAD ? iModelInstance.current.TITLE : prefix + 'dataset.upload-dataset'} /></h2>
                </Accordion.Header>
                <Accordion.Body>
                  <TabularClassificationDataset
                    dataset={dataset}

                    datasets={datasets_processed.datasets}
                    setDatasets={setDatasetsProcessed}

                    iModelInstance={iModelInstance}
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
              <TabularClassificationDatasetProcess
                datasets={datasets_processed}
                setDatasets={setDatasetsProcessed}
              />
            </Col>
          </Row>
        </>}

        {/* SHOW DATASET */}
        <N4LDivider i18nKey={'hr.dataset'} />
        <Row className={'mt-3 joyride-step-dataset'}>
          <Col>
            <TabularClassificationDatasetShow
              datasets={datasets_processed}
            />
          </Col>
        </Row>

        {/* GENERATOR */}
        <N4LDivider i18nKey={'hr.model'} />
        {datasets_processed.index < 0 && <>
          <Card>
            <Card.Header className={'d-flex align-items-center justify-content-between'}>
              <h3><Trans i18nKey={'pages.playground.generator.layer-design'} /></h3>
            </Card.Header>
            <Card.Body>
              <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-process'} />
            </Card.Body>
          </Card>
        </>}
        {datasets_processed.index >= 0 &&
          <Form onSubmit={handleSubmit_CreateModel} id={'TabularClassificationCustomDataset'}>
            {/* BLOCK 1 */}
            <Row className={'mt-3'}>
              <Col xl={12} className={'joyride-step-layer'}>
                <N4LLayerDesign
                  layers={layers}
                  show={datasets_processed.index >= 0}
                  glossary_action={GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_0_LAYER_DESIGN}
                  manual_action={MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_0_LAYER_DESIGN} />
              </Col>
            </Row>

            <Row className={'mt-3'}>
              {/* LAYERS EDITOR */}
              <Col className={'mt-3 joyride-step-editor-layers'} xl={6}>
                <TabularClassificationEditorLayers
                  layers={layers}
                  setLayers={setLayers}
                  datasets={datasets_processed.datasets}
                  datasetIndex={datasets_processed.index}
                />
              </Col>

              {/* HYPERPARAMETERS EDITOR */}
              <Col className={'mt-3 joyride-step-editor-trainer'} xl={6}>
                <TabularClassificationEditorHyperparameters
                  setLearningRate={setLearningRate}
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
                  <Button
                    variant={'primary'}
                    size={'lg'}
                    type={'submit'}
                    disabled={isTraining || !datasets_processed.datasets[datasets_processed.index] || (!datasets_processed.datasets[datasets_processed.index].is_dataset_processed)}>
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
            <TabularClassificationTableModels
              listModels={generatedModels}
              isTraining={isTraining}
            />
          </Col>
        </Row>

        {/* PREDICTION */}
        <N4LDivider i18nKey={'hr.predict'} />

        <Row className={'mt-3 joyride-step-classify-visualization'}>
          <Col xl={12}>
            <TabularClassificationPrediction
              // conjunto de datos
              dataset={dataset}
              // listado de conjuntos de datos procesados
              datasets={datasets_processed}

              // modelo de tensorflowjs
              Model={Model}
              // actualizar el modelo de tensorflowjs
              setModel={setModel}

              generatedModels={generatedModels}
              setGeneratedModels={setGeneratedModels}

              generatedModelsIndex={generatedModelsIndex}
              setGeneratedModelsIndex={setGeneratedModelsIndex}

              inputDataToPredict={inputDataToPredict}
              setInputDataToPredict={setInputDataToPredict}
              inputVectorToPredict={inputVectorToPredict}
              setInputVectorToPredict={setInputVectorToPredict}

              predictionBar={predictionBar}

              handleSubmit_PredictVector={handleSubmit_PredictVector}
            />
          </Col>
        </Row>
      </Container>
    </>
  )
}
