import { useMemo, useState } from 'react'
import { Button, Card, Col, Row, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'

import { DEFAULT_SELECTOR_MODEL, DEFAULT_SELECTOR_MODEL_INDEX, VERBOSE } from '@/CONSTANTS'
import N4LSummary from '@components/summary/N4LSummary'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import N4LDivider from '@components/divider/N4LDivider'
import N4LVirtualSelect, { type VirtualSelectOption_t } from '@components/select/N4LVirtualSelect'
import { useRegressionContext } from '@context/useRegressionContext'
import ModelReviewRegressionPredictForm from '@pages/playground/1_Regression/ModelReviewRegressionPredictForm'
import RegressionPredictionInfo from '@pages/playground/1_Regression/RegressionPredictionInfo'
import { TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION } from './utils'
import TabularShapPanel from '@core/explainability/TabularShapPanel'
import { dataframeRowsToNumbers, dataframeRowsWithDisplay } from '@core/explainability/shapSampling'

type RegressionPredictionProps = {
  /** Secciones de la página (numeran el separador de la explicabilidad) */
  steps?: string[]
}

// Valor de la variable objetivo para la lista de instancias: sin decimales de más
const formatTarget = (value: unknown) => (typeof value === 'number' && !Number.isInteger(value) ? String(Number(value.toFixed(4))) : String(value))

export default function RegressionPrediction({ steps }: RegressionPredictionProps) {
  const prefix = 'pages.playground.1-regression.predict.'
  const prefixForm = 'pages.playground.generator.dynamic-form-dataset.'
  const { t } = useTranslation()

  const {
    prediction,
    setPrediction,

    listModels,
    setListModels,
  } = useRegressionContext()


  // Instancia del conjunto de datos copiada al formulario (null hasta elegir una)
  const [indexInstance, setIndexInstance] = useState<number | null>(null)
  // Valor real de lo que se predijo: si después se edita el formulario, el resultado sigue siendo de esa instancia
  const [resultActual, setResultActual] = useState<number | null>(null)

  const handleSubmit_Predict = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const vector = prediction.input_3_dataframe_scaling.values[0] as number[]
    const _indexModel: number = listModels.index as number
    const model = listModels.data[_indexModel].model
    const predictTensor = tfjs.tidy(() => model.predict(tfjs.tensor2d([vector])) as tfjs.Tensor)
    // Lectura asíncrona: con WebGPU las síncronas detienen la GPU
    const result = Array.from(await predictTensor.data<'float32'>())
    predictTensor.dispose()

    setResultActual(actualValue)
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

  const handleChange_Instance_Index = (_indexInstance: number) => {
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

  const showPrediction = listModels.data.length > 0
    && listModels.index !== DEFAULT_SELECTOR_MODEL_INDEX
    && Number.isInteger(listModels.index)
    && listModels.index >= 0

  const _indexModel: number = listModels.index as number
  const dataProcessed = showPrediction ? listModels.data[_indexModel]?.dataset_processed?.data_processed : undefined

  // Una opción por instancia: su número y el valor real de la variable objetivo. Puede haber miles: el desplegable
  // solo pinta las que se ven
  const instanceOptions = useMemo<VirtualSelectOption_t[]>(() => {
    if (dataProcessed === undefined) return []
    const targets = dataProcessed.dataframe_y.values as unknown[]
    return targets.map((target, index) => ({ value: index, label: `#${index} · ${formatTarget(target)}` }))
  }, [dataProcessed])

  // El valor real solo se enseña si el formulario sigue siendo la instancia elegida (sin editar)
  const generatedModel = showPrediction ? listModels.data[_indexModel] : undefined
  const originalRows = generatedModel?.dataset_processed.dataframe_original.values as unknown[][] | undefined
  const selectedRow = indexInstance === null ? undefined : originalRows?.[indexInstance]
  const formRow = prediction.input_1_dataframe_original.values[0] as unknown[] | undefined
  const instanceMatches = selectedRow !== undefined && formRow !== undefined &&
    selectedRow.every((value, column) => String(value) === String(formRow[column]))
  const actualValue = instanceMatches && indexInstance !== null
    ? Number((dataProcessed?.dataframe_y.values as unknown[] | undefined)?.[indexInstance])
    : null

  // Explicabilidad: el modelo recibe la instancia ESCALADA (input_3_dataframe_scaling), así que el
  // background sale de la X escalada del dataset del modelo seleccionado.
  const explainModel = listModels.data[_indexModel]?.model ?? null
  const explainDataProcessed = listModels.data[_indexModel]?.dataset_processed?.data_processed

  if (VERBOSE) console.debug('render RegressionPrediction')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h2><Trans i18nKey={prefix + 'title'} /></h2>
        <div className={'d-flex flex-wrap gap-2 n4l-card-header-controls'}>
          <div className={'n4l-instance-select'}>
            <N4LVirtualSelect options={instanceOptions}
              value={indexInstance}
              onChange={handleChange_Instance_Index}
              disabled={!showPrediction}
              size={'sm'}
              placeholder={t(prefix + 'list-instances')}
              searchPlaceholder={t(prefixForm + 'search-entity')}
              noResultsText={t(prefixForm + 'no-entity')}
              countText={(shown, total) => t(prefixForm + 'entity-count', { shown, total })} />
          </div>
          <div>
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
                      const index_format = (index + 1).toString()
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
          <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-models'} />
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

            {/* El mismo formulario que el de los modelos preentrenados: tipo y rango de cada atributo */}
            {indexInstance === null || generatedModel === undefined
              ? <N4LEmptyState i18nKey={prefix + 'choose-instance'} />
              : <ModelReviewRegressionPredictForm customModel={{ model: generatedModel.model }}
                dataset={generatedModel.dataset_processed}
                prediction={prediction}
                setPrediction={setPrediction} />}

            <Row className={'mt-2'}>
              <div className="d-grid gap-2">
                <Button
                  variant={'primary'}
                  size={'lg'}
                  type={'submit'}
                  disabled={indexInstance === null}>
                  <Trans i18nKey={prefix + 'button-submit'} />
                </Button>
              </div>
            </Row>

            <hr />

            <RegressionPredictionInfo prediction={prediction} targetName={dataProcessed?.column_name_target} actual={resultActual} />

          </Form>
        </>}
      </Card.Body>
    </Card>

    <N4LDivider i18nKey={'hr.explainability'} steps={steps} />
    <TabularShapPanel
      features={explainDataProcessed?.X.columns ?? []}
      inputKey={prediction.input_3_dataframe_scaling}
      getModel={() => explainModel}
      getInstance={() => (prediction.input_3_dataframe_scaling.values[0] as number[] | undefined) ?? null}
      getPool={() => dataframeRowsToNumbers(explainDataProcessed?.X.values)}
      getPoolDisplay={() => dataframeRowsWithDisplay(explainDataProcessed?.X.values, explainDataProcessed?.dataframe_X?.values).display}
      targetName={explainDataProcessed?.column_name_target}
      getInstanceDisplay={() => (prediction.input_2_dataframe_encoding.values[0] as Array<string | number> | undefined) ?? null}
      valuesAreScaled
      modelReady={showPrediction}
    />
  </>
}
