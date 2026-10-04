import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'
import { Card, Col, Container, Form, Row } from 'react-bootstrap'
import * as dfd from 'danfojs'
import * as tfjs from '@tensorflow/tfjs'

import * as _Types from '@core/types'
import { VERBOSE, DEFAULT_SELECTOR_DATASET, DEFAULT_SELECTOR_MODEL, DEFAULT_SELECTOR_DATASET_INDEX, DEFAULT_SELECTOR_MODEL_INDEX, DEFAULT_SELECTOR_INSTANCE_INDEX } from '@/CONSTANTS'
import N4LModelSummaryButton from '@components/neural-network/N4LModelSummaryButton'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import N4LVirtualSelect, { type VirtualSelectOption_t } from '@components/select/N4LVirtualSelect'
import { type I_MODEL_REGRESSION, MAP_LR_CLASSES } from '@pages/playground/1_Regression/models'
import { createReviewModelInstance } from '@core/models/createReviewModelInstance'
import ModelReviewRegressionDataset from './ModelReviewRegressionDataset'
import ModelReviewRegressionPredict from './ModelReviewRegressionPredict'
import { TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION } from './utils'
import TabularShapPanel from '@core/explainability/TabularShapPanel'
import N4LPageHeader from '@components/neural-network/N4LPageHeader'
import N4LModelCard from '@components/neural-network/N4LModelCard'
import N4LModelAside from '@components/neural-network/N4LModelAside'
import N4LDownloadProgress from '@components/loading/N4LDownloadProgress'
import { trackDownloads } from '@core/downloadProgress'
import { regressionReviewGuide } from './modelReviewGuide'
import N4LStepByStep from '@components/neural-network/stepByStep/N4LStepByStep'
import { useStepByStepEnabled } from '@components/neural-network/stepByStep/stepByStepSetting'
import { usePretrainedNetwork } from '@components/neural-network/stepByStep/usePretrainedNetwork'
import { PRETRAINED_LEARNING_RATE } from '@core/nn-utils/stepByStep'
import { dataframeRowsToNumbers, dataframeRowsWithDisplay } from '@core/explainability/shapSampling'

// Valor de la variable objetivo para la lista de instancias: sin decimales de más
const formatTarget = (value: unknown) => (typeof value === 'number' && !Number.isInteger(value) ? String(Number(value.toFixed(4))) : String(value))

type ModelReviewRegressionProps_t = {
  dataset: string
}

