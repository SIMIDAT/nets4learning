import { lazy, Suspense, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'
import { Accordion, Card, Col, Form, Row } from 'react-bootstrap'
import * as tfjs from '@tensorflow/tfjs'

import { DEFAULT_SELECTOR_DATASET_INDEX, DEFAULT_SELECTOR_MODEL_INDEX, VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS } from '@/CONSTANTS_ACTIONS'

import N4LDivider from '@components/divider/N4LDivider'
import N4LSectionLayout from '@components/divider/N4LSectionLayout'
import N4LTrainButton from '@components/neural-network/N4LTrainButton'
import { useTrainingProgress } from '@hooks/useTrainingProgress'
import { useStoredModels } from '@hooks/useStoredModels'
import N4LStoredModelsNotice from '@components/neural-network/N4LStoredModelsNotice'
import N4LTrainingDiagnosis from '@components/neural-network/N4LTrainingDiagnosis'
import { reportTrainResult } from '@core/training/trainResult'
import { checkDenseLayers } from '@core/nn-utils/checkLayers'
import { historyFromData } from '@core/training/modelStore'
import { historyData, type TrainingHistory_t } from '@core/training/buildModels'
import { trainerGuide } from '@components/guide/trainerGuide'
import N4LStepByStep from '@components/neural-network/stepByStep/N4LStepByStep'
import { useStepByStepEnabled } from '@components/neural-network/stepByStep/stepByStepSetting'
import { dataframeRowsToNumbers } from '@core/explainability/shapSampling'
import type { TrainingSession_t } from '@core/session/trainingSession'
import { useTrainerSession } from '@hooks/useTrainerSession'
import { layersAreValid } from '@components/neural-network/alertLayerError'
import N4LPageHeader from '@components/neural-network/N4LPageHeader'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import N4LLayerDesign from '@components/neural-network/N4LLayerDesign'
import DebugJSON from '@components/debug/DebugJSON'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

import { MAP_LR_CLASSES } from './models'
import { hasModel, loadModelClass } from '@core/models/modelRegistry'

import * as _Types from '@core/types'
import { createRegressionCustomModel } from '@core/controller/01-regression/RegressionModelController'
import { useRegressionContext } from '@context/useRegressionContext'
import alertHelper from '@utils/alertHelper'
import { TASKS, UPLOAD } from '@/TASKS'
import { TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION } from './utils'
import N4LHelpLink from '@components/helpLink/N4LHelpLink'

// Manual and datasets
const RegressionManual = lazy(() => import('./RegressionManual'))
const RegressionDataset = lazy(() => import('./RegressionDataset'))
const RegressionDatasetProcess = lazy(() => import('./RegressionDatasetProcess'))
const RegressionDatasetShow = lazy(() => import('./RegressionDatasetShow'))
// Editors
const RegressionEditorLayers = lazy(() => import('./RegressionEditorLayers'))
const RegressionEditorFeaturesSelector = lazy(() => import('./RegressionEditorFeaturesSelector'))
const RegressionEditorHyperparameters = lazy(() => import('./RegressionEditorHyperparameters'))
// Models
const RegressionTableModels = lazy(() => import('./RegressionTableModels'))
const RegressionPrediction = lazy(() => import('./RegressionPrediction'))

type RegressionProps_t = {
  dataset: string
}

/** Lo que se guarda de cada modelo entrenado (con el modelo): sus parámetros, el fichero con el que se entrenó y el historial */
type StoredRegressionModel_t = Omit<_Types.CustomModelGenerated_t, 'model' | 'history' | 'dataset_processed' | 'dataframe'> & { csv: string, history: TrainingHistory_t }

export default function Regression({ dataset }: RegressionProps_t) {
  /** @type {ReturnType<typeof useParams<{id: string}>>} */
  const { id: param_id } = useParams()
  const navigate = useNavigate()

  // i18n
  const prefix = 'pages.playground.generator.'
  const { t } = useTranslation()
  const training = useTrainingProgress()
  // Secciones de la página en orden: numeran los separadores (N4LDivider)
  // Paso a paso solo si se ha activado en /settings
  const stepByStep = useStepByStepEnabled()
  const steps = ['hr.information', ...(dataset === UPLOAD ? ['hr.process-dataset'] : []), 'hr.dataset', 'hr.model', ...(stepByStep ? ['hr.step-by-step'] : []), 'hr.predict', 'hr.explainability']
  // La guía de la página (botón Guía): de los datos al modelo entrenado, paso a paso
  const guideSteps = useMemo(() => trainerGuide(t, '1-regression', dataset, { upload: dataset === UPLOAD, datasetTable: true, testSize: 'hp-train-rate', stepByStep: stepByStep ? 'after-models' : false }), [t, dataset, stepByStep])

  const {
    // prediction,
    setPrediction,

    datasets,
    setDatasets,

    params,
    setParams,

    isTraining,
    setIsTraining,

    listModels,
    setListModels,

    accordionActive,
    setAccordionActive,

    iModelInstance,
    setIModelInstance,
  } = useRegressionContext()

  // El paso a paso (N4LStepByStep): las capas del editor y las filas ya procesadas, como las recibe la red
  const stepLayers = useMemo(() => params.params_layers.map(({ units, activation }) => ({ units, activation: activation ?? 'linear' })), [params.params_layers])
  const stepProcessed = datasets.data[datasets.index]?.data_processed
  const stepData = useMemo(() => ({
    X       : dataframeRowsToNumbers(stepProcessed?.X.values),
    y       : ((stepProcessed?.y.values ?? []) as number[]).map((value) => [Number(value)]),
    features: (stepProcessed?.X.columns ?? []) as string[],
  }), [stepProcessed])

  // region SESIÓN: exportar, importar y compartir capas e hiperparámetros

  const currentSession = (): TrainingSession_t => {
    const training_params = params.params_training
    return {
      app            : 'nets4learning',
      version        : 1,
      task           : TASKS.REGRESSION,
      dataset        : dataset,
      layers         : params.params_layers,
      hyperparameters: {
        learningRate: training_params.learning_rate,
        epochs      : training_params.n_of_epochs,
        testSize    : training_params.test_size,
        optimizer   : training_params.id_optimizer,
        loss        : training_params.id_loss,
        metrics     : training_params.list_id_metrics,
      },
    }
  }

  const applySession = ({ layers: importedLayers, hyperparameters: h }: TrainingSession_t) => {
    setParams((prevState) => ({
      ...prevState,
      params_layers: importedLayers.map((layer) => ({
        units     : Number(layer.units),
        activation: String(layer.activation ?? 'relu'),
        // La capa de salida de regresión no se puede editar
        ...(layer.is_disabled === true ? { is_disabled: true } : {}),
      })),
      params_training: {
        ...prevState.params_training,
        learning_rate  : h.learningRate,
        n_of_epochs    : h.epochs,
        test_size      : h.testSize,
        id_optimizer   : h.optimizer as IdOptimizer_t,
        id_loss        : h.loss as IdLoss_t,
        list_id_metrics: h.metrics as IdMetric_t[],
      },
    }))
  }
  // endregion




  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init][ dataset, t, setIModelInstance, setAccordionActive, setDatasets, setParams, history ]')
    const init = async () => {
      await tfjs.ready()
      if (hasModel(MAP_LR_CLASSES, dataset)) {
        const _iModelInstance = new (await loadModelClass(MAP_LR_CLASSES, dataset))(t, setAccordionActive)
        setIModelInstance(_iModelInstance)
        // Al subir un CSV no hay datasets predefinidos: los aporta el usuario
        if (dataset !== UPLOAD) {
          const _datasets = await _iModelInstance.DATASETS()
          setDatasets(() => {
            return {
              data   : _datasets,
              index  : 0,
              dataset: 'select-dataset',
            }
          })
        }
      } else {
        await alertHelper.alertError(t('error.model-selected'))
        console.error('Error, option not valid', { ID: dataset })
        navigate('/404')
      }
    }
    init().then(() => undefined)
  }, [dataset, t, setIModelInstance, setAccordionActive, setDatasets, setParams, navigate])


  // Las capas por defecto de cada fichero (el vino tinto o el blanco…): al cargarlo o al elegir otro, no con cualquier
  // cambio de los datos (procesarlos las borraría, y con ellas una configuración importada)
  const selectedCsv = datasets.index !== DEFAULT_SELECTOR_DATASET_INDEX ? datasets.data[datasets.index]?.csv : undefined
  useEffect(() => {
    if (dataset === UPLOAD || !hasModel(MAP_LR_CLASSES, dataset) || iModelInstance === null || !selectedCsv) return
    setParams((prevState) => ({
      ...prevState,
      params_layers: iModelInstance.DEFAULT_LAYERS(selectedCsv),
    }))
  }, [dataset, iModelInstance, selectedCsv, setParams])

  // Lista después de las capas por defecto del conjunto de datos (el efecto de arriba)
  const { sessionVersion, importSession } = useTrainerSession(TASKS.REGRESSION, iModelInstance !== null && (dataset === UPLOAD || datasets.data.length > 0), applySession)

  const TrainModel = async () => {
    const dataset_processed = datasets.data[datasets.index]
    const result = await createRegressionCustomModel({
      dataset_processed: dataset_processed,
      layerList        : params.params_layers,
      learningRate     : params.params_training.learning_rate,
      numberOfEpoch    : params.params_training.n_of_epochs,
      testSize         : params.params_training.test_size / 100,
      idOptimizer      : params.params_training.id_optimizer,
      idLoss           : params.params_training.id_loss,
      idMetrics        : params.params_training.list_id_metrics,
      ...training.callbacks,
    })
    if (!result) {
      console.error('Error creating the model')
      return
    }
    const { model, history } = result

    const newModel: _Types.CustomModelGenerated_t = {
      model            : model,
      history          : history,
      params_layers    : [...params.params_layers],
      params_training  : { ...params.params_training },
      params_features  : { ...params.params_features },
      dataset_processed: dataset_processed
    }
    setListModels((prevState) => {
      return {
        ...prevState,
        data : [...prevState.data, newModel],
        index: prevState.data.length
      }
    })
    storedModels.save(model, {
      params_layers  : newModel.params_layers,
      params_training: newModel.params_training,
      params_features: newModel.params_features,
      csv            : dataset_processed.csv,
      history        : historyData(history),
    })
    reportTrainResult({ history: history.history, layers: newModel.params_layers })
    fillPredictionForm(dataset_processed)
    training.complete()
  }

  /** El formulario de predicción, con la primera fila del conjunto con el que se entrenó el modelo elegido */
  const fillPredictionForm = (dataset_processed: _Types.DatasetProcessed_t) => {
    const newPredictionState = TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION(dataset_processed, 0)
    setPrediction((prevState) => ({
      ...prevState,
      input_0_raw                : newPredictionState.input_0_raw,
      input_1_dataframe_original : newPredictionState.input_1_dataframe_original,
      input_1_dataframe_processed: newPredictionState.input_1_dataframe_processed,
      input_2_dataframe_encoding : newPredictionState.input_2_dataframe_encoding,
      input_3_dataframe_scaling  : newPredictionState.input_3_dataframe_scaling,
    }))
  }

  // Los modelos entrenados antes con este conjunto (guardados en el navegador): vuelven a la tabla con el fichero con el
  // que se entrenaron (por su nombre). Cuando ya están cargados los datos; los de un conjunto subido no se guardan
  const storedModels = useStoredModels<StoredRegressionModel_t>('regression', dataset, dataset !== UPLOAD && datasets.data.length > 0, (stored) => {
    const restored = stored.flatMap(({ model, data: { csv, history, ...params } }): _Types.CustomModelGenerated_t[] => {
      const dataset_processed = datasets.data.find((candidate) => candidate.csv === csv)
      return dataset_processed === undefined ? [] : [{ ...params, model: model as tfjs.Sequential, history: historyFromData(history), dataset_processed }]
    })
    if (restored.length === 0) return
    setListModels((prevState) => ({
      ...prevState,
      data : [...restored, ...prevState.data],
      index: prevState.index >= 0 ? prevState.index + restored.length : restored.length - 1,
    }))
    if (listModels.data.length === 0) fillPredictionForm(restored.at(-1)!.dataset_processed)
  })
  const handleClear_StoredModels = async () => {
    await storedModels.clear()
    setListModels((prevState) => ({ ...prevState, data: [], index: DEFAULT_SELECTOR_MODEL_INDEX }))
  }

  const handleSubmit_TrainModel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!(await layersAreValid(t, checkDenseLayers(params.params_layers)))) return
    setIsTraining(true)
    training.start({
      epochs      : params.params_training.n_of_epochs,
      learningRate: params.params_training.learning_rate,
      optimizer   : params.params_training.id_optimizer,
      loss        : params.params_training.id_loss,
      layers      : params.params_layers.length,
    })

    try {
      await TrainModel()
      alertHelper.alertSuccess(t('alert.model-train-success'))
    } catch (error) {
      console.error('Error during model training:', error)
    } finally {
      setIsTraining(false)
      training.finish()
    }
  }

  const accordionToggle = (value: string) => {

    setAccordionActive((prevState) => {
      const copy = JSON.parse(JSON.stringify(prevState))
      const index = copy.indexOf(value)
      if (index === -1) {
        copy.push(value)
      } else {
        copy.splice(index, 1)
      }
      return copy
    })
  }

  const ready = datasets.data.length > 0 && datasets.index !== DEFAULT_SELECTOR_DATASET_INDEX && datasets.index >= 0

  // La clase del modelo se carga bajo demanda en el init; hasta entonces se muestra la carga.
  if (iModelInstance === null) {
    return <WaitingPlaceholder />
  }

  if (VERBOSE) console.debug('render Regression')
  return (
    <>
      <N4LSectionLayout steps={steps}>
        <N4LPageHeader title={<Trans i18nKey={'modality.' + param_id} />} guideId={'train.regression.' + dataset} guideSteps={guideSteps}
          getSession={currentSession} onImport={importSession} className={'mt-2 mb-3'} />

        {/* INFORMATION */}
        <N4LDivider i18nKey={'hr.information'} steps={steps} />
        <Row>
          <Col>
            <Accordion defaultActiveKey={[]} activeKey={accordionActive}>
              <Accordion.Item data-guide={'manual'} eventKey={'manual'}>
                <Accordion.Header onClick={() => accordionToggle('manual')} as={'h2'} className={'n4l-accordion-h2'}>
                  <Trans i18nKey={'pages.playground.1-regression.generator.manual.title'} />
                </Accordion.Header>
                <Accordion.Body>
                  <Suspense fallback={<></>}><RegressionManual /></Suspense>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item data-guide={'dataset-info'} eventKey={'dataset_info'}>
                <Accordion.Header onClick={() => accordionToggle('dataset_info')} as={'h2'} className={'n4l-accordion-h2'}>
                  <Trans i18nKey={dataset !== UPLOAD ? iModelInstance.i18n_TITLE : prefix + 'dataset.upload-dataset'} />
                </Accordion.Header>
                <Accordion.Body id={'info-dataset'}>
                  <Suspense fallback={<></>}><RegressionDataset dataset={dataset} /></Suspense>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Col>
        </Row>

        {/* PROCESS DATASET */}
        {dataset === UPLOAD && <>
          <N4LDivider i18nKey={'hr.process-dataset'} steps={steps} />
          <Row data-guide={'process'}>
            <Col>
              <Suspense fallback={<></>}><RegressionDatasetProcess /></Suspense>
            </Col>
          </Row>
        </>}

        {/* SHOW DATASET */}
        <N4LDivider i18nKey={'hr.dataset'} steps={steps} />
        <Row data-guide={'dataset'}>
          <Col>
            <Suspense fallback={<></>}><RegressionDatasetShow /></Suspense>
          </Col>
        </Row>

        {/* MODEL */}
        <N4LDivider i18nKey={'hr.model'} steps={steps} />
        <Row>
          <Col data-guide={'layer-design'}>
            <N4LLayerDesign
              layers={params.params_layers}
              show={ready}
              actions={[
                <>
                  <Trans
                    i18nKey={'more-information-in-link'}
                    components={{
                      link1: <N4LHelpLink page={'glossary'} action={GLOSSARY_ACTIONS.REGRESSION.STEP_3_0_LAYER_DESIGN} />,
                    }} />
                </>
              ]}
            />
          </Col>
        </Row>

        <Form onSubmit={handleSubmit_TrainModel}>
          <Row className={'mt-3'}>
            <Col className={'mb-3'}>
              <Suspense fallback={<></>}><RegressionEditorLayers /></Suspense>
              <Suspense fallback={<></>}><RegressionEditorFeaturesSelector /></Suspense>
            </Col>

            <Col>
              <Suspense fallback={<></>}><RegressionEditorHyperparameters key={sessionVersion} /></Suspense>
            </Col>
          </Row>

          <Row className={'mt-3'}>
            <Col xl={12} data-guide={'train'}>
              <N4LTrainButton isTraining={training.isTraining}
                progress={training.progress}
                isStopping={training.isStopping}
                onStop={training.stop}
                disabled={!ready || isTraining || !datasets.data[datasets.index].is_dataset_processed}>
                <Trans i18nKey={prefix + 'models.button-submit'} />
              </N4LTrainButton>
              {!training.isTraining &&
                <N4LTrainingDiagnosis history={listModels.data.at(-1)?.history.history} model={listModels.data.length} />}
            </Col>
          </Row>
        </Form>

        <hr />

        <N4LStoredModelsNotice count={storedModels.restored} onClear={handleClear_StoredModels} />
        <Row className={'mt-3'}>
          <Col data-guide={'models'}>
            <Suspense fallback={<></>}><RegressionTableModels /></Suspense>
          </Col>
        </Row>

        {/* Paso a paso, si se ha activado en /settings */}
        {stepByStep && <>
          <N4LDivider i18nKey={'hr.step-by-step'} steps={steps} />
          <Row className={'mt-3'} data-guide={'step-by-step'}>
            <Col>
              <N4LStepByStep kind={'regression'} layers={stepLayers} X={stepData.X} y={stepData.y}
                featureNames={stepData.features} outputNames={[stepProcessed?.column_name_target ?? '']}
                learningRate={params.params_training.learning_rate} />
            </Col>
          </Row>
        </>}

        <N4LDivider i18nKey={'hr.predict'} steps={steps} />

        <Row className={'mt-3'}>
          <Col data-guide={'predict'}>
            <Suspense fallback={<></>}>
              <RegressionPrediction steps={steps} />
            </Suspense>
          </Col>
        </Row>

        {import.meta.env.VITE_ENVIRONMENT === 'development' && ready &&
          <Row className={'mt-3'}>
            <Col>
              <Card>
                <Card.Header>
                  <h2>Debug</h2>
                </Card.Header>
                <Card.Body>
                  <Row lg={2}>
                    <Col>
                      <DebugJSON
                        obj={{
                          is_dataset_upload   : datasets.data[datasets.index].is_dataset_upload,
                          is_dataset_processed: datasets.data[datasets.index].is_dataset_processed,
                          container_info      : datasets.data[datasets.index].container_info,
                        }} />
                    </Col>
                    <Col>
                      <DebugJSON
                        obj={{
                          datasets      : datasets.data.length,
                          datasets_index: datasets.index
                        }} />
                    </Col>
                    <Col><DebugJSON obj={params.params_training} /></Col>
                    <Col><DebugJSON obj={params.params_visor} /></Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        }

      </N4LSectionLayout>
    </>
  )
}
