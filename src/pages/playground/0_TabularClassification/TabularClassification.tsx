import './TabularClassification.css'
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'
import { Accordion, Card, Col, Form, Row } from 'react-bootstrap'
import * as _dfd from 'danfojs'
import * as tfjs from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'

import * as _Types from '@core/types'
import { TASKS, UPLOAD } from '@/TASKS'
import { MAP_TC_CLASSES } from '@pages/playground/0_TabularClassification/models'
import { hasModel, loadModelClass } from '@core/models/modelRegistry'
import { createTabularClassificationCustomModel } from '@core/controller/00-tabular-classification/TabularClassificationModelController'

import alertHelper from '@utils/alertHelper'

import N4LDivider from '@components/divider/N4LDivider'
import N4LSectionLayout from '@components/divider/N4LSectionLayout'
import { argMax } from '@core/nn-utils/classificationOutput'
import N4LLayerDesign from '@components/neural-network/N4LLayerDesign'
import N4LTrainButton from '@components/neural-network/N4LTrainButton'
import { useTrainingProgress } from '@hooks/useTrainingProgress'
import { useStoredModels } from '@hooks/useStoredModels'
import N4LStoredModelsNotice from '@components/neural-network/N4LStoredModelsNotice'
import N4LTrainingDiagnosis from '@components/neural-network/N4LTrainingDiagnosis'
import { layerIssueText } from '@components/neural-network/layerCheckText'
import { checkDenseLayers } from '@core/nn-utils/checkLayers'
import { historyFromData } from '@core/training/modelStore'
import { reportTrainResult } from '@core/training/trainResult'
import { historyData, type TrainingHistory_t } from '@core/training/buildModels'
import N4LSessionButtons from '@components/session/N4LSessionButtons'
import N4LGuide from '@components/guide/N4LGuide'
import { trainerGuide } from '@components/guide/trainerGuide'
import N4LStepByStep from '@components/neural-network/stepByStep/N4LStepByStep'
import { useStepByStepEnabled } from '@components/neural-network/stepByStep/stepByStepSetting'
import { parseSession, SessionError, type TrainingSession_t } from '@core/session/trainingSession'
import { useSharedSession } from '@hooks/useSharedSession'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import N4LEmptyState from '@components/loading/N4LEmptyState'

import TabularClassificationManual from '@pages/playground/0_TabularClassification/TabularClassificationManual'
import TabularClassificationDataset from '@pages/playground/0_TabularClassification/TabularClassificationDataset'
import TabularClassificationDatasetShow from '@pages/playground/0_TabularClassification/TabularClassificationDatasetShow'
import TabularClassificationEditorHyperparameters from '@pages/playground/0_TabularClassification/TabularClassificationEditorHyperparameters'
import TabularClassificationEditorLayers from '@pages/playground/0_TabularClassification/TabularClassificationEditorLayers'
import TabularClassificationTableModels from '@pages/playground/0_TabularClassification/TabularClassificationTableModels'
import TabularClassificationPrediction from '@pages/playground/0_TabularClassification/TabularClassificationPrediction'
import TabularShapPanel from '@core/explainability/TabularShapPanel'
import { dataframeRowsToNumbers } from '@core/explainability/shapSampling'
import { trackEvent } from '@core/analytics'

import { VERBOSE } from '@/CONSTANTS'

import TabularClassificationDatasetProcess from '@pages/playground/0_TabularClassification/TabularClassificationDatasetProcess'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'

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
type Props = {
  dataset: string
}
/** Lo que se guarda de cada modelo entrenado (con el modelo): todo menos el modelo, y el historial como datos */
type StoredTabularModel_t = Omit<_Types.TabularClassificationGeneratedModel_t, 'model' | 'history'> & { history: TrainingHistory_t }