export default function ModelReviewRegression({ dataset }: ModelReviewRegressionProps_t) {
  /**
   * @type {ReturnType<typeof useParams<{id: string}>>}
   */
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const prefix = 'pages.playground.1-regression.'
  const { t } = useTranslation()
  const [iModelInstance, setIModelInstance] = useState<I_MODEL_REGRESSION | null>(null)
  // Hasta tener los conjuntos de datos y las redes del elegido (otra vez al cambiar de conjunto)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * @type {ReturnType<typeof useState<_Types.StateListDatasetProcessed_t>>}
   */
  const [listDatasets, setDatasets] = useState<_Types.StateListDatasetProcessed_t>({
    data   : [],
    index  : DEFAULT_SELECTOR_DATASET_INDEX,
    dataset: 'select-dataset',
  })

  /**
   * @type {ReturnType<typeof useState<_Types.StateListCustomModel_t>>}
   */
  const [listCustomModels, setListCustomModels] = useState<_Types.StateListCustomModel_t>({
    data : [],
    index: DEFAULT_SELECTOR_MODEL_INDEX,
    model: 'select-model',
  })

  /**
   * @type {ReturnType<typeof useState<_Types.StateInstance_t>>}
   */
  const [instances, setInstances] = useState<_Types.StateInstance_t>({
    data    : [],
    index   : DEFAULT_SELECTOR_INSTANCE_INDEX,
    instance: 'select-instance',
  })

  /**
   * @type {ReturnType<typeof useState<_Types.StatePrediction_t>>}
   */
  const [prediction, setPrediction] = useState<_Types.StatePrediction_t>({
    input_0_raw                : [],
    //
    input_1_dataframe_original : new dfd.DataFrame(),
    input_1_dataframe_processed: new dfd.DataFrame(),
    input_2_dataframe_encoding : new dfd.DataFrame(),
    input_3_dataframe_scaling  : new dfd.DataFrame(),
    //
    result                     : [],
  })


  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init][ dataset, t ]')
    const init = async () => {
      const _iModelInstance = await createReviewModelInstance(MAP_LR_CLASSES, dataset, (ModelClass) => new ModelClass(t, () => { }), navigate)
      if (_iModelInstance === null) return
      try {
        setIModelInstance(_iModelInstance)
        // Con el progreso real de lo que se descarga
        const _datasets = await trackDownloads(() => _iModelInstance.DATASETS(), 'dataset_load')
        setDatasets({
          data   : _datasets,
          index  : 0,
          dataset: 'select-dataset',
        })
      } catch (error) {
        console.error('Error', error)
      }
    }
    init().then(() => undefined)
  }, [dataset, t, navigate])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init][ listDatasets ]')
    const init = async () => {
      await tfjs.ready()
      if (
        listDatasets.index !== DEFAULT_SELECTOR_DATASET_INDEX &&
        listDatasets.data.length > 0 &&
        iModelInstance
      ) {
        const _models = await trackDownloads(() => iModelInstance.MODELS(listDatasets.data[listDatasets.index].csv), 'model_load')
        setIsLoading(false)
        setListCustomModels({
          // Un conjunto de datos sin modelos preentrenados devuelve [] (o nada, si no está en la lista)
          data : _models ?? [],
          index: 0,
          model: 'select-model',
        })
      }
    }

    init().then(() => undefined)
  }, [listDatasets, iModelInstance])

  useEffect(() => {
    if (VERBOSE)
      console.debug('useEffect[init][ datasets, datasets.data, datasets.index, models, models.data, models.index ]')
    const init = async () => {
      await tfjs.ready()
      // Las instancias son del conjunto de datos elegido, tenga o no modelos: antes, con uno sin modelos, se quedaban
      // las del anterior
      if (listCustomModels.index !== DEFAULT_SELECTOR_MODEL_INDEX && listDatasets.data[listDatasets.index] !== undefined) {
        const dataset_processed: _Types.DatasetProcessed_t = listDatasets.data[listDatasets.index]
        const { dataframe_original /* data_processed */ } = dataset_processed
        // El formulario empieza con la primera instancia, y el selector lo dice
        setInstances((_prevState) => ({
          data    : dataframe_original.values as Array<Array<string | number | boolean>>,
          index   : 0,
          instance: 'select-instance',
        }))
        const state = TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION(dataset_processed, 0)
        setPrediction((prevState) => {
          return {
            ...prevState,
            input_0_raw                : state.input_0_raw,
            input_1_dataframe_original : state.input_1_dataframe_original,
            input_1_dataframe_processed: state.input_1_dataframe_processed,
            input_2_dataframe_encoding : state.input_2_dataframe_encoding,
            input_3_dataframe_scaling  : state.input_3_dataframe_scaling,
            result                     : state.result,
          }
        })
      }
    }

    init().then(() => undefined)
  }, [
    listDatasets,
    listDatasets.data,
    listDatasets.index,
    listCustomModels,
    listCustomModels.data,
    listCustomModels.index,
  ])

  const handleChange_Datasets_Index = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setIsLoading(true)
    setDatasets((prevState) => ({
      ...prevState,
      index: parseInt(event.target.value),
    }))
    // Los modelos y la instancia eran del conjunto anterior: se vacían hasta cargar los del nuevo (si no, el
    // formulario mezclaba las columnas del nuevo con la instancia del anterior y la página fallaba)
    setListCustomModels({ data: [], index: DEFAULT_SELECTOR_MODEL_INDEX, model: 'select-model' })
    setInstances({ data: [], index: DEFAULT_SELECTOR_INSTANCE_INDEX, instance: 'select-instance' })
    setPrediction((prevState) => ({ ...prevState, input_1_dataframe_original: new dfd.DataFrame(), result: [] }))
  }

  const handleChange_Models_Index = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    setListCustomModels((prevState) => ({
      ...prevState,
      index: parseInt(event.target.value),
    }))
  }

  const handleChange_Instance_Index = (newInstanceIndex: number) => {

    const dataset_processed: _Types.DatasetProcessed_t = listDatasets.data[listDatasets.index]
    const state = TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION(dataset_processed, newInstanceIndex)
    setPrediction((prevState) => {
      return {
        ...prevState,
        input_0_raw                : state.input_0_raw,
        input_1_dataframe_original : state.input_1_dataframe_original,
        input_1_dataframe_processed: state.input_1_dataframe_processed,
        input_2_dataframe_encoding : state.input_2_dataframe_encoding,
        input_3_dataframe_scaling  : state.input_3_dataframe_scaling,
        result                     : state.result,
      }
    })
    setInstances((prevState) => ({
      ...prevState,
      index: newInstanceIndex,
    }))
  }

  // Explicabilidad: el modelo recibe la instancia ESCALADA (input_3_dataframe_scaling), así que el
  // background sale de la X escalada del dataset (data_processed.X).
  const explainDataProcessed = listDatasets.data[listDatasets.index]?.data_processed
  const explainModel = listCustomModels.data[listCustomModels.index]?.model ?? null

  // Ya cargados los modelos del conjunto de datos elegido, no hay ninguno
  const hasNoModels = listCustomModels.index !== DEFAULT_SELECTOR_MODEL_INDEX && listCustomModels.data.length === 0

  // Selector de instancias: su número y el valor real de la variable objetivo. Puede haber miles: el desplegable solo
  // pinta las que se ven
  const datasetSelected = listDatasets.data[listDatasets.index]
  const targetIndex = datasetSelected?.data_processed
    ? datasetSelected.dataframe_original.columns.indexOf(datasetSelected.data_processed.column_name_target)
    : -1
  const instanceOptions = useMemo<VirtualSelectOption_t[]>(() => (
    instances.data.map((row, index) => ({ value: index, label: `#${index} · ${targetIndex >= 0 ? formatTarget(row[targetIndex]) : ''}` }))
  ), [instances.data, targetIndex])
  // El selector solo muestra la instancia mientras el formulario no se cambie: si no, ya no es esa
  const selectedRow = instances.index >= 0 ? instances.data[instances.index] : undefined
  const formRow = prediction.input_1_dataframe_original.values[0] as unknown[] | undefined
  const instanceMatches = selectedRow !== undefined && formRow !== undefined &&
    selectedRow.every((value, column) => String(value) === String(formRow[column]))
  const actualValue = instanceMatches && targetIndex >= 0 ? Number(selectedRow[targetIndex]) : null

  // Guía paso a paso de la página (con voz), si el modelo la tiene: un paso por variable de entrada del conjunto elegido
  const guideFields = datasetSelected?.data_processed?.dataframe_X.columns
  // Paso a paso (si se ha activado en /settings), con los pesos del modelo elegido y las filas del conjunto elegido
  const stepByStep = useStepByStepEnabled()
  const stepNetwork = usePretrainedNetwork(explainModel, stepByStep)
  const stepData = useMemo(() => ({
    X       : dataframeRowsToNumbers(explainDataProcessed?.X.values),
    y       : ((explainDataProcessed?.y.values ?? []) as number[]).map((value) => [Number(value)]),
    features: (explainDataProcessed?.X.columns ?? []) as string[],
  }), [explainDataProcessed])

  const guideSteps = useMemo(() => (iModelInstance === null
    ? null
    : regressionReviewGuide(t, dataset, guideFields ?? [], stepByStep)), [t, dataset, iModelInstance, guideFields, stepByStep])

  if (VERBOSE) console.debug('render ModelReviewRegression')
  return (
    <>
      <Container className={'n4l-container-wide'} id={'ModelReviewRegression'} data-testid="Test-ModelReviewRegression">
        <N4LPageHeader title={<Trans i18nKey={'modality.' + id} />} guideId={'regression.' + dataset} guideSteps={guideSteps} />
        <Row>
          <Col>
            <N4LDownloadProgress isLoading={isLoading} />
          </Col>
        </Row>

        {iModelInstance !== null && (
          <Row>
            <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
              <N4LModelAside>
                <N4LModelCard title={<Trans i18nKey={iModelInstance.i18n_TITLE} />}
                  actions={<N4LModelSummaryButton model={explainModel} title={`${t(iModelInstance.i18n_TITLE)} (${listDatasets.data[listDatasets.index]?.csv ?? ''})`} />}>
                <Form.Group controlId="FormSelector_Dataset" data-guide={'dataset-select'}>
                  <Form.Label>
                    <Trans i18nKey={'form.select-dataset.title'} />
                  </Form.Label>
                  <Form.Select
                    aria-label={t('form.select-dataset.title')}
                    size={'sm'}
                    value={listDatasets.index}
                    onChange={handleChange_Datasets_Index}
                  >
                    <option value={DEFAULT_SELECTOR_DATASET} disabled={true}>
                      <Trans i18nKey={'selector-dataset'} />
                    </option>
                    {listDatasets.data.map(({ csv }, index) => {
                      return (
                        <option key={index} value={index}>
                          {csv}
                        </option>
                      )
                    })}
                  </Form.Select>
                  <Form.Text className={'text-muted'}>
                    <Trans i18nKey={'form.select-dataset.info'} />
                  </Form.Text>
                </Form.Group>
                  {iModelInstance.DESCRIPTION()}
                </N4LModelCard>
              </N4LModelAside>
            </Col>
            <Col xs={12} sm={12} md={12} xl={9} xxl={9}>
              {/* Conjunto de datos: tal cual, procesado y su análisis (correlaciones y dispersión, entre otros) */}
              <ModelReviewRegressionDataset dataset={datasetSelected} />

              {/* Model PREDICT */}
              <Card className={'mt-3'}>
                <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
                  <h2>
                    <Trans i18nKey={prefix + 'predict.title'} />
                  </h2>
                  <div className={'d-flex flex-wrap gap-2 n4l-card-header-controls'}>
                    <div className={'n4l-instance-select'} data-guide={'instances'}>
                      <N4LVirtualSelect options={instanceOptions}
                        value={instanceMatches ? instances.index : null}
                        onChange={handleChange_Instance_Index}
                        disabled={instances.data.length === 0 || hasNoModels}
                        size={'sm'}
                        placeholder={t(instances.index >= 0 ? 'example-custom' : prefix + 'predict.list-instances')}
                        searchPlaceholder={t('pages.playground.generator.dynamic-form-dataset.search-entity')}
                        noResultsText={t('pages.playground.generator.dynamic-form-dataset.no-entity')}
                        countText={(shown, total) => t('pages.playground.generator.dynamic-form-dataset.entity-count', { shown, total })} />
                    </div>
                    <Form.Group controlId={'FormSelector_Models'} data-guide={'models'}>
                      <Form.Select
                        disabled={hasNoModels}
                        aria-label={t(prefix + 'predict.list-models')}
                        size={'sm'}
                        value={listCustomModels.index}
                        onChange={handleChange_Models_Index}
                      >
                        <option value={DEFAULT_SELECTOR_MODEL} disabled={true}>
                          <Trans i18nKey={'selector-model'} />
                        </option>
                        {listCustomModels.data.map((_value, index) => {
                          const index_format = (index + 1).toString()
                          return (
                            <option key={index} value={index}>
                              <Trans i18nKey={'model.__index__'} values={{ index: index_format }} />
                            </option>
                          )
                        })}
                      </Form.Select>
                    </Form.Group>
                  </div>
                </Card.Header>
                <Card.Body>
                  {hasNoModels && <N4LEmptyState i18nKey={prefix + 'predict.no-models'} />}
                  {!hasNoModels && <ModelReviewRegressionPredict
                    customModel={listCustomModels.data[listCustomModels.index]}
                    dataset={listDatasets.data[listDatasets.index]}
                    prediction={prediction}
                    setPrediction={setPrediction}
                    actualValue={actualValue}
                  />}
                </Card.Body>
              </Card>

              <TabularShapPanel
                features={explainDataProcessed?.X.columns ?? []}
                inputKey={prediction.input_3_dataframe_scaling}
                hasPrediction={prediction.input_3_dataframe_scaling.values.length > 0}
                getModel={() => explainModel}
                getInstance={() => (prediction.input_3_dataframe_scaling.values[0] as number[] | undefined) ?? null}
                getPool={() => dataframeRowsToNumbers(explainDataProcessed?.X.values)}
                getPoolDisplay={() => dataframeRowsWithDisplay(explainDataProcessed?.X.values, explainDataProcessed?.dataframe_X?.values).display}
                targetName={explainDataProcessed?.column_name_target}
                getInstanceDisplay={() => (prediction.input_2_dataframe_encoding.values[0] as Array<string | number> | undefined) ?? null}
                valuesAreScaled
              />

              {stepByStep && stepNetwork !== undefined && (
                <div className={'mt-3'} data-guide={'step-by-step'}>
                  <N4LStepByStep kind={'regression'} initialNetwork={stepNetwork} X={stepData.X} y={stepData.y}
                    featureNames={stepData.features} outputNames={[explainDataProcessed?.column_name_target ?? '']}
                    learningRate={PRETRAINED_LEARNING_RATE} />
                </div>
              )}
            </Col>
          </Row>
        )}
      </Container>
    </>
  )
}
