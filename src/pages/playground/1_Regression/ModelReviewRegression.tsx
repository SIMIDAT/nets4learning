import { useEffect, useMemo, useRef, useState, useId } from "react"
import { useParams } from "react-router"
import { useNavigate } from "react-router-dom"
import { Trans, useTranslation } from "react-i18next"
import { Button, Card, Col, Container, Form, ProgressBar, Row } from "react-bootstrap"
import ReactGA from "react-ga4"
import * as dfd from "danfojs"
import * as tfjs from "@tensorflow/tfjs"

import * as _Types from "@core/types"
import { myModelWrapper } from "@core/explainability/ModelExplanation"
import ShapExplanationChart from "@core/explainability/ModelExplanationChart"
import ShapBeeswarmChart from "@core/explainability/ShapBeeswarmChart"
import { dataframeRowsToNumbers, sampleRowsWithoutReplacement, buildShapBackground } from "@core/explainability/shapSampling"
import { KernelSHAP } from "webshap"
import { VERBOSE, DEFAULT_SELECTOR_DATASET, DEFAULT_SELECTOR_MODEL, DEFAULT_SELECTOR_INSTANCE, DEFAULT_SELECTOR_DATASET_INDEX, DEFAULT_SELECTOR_MODEL_INDEX, DEFAULT_SELECTOR_INSTANCE_INDEX } from "@/CONSTANTS"
import { UPLOAD } from "@/DATA_MODEL"
import { TABLE_PLOT_STYLE_CONFIG } from "@/CONSTANTS_DanfoJS"
import N4LSummary from "@components/summary/N4LSummary"
import DataFrameDatasetCard from "@components/dataframe/DataFrameDatasetCard"
import DataFrameScatterPlotCard from "@components/dataframe/DataFrameScatterPlotCard"
import { I_MODEL_REGRESSION, MAP_LR_CLASSES } from "@pages/playground/1_Regression/models"
import ModelReviewRegressionPredict from "./ModelReviewRegressionPredict"
import { TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION } from "./utils"
import alertHelper from "@utils/alertHelper"

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
  const dataframe_processed_dataset_plotID = useId()
  const dataframe_processed_describe_plotID = useId()
  const iModelInstance_ref = useRef<I_MODEL_REGRESSION>(new I_MODEL_REGRESSION(t, () => { }))

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

  // === Explicabilidad (SHAP) ===
  const explainer = useRef<KernelSHAP | null>(null)
  const [showExplain, setShowExplain] = useState(false)
  const [explanationData, setExplanationData] = useState<number[][] | null>(null)
  const [isCalculo, setIsCalculo] = useState(false)
  const [nSamplesExplain, setNSamplesExplain] = useState(1000)

  // Pool de instancias del dataset (X escalada = mismo espacio que input_3_dataframe_scaling)
  // del que se muestrea el background, y los nombres de sus features.
  const backgroundPool_ref = useRef<number[][]>([])
  const featureNames_ref = useRef<string[]>([])

  // SHAP global. Matriz única: shap[instancia][feature] (regresión → un solo target, el 0)
  // y featureValues[instancia][feature] para colorear el beeswarm.
  const [globalShap, setGlobalShap] = useState<{
    shap: number[][]
    featureValues: number[][]
  } | null>(null)
  const [showGlobalExplain, setShowGlobalExplain] = useState(false)
  const [isCalculoGlobal, setIsCalculoGlobal] = useState(false)
  const [globalProgress, setGlobalProgress] = useState(0)
  const [nInstancesGlobal, setNInstancesGlobal] = useState(50)
  const [globalSortOrder, setGlobalSortOrder] = useState<"desc" | "asc" | "none">("desc")
  const [globalChartType, setGlobalChartType] = useState<"bar" | "beeswarm">("bar")

  // Importancia global = mean(|SHAP|) por feature, derivada de la matriz.
  const globalImportance = useMemo<number[] | null>(() => {
    if (!globalShap || globalShap.shap.length === 0) return null
    const nF = globalShap.shap[0].length
    const sums = new Array(nF).fill(0)
    for (const row of globalShap.shap) {
      for (let f = 0; f < nF; f++) sums[f] += Math.abs(row[f])
    }
    return sums.map((s) => s / globalShap.shap.length)
  }, [globalShap])

  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
      page   : `/ModelReviewRegression/${dataset}`,
      title  : dataset,
    })
  }, [dataset])

  useEffect(() => {
    if (VERBOSE) console.debug("useEffect[init][ dataset, t ]")
    const init = async () => {
      await tfjs.ready()
      // =========================
      if (dataset === UPLOAD) {
        console.warn("Error, option not valid", { ID: dataset })
      } else if (dataset in MAP_LR_CLASSES) {
        try {
          const _iModelClass = MAP_LR_CLASSES[dataset]
          iModelInstance_ref.current = new _iModelClass(t, () => { })
          const _datasets = await iModelInstance_ref.current.DATASETS()
          setDatasets({
            data   : _datasets,
            index  : 0,
            dataset: "select-dataset",
          })
        } catch (error) {
          console.error("Error", error)
        }
      } else {
        console.error("Error, option not valid", { ID: dataset })
        await alertHelper.alertError("Error, option not valid")
        navigate("/404")
      }
      // =========================
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
        iModelInstance_ref.current
      ) {
        const _models = await iModelInstance_ref.current.MODELS(listDatasets.data[listDatasets.index].csv)
        setListCustomModels({
          data : _models,
          index: 0,
          model: "select-model",
        })
      }
    }

    init().then(() => undefined)
  }, [listDatasets])

  useEffect(() => {
    if (VERBOSE)
      console.debug("useEffect[init][ datasets, datasets.data, datasets.index, models, models.data, models.index ]")
    const init = async () => {
      await tfjs.ready()
      if (listCustomModels.index !== DEFAULT_SELECTOR_MODEL_INDEX && listCustomModels.data.length > 0) {
        /**@type {_Types.DatasetProcessed_t}*/
        const dataset_processed: _Types.DatasetProcessed_t = listDatasets.data[listDatasets.index]
        const { dataframe_original, data_processed } = dataset_processed
        setDataFrame_X(dataframe_original)
        // Background pool de SHAP: la X ESCALADA (mismo espacio que input_3_dataframe_scaling,
        // que es lo que recibe el modelo en predict). Guardamos también los nombres de features.
        if (data_processed) {
          backgroundPool_ref.current = dataframeRowsToNumbers(data_processed.X.values)
          featureNames_ref.current = data_processed.X.columns
        } else {
          backgroundPool_ref.current = []
          featureNames_ref.current = []
        }
        setInstances((_prevState) => ({
          data    : dataframe_original.values,
          index   : DEFAULT_SELECTOR_INSTANCE_INDEX,
          instance: "select-instance",
        }))
        const state = TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION(dataset_processed)
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

  useEffect(() => {
    if (VERBOSE)
      console.debug(
        "useEffect[ datasets, datasets.data, datasets.index, dataframe_processed_dataset_plotID, dataframe_processed_describe_plotID ]"
      )
    if (listDatasets.index !== DEFAULT_SELECTOR_DATASET_INDEX && listDatasets.data.length > 0) {
      const { dataframe_processed } = listDatasets.data[listDatasets.index]
      dataframe_processed.plot(dataframe_processed_dataset_plotID).table({ config: TABLE_PLOT_STYLE_CONFIG })
      dataframe_processed
        .describe()
        .T.plot(dataframe_processed_describe_plotID)
        .table({ config: TABLE_PLOT_STYLE_CONFIG })
    }
  }, [
    listDatasets,
    listDatasets.data,
    listDatasets.index,
    dataframe_processed_dataset_plotID,
    dataframe_processed_describe_plotID,
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

  const handleChange_Instance_Index = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newInstanceIndex = parseInt(event.target.value)

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

  const handleRequest_ExplainPrediction = async (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (showExplain) {
      setShowExplain(false)
      return
    }

    setIsCalculo(true)
    try {
      if (!prediction.input_0_raw || prediction.input_0_raw.length === 0) {
        await alertHelper.alertInfo(t("info.insert-input"))
        setIsCalculo(false)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selected: any = listCustomModels.data[listCustomModels.index]
      const model = selected?.model
      if (!model) {
        await alertHelper.alertError(t("Model is not available for explainability"))
        setIsCalculo(false)
        return
      }

      // Background de ceros (igual que en la versión original)
      const nBackgroundRows = 50
      const nFeatures = model.inputs[0].shape[1] as number
      const backgroundData = Array(nBackgroundRows)
        .fill(null)
        .map(() => Array(nFeatures).fill(0))

      const predictor = myModelWrapper(model)
      explainer.current = new KernelSHAP(predictor, backgroundData, 0.2022)

      const instance = prediction.input_3_dataframe_scaling.values[0] as number[]
      const nSamples = Number(nSamplesExplain) || 1000
      const shapValues = await explainer.current.explainOneInstance(instance, nSamples)

      setExplanationData(shapValues)
      setShowExplain(true)
      setIsCalculo(false)
    } catch (error) {
      console.error("Error calculating explainability", { error })
      await alertHelper.alertError(t("Error calculating explainability"))
      setIsCalculo(false)
    }
  }

  // SHAP global: explica una muestra de instancias del dataset y agrega mean(|SHAP|) por
  // feature. En regresión solo hay un target (el 0), así que no hay clase que seleccionar.
  const handleRequest_ExplainGlobal = async (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (showGlobalExplain) {
      setShowGlobalExplain(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selected: any = listCustomModels.data[listCustomModels.index]
    const model = selected?.model
    if (!model) {
      await alertHelper.alertError(t("Model is not available for explainability"))
      return
    }

    const nFeatures = model.inputs[0].shape[1] as number
    const pool = backgroundPool_ref.current.filter((row) => row.length === nFeatures)
    if (pool.length === 0) {
      await alertHelper.alertError(
        t("pages.playground.0-tabular-classification.general.no-data", {
          defaultValue: "No dataset available to compute global importance",
        }),
      )
      return
    }

    setIsCalculoGlobal(true)
    setGlobalProgress(0)
    try {
      const backgroundData = buildShapBackground(pool, nFeatures)
      const predictor = myModelWrapper(model)

      const instances = sampleRowsWithoutReplacement(pool, Math.min(nInstancesGlobal, pool.length))
      const nSamples = Number(nSamplesExplain) || 1000

      const shapMatrix: number[][] = []
      for (let k = 0; k < instances.length; k++) {
        // KernelSHAP no resetea su estado interno entre llamadas → explainer nuevo por instancia.
        const explainerGlobal = new KernelSHAP(predictor, backgroundData, 0.2022)
        const shap = await explainerGlobal.explainOneInstance(instances[k], nSamples)
        // Regresión: un solo target → fila 0.
        const targetShap = shap[0] ?? []
        shapMatrix.push(Array.from({ length: nFeatures }, (_, f) => targetShap[f] ?? 0))
        setGlobalProgress(Math.round(((k + 1) / instances.length) * 100))
      }

      setGlobalShap({ shap: shapMatrix, featureValues: instances })
      setShowGlobalExplain(true)
    } catch (error) {
      console.error("Error calculating global explainability", { error })
      await alertHelper.alertError(t("Error calculating explainability"))
    } finally {
      setIsCalculoGlobal(false)
    }
  }

  if (VERBOSE) console.debug("render ModelReviewRegression")
  return (
    <>
      <Container id={"ModelReviewRegression"} data-testid="Test-ModelReviewRegression">
        <Row className={"mt-3"}>
          <Col>
            <div className={"d-flex justify-content-between"}>
              <h1>
                <Trans i18nKey={"modality." + id} />
              </h1>
            </div>
          </Col>
        </Row>

        {iModelInstance_ref !== null && (
          <Row>
            <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
              <div className={"sticky-top"} style={{ zIndex: 0 }}>
              <Card className={"border-info mt-3"}>
                <Card.Header>
                  <h2>
                    <Trans i18nKey={iModelInstance_ref.current.i18n_TITLE} />
                  </h2>
                </Card.Header>
                <Card.Body>
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

                  {iModelInstance_ref.current.DESCRIPTION()}
                </Card.Body>
              </Card>

              {/* Panel narrativo de explicabilidad: aparece al pedir una explicación. */}
              {(showExplain || showGlobalExplain) && (
                <Card className={"mt-3 border-success"}>
                  <Card.Header>
                    <h2 className={"h5 mb-0"}>
                      <Trans
                        i18nKey={"pages.playground.0-tabular-classification.general.explain-panel-title"}
                        defaults={"Explainability"}
                      />
                    </h2>
                  </Card.Header>
                  <Card.Body>
                    {showExplain && (
                      <div className={showGlobalExplain ? "mb-3" : ""}>
                        <h3 className={"h6"}>
                          <Trans
                            i18nKey={"pages.playground.0-tabular-classification.general.explain-panel-local-title"}
                            defaults={"Local explanation (one instance)"}
                          />
                        </h3>
                        <p className={"small mb-0"}>
                          <Trans
                            i18nKey={
                              "pages.playground.0-tabular-classification.general.explain-panel-local-body-regression"
                            }
                            defaults={
                              "SHAP explains a single prediction by distributing the difference between the predicted value and the model's average prediction (base value) across the features. Each bar shows how much, and in which direction, a feature pushes: positive raises the predicted value, negative lowers it."
                            }
                          />
                        </p>
                      </div>
                    )}
                    {showGlobalExplain && (
                      <div>
                        <h3 className={"h6"}>
                          <Trans
                            i18nKey={"pages.playground.0-tabular-classification.general.explain-panel-global-title"}
                            defaults={"Global importance (all instances)"}
                          />
                        </h3>
                        <p className={"small mb-0"}>
                          <Trans
                            i18nKey={"pages.playground.0-tabular-classification.general.explain-panel-global-body"}
                            defaults={
                              "Global importance aggregates many local explanations. The bar chart shows the mean of the absolute values (mean |SHAP|): how much each feature weighs on average. The beeswarm adds the direction and spread of the effect, colouring each point by the feature value."
                            }
                          />
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
              </div>
            </Col>
            <Col xs={12} sm={12} md={12} xl={9} xxl={9}>
              <DataFrameDatasetCard dataframe={dataframe_X} />

              {/* DataFrame INFO */}
              <Card className={"mt-3"}>
                <Card.Header className={"d-flex justify-content-between"}>
                  <h2>
                    <Trans i18nKey={prefix + "dataframe.title"} />
                  </h2>
                </Card.Header>
                <Card.Body>
                  <N4LSummary
                    title={<Trans i18nKey={prefix + "details.description-processed.dataset"} />}
                    info={<div id={dataframe_processed_dataset_plotID}></div>}
                  />
                  <N4LSummary
                    title={<Trans i18nKey={prefix + "details.description-processed.describe"} />}
                    info={<div id={dataframe_processed_describe_plotID}></div>}
                  />
                </Card.Body>
              </Card>

              {/* DataFrame PLOT */}
              <DataFrameScatterPlotCard dataframe={dataframe_X} />

              {/* Model PREDICT */}
              <Card className={"mt-3"}>
                <Card.Header className={"d-flex justify-content-between"}>
                  <h2>
                    <Trans i18nKey={prefix + "model-selector.title"} />
                  </h2>
                  <div className={"d-flex gap-2"}>
                    <Form.Group controlId={"FormSelector_Instances"}>
                      <Form.Select
                        aria-label={"plot"}
                        size={"sm"}
                        value={instances.index}
                        onChange={handleChange_Instance_Index}
                      >
                        <option value={DEFAULT_SELECTOR_INSTANCE} disabled={true}>
                          <Trans i18nKey={"selector-instance"} />
                        </option>
                        {instances.data.map((_value, index) => {
                          const index_format = index.toString().padStart(3, "0")
                          return (
                            <option key={index} value={index}>
                              <Trans i18nKey={"instance.__index__"} values={{ index: index_format }} />
                            </option>
                          )
                        })}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group controlId={"FormSelector_Models"}>
                      <Form.Select
                        aria-label={"plot"}
                        size={"sm"}
                        value={listCustomModels.index}
                        onChange={handleChange_Models_Index}
                      >
                        <option value={DEFAULT_SELECTOR_MODEL} disabled={true}>
                          <Trans i18nKey={"selector-model"} />
                        </option>
                        {listCustomModels.data.map((_value, index) => {
                          const index_format = index.toString()
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
                  />
                </Card.Body>
              </Card>

              {/* Explicabilidad */}
              <Card className={"mt-3"} data-testid={"explainability-card"}>
                <Card.Header className={"d-flex align-items-center justify-content-between"}>
                  <h3>
                    <Trans
                      i18nKey={"pages.playground.0-tabular-classification.general.explainability"}
                      defaults={"Explicabilidad del modelo"}
                    />
                  </h3>
                </Card.Header>
                <Card.Body>
                  <Row className={"mb-2"}>
                    <Col md={6} className="mb-2">
                      <Form.Group controlId="inputNSamplesRegression">
                        <Form.Label>
                          <Trans
                            i18nKey={"pages.playground.1-regression.n-samples"}
                            defaults={"Number of samples"}
                          />
                        </Form.Label>
                        <Form.Control
                          type="number"
                          size={"sm"}
                          value={nSamplesExplain}
                          min={1}
                          step={1}
                          onChange={(e) => setNSamplesExplain(Number(e.target.value))}
                        />
                        <Form.Text className="text-muted">
                          <Trans
                            i18nKey={"pages.playground.1-regression.n-samples-help"}
                            defaults={"Samples used by KernelSHAP"}
                          />
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className={"mb-3"}>
                    <Col>
                      <div className="d-grid gap-2">
                        <Button
                          size={"lg"}
                          variant={showExplain ? "outline-secondary" : "primary"}
                          onClick={(e) => handleRequest_ExplainPrediction(e)}
                          disabled={isCalculo || prediction.input_0_raw?.length === 0}
                        >
                          {isCalculo
                            ? t("pages.playground.0-tabular-classification.general.calculating", {
                                defaultValue: "Calculating...",
                              })
                            : showExplain
                              ? t("pages.playground.0-tabular-classification.general.hide-explain", {
                                  defaultValue: "Hide explanation",
                                })
                              : t("pages.playground.0-tabular-classification.general.show-explain", {
                                  defaultValue: "Show explanation",
                                })}
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
                          features={
                            listDatasets.data[listDatasets.index]?.dataframe_processed
                              ?.columns || []
                          }
                        />
                      )}
                    </Col>
                  </Row>

                  {/* === SHAP global: importancia media de las características (mean|SHAP|) === */}
                  <hr />
                  <Row className={"mb-2"}>
                    <Col md={4} className="mb-2">
                      <Form.Group controlId="inputNInstancesGlobalRegression">
                        <Form.Label>
                          <Trans
                            i18nKey={"pages.playground.0-tabular-classification.general.n-instances"}
                            defaults={"Instances to aggregate"}
                          />
                        </Form.Label>
                        <Form.Control
                          type="number"
                          size={"sm"}
                          value={nInstancesGlobal}
                          min={1}
                          step={1}
                          onChange={(e) => setNInstancesGlobal(Number(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4} className="mb-2">
                      <Form.Group controlId="selectGlobalChartTypeRegression">
                        <Form.Label>
                          <Trans
                            i18nKey={"pages.playground.0-tabular-classification.general.chart-type"}
                            defaults={"Chart type"}
                          />
                        </Form.Label>
                        <Form.Select
                          size={"sm"}
                          value={globalChartType}
                          onChange={(e) => setGlobalChartType(e.target.value as "bar" | "beeswarm")}
                        >
                          <option value={"bar"}>
                            {t("pages.playground.0-tabular-classification.general.chart-bar", {
                              defaultValue: "Bar (mean |SHAP|)",
                            })}
                          </option>
                          <option value={"beeswarm"}>
                            {t("pages.playground.0-tabular-classification.general.chart-beeswarm", {
                              defaultValue: "Beeswarm",
                            })}
                          </option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    {globalChartType === "bar" && (
                      <Col md={4} className="mb-2">
                        <Form.Group controlId="selectGlobalSortOrderRegression">
                          <Form.Label>
                            <Trans
                              i18nKey={"pages.playground.0-tabular-classification.general.sort-order"}
                              defaults={"Sort"}
                            />
                          </Form.Label>
                          <Form.Select
                            size={"sm"}
                            value={globalSortOrder}
                            onChange={(e) => setGlobalSortOrder(e.target.value as "desc" | "asc" | "none")}
                          >
                            <option value={"desc"}>
                              {t("pages.playground.0-tabular-classification.general.sort-desc", {
                                defaultValue: "Most to least important",
                              })}
                            </option>
                            <option value={"asc"}>
                              {t("pages.playground.0-tabular-classification.general.sort-asc", {
                                defaultValue: "Least to most important",
                              })}
                            </option>
                            <option value={"none"}>
                              {t("pages.playground.0-tabular-classification.general.sort-none", {
                                defaultValue: "Original order",
                              })}
                            </option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    )}
                  </Row>

                  <Row className={"mb-3"}>
                    <Col>
                      <div className="d-grid gap-2">
                        <Button
                          size={"lg"}
                          variant={showGlobalExplain ? "outline-secondary" : "primary"}
                          onClick={(e) => handleRequest_ExplainGlobal(e)}
                          disabled={isCalculoGlobal}
                        >
                          {isCalculoGlobal
                            ? t("pages.playground.0-tabular-classification.general.calculating", {
                                defaultValue: "Calculating...",
                              })
                            : showGlobalExplain
                              ? t("pages.playground.0-tabular-classification.general.hide-global", {
                                  defaultValue: "Hide global importance",
                                })
                              : t("pages.playground.0-tabular-classification.general.show-global", {
                                  defaultValue: "Show global importance",
                                })}
                        </Button>
                      </div>
                      {isCalculoGlobal && (
                        <ProgressBar
                          className={"mt-2"}
                          now={globalProgress}
                          label={`${globalProgress}%`}
                          striped={true}
                          animated={true}
                        />
                      )}
                    </Col>
                  </Row>

                  <Row>
                    <Col>
                      {showGlobalExplain &&
                        globalShap &&
                        globalImportance &&
                        (globalChartType === "bar" ? (
                          <ShapExplanationChart
                            shapValues={[globalImportance]}
                            predictedClass={0}
                            sortOrder={globalSortOrder}
                            features={featureNames_ref.current}
                          />
                        ) : (
                          <ShapBeeswarmChart
                            shap={globalShap.shap}
                            featureValues={globalShap.featureValues}
                            features={featureNames_ref.current}
                          />
                        ))}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </>
  )
}