export default function TabularClassification(props: Props) {
  const { dataset } = props
  const navigate = useNavigate()

  const prefix = 'pages.playground.generator.'
  const prefixManual = 'pages.playground.0-tabular-classification.generator.'
  const { t } = useTranslation()

  const {
    iModelInstance, setIModelInstance,
    datasets, setDatasets,
    layers, setLayers,
    learningRate, setLearningRate,
    numberEpochs, setNumberEpochs,
    testSize, setTestSize,
    idOptimizer, setIdOptimizer,
    idLoss, setIdLoss,
    idMetrics, setIdMetrics,
    isTraining, setIsTraining,
    generatedModels, setGeneratedModels,
    setGeneratedModelsIndex,
    model, setModel,
    inputDataToPredict,
    inputVectorToPredict,
    predictionBar, setPredictionBar,
  } = useTabularClassificationContext()

  // Explicabilidad: el modelo predice en espacio ESCALADO, así que la instancia explicada y el
  // background (data_processed.X) también van escalados.
  const predictedVector_ref = useRef<number[] | null>(null)
  const predictedDisplay_ref = useRef<Array<string | number> | null>(null)
  const [predictedClassIndex, setPredictedClassIndex] = useState(0)
  const training = useTrainingProgress()

  // Los modelos entrenados antes con este conjunto (guardados en el navegador): vuelven a la tabla, y se clasifica con
  // el último. Los de un conjunto subido no se guardan
  const storedModels = useStoredModels<StoredTabularModel_t>('tabular-classification', dataset, dataset !== UPLOAD, (stored) => {
    const restored = stored.map(({ model, data }) => ({ ...data, model: model as tfjs.Sequential, history: historyFromData(data.history) }))
    setGeneratedModels((current) => [...restored, ...current])
    setGeneratedModelsIndex((current) => (current >= 0 ? current + restored.length : restored.length - 1))
    setModel((current) => current ?? restored.at(-1)!.model)
  })
  const handleClear_StoredModels = async () => {
    await storedModels.clear()
    setGeneratedModels([])
    setGeneratedModelsIndex(-1)
    setModel(null)
  }

  // region SESIÓN: exportar e importar capas e hiperparámetros
  // Cambia al importar para volver a montar el editor de hiperparámetros con los valores nuevos
  const [sessionVersion, setSessionVersion] = useState(0)

  const currentSession = (): TrainingSession_t => ({
    app            : 'nets4learning',
    version        : 1,
    task           : TASKS.TABULAR_CLASSIFICATION,
    dataset        : dataset,
    layers         : layers,
    hyperparameters: { learningRate, epochs: numberEpochs, testSize, optimizer: idOptimizer, loss: idLoss, metrics: [idMetrics] },
  })

  const handleImport_Session = async (text: string) => {
    try {
      const { layers: importedLayers, hyperparameters: h } = parseSession(text, TASKS.TABULAR_CLASSIFICATION)
      setLayers(importedLayers.map((layer) => ({ _class: 'dense', units: Number(layer.units), activation: String(layer.activation ?? 'relu') })))
      setLearningRate(h.learningRate)
      setNumberEpochs(h.epochs)
      setTestSize(h.testSize)
      setIdOptimizer(h.optimizer as IdOptimizer_t)
      setIdLoss(h.loss as IdLoss_t)
      setIdMetrics((h.metrics[0] ?? idMetrics) as IdMetric_t)
      setSessionVersion((version) => version + 1)
      await alertHelper.alertSuccess(t('session.imported'))
    } catch (error) {
      await alertHelper.alertError(t(error instanceof SessionError ? error.i18nKey : 'session.error-not-session'))
    }
  }
  // La de un enlace compartido, cuando ya están los datos (antes, la página pone sus capas por defecto)
  useSharedSession(datasets.datasets.length > 0, handleImport_Session)
  // endregion
  // Secciones de la página en orden: numeran los separadores (N4LDivider)
  // Paso a paso solo si se ha activado en /settings
  const stepByStep = useStepByStepEnabled()
  const steps = ['hr.information', ...(dataset === UPLOAD ? ['hr.process-dataset'] : []), 'hr.dataset', 'hr.model', ...(stepByStep ? ['hr.step-by-step'] : []), 'hr.generated-models', 'hr.classify', 'hr.explainability']
  // La guía de la página (botón Guía): de los datos al modelo entrenado, paso a paso
  const guideSteps = useMemo(() => trainerGuide(t, '0-tabular-classification', dataset, { upload: dataset === UPLOAD, datasetTable: true, testSize: 'hp-train-rate', stepByStep: stepByStep ? 'after-train' : false }), [t, dataset, stepByStep])
  // El paso a paso (N4LStepByStep): las capas del editor y las filas ya procesadas, como las recibe la red
  const stepLayers = useMemo(() => layers.map(({ units, activation }) => ({ units, activation: activation ?? 'linear' })), [layers])
  const stepProcessed = datasets.datasets[datasets.index]?.data_processed
  const stepData = useMemo(() => ({
    X       : dataframeRowsToNumbers(stepProcessed?.X.values),
    y       : (stepProcessed?.y.values ?? []) as number[][],
    features: (stepProcessed?.X.columns ?? []) as string[],
  }), [stepProcessed])


  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init][ dataset, t, history ]')
    const init = async () => {
      await tfjs.ready()
      if (hasModel(MAP_TC_CLASSES, dataset)) {
        const _iModelClass = await loadModelClass(MAP_TC_CLASSES, dataset)
        const _iModelInstance = new _iModelClass(t, () => {})
        setIModelInstance(_iModelInstance)
        const _datasets = await _iModelInstance.DATASETS()
        const _default_layers = _iModelInstance.DEFAULT_LAYERS()
        setLayers(_default_layers)
        setDatasets({ index: 0, datasets: _datasets })
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
  }, [dataset, t, navigate, setIModelInstance, setLayers, setDatasets])

  // region MODEL
  const handleSubmit_CreateModel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (datasets.datasets.length === 0) {
      await alertHelper.alertError(t('error.need-dataset'))
      return
    }
    if (datasets.index < 0 || datasets.index >= datasets.datasets.length) {
      await alertHelper.alertError(t('error.need-dataset'))
      return
    }

    const { data_processed } = datasets.datasets[datasets.index]
    if (!data_processed || !data_processed.classes) {
      await alertHelper.alertError(t('error.dataset-not-processed'))
      console.error('Error, dataset not processed')
      return
    }

    // Lo que está mal en las capas (la salida con tantas neuronas como clases, unidades válidas…) impide entrenar
    const layerError = checkDenseLayers(layers, { units: data_processed.classes.length, activation: 'softmax' }).find(({ severity }) => severity === 'error')
    if (layerError) {
      await alertHelper.alertWarning(t('layer-check.title-error'), { footer: '', text: '', html: <>{layerIssueText(t, layerError)}</> })
      return
    }

    try {
      setIsTraining(true)
      training.start({ epochs: numberEpochs, learningRate, optimizer: idOptimizer, loss: idLoss, layers: layers.length })
      const _dataset_processed = datasets.datasets[datasets.index]
      const _learningRate = learningRate
      const _numberOfEpoch = numberEpochs
      const _testSize = testSize / 100
      const _layerList = layers
      const _idOptimizer = idOptimizer
      const _idLoss = idLoss
      const _idMetrics = idMetrics

      const { model, history, evaluation } = await createTabularClassificationCustomModel({
        dataset_processed: _dataset_processed,
        learningRate     : _learningRate,
        numberOfEpoch    : _numberOfEpoch,
        testSize         : _testSize,
        layerList        : _layerList,
        idOptimizer      : _idOptimizer,
        idLoss           : _idLoss,
        idMetrics        : _idMetrics,
        ...training.callbacks,
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
        evaluation   : evaluation && { classes: data_processed.classes, ...evaluation },
      }
      setGeneratedModels((oldArray) => ([
        ...oldArray,
        newModel
      ]))
      setIsTraining(false)

      // Se clasifica con el modelo recién entrenado (durante el entrenamiento no se añaden otros)
      setModel(model)
      const { model: _model, history: _history, ...stored } = newModel
      storedModels.save(model, { ...stored, history: historyData(history) })
      reportTrainResult({ history: history.history, layers: _layerList, evaluation })
      setGeneratedModelsIndex(generatedModels.length)
      training.complete()
      await alertHelper.alertSuccess(t('alert.model-train-success'))
    } catch (error) {
      console.error(error)
    } finally {
      setIsTraining(false)
      training.finish()
    }
  }
  // endregion

  // region Prediction
  const handleSubmit_PredictVector = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (dataset === UPLOAD) {
      if (datasets.datasets.length === 0) {
        await alertHelper.alertError(t('error.need-dataset'))
        return
      }
    }
    if (model === undefined || model === null) {
      await alertHelper.alertError(t('error.need-model'))
      return
    }
    try {
      const { data_processed } = datasets.datasets[datasets.index]
      if (!data_processed) {
        await alertHelper.alertError(t('error.dataset-not-processed'))
        console.error('Error, dataset not processed')
        return
      }
      const { scaler, classes } = data_processed
      if (!scaler || !classes) {
        await alertHelper.alertError(t('error.dataset-not-processed'))
        console.error('Error, dataset not processed')
        return
      }
      const input_vector_to_predict_scaled = scaler.transform(inputVectorToPredict)
      const prediction = tfjs.tidy(() => model.predict(tfjs.tensor([input_vector_to_predict_scaled])) as tfjs.Tensor)
      // Lectura asíncrona: con WebGPU las síncronas detienen la GPU
      const predictionValues = Array.from(await prediction.data<'float32'>())
      prediction.dispose()
      if (VERBOSE) console.debug({ predictionValues })
      predictedVector_ref.current = input_vector_to_predict_scaled as number[]
      predictedDisplay_ref.current = inputDataToPredict.map((value) => (Array.isArray(value) ? value.join(', ') : String(value)))
      setPredictedClassIndex(argMax(predictionValues))
      setPredictionBar({ classes: classes, labels: classes, data: predictionValues })
      trackEvent('predict', { input: 'form' })
    } catch (error) {
      console.error(error)
      await alertHelper.alertError(t('error.model-not-valid'))
    }
  }
  // endregion
  if (iModelInstance === null) {
    return <WaitingPlaceholder />
  }

  const dataProcessed = datasets.datasets[datasets.index]?.data_processed
  if (VERBOSE) console.debug('render TabularClassificationCustomDataset')
  return (
    <>
      <N4LSectionLayout steps={steps} className={'mb-3'}>
        <Row className={'mt-3 mb-3'}>
          <Col xl={12}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h1><Trans i18nKey={'modality.0'} /></h1>
              <div className={'d-flex flex-wrap gap-2'}>
                <N4LGuide id={'train.tabular-classification.' + dataset} steps={guideSteps} compact={true} />
                <div className={'d-flex flex-wrap gap-2'} data-guide={'session'}>
                  <N4LSessionButtons getSession={currentSession} onImport={handleImport_Session} />
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* INFORMATION */}
        <N4LDivider i18nKey={'hr.information'} steps={steps} />
        <Row className={'mt-3'}>
          <Col>
            <Accordion defaultActiveKey={dataset === UPLOAD ? ['dataset_info'] : []}>
              <Accordion.Item data-guide={'manual'} key={UPLOAD} eventKey={'manual'}>
                <Accordion.Header as={'h2'} className={'n4l-accordion-h2'}>
                  <Trans i18nKey={prefixManual + 'manual.title'} />
                </Accordion.Header>
                <Accordion.Body>
                  <TabularClassificationManual />
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item data-guide={'dataset-info'} key={'1'} eventKey={'dataset_info'}>
                <Accordion.Header as={'h2'} className={'n4l-accordion-h2'}>
                  <Trans i18nKey={dataset !== UPLOAD ? iModelInstance.TITLE : prefix + 'dataset.upload-dataset'} />
                </Accordion.Header>
                <Accordion.Body>
                  <TabularClassificationDataset dataset={dataset} />
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Col>
        </Row>

        {/* PROCESS DATASET */}
        {dataset === UPLOAD && <>
          <N4LDivider i18nKey={'hr.process-dataset'} steps={steps} />
          <Row className={'mt-3'} data-guide={'process'}>
            <Col>
              <TabularClassificationDatasetProcess />
            </Col>
          </Row>
        </>}

        {/* SHOW DATASET */}
        <N4LDivider i18nKey={'hr.dataset'} steps={steps} />
        <Row className={'mt-3'} data-guide={'dataset'}>
          <Col>
            <TabularClassificationDatasetShow />
          </Col>
        </Row>

        {/* GENERATOR */}
        <N4LDivider i18nKey={'hr.model'} steps={steps} />
        {datasets.index < 0 && <>
          <Card>
            <Card.Header className={'d-flex align-items-center justify-content-between'}>
              <h3><Trans i18nKey={'pages.playground.generator.layer-design'} /></h3>
            </Card.Header>
            <Card.Body>
              <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-process'} />
            </Card.Body>
          </Card>
        </>}
        {datasets.index >= 0 &&
          <Form onSubmit={handleSubmit_CreateModel} id={'TabularClassificationCustomDataset'}>
            {/* BLOCK 1 */}
            <Row className={'mt-3'}>
              <Col xl={12} data-guide={'layer-design'}>
                <N4LLayerDesign
                  layers={layers}
                  show={datasets.index >= 0}
                  glossary_action={GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_0_LAYER_DESIGN}
                  manual_action={MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_0_LAYER_DESIGN} />
              </Col>
            </Row>

            <Row className={'mt-3'}>
              {/* LAYERS EDITOR */}
              <Col className={'mt-3'} xl={6}>
                <TabularClassificationEditorLayers />
              </Col>

              {/* HYPERPARAMETERS EDITOR */}
              <Col className={'mt-3'} xl={6}>
                <TabularClassificationEditorHyperparameters key={sessionVersion} />
              </Col>
            </Row>

            {/* BLOCK BUTTON SUBMIT */}
            <Row className={'mt-3'}>
              <Col xl={12} data-guide={'train'}>
                <N4LTrainButton isTraining={training.isTraining}
                  progress={training.progress}
                  isStopping={training.isStopping}
                  onStop={training.stop}
                  disabled={isTraining || !datasets.datasets[datasets.index] || (!datasets.datasets[datasets.index].is_dataset_processed)}>
                  <Trans i18nKey={prefix + 'models.button-submit'} />
                </N4LTrainButton>
                {!training.isTraining &&
                  <N4LTrainingDiagnosis history={generatedModels.at(-1)?.history.history} model={generatedModels.length} />}
              </Col>
            </Row>
          </Form>
        }

        {/* STEP BY STEP (si se ha activado en /settings) */}
        {stepByStep && <>
          <N4LDivider i18nKey={'hr.step-by-step'} steps={steps} />
          <Row className={'mt-3'} data-guide={'step-by-step'}>
            <Col>
              <N4LStepByStep kind={'classification'} layers={stepLayers} X={stepData.X} y={stepData.y}
                featureNames={stepData.features} outputNames={stepProcessed?.classes ?? []} learningRate={learningRate} />
            </Col>
          </Row>
        </>}

        <N4LStoredModelsNotice count={storedModels.restored} onClear={handleClear_StoredModels} />
        {/* TABLE MODELS */}
        <N4LDivider i18nKey={'hr.generated-models'} steps={steps} />
        <Row className={'mt-3'} data-guide={'models'}>
          <Col>
            <TabularClassificationTableModels />
          </Col>
        </Row>

        {/* CLASSIFICATION */}
        <N4LDivider i18nKey={'hr.classify'} steps={steps} />

        <Row className={'mt-3'} data-guide={'predict'}>
          <Col xl={12}>
            <TabularClassificationPrediction dataset={dataset} handleSubmit_PredictVector={handleSubmit_PredictVector} />
          </Col>
        </Row>

        {/* EXPLAINABILITY */}
        <N4LDivider i18nKey={'hr.explainability'} steps={steps} />

        <Row>
          <Col xl={12}>
            <TabularShapPanel
              features={dataProcessed?.X.columns ?? []}
              classes={dataProcessed?.classes ?? []}
              predictedClassIndex={predictedClassIndex}
              inputKey={predictionBar}
              modelReady={model !== null && model !== undefined}
              hasPrediction={predictionBar.data.length > 0}
              getModel={() => model}
              getInstance={() => predictedVector_ref.current}
              getPool={() => dataframeRowsToNumbers(dataProcessed?.X.values)}
              getInstanceDisplay={() => predictedDisplay_ref.current}
              valuesAreScaled
            />
          </Col>
        </Row>
      </N4LSectionLayout>
    </>
  )
}
