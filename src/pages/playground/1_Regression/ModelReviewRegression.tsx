import { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { Trans, useTranslation } from "react-i18next"
import { Card, Col, Container, Form, Row } from "react-bootstrap"
import { trackPageView } from "@core/analytics"
import * as dfd from "danfojs"
import * as tfjs from "@tensorflow/tfjs"

import * as _Types from "@core/types"
import { VERBOSE, DEFAULT_SELECTOR_DATASET, DEFAULT_SELECTOR_MODEL, DEFAULT_SELECTOR_DATASET_INDEX, DEFAULT_SELECTOR_MODEL_INDEX, DEFAULT_SELECTOR_INSTANCE_INDEX } from "@/CONSTANTS"
import N4LModelSummaryButton from "@components/neural-network/N4LModelSummaryButton"
import N4LVirtualSelect, { type VirtualSelectOption_t } from "@components/select/N4LVirtualSelect"
import DataFrameScatterPlotCard from "@components/dataframe/DataFrameScatterPlotCard"
import { type I_MODEL_REGRESSION, MAP_LR_CLASSES } from "@pages/playground/1_Regression/models"
import { createReviewModelInstance } from "@core/models/createReviewModelInstance"
import ModelReviewRegressionDataset from "./ModelReviewRegressionDataset"
import ModelReviewRegressionPredict from "./ModelReviewRegressionPredict"
import { TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION } from "./utils"
import TabularShapPanel from "@core/explainability/TabularShapPanel"
import { dataframeRowsToNumbers, dataframeRowsWithDisplay } from "@core/explainability/shapSampling"

// Valor de la variable objetivo para la lista de instancias: sin decimales de más
const formatTarget = (value: unknown) => (typeof value === "number" && !Number.isInteger(value) ? String(Number(value.toFixed(4))) : String(value))

type ModelReviewRegressionProps_t = {
  dataset: string
}

export default function ModelReviewRegression({ dataset }: ModelReviewRegressionProps_t) {
  /**
   * @type {ReturnType<typeof useParams<{id: string}>>}
   */
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const prefix = "pages.playground.1-regression."
  const { t } = useTranslation()
  const [iModelInstance, setIModelInstance] = useState<I_MODEL_REGRESSION | null>(null)

  const [dataframe_X, setDataFrame_X] = useState(new dfd.DataFrame())

  /**
   * @type {ReturnType<typeof useState<_Types.StateListDatasetProcessed_t>>}
   */
  const [listDatasets, setDatasets] = useState<_Types.StateListDatasetProcessed_t>({
    data   : [],
    index  : DEFAULT_SELECTOR_DATASET_INDEX,
    dataset: "select-dataset",
  })

  /**
   * @type {ReturnType<typeof useState<_Types.StateListCustomModel_t>>}
   */
  const [listCustomModels, setListCustomModels] = useState<_Types.StateListCustomModel_t>({
    data : [],
    index: DEFAULT_SELECTOR_MODEL_INDEX,
    model: "select-model",
  })

  /**
   * @type {ReturnType<typeof useState<_Types.StateInstance_t>>}
   */
  const [instances, setInstances] = useState<_Types.StateInstance_t>({
    data    : [],
    index   : DEFAULT_SELECTOR_INSTANCE_INDEX,
    instance: "select-instance",
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
    trackPageView(`/ModelReviewRegression/${dataset}`, dataset)
  }, [dataset])

  useEffect(() => {
    if (VERBOSE) console.debug("useEffect[init][ dataset, t ]")
    const init = async () => {
      const _iModelInstance = await createReviewModelInstance(MAP_LR_CLASSES, dataset, (ModelClass) => new ModelClass(t, () => { }), navigate)
      if (_iModelInstance === null) return
      try {
        setIModelInstance(_iModelInstance)
        const _datasets = await _iModelInstance.DATASETS()
        setDatasets({
          data   : _datasets,
          index  : 0,
          dataset: "select-dataset",
        })
      } catch (error) {
        console.error("Error", error)
      }
    }
    init().then(() => undefined)
  }, [dataset, t, navigate])

  useEffect(() => {
    if (VERBOSE) console.debug("useEffect[init][ listDatasets ]")
    const init = async () => {
      await tfjs.ready()
      if (
        listDatasets.index !== DEFAULT_SELECTOR_DATASET_INDEX &&
        listDatasets.data.length > 0 &&
        iModelInstance
      ) {
        const _models = await iModelInstance.MODELS(listDatasets.data[listDatasets.index].csv)
        setListCustomModels({
          data : _models,
          index: 0,
          model: "select-model",
        })
      }
    }

    init().then(() => undefined)
  }, [listDatasets, iModelInstance])

  useEffect(() => {
    if (VERBOSE)
      console.debug("useEffect[init][ datasets, datasets.data, datasets.index, models, models.data, models.index ]")
    const init = async () => {
      await tfjs.ready()
      if (listCustomModels.index !== DEFAULT_SELECTOR_MODEL_INDEX && listCustomModels.data.length > 0) {
        /**@type {_Types.DatasetProcessed_t}*/
        const dataset_processed: _Types.DatasetProcessed_t = listDatasets.data[listDatasets.index]
        const { dataframe_original /* data_processed */ } = dataset_processed
        setDataFrame_X(dataframe_original)
        // El formulario empieza con la primera instancia, y el selector lo dice
        setInstances((_prevState) => ({
          data    : dataframe_original.values as Array<Array<string | number | boolean>>,
          index   : 0,
          instance: "select-instance",
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
    setDatasets((prevState) => ({
      ...prevState,
      index: parseInt(event.target.value),
    }))
  }

  const handleChange_Models_Index = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    setListCustomModels((prevState) => ({
      ...prevState,
      index: parseInt(event.target.value),
    }))
  }

  const handleChange_Instance_Index = (newInstanceIndex: number) => {

    /**@type {_Types.DatasetProcessed_t}*/
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

  // Selector de instancias: su número y el valor real de la variable objetivo. Puede haber miles: el desplegable solo
  // pinta las que se ven
  const datasetSelected = listDatasets.data[listDatasets.index]
  const targetIndex = datasetSelected?.data_processed
    ? datasetSelected.dataframe_original.columns.indexOf(datasetSelected.data_processed.column_name_target)
    : -1
  const instanceOptions = useMemo<VirtualSelectOption_t[]>(() => (
    instances.data.map((row, index) => ({ value: index, label: `#${index} · ${targetIndex >= 0 ? formatTarget(row[targetIndex]) : ""}` }))
  ), [instances.data, targetIndex])
  // El selector solo muestra la instancia mientras el formulario no se cambie: si no, ya no es esa
  const selectedRow = instances.index >= 0 ? instances.data[instances.index] : undefined
  const formRow = prediction.input_1_dataframe_original.values[0] as unknown[] | undefined
  const instanceMatches = selectedRow !== undefined && formRow !== undefined &&
    selectedRow.every((value, column) => String(value) === String(formRow[column]))
  const actualValue = instanceMatches && targetIndex >= 0 ? Number(selectedRow[targetIndex]) : null

  if (VERBOSE) console.debug("render ModelReviewRegression")
  return (
    <>
      <Container className={'n4l-container-wide'} id={"ModelReviewRegression"} data-testid="Test-ModelReviewRegression">
        <Row className={"mt-3"}>
          <Col>
            <div className={"d-flex justify-content-between"}>
              <h1>
                <Trans i18nKey={"modality." + id} />
              </h1>
            </div>
          </Col>
        </Row>

        {iModelInstance !== null && (
          <Row>
            <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
              <Card className={"sticky-top border-info mt-3"}>
                <Card.Header>
                  <h2>
                    <Trans i18nKey={iModelInstance.i18n_TITLE} />
                  </h2>
                </Card.Header>
                <Card.Body>
                  <N4LModelSummaryButton model={explainModel} title={`${t(iModelInstance.i18n_TITLE)} (${listDatasets.data[listDatasets.index]?.csv ?? ""})`} />
                  <Form.Group controlId="FormSelector_Dataset">
                    <Form.Label>
                      <Trans i18nKey={"form.select-dataset.title"} />
                    </Form.Label>
                    <Form.Select
                      aria-label={t("form.select-dataset.title")}
                      size={"sm"}
                      value={listDatasets.index}
                      onChange={handleChange_Datasets_Index}
                    >
                      <option value={DEFAULT_SELECTOR_DATASET} disabled={true}>
                        <Trans i18nKey={"selector-dataset"} />
                      </option>
                      {listDatasets.data.map(({ csv }, index) => {
                        return (
                          <option key={index} value={index}>
                            {csv}
                          </option>
                        )
                      })}
                    </Form.Select>
                    <Form.Text className={"text-muted"}>
                      <Trans i18nKey={"form.select-dataset.info"} />
                    </Form.Text>
                  </Form.Group>

                  {iModelInstance.DESCRIPTION()}
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={12} md={12} xl={9} xxl={9}>
              <ModelReviewRegressionDataset dataset={datasetSelected} />

              {/* DataFrame PLOT */}
              <DataFrameScatterPlotCard dataframe={dataframe_X} />

              {/* Model PREDICT */}
              <Card className={"mt-3"}>
                <Card.Header className={"d-flex flex-wrap align-items-center justify-content-between gap-2"}>
                  <h2>
                    <Trans i18nKey={prefix + "predict.title"} />
                  </h2>
                  <div className={"d-flex flex-wrap gap-2"}>
                    <div style={{ minWidth: "16rem" }}>
                      <N4LVirtualSelect options={instanceOptions}
                        value={instanceMatches ? instances.index : null}
                        onChange={handleChange_Instance_Index}
                        disabled={instances.data.length === 0}
                        size={"sm"}
                        placeholder={t(instances.index >= 0 ? "example-custom" : prefix + "predict.list-instances")}
                        searchPlaceholder={t("pages.playground.generator.dynamic-form-dataset.search-entity")}
                        noResultsText={t("pages.playground.generator.dynamic-form-dataset.no-entity")}
                        countText={(shown, total) => t("pages.playground.generator.dynamic-form-dataset.entity-count", { shown, total })} />
                    </div>
                    <Form.Group controlId={"FormSelector_Models"}>
                      <Form.Select
                        aria-label={t(prefix + "predict.list-models")}
                        size={"sm"}
                        value={listCustomModels.index}
                        onChange={handleChange_Models_Index}
                      >
                        <option value={DEFAULT_SELECTOR_MODEL} disabled={true}>
                          <Trans i18nKey={"selector-model"} />
                        </option>
                        {listCustomModels.data.map((_value, index) => {
                          const index_format = (index + 1).toString()
                          return (
                            <option key={index} value={index}>
                              <Trans i18nKey={"model.__index__"} values={{ index: index_format }} />
                            </option>
                          )
                        })}
                      </Form.Select>
                    </Form.Group>
                  </div>
                </Card.Header>
                <Card.Body>
                  <ModelReviewRegressionPredict
                    customModel={listCustomModels.data[listCustomModels.index]}
                    dataset={listDatasets.data[listDatasets.index]}
                    prediction={prediction}
                    setPrediction={setPrediction}
                    actualValue={actualValue}
                  />
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
            </Col>
          </Row>
        )}
      </Container>
    </>
  )
}
