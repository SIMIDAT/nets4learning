import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'
import { Accordion, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { trackPageView } from '@core/analytics'
import * as tfjs from '@tensorflow/tfjs'

import { DEFAULT_SELECTOR_DATASET_INDEX, VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS } from '@/CONSTANTS_ACTIONS'

import N4LDivider from '@components/divider/N4LDivider'
import N4LTrainButton from '@components/neural-network/N4LTrainButton'
import { useTrainingProgress } from '@hooks/useTrainingProgress'
import N4LSessionButtons from '@components/session/N4LSessionButtons'
import { downloadSession, parseSession, SessionError } from '@core/session/trainingSession'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import N4LLayerDesign from '@components/neural-network/N4LLayerDesign'
import N4LJoyride from '@components/joyride/N4LJoyride'
import DebugJSON from '@components/debug/DebugJSON'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

import { MAP_LR_CLASSES } from './models'
import { hasModel, loadModelClass } from '@core/models/modelRegistry'

import * as _Types from '@core/types'
// import LinearRegressionModelController_Simple from '@core/controller/01-regression/LinearRegressionModelController_Simple'
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
// const RegressionEditorVisor = lazy(() => import( './RegressionEditorVisor'))
// Models
const RegressionTableModels = lazy(() => import('./RegressionTableModels'))
const RegressionPrediction = lazy(() => import('./RegressionPrediction'))

type RegressionProps_t = {
  dataset: string
}

export default function Regression({ dataset }: RegressionProps_t) {
  /** @type {ReturnType<typeof useParams<{id: string}>>} */
  const { id: param_id } = useParams()
  const navigate = useNavigate()

  // i18n
  const prefix = 'pages.playground.generator.'
  const { t } = useTranslation()
  const training = useTrainingProgress()
  // Secciones de la página en orden: numeran los separadores (N4LDivider)
  const steps = ['hr.information', ...(dataset === UPLOAD ? ['hr.process-dataset'] : []), 'hr.dataset', 'hr.model', 'hr.predict']

  const {
    // prediction,
    setPrediction,

    datasets,
    setDatasets,

    params,
    setParams,

    isTraining,
    setIsTraining,

    setListModels,

    accordionActive,
    setAccordionActive,

    iModelInstance,
    setIModelInstance,
  } = useRegressionContext()

  // region SESIÓN: exportar e importar capas e hiperparámetros
  // Cambia al importar para volver a montar el editor de hiperparámetros con los valores nuevos
  const [sessionVersion, setSessionVersion] = useState(0)

  const handleClick_ExportSession = () => {
    const training_params = params.params_training
    downloadSession({
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
    })
  }

  const handleImport_Session = async (text: string) => {
    try {
      const { layers: importedLayers, hyperparameters: h } = parseSession(text, TASKS.REGRESSION)
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
      setSessionVersion((version) => version + 1)
      await alertHelper.alertSuccess(t('session.imported'))
    } catch (error) {
      await alertHelper.alertError(t(error instanceof SessionError ? error.i18nKey : 'session.error-not-session'))
    }
  }
  // endregion

  const joyrideButton_ref = useRef<_Types.JoyrideHandle_t>({})


  useEffect(() => {
    trackPageView(`/Regression/${dataset}`, dataset)
  }, [dataset])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init][ dataset, t, setIModelInstance, setAccordionActive, setDatasets, setParams, history ]')
    const init = async () => {
      await tfjs.ready()
      if (hasModel(MAP_LR_CLASSES, dataset)) {
        /** @type {_Types.I_MODEL_REGRESSION_t} */
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


  useEffect(() => {
    if (dataset === UPLOAD) {
      if (VERBOSE) console.debug('Regression upload csv')
    } else if (hasModel(MAP_LR_CLASSES, dataset)) {
      if (iModelInstance
        && datasets
        && datasets.data
        && datasets.index != DEFAULT_SELECTOR_DATASET_INDEX
        && datasets.data[datasets.index]
        && datasets.data[datasets.index].csv
      ) {
        setParams((prevState) => ({
          ...prevState,
          params_layers: iModelInstance.DEFAULT_LAYERS(datasets.data[datasets.index].csv)
        }))
      }
    }
  }, [dataset, iModelInstance, datasets, setParams])

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

    /** @type {_Types.CustomModelGenerated_t} */
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

  const handleSubmit_TrainModel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsTraining(true)
    training.start()

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
      <N4LJoyride 
        joyrideButton_ref={joyrideButton_ref}
        JOYRIDE_state={iModelInstance.JOYRIDE()}
        TASK={'regression'}
        KEY={'LinearRegression'}
      />

      <Container>
        <Row className={'mt-2 mb-3'}>
          <Col xl={12}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h1><Trans i18nKey={'modality.' + param_id} /></h1>
              <div className={'d-flex flex-wrap gap-2'}>
                <N4LSessionButtons onExport={handleClick_ExportSession} onImport={handleImport_Session} />
                <Button className={'text-nowrap'} size={'sm'}
                  variant={'outline-primary'}
                  onClick={() => joyrideButton_ref.current.handleClick_StartJoyride?.()}>
                  <Trans i18nKey={'datasets-models.1-regression.joyride.title'} />
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* INFORMATION */}
        <N4LDivider i18nKey={'hr.information'} steps={steps} />
        <Row>
          <Col>
            <Accordion defaultActiveKey={[]} activeKey={accordionActive}>
              <Accordion.Item className={'joyride-step-1-manual'} eventKey={'manual'}>
                <Accordion.Header onClick={() => accordionToggle('manual')} as={'h2'} className={'n4l-accordion-h2'}>
                  <Trans i18nKey={'pages.playground.1-regression.generator.manual.title'} />
                </Accordion.Header>
                <Accordion.Body>
                  <Suspense fallback={<></>}><RegressionManual /></Suspense>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item className={'joyride-step-2-dataset-info'} eventKey={'dataset_info'}>
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
          <Row className={'joyride-step-3-pre-process-dataset'}>
            <Col>
              <Suspense fallback={<></>}><RegressionDatasetProcess /></Suspense>
            </Col>
          </Row>
        </>}

        {/* SHOW DATASET */}
        <N4LDivider i18nKey={'hr.dataset'} steps={steps} />
        <Row className={'joyride-step-4-dataset'}>
          <Col>
            <Suspense fallback={<></>}><RegressionDatasetShow /></Suspense>
          </Col>
        </Row>

        {/* MODEL */}
        <N4LDivider i18nKey={'hr.model'} steps={steps} />
        <Row>
          <Col className={'joyride-step-5-layer'}>
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
              <div className={'joyride-step-6-editor-layers'}>
                <Suspense fallback={<></>}><RegressionEditorLayers /></Suspense>
              </div>

              <div className={'joyride-step-6-editor-selector-features'}>
                <Suspense fallback={<></>}><RegressionEditorFeaturesSelector /></Suspense>
              </div>
            </Col>

            <Col className={'joyride-step-7-editor-trainer'}>
              <Suspense fallback={<></>}><RegressionEditorHyperparameters key={sessionVersion} /></Suspense>
            </Col>
          </Row>

          <Row className={'mt-3'}>
            <Col xl={12}>
              <N4LTrainButton isTraining={training.isTraining}
                progress={training.progress}
                isStopping={training.isStopping}
                onStop={training.stop}
                disabled={!ready || isTraining || !datasets.data[datasets.index].is_dataset_processed}>
                <Trans i18nKey={prefix + 'models.button-submit'} />
              </N4LTrainButton>
            </Col>
          </Row>
        </Form>

        <hr />

        <Row className={'mt-3'}>
          <Col className={'joyride-step-8-list-of-models'}>
            <Suspense fallback={<></>}><RegressionTableModels /></Suspense>
          </Col>
        </Row>

        <N4LDivider i18nKey={'hr.predict'} steps={steps} />

        <Row className={'mt-3'}>
          <Col className={'joyride-step-9-predict-visualization'}>
            <Suspense fallback={<></>}>
              <RegressionPrediction />
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

      </Container>
    </>
  )
}
