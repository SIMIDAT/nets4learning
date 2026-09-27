import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Col, Row, Form, ProgressBar } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'

import { DEFAULT_SELECTOR_INSTANCE, DEFAULT_SELECTOR_MODEL, DEFAULT_SELECTOR_MODEL_INDEX, VERBOSE } from '@/CONSTANTS'
import N4LSummary from '@components/summary/N4LSummary'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import RegressionContext from '@context/RegressionContext'
import RegressionPredictionForm from '@pages/playground/1_Regression/RegressionPredictionForm'
import RegressionPredictionInfo from '@pages/playground/1_Regression/RegressionPredictionInfo'
import { TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION } from './utils'

import alertHelper from '@utils/alertHelper'
import { myModelWrapper } from '@core/explainability/ModelExplanation'
import ShapExplanationChart from '@core/explainability/ModelExplanationChart'
import ShapBeeswarmChart from '@core/explainability/ShapBeeswarmChart'
import { dataframeRowsToNumbers, sampleRowsWithoutReplacement, buildShapBackground } from '@core/explainability/shapSampling'
import { KernelSHAP } from 'webshap'

export default function RegressionPrediction() {
  const prefix = 'pages.playground.1-regression.predict.'
  const { t } = useTranslation()

  const {
    prediction,
    setPrediction,

    listModels,
    setListModels,
  } = useContext(RegressionContext)

  const [showPrediction, setShowPrediction] = useState(false)

  /**
   * @type {ReturnType<typeof useState<string|number>>}
   */
  const [indexInstance, setIndexInstance] = useState<string | number>(DEFAULT_SELECTOR_INSTANCE)

  // === Explicabilidad (SHAP) sobre el modelo recién entrenado ===
  // Regresión: la instancia ya viene ESCALADA (input_3_dataframe_scaling = fila de data_processed.X)
  // y un solo target → sin selector de clase.
  const explainer = useRef<KernelSHAP | null>(null)
  const [showExplain, setShowExplain] = useState(false)
  const [explanationData, setExplanationData] = useState<number[][] | null>(null)
  const [isCalculo, setIsCalculo] = useState(false)
  const [nSamplesExplain, setNSamplesExplain] = useState(1000)
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

  const handleSubmit_Predict = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const vector = prediction.input_3_dataframe_scaling.values[0]
    // @ts-ignore
    const tensor = tfjs.tensor2d([vector])
    const _indexModel: number = listModels.index as number
    const model = (/**@type {tfjs.LayersModel}*/(listModels.data[_indexModel].model))
    const predictTensor = (/**@type {tfjs.Tensor}*/(model.predict(tensor)) as tfjs.Tensor)

    const result = [predictTensor.dataSync()]

    setPrediction((prevState) => ({
      ...prevState,
      result: result
    }))

  }

  const handleChange_Model_Index = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setListModels((prevState) => ({
      ...prevState,
      index: parseInt(e.target.value)
    }))
  }

  const handleChange_Instance_Index = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault()
    const _indexInstance: number = parseInt(e.target.value)
    setIndexInstance(_indexInstance)
    const _indexModel: number = listModels.index as number
    const dataset_processed = listModels.data[_indexModel].dataset_processed
    const newPredictionState = TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION(dataset_processed, _indexInstance)

    setPrediction((prevState) => ({
      ...prevState,
      input_0_raw                : newPredictionState.input_0_raw,
      input_1_dataframe_original : newPredictionState.input_1_dataframe_original,
      input_1_dataframe_processed: newPredictionState.input_1_dataframe_processed,
      input_2_dataframe_encoding : newPredictionState.input_2_dataframe_encoding,
      input_3_dataframe_scaling  : newPredictionState.input_3_dataframe_scaling,
    }))
  }

  // === Explicabilidad ===
  // Modelo + data_processed del modelo seleccionado actualmente.
  const getExplainContext = () => {
    const idx = listModels.index as number
    const selected = listModels.data[idx]
    return {
      model: selected?.model,
      data_processed: selected?.dataset_processed?.data_processed ?? null,
    }
  }

  // SHAP local: explica la predicción actual. Instancia = input_3_dataframe_scaling (ESCALADA).
  const handleRequest_ExplainPrediction = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (showExplain) { setShowExplain(false); return }

    const { model, data_processed } = getExplainContext()
    if (!model || !data_processed) {
      await alertHelper.alertError(t('Model is not available for explainability'))
      return
    }
    if (!prediction.input_3_dataframe_scaling?.values?.length) {
      await alertHelper.alertInfo(t('info.insert-input'))
      return
    }

    setIsCalculo(true)
    try {
      const instance = prediction.input_3_dataframe_scaling.values[0] as number[]
      const nFeatures = instance.length
      const pool = dataframeRowsToNumbers(data_processed.X.values)
      const background = buildShapBackground(pool, nFeatures)

      const predictor = myModelWrapper(model)
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

  // SHAP global: mean(|SHAP|) sobre una muestra de data_processed.X (escalada). Target 0.
  const handleRequest_ExplainGlobal = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (showGlobalExplain) { setShowGlobalExplain(false); return }

    const { model, data_processed } = getExplainContext()
    if (!model || !data_processed) {
      await alertHelper.alertError(t('Model is not available for explainability'))
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
      const predictor = myModelWrapper(model)
      const instances = sampleRowsWithoutReplacement(validPool, Math.min(nInstancesGlobal, validPool.length))
      const nSamples = Number(nSamplesExplain) || 1000

      const shapMatrix: number[][] = []
      for (let k = 0; k < instances.length; k++) {
        // KernelSHAP no resetea su estado interno entre llamadas → uno nuevo por instancia.
        const explainerGlobal = new KernelSHAP(predictor, background, 0.2022)
        const shap = await explainerGlobal.explainOneInstance(instances[k], nSamples)
        const targetShap = shap[0] ?? []
        shapMatrix.push(Array.from({ length: nFeatures }, (_, f) => targetShap[f] ?? 0))
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

  useEffect(() => {
    // setShowPrediction((listModels.data.length > 0 && listModels.index !== DEFAULT_SELECTOR_MODEL && listModels.index >= 0))
    // eslint-disable-next-line
    setShowPrediction(() => {
      if (listModels.data.length > 0 && listModels.index !== DEFAULT_SELECTOR_MODEL_INDEX) {
        const isNumber = Number.isInteger(listModels.index)
        if (isNumber) {
          const _index: number = listModels.index as number
          if (_index >= 0) {
            return true
          }
        }
      }
      return false
    })
  }, [listModels, listModels.data, listModels.index, setShowPrediction])

  const _indexModel: number = listModels.index as number
  // Nombres de features del modelo seleccionado (X escalada) para los gráficos de explicabilidad.
  const _explainFeatures: string[] =
    listModels.data[_indexModel]?.dataset_processed?.data_processed?.X?.columns ?? []

  if (VERBOSE) console.debug('render RegressionPrediction')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h2><Trans i18nKey={prefix + 'title'} /></h2>
        <div className="d-flex">
          <div>
            <Form.Group controlId={'instance-selector'}>
              <Form.Select aria-label={'instance-selector'}
                size={'sm'}
                defaultValue={indexInstance}
                disabled={!showPrediction}
                onChange={(e) => handleChange_Instance_Index(e)}>
                <option disabled={true} value={DEFAULT_SELECTOR_INSTANCE}><Trans i18nKey={prefix + 'list-instances'} /></option>
                <>
                  {showPrediction && <>
                    {Array(listModels.data[_indexModel].dataset_processed?.data_processed?.dataframe_X.values.length)
                      .fill(0)
                      .map((_value, index) => {
                        const index_format = index.toString().padStart(3, '0')
                        return <option key={index} value={index}>
                          <Trans i18nKey={prefix + 'instance.__index__'} values={{ index: index_format }} />
                        </option>
                      })}
                  </>}
                </>
              </Form.Select>
            </Form.Group>
          </div>
          <div className={'ms-3'}>
            <Form.Group controlId={'model-selector'}>
              <Form.Select
                aria-label={'model-selector'}
                size={'sm'}
                data-value={listModels.index}
                value={listModels.index}
                disabled={!showPrediction}
                onChange={(e) => handleChange_Model_Index(e)}
              >
                <option disabled={true} value={DEFAULT_SELECTOR_MODEL}>
                  <Trans i18nKey={prefix + 'list-models'} />
                </option>
                <>
                  {listModels
                    .data
                    .map((_, index) => {
                      const index_format = index.toString()
                      return <option key={index} value={index}>
                        <Trans i18nKey={'model.__index__'} values={{ index: index_format }} />
                      </option>
                    })}
                </>
              </Form.Select>
            </Form.Group>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {!showPrediction && <>
          <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-models'} />
        </>}
        {showPrediction && <>
          <Row>
            <Col>
              <N4LSummary title={t('Features')}>
                <ol>
                  {Array
                    .from(listModels.data[_indexModel]?.params_features.X_features ?? [])
                    .map((value, index) => {
                      return <li key={index}>{value}</li>
                    })
                  }
                </ol>
              </N4LSummary>
            </Col>
            <Col>
              <N4LSummary title={t('Target')}>
                <ol>
                  <li>{listModels.data[_indexModel]?.params_features.Y_target}</li>
                </ol>
              </N4LSummary>
            </Col>
          </Row>
          <hr />
          <Form onSubmit={handleSubmit_Predict} noValidate>

            <RegressionPredictionForm
              generatedModel={listModels.data[_indexModel]}
            />

            <hr />

            <Row>
              <div className="d-grid gap-2">
                <Button
                  variant={'primary'}
                  size={'lg'}
                  type={'submit'}>
                  <Trans i18nKey={prefix + 'button-submit'} />
                </Button>
              </div>
            </Row>

            <hr />

            <RegressionPredictionInfo prediction={prediction} />

          </Form>
        </>}
      </Card.Body>
    </Card>

    {/* EXPLAINABILITY */}
    {showPrediction && (
      <Card className={'mt-3'} data-testid={'explainability-card'}>
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
                      i18nKey={'pages.playground.0-tabular-classification.general.explain-panel-local-body-regression'}
                      defaults={'SHAP explains a single prediction by distributing the difference between the predicted value and the model\'s average prediction (base value) across the features.'}
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
              <Form.Group controlId={'regTrainInputNSamples'}>
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
                  disabled={isCalculo}
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
                  predictedClass={0}
                  predictionProbs={prediction.result}
                  features={_explainFeatures}
                />
              )}
            </Col>
          </Row>

          {/* === SHAP global === */}
          <hr />
          <Row className={'mb-2'}>
            <Col md={4} className={'mb-2'}>
              <Form.Group controlId={'regTrainInputNInstancesGlobal'}>
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
              <Form.Group controlId={'regTrainSelectGlobalChartType'}>
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
                <Form.Group controlId={'regTrainSelectGlobalSortOrder'}>
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
                  disabled={isCalculoGlobal}
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
                    features={_explainFeatures}
                  />
                ) : (
                  <ShapBeeswarmChart
                    shap={globalShap.shap}
                    featureValues={globalShap.featureValues}
                    features={_explainFeatures}
                  />
                ))}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    )}
  </>
}
