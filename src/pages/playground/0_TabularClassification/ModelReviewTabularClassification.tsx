import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import * as tfjs from '@tensorflow/tfjs'

import alertHelper from '@utils/alertHelper'
import type I_MODEL_TABULAR_CLASSIFICATION from './models/_model'
import type { TabularInstance_t } from './models/_model'
import { VERBOSE } from '@/CONSTANTS'
import { UPLOAD } from '@/TASKS'
import { MAP_TC_CLASSES } from '@pages/playground/0_TabularClassification/models'
import { createReviewModelInstance } from '@core/models/createReviewModelInstance'
import ModelReviewTabularClassificationDataset from '@pages/playground/0_TabularClassification/ModelReviewTabularClassificationDataset'
import ModelReviewTabularClassificationPredict from '@pages/playground/0_TabularClassification/ModelReviewTabularClassificationPredict'
import ModelReviewTabularClassificationPredictForm from '@pages/playground/0_TabularClassification/ModelReviewTabularClassificationPredictForm'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import type { BasicPrediction_t, DatasetProcessed_t } from '@core/types'
import TabularShapPanel from '@core/explainability/TabularShapPanel'
import N4LModelSummaryButton from '@components/neural-network/N4LModelSummaryButton'
import N4LVirtualSelect, { type VirtualSelectOption_t } from '@components/select/N4LVirtualSelect'
import N4LPageHeader from '@components/neural-network/N4LPageHeader'
import N4LModelCard from '@components/neural-network/N4LModelCard'
import N4LModelAside from '@components/neural-network/N4LModelAside'
import N4LDownloadProgress from '@components/loading/N4LDownloadProgress'
import { trackDownloads } from '@core/downloadProgress'
import { dataframeRowsToNumbers, formatFeatureName } from '@core/explainability/shapSampling'
import { trackEvent } from '@core/analytics'
import { tabularReviewGuide } from './modelReviewGuide'
import N4LStepByStep from '@components/neural-network/stepByStep/N4LStepByStep'
import { useStepByStepEnabled } from '@components/neural-network/stepByStep/stepByStepSetting'
import { usePretrainedNetwork } from '@components/neural-network/stepByStep/usePretrainedNetwork'
import { PRETRAINED_LEARNING_RATE } from '@core/nn-utils/stepByStep'
type Props = {
  dataset: string
}
export default function ModelReviewTabularClassification(props: Props) {
  const { dataset } = props

  const { t } = useTranslation()
  const navigate = useNavigate()

  const [iModelInstance, setIModelInstance] = useState<I_MODEL_TABULAR_CLASSIFICATION | null>(null)
  const [model, setModel] = useState<tfjs.LayersModel | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const [isButtonToPredictDisabled, setIsButtonToPredictDisabled] = useState(true)

  // Datos a predecir crudos
  const [dataToPredict, setDataToPredict] = useState<TabularInstance_t>({})
  // Datos a predecir después de codificar
  const [vectorToPredict, setVectorToPredict] = useState<number[]>([])

  const [prediction, setPrediction] = useState<BasicPrediction_t>({ labels: [], data: [] })
  // Clase real de lo clasificado, si era un ejemplo o una fila del conjunto de datos sin cambios
  const [predictionActual, setPredictionActual] = useState<number | null>(null)

  // Conjunto de datos del modelo: sus filas se pueden copiar al formulario
  const [datasetProcessed, setDatasetProcessed] = useState<DatasetProcessed_t | null>(null)
  // Ejemplo (valores negativos: -1 el primero) o fila del conjunto de datos elegida en el selector
  const [selectedInstance, setSelectedInstance] = useState<number | null>(null)

  // === Explicabilidad (SHAP) ===
  // Filas del dataset (codificadas, sin escalar: el mismo espacio que recibe el modelo) y la
  // última entrada predicha, que es la que se explica.
  const backgroundPool_ref = useRef<number[][]>([])
  const predictedVector_ref = useRef<number[] | null>(null)
  // Valores del formulario (categorías y unidades originales) de la entrada predicha.
  const predictedDisplay_ref = useRef<Array<string | number> | null>(null)
  const [explainMeta, setExplainMeta] = useState<{ features: string[], classes: string[] }>({ features: [], classes: [] })
  const [predictedClassIndex, setPredictedClassIndex] = useState(0)

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect [dataToPredict]')
    // TODO encoders to dataToPredict
    const init = async () => {
      // Hasta que termina la carga no hay datos que codificar (los encoders fallan con valores vacíos)
      if (iModelInstance === null || Object.keys(dataToPredict).length === 0) return
      const datasets = await iModelInstance.DATASETS()
      if (datasets.length === 0 || !datasets[0].data_processed) {
        console.warn('Error, datasets is empty')
        return
      }
      const _vectorValuesEncoders = DataFrameUtils.DataFrameApplyEncoders(
        datasets[0].data_processed.encoders,
        dataToPredict,
        iModelInstance.DATA_DEFAULT_KEYS,
      )
      setVectorToPredict(_vectorValuesEncoders)
    }
    init().then()
  }, [dataToPredict, iModelInstance])


  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init]')
    const init = async () => {
      const _iModelInstance = await createReviewModelInstance(MAP_TC_CLASSES, dataset, (ModelClass) => new ModelClass(t, () => {}), navigate)
      if (_iModelInstance === null) return
      try {
        setIModelInstance(_iModelInstance)
        // El modelo y su conjunto de datos, con el progreso real de lo que se descarga
        const { _model, _datasets } = await trackDownloads(async () => ({
          _model   : await _iModelInstance.LOAD_LAYERS_MODEL({}),
          _datasets: await _iModelInstance.DATASETS() as DatasetProcessed_t[],
        }), 'model_load')
        setModel(_model)
        setDataToPredict(_iModelInstance.DATA_DEFAULT)
        if (!_datasets.length || !_datasets[0].data_processed) {
          console.warn('No datasets available.')
          return
        }
        const encoders = _datasets[0].data_processed.encoders
        const _applyEncoders = DataFrameUtils.DataFrameApplyEncoders(
          encoders,
          _iModelInstance.DATA_DEFAULT,
          _iModelInstance.DATA_DEFAULT_KEYS,
        )
        setVectorToPredict(_applyEncoders)
        backgroundPool_ref.current = dataframeRowsToNumbers(_datasets[0].data_processed.dataframe_X.values)
        setDatasetProcessed(_datasets[0])
        setExplainMeta({
          features: _iModelInstance.FORM.map((field) => formatFeatureName(field.name)),
          classes : _iModelInstance.CLASSES,
        })
        setIsLoading(false)
        setIsButtonToPredictDisabled(false)
        await alertHelper.alertSuccess(t('model-loaded-successfully'))
      } catch (e) {
        console.error("Error, can't load model", { e })
      }
    }

    init().then((_r) => {
      if (VERBOSE) console.debug('init end')
    })
  }, [dataset, navigate, t])

  const handleSubmit_PredictVector = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsButtonToPredictDisabled(true)
    if (vectorToPredict === undefined || vectorToPredict.length < 1) {
      await alertHelper.alertInfo(t('info.insert-input'))
      setIsButtonToPredictDisabled(false)
      return
    }
    if (model === null) {
      console.error('Error, model is null')
      return
    }
    if (iModelInstance === null) {
      console.error('Error, model instance is null')
      return
    }

    try {
      const parse_vectorToPredict = vectorToPredict.map((item) => parseFloat(item.toString()))
      const model_prediction = tfjs.tidy(() => model.predict(tfjs.tensor2d(parse_vectorToPredict, [1, parse_vectorToPredict.length])) as tfjs.Tensor)
      // Lectura asíncrona: con WebGPU las síncronas detienen la GPU
      const probabilities = Array.from(await model_prediction.data<'float32'>())
      model_prediction.dispose()
      predictedVector_ref.current = parse_vectorToPredict
      predictedDisplay_ref.current = iModelInstance.DATA_DEFAULT_KEYS.map((key) => dataToPredict[key])
      setPredictedClassIndex(probabilities.indexOf(Math.max(...probabilities)))
      setPredictionActual(instanceMatches && selectedInstance !== null ? actualClassOf(selectedInstance) : null)
      setPrediction({ labels: iModelInstance.CLASSES, data: probabilities })
      trackEvent('predict', { input: 'form' })
    } catch (error) {
      console.error(error)
      await alertHelper.alertError(t('error.prediction'))
    }

    setIsButtonToPredictDisabled(false)
  }

  // region SELECTOR DE INSTANCIAS: ejemplos de cada clase y filas del conjunto de datos
  const targetColumn = datasetProcessed?.data_processed?.column_name_target

  /** Valores de un ejemplo (valor negativo) o de una fila del conjunto de datos */
  const instanceFor = (value: number): TabularInstance_t | null => {
    if (iModelInstance === null) return null
    if (value < 0) return iModelInstance.LIST_EXAMPLES[-value - 1] ?? null
    const original = datasetProcessed?.dataframe_original
    if (!original) return null
    const row = original.values[value] as Array<string | number> | undefined
    if (row === undefined) return null
    return Object.fromEntries(iModelInstance.DATA_DEFAULT_KEYS.map((key) => [key, row[original.columns.indexOf(key)]]))
  }

  /** Clase real (posición en CLASSES) de un ejemplo o una fila; null si no se sabe */
  const actualClassOf = (value: number): number | null => {
    if (iModelInstance === null) return null
    const target = value < 0
      ? iModelInstance.LIST_EXAMPLES_RESULTS[-value - 1]
      : targetColumn ? datasetProcessed?.dataframe_original[targetColumn].values[value] : undefined
    const index = target === undefined ? -1 : iModelInstance.CLASS_INDEX(target)
    return index >= 0 ? index : null
  }

  // Primero los ejemplos de cada clase y después todas las filas (puede haber miles: el desplegable solo pinta las que se ven)
  const instanceOptions = useMemo<VirtualSelectOption_t[]>(() => {
    if (iModelInstance === null) return []
    const classText = (target: unknown) => {
      const classIndex = iModelInstance.CLASS_INDEX(target)
      return classIndex >= 0 ? t(iModelInstance.CLASSES[classIndex]) : String(target)
    }
    const examples = iModelInstance.LIST_EXAMPLES.map((_example, index) => ({
      value: -(index + 1),
      label: `★ ${t('example-i', { i: classText(iModelInstance.LIST_EXAMPLES_RESULTS[index]) })}`,
    }))
    const targets = targetColumn ? datasetProcessed?.dataframe_original[targetColumn].values as unknown[] : []
    const rows = (targets ?? []).map((target, index) => ({ value: index, label: `#${index} · ${classText(target)}` }))
    return [...examples, ...rows]
  }, [iModelInstance, datasetProcessed, targetColumn, t])

  // El selector solo muestra lo elegido mientras el formulario no se cambie: si no, ya no es ese ejemplo ni esa fila
  const selectedValues = selectedInstance === null ? null : instanceFor(selectedInstance)
  const instanceMatches = selectedValues !== null && iModelInstance !== null &&
    iModelInstance.DATA_DEFAULT_KEYS.every((key) => String(selectedValues[key]) === String(dataToPredict[key]))

  const handleChange_Instance = (value: number) => {
    const values = instanceFor(value)
    if (values === null) return
    setSelectedInstance(value)
    setDataToPredict(values)
  }
  // endregion

  // Guía paso a paso de la página (con voz), si el modelo la tiene: solo con el botón "Guía"
  // Paso a paso (si se ha activado en /settings), con los pesos de este modelo
  const stepByStep = useStepByStepEnabled()
  const stepNetwork = usePretrainedNetwork(model, stepByStep)
  // Las filas como las recibe el modelo (codificadas, como el formulario) y su clase en one-hot, en el orden de CLASSES.
  // Una clase sin salida en el modelo no se puede enseñar: en CAR, «good» (el modelo solo tiene 3 salidas)
  const stepData = useMemo(() => {
    const outputs = stepNetwork?.layers.at(-1)?.units ?? 0
    if (!datasetProcessed?.data_processed || iModelInstance === null || outputs === 0) return null
    const { dataframe_X, column_name_target } = datasetProcessed.data_processed
    const inputs = dataframeRowsToNumbers(dataframe_X.values)
    const X: number[][] = []
    const y: number[][] = []
    const rows: number[] = []
    ;(datasetProcessed.dataframe_original[column_name_target].values as unknown[]).forEach((target, row) => {
      const index = iModelInstance.CLASS_INDEX(target)
      if (index < 0 || index >= outputs) return
      X.push(inputs[row])
      y.push(Array.from({ length: outputs }, (_, k) => (k === index ? 1 : 0)))
      rows.push(row)
    })
    return { X, y, rows, features: dataframe_X.columns as string[], classes: iModelInstance.CLASSES.slice(0, outputs).map((name) => t(name)) }
  }, [datasetProcessed, iModelInstance, stepNetwork, t])

  const guideSteps = useMemo(() => (iModelInstance === null
    ? null
    : tabularReviewGuide(t, dataset, iModelInstance.FORM.map(({ name }) => name), stepByStep)), [t, dataset, iModelInstance, stepByStep])

  if (VERBOSE) console.debug('render ModelReviewTabularClassification')
  return (
    <>
      <Container className={'n4l-container-wide'}>
        <N4LPageHeader title={<Trans i18nKey={'modality.0'} />} guideId={'tabular-classification.' + dataset} guideSteps={guideSteps} className={'mt-2'} />
      </Container>

      <Container className={'n4l-container-wide'} id={'ModelReviewTabularClassification'} data-testid={'Test-ModelReviewTabularClassification'}>
        <Row>
          <Col>
            <N4LDownloadProgress isLoading={isLoading} />
          </Col>
        </Row>
        {iModelInstance !== null && model !== null && <Row>
          <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
            <N4LModelAside>
              <N4LModelCard title={<Trans i18nKey={iModelInstance.TITLE} />}
                actions={<N4LModelSummaryButton model={model} title={t(iModelInstance.TITLE)} />}>
                {iModelInstance.DESCRIPTION()}
              </N4LModelCard>
            </N4LModelAside>
          </Col>

          <Col xs={12} sm={12} md={12} xl={9} xxl={9}>
            <ModelReviewTabularClassificationDataset iModelInstance={iModelInstance} />

            <Card className={'mt-3'}>
              <Card.Header className={'d-flex align-items-center justify-content-between'}>
                <h3>
                  <Trans i18nKey={'pages.playground.0-tabular-classification.general.description-features'} />
                </h3>
                <div className={'n4l-card-header-controls n4l-instance-select'} data-guide={'instances'}>
                  <N4LVirtualSelect options={instanceOptions}
                    value={instanceMatches ? selectedInstance : null}
                    onChange={handleChange_Instance}
                    size={'sm'}
                    placeholder={t('example-custom')}
                    searchPlaceholder={t('pages.playground.generator.dynamic-form-dataset.search-entity')}
                    noResultsText={t('pages.playground.generator.dynamic-form-dataset.no-entity')}
                    countText={(shown, total) => t('pages.playground.generator.dynamic-form-dataset.entity-count', { shown, total })} />
                </div>
              </Card.Header>
              <Card.Body>
                {/* Qué valores pide el formulario (antes iba en una tarjeta aparte, "Descripción de la entrada de datos") */}
                {dataset === UPLOAD
                  ? <p>
                    <Trans i18nKey={'datasets-models.0-tabular-classification.upload.html-example.text'} /><br />
                    <b><Trans i18nKey={'datasets-models.0-tabular-classification.upload.html-example.items'} /></b>
                  </p>
                  : iModelInstance.HTML_EXAMPLE()}
                <Form onSubmit={handleSubmit_PredictVector}>
                  <ModelReviewTabularClassificationPredictForm
                    iModelInstance={iModelInstance}
                    dataToTest={dataToPredict}
                    setDataToTest={setDataToPredict}
                  />
                  <Row className={'mt-3'} data-guide={'vector'}>
                    <Col>
                      <Form.Group controlId={'formInputData'}>
                        <Form.Label>
                          <Trans i18nKey={'pages.playground.0-tabular-classification.general.description-data'} />
                        </Form.Label>
                        <Form.Control size={'sm'} disabled={true} value={Object.values(dataToPredict).join(',')} />
                        <Form.Text className="text-muted">
                          <Trans i18nKey={'pages.playground.form.data-to-check'} />
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId={'formInputVector'}>
                        <Form.Label>
                          <Trans i18nKey={'pages.playground.0-tabular-classification.general.description-vector'} />
                        </Form.Label>
                        <Form.Control size={'sm'} disabled={true} value={vectorToPredict.join(',')} />
                        <Form.Text className="text-muted">
                          <Trans i18nKey={'pages.playground.form.vector-to-check'} />
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  {/*<Row><Col><pre>[[{vectorToPredict.join(',')}], [1, {vectorToPredict.length}]]</pre></Col></Row>*/}
                  <Row className={'mt-3'}>
                    <Col>
                      <div className="d-grid gap-2" data-guide={'classify'}>
                        <Button variant={'primary'} size={'lg'} type={'submit'} disabled={isButtonToPredictDisabled}>
                          <Trans i18nKey={'pages.playground.generator.dynamic-form-dataset.classify-button'} />
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

            <ModelReviewTabularClassificationPredict prediction={prediction} actualIndex={predictionActual} />

            <TabularShapPanel
              features={explainMeta.features}
              classes={explainMeta.classes}
              predictedClassIndex={predictedClassIndex}
              inputKey={prediction}
              hasPrediction={prediction.data.length > 0}
              getModel={() => model}
              getInstance={() => predictedVector_ref.current}
              getPool={() => backgroundPool_ref.current}
              getInstanceDisplay={() => predictedDisplay_ref.current}
            />

            {stepByStep && stepNetwork !== undefined && (
              <div className={'mt-3'} data-guide={'step-by-step'}>
                <N4LStepByStep kind={'classification'} initialNetwork={stepNetwork} X={stepData?.X ?? []} y={stepData?.y ?? []} rowNumbers={stepData?.rows}
                  featureNames={stepData?.features ?? []} outputNames={stepData?.classes ?? []} learningRate={PRETRAINED_LEARNING_RATE} />
              </div>
            )}
          </Col>
        </Row>}
      </Container>
    </>
  )
}
