import './TabularClassification.css'
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Accordion, Button, Card, Col, Container, Form, ProgressBar, Row } from 'react-bootstrap'
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

import { myModelWrapper } from '@core/explainability/ModelExplanation'
import ShapExplanationChart from '@core/explainability/ModelExplanationChart'
import ShapBeeswarmChart from '@core/explainability/ShapBeeswarmChart'
import { dataframeRowsToNumbers, sampleRowsWithoutReplacement, buildShapBackground } from '@core/explainability/shapSampling'
import { KernelSHAP } from 'webshap'

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

  // === Explicabilidad (SHAP) sobre el modelo recién entrenado ===
  // El train tabular predice en espacio ESCALADO (scaler.transform antes de predict),
  // así que instancia y background van escalados (data_processed.X).
  const explainer = useRef<KernelSHAP | null>(null)
  const [showExplain, setShowExplain] = useState(false)
  const [explanationData, setExplanationData] = useState<number[][] | null>(null)
  const [isCalculo, setIsCalculo] = useState(false)
  const [nSamplesExplain, setNSamplesExplain] = useState(1000)
  const [selectedClassIndex, setSelectedClassIndex] = useState(0)
  // SHAP global: matriz única (shap + valores de features) de la que se deriva todo.
  const [globalShap, setGlobalShap] = useState<{ shap: number[][]; featureValues: number[][] } | null>(null)
  const [showGlobalExplain, setShowGlobalExplain] = useState(false)
  const [isCalculoGlobal, setIsCalculoGlobal] = useState(false)
  const [globalProgress, setGlobalProgress] = useState(0)
  const [nInstancesGlobal, setNInstancesGlobal] = useState(50)
  const [globalSortOrder, setGlobalSortOrder] = useState<'desc' | 'asc' | 'none'>('desc')
  const [globalChartType, setGlobalChartType] = useState<'bar' | 'beeswarm'>('bar')
  const globalImportance = useMemo<number[] | null>(() => {
    if (!globalShap || globalShap.shap.length === 0) return null
    const nF = globalShap.shap[0].length
    const sums = new Array(nF).fill(0)
    for (const row of globalShap.shap) for (let f = 0; f < nF; f++) sums[f] += Math.abs(row[f])
    return sums.map((s) => s / globalShap.shap.length)
  }, [globalShap])
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

  // region EXPLAINABILITY (SHAP)
  // data_processed del dataset seleccionado (contiene scaler, classes y la X escalada).
  const getDataProcessed = () => {
    const ds = datasets_processed.datasets[datasets_processed.index]
    return ds?.data_processed ?? null
  }

  // SHAP local: explica la predicción actual. La instancia va ESCALADA (igual que el predict).
  const handleRequest_ExplainPrediction = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (showExplain) { setShowExplain(false); return }
    if (Model === null) { await alertHelper.alertError('First you must load a model'); return }

    const data_processed = getDataProcessed()
    if (!data_processed || !data_processed.scaler) {
      await alertHelper.alertError('Error, dataset not processed')
      return
    }
    if (!inputVectorToPredict || inputVectorToPredict.length === 0) {
      await alertHelper.alertInfo(t('info.insert-input'))
      return
    }

    setIsCalculo(true)
    try {
      // Instancia en espacio ESCALADO (exactamente como en handleSubmit_PredictVector).
      const instance = data_processed.scaler.transform(inputVectorToPredict) as number[]
      const nFeatures = instance.length
      const pool = dataframeRowsToNumbers(data_processed.X.values)
      const background = buildShapBackground(pool, nFeatures)

      const predictor = myModelWrapper(Model)
      explainer.current = new KernelSHAP(predictor, background, 0.2022)
      const nSamples = Number(nSamplesExplain) || 1000
      const shapValues = await explainer.current.explainOneInstance(instance, nSamples)
      setExplanationData(shapValues)
      setShowExplain(true)
    } catch (error) {
      console.error('Error calculating explainability', { error })
      await alertHelper.alertError(t('Error calculating explainability'))
    } finally {
      setIsCalculo(false)
    }
  }

  // SHAP global: agrega mean(|SHAP|) sobre una muestra del dataset (X escalada).
  const handleRequest_ExplainGlobal = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (showGlobalExplain) { setShowGlobalExplain(false); return }
    if (Model === null) { await alertHelper.alertError('First you must load a model'); return }

    const data_processed = getDataProcessed()
    if (!data_processed) {
      await alertHelper.alertError('Error, dataset not processed')
      return
    }

    const pool = dataframeRowsToNumbers(data_processed.X.values)
    const nFeatures = pool[0]?.length ?? 0
    const validPool = pool.filter((row) => row.length === nFeatures)
    if (validPool.length === 0) {
      await alertHelper.alertError(
        t('pages.playground.0-tabular-classification.general.no-data', {
          defaultValue: 'No dataset available to compute global importance',
        }),
      )
      return
    }

    setIsCalculoGlobal(true)
    setGlobalProgress(0)
    try {
      const background = buildShapBackground(validPool, nFeatures)
      const predictor = myModelWrapper(Model)
      const instances = sampleRowsWithoutReplacement(validPool, Math.min(nInstancesGlobal, validPool.length))
      const nSamples = Number(nSamplesExplain) || 1000

      const shapMatrix: number[][] = []
      for (let k = 0; k < instances.length; k++) {
        // KernelSHAP no resetea su estado interno entre llamadas → uno nuevo por instancia.
        const explainerGlobal = new KernelSHAP(predictor, background, 0.2022)
        const shap = await explainerGlobal.explainOneInstance(instances[k], nSamples)
        const classShap = shap[selectedClassIndex] ?? []
        shapMatrix.push(Array.from({ length: nFeatures }, (_, f) => classShap[f] ?? 0))
        setGlobalProgress(Math.round(((k + 1) / instances.length) * 100))
      }

      setGlobalShap({ shap: shapMatrix, featureValues: instances })
      setShowGlobalExplain(true)
    } catch (error) {
      console.error('Error calculating global explainability', { error })
      await alertHelper.alertError(t('Error calculating explainability'))
    } finally {
      setIsCalculoGlobal(false)
    }
  }

  // Al cambiar de clase, la matriz global queda obsoleta → reset para forzar recálculo.
  const handleChange_SelectedClass = (index: number) => {
    setSelectedClassIndex(index)
    setGlobalShap(null)
    setShowGlobalExplain(false)
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

        {/* EXPLAINABILITY */}
        <Row className={'mt-3'}>
          <Col xl={12}>
            <Card data-testid={'explainability-card'}>
              <Card.Header>
                <h3>
                  <Trans
                    i18nKey={'pages.playground.0-tabular-classification.general.explainability'}
                    defaults={'Explicabilidad del modelo'}
                  />
                </h3>
              </Card.Header>
              <Card.Body>
                {/* Panel narrativo contextual */}
                {(showExplain || showGlobalExplain) && (
                  <div className={'alert alert-success'}>
                    {showExplain && (
                      <div className={showGlobalExplain ? 'mb-2' : ''}>
                        <strong>
                          <Trans
                            i18nKey={'pages.playground.0-tabular-classification.general.explain-panel-local-title'}
                            defaults={'Local explanation (one instance)'}
                          />
                        </strong>
                        <div className={'small'}>
                          <Trans
                            i18nKey={'pages.playground.0-tabular-classification.general.explain-panel-local-body'}
                            defaults={'SHAP explains a single prediction by distributing the difference between this prediction and the model\'s average prediction (base value) across the features.'}
                          />
                        </div>
                      </div>
                    )}
                    {showGlobalExplain && (
                      <div>
                        <strong>
                          <Trans
                            i18nKey={'pages.playground.0-tabular-classification.general.explain-panel-global-title'}
                            defaults={'Global importance (all instances)'}
                          />
                        </strong>
                        <div className={'small'}>
                          <Trans
                            i18nKey={'pages.playground.0-tabular-classification.general.explain-panel-global-body'}
                            defaults={'Global importance aggregates many local explanations (mean |SHAP|).'}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* === SHAP local === */}
                <Row className={'mb-2'}>
                  <Col md={6} className={'mb-2'}>
                    <Form.Group controlId={'trainSelectPredictedClass'}>
                      <Form.Label>
                        <Trans
                          i18nKey={'pages.playground.0-tabular-classification.general.select-class'}
                          defaults={'Select class'}
                        />
                      </Form.Label>
                      <Form.Select
                        size={'sm'}
                        value={selectedClassIndex}
                        onChange={(e) => handleChange_SelectedClass(Number(e.target.value))}
                      >
                        {(getDataProcessed()?.classes ?? []).map((c, idx) => (
                          <option key={`train_class_${idx}`} value={idx}>
                            {c}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className={'mb-2'}>
                    <Form.Group controlId={'trainInputNSamples'}>
                      <Form.Label>
                        <Trans
                          i18nKey={'pages.playground.0-tabular-classification.general.n-samples'}
                          defaults={'Number of samples'}
                        />
                      </Form.Label>
                      <Form.Control
                        type={'number'}
                        size={'sm'}
                        value={nSamplesExplain}
                        min={1}
                        step={1}
                        onChange={(e) => setNSamplesExplain(Number(e.target.value))}
                      />
                      <Form.Text className={'text-muted'}>
                        <Trans
                          i18nKey={'pages.playground.0-tabular-classification.general.n-samples-help'}
                          defaults={'Samples used by KernelSHAP'}
                        />
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className={'mb-3'}>
                  <Col>
                    <div className={'d-grid gap-2'}>
                      <Button
                        size={'lg'}
                        variant={showExplain ? 'outline-secondary' : 'primary'}
                        onClick={(e) => handleRequest_ExplainPrediction(e)}
                        disabled={isCalculo || Model === null}
                      >
                        {isCalculo
                          ? t('pages.playground.0-tabular-classification.general.calculating', { defaultValue: 'Calculating...' })
                          : showExplain
                            ? t('pages.playground.0-tabular-classification.general.hide-explain', { defaultValue: 'Hide explanation' })
                            : t('pages.playground.0-tabular-classification.general.show-explain', { defaultValue: 'Show explanation' })}
                      </Button>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    {showExplain && explanationData && (
                      <ShapExplanationChart
                        shapValues={explanationData}
                        predictedClass={selectedClassIndex}
                        predictionProbs={predictionBar}
                        features={getDataProcessed()?.X?.columns ?? []}
                      />
                    )}
                  </Col>
                </Row>

                {/* === SHAP global === */}
                <hr />
                <Row className={'mb-2'}>
                  <Col md={4} className={'mb-2'}>
                    <Form.Group controlId={'trainInputNInstancesGlobal'}>
                      <Form.Label>
                        <Trans
                          i18nKey={'pages.playground.0-tabular-classification.general.n-instances'}
                          defaults={'Instances to aggregate'}
                        />
                      </Form.Label>
                      <Form.Control
                        type={'number'}
                        size={'sm'}
                        value={nInstancesGlobal}
                        min={1}
                        step={1}
                        onChange={(e) => setNInstancesGlobal(Number(e.target.value))}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className={'mb-2'}>
                    <Form.Group controlId={'trainSelectGlobalChartType'}>
                      <Form.Label>
                        <Trans
                          i18nKey={'pages.playground.0-tabular-classification.general.chart-type'}
                          defaults={'Chart type'}
                        />
                      </Form.Label>
                      <Form.Select
                        size={'sm'}
                        value={globalChartType}
                        onChange={(e) => setGlobalChartType(e.target.value as 'bar' | 'beeswarm')}
                      >
                        <option value={'bar'}>
                          {t('pages.playground.0-tabular-classification.general.chart-bar', { defaultValue: 'Bar (mean |SHAP|)' })}
                        </option>
                        <option value={'beeswarm'}>
                          {t('pages.playground.0-tabular-classification.general.chart-beeswarm', { defaultValue: 'Beeswarm' })}
                        </option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  {globalChartType === 'bar' && (
                    <Col md={4} className={'mb-2'}>
                      <Form.Group controlId={'trainSelectGlobalSortOrder'}>
                        <Form.Label>
                          <Trans
                            i18nKey={'pages.playground.0-tabular-classification.general.sort-order'}
                            defaults={'Sort'}
                          />
                        </Form.Label>
                        <Form.Select
                          size={'sm'}
                          value={globalSortOrder}
                          onChange={(e) => setGlobalSortOrder(e.target.value as 'desc' | 'asc' | 'none')}
                        >
                          <option value={'desc'}>
                            {t('pages.playground.0-tabular-classification.general.sort-desc', { defaultValue: 'Most to least important' })}
                          </option>
                          <option value={'asc'}>
                            {t('pages.playground.0-tabular-classification.general.sort-asc', { defaultValue: 'Least to most important' })}
                          </option>
                          <option value={'none'}>
                            {t('pages.playground.0-tabular-classification.general.sort-none', { defaultValue: 'Original order' })}
                          </option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <Row className={'mb-3'}>
                  <Col>
                    <div className={'d-grid gap-2'}>
                      <Button
                        size={'lg'}
                        variant={showGlobalExplain ? 'outline-secondary' : 'primary'}
                        onClick={(e) => handleRequest_ExplainGlobal(e)}
                        disabled={isCalculoGlobal || Model === null}
                      >
                        {isCalculoGlobal
                          ? t('pages.playground.0-tabular-classification.general.calculating', { defaultValue: 'Calculating...' })
                          : showGlobalExplain
                            ? t('pages.playground.0-tabular-classification.general.hide-global', { defaultValue: 'Hide global importance' })
                            : t('pages.playground.0-tabular-classification.general.show-global', { defaultValue: 'Show global importance' })}
                      </Button>
                    </div>
                    {isCalculoGlobal && (
                      <ProgressBar className={'mt-2'} now={globalProgress} label={`${globalProgress}%`} striped={true} animated={true} />
                    )}
                  </Col>
                </Row>

                <Row>
                  <Col>
                    {showGlobalExplain &&
                      globalShap &&
                      globalImportance &&
                      (globalChartType === 'bar' ? (
                        <ShapExplanationChart
                          shapValues={[globalImportance]}
                          predictedClass={0}
                          sortOrder={globalSortOrder}
                          features={getDataProcessed()?.X?.columns ?? []}
                        />
                      ) : (
                        <ShapBeeswarmChart
                          shap={globalShap.shap}
                          featureValues={globalShap.featureValues}
                          features={getDataProcessed()?.X?.columns ?? []}
                        />
                      ))}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}
