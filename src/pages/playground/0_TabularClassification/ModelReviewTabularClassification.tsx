import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { Trans, useTranslation } from "react-i18next"
import { Button, Card, Col, Container, Form, ProgressBar, Row } from "react-bootstrap"
import ReactGA from "react-ga4"
import * as tfjs from "@tensorflow/tfjs"
import * as tfvis from "@tensorflow/tfjs-vis"

import alertHelper from "@utils/alertHelper"
import I_MODEL_TABULAR_CLASSIFICATION from "./models/_model"
import { VERBOSE } from "@/CONSTANTS"
import { MAP_TC_CLASSES } from "@pages/playground/0_TabularClassification/models"
import ModelReviewTabularClassificationDatasetTable from "@pages/playground/0_TabularClassification/ModelReviewTabularClassificationDatasetTable"
import ModelReviewTabularClassificationDatasetInfo from "@pages/playground/0_TabularClassification/ModelReviewTabularClassificationDatasetInfo"
import ModelReviewTabularClassificationPredict from "@pages/playground/0_TabularClassification/ModelReviewTabularClassificationPredict"
import ModelReviewTabularClassificationPredictForm from "@pages/playground/0_TabularClassification/ModelReviewTabularClassificationPredictForm"
import * as DataFrameUtils from "@core/dataframe/DataFrameUtils"
import { UPLOAD } from "@/DATA_MODEL"
import type { BasicPrediction_t, DatasetProcessed_t } from "@core/types"
import { myModelWrapper } from "@core/explainability/ModelExplanation"
import ShapExplanationChart from "@core/explainability/ModelExplanationChart"
import ShapBeeswarmChart from "@core/explainability/ShapBeeswarmChart"
import {
  dataframeRowsToNumbers,
  sampleRowsWithoutReplacement,
  buildShapBackground,
} from "@core/explainability/shapSampling"
import { KernelSHAP } from "webshap"
type Props = {
  dataset: string
}

export default function ModelReviewTabularClassification(props: Props) {
  const { dataset } = props

  //const prefix = 'pages.playground.0-tabular-classification'
  const { t } = useTranslation()
  const navigate = useNavigate()

  const iModelInstance_ref = useRef<I_MODEL_TABULAR_CLASSIFICATION | null>(null)
  const model_ref = useRef<tfjs.LayersModel | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  const [isButtonToPredictDisabled, setIsButtonToPredictDisabled] = useState(true)

  // Datos a predecir crudos
  const [dataToPredict, setDataToPredict] = useState({})
  // Datos a predecir después de codificar
  const [vectorToPredict, setVectorToPredict] = useState<number[]>([])

  const [prediction, setPrediction] = useState<BasicPrediction_t>({ labels: [], data: [] })

  // === Explicabilidad (SHAP) ===
  const explainer = useRef<KernelSHAP | null>(null)
  // Pool de instancias del dataset (codificadas, sin escalar = mismo espacio que vectorToPredict)
  // del que se muestrea el background para KernelSHAP.
  const backgroundPool_ref = useRef<number[][]>([])
  const [showExplain, setShowExplain] = useState(false)
  const [explanationData, setExplanationData] = useState<number[][] | null>(null)
  const [isCalculo, setIsCalculo] = useState(false)
  const [nSamplesExplain, setNSamplesExplain] = useState(1000)
  const [selectedClassIndex, setSelectedClassIndex] = useState(0)

  //  SHAP global. Matriz única que almacena TODO el resultado del cálculo global:
  //   - shap[instancia][feature]          → valor SHAP (clase seleccionada)
  //   - featureValues[instancia][feature] → valor de la feature (para colorear el beeswarm)
  // De aquí derivamos el bar plot (mean|SHAP|) y, más adelante, el beeswarm.
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

  // Importancia global = mean(|SHAP|) por feature, derivada de la matriz (única fuente de verdad).
  const globalImportance = useMemo<number[] | null>(() => {
    if (!globalShap || globalShap.shap.length === 0) return null
    const nF = globalShap.shap[0].length
    const sums = new Array(nF).fill(0)
    for (const row of globalShap.shap) {
      for (let f = 0; f < nF; f++) sums[f] += Math.abs(row[f])
    }
    return sums.map((s) => s / globalShap.shap.length)
  }, [globalShap])

  const handleChange_onProgress = (fraction: number) => {
    setProgress(fraction * 100)
  }
  useEffect(() => {
    if (VERBOSE) console.debug("useEffect []")
    return () => {
      tfvis.visor().close()
    }
  }, [])

  useEffect(() => {
    if (VERBOSE) console.debug("useEffect [dataToPredict]")
    // TODO encoders to dataToPredict
    const init = async () => {
      const iModelInstance = iModelInstance_ref.current
      if (iModelInstance === null) {
        console.warn("Error, model instance is null")
        return
      }
      const datasets = await iModelInstance.DATASETS()
      if (datasets.length === 0 || !datasets[0].data_processed) {
        console.warn("Error, datasets is empty")
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
  }, [dataToPredict])

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: `/ModelReviewTabularClassification/${dataset}`, title: dataset })
  }, [dataset])

  useEffect(() => {
    if (VERBOSE) console.debug("useEffect[init]")
    const init = async () => {
      await tfjs.ready()
      // =========================
      if (dataset === UPLOAD) {
        console.error("Error, option not valid")
      } else if (dataset in MAP_TC_CLASSES) {
        try {
          const _iModelClass = MAP_TC_CLASSES[dataset]
          iModelInstance_ref.current = new _iModelClass(t, () => {})
          if (iModelInstance_ref === null || iModelInstance_ref.current === null) {
            console.warn("Error, model instance is null", { dataset })
            await alertHelper.alertError("Error, option not valid")
            return
          }
          model_ref.current = await iModelInstance_ref.current.LOAD_LAYERS_MODEL({
            onProgress: handleChange_onProgress,
          })
          setDataToPredict(iModelInstance_ref.current.DATA_DEFAULT)
          const _datasets: DatasetProcessed_t[] = await iModelInstance_ref.current.DATASETS()
          if (!_datasets.length || !_datasets[0].data_processed) {
            console.warn("No datasets available.")
            return
          }
          const encoders = _datasets[0].data_processed.encoders
          const _applyEncoders = DataFrameUtils.DataFrameApplyEncoders(
            encoders,
            iModelInstance_ref.current.DATA_DEFAULT,
            iModelInstance_ref.current.DATA_DEFAULT_KEYS,
          )
          setVectorToPredict(_applyEncoders)
          // Guardamos las filas del dataset (codificadas, SIN escalar) para usarlas como
          // background de SHAP. dataframe_X está en el mismo espacio que vectorToPredict.
          try {
            const dataframe_X = _datasets[0].data_processed.dataframe_X
            backgroundPool_ref.current = dataframeRowsToNumbers(dataframe_X.values)
          } catch (e) {
            console.warn("Could not build SHAP background pool from dataset", { e })
            backgroundPool_ref.current = []
          }
          setIsLoading(false)
          setIsButtonToPredictDisabled(false)
          await alertHelper.alertSuccess(t("model-loaded-successfully"))
        } catch (e) {
          console.error("Error, can't load model", { e })
        }
      } else {
        console.error("Error, model not valid", { ID: dataset })
        await alertHelper.alertError("Error, option not valid")
        navigate("/404")
      }
      // =========================
    }

    init().then((_r) => {
      console.debug("init end")
    })
  }, [dataset, navigate, t])

  const handleSubmit_PredictVector = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsButtonToPredictDisabled(true)
    if (vectorToPredict === undefined || vectorToPredict.length < 1) {
      await alertHelper.alertInfo(t("info.insert-input"))
      setIsButtonToPredictDisabled(false)
      return
    }
    if (model_ref.current === null) {
      console.error("Error, model is null")
      return
    }
    if (iModelInstance_ref.current === null) {
      console.error("Error, model instance is null")
      return
    }

    try {
      const parse_vectorToPredict = vectorToPredict.map((item) => parseFloat(item.toString()))
      const tensor = tfjs.tensor2d(parse_vectorToPredict, [1, parse_vectorToPredict.length])
      // FIX
      // TypeScript error
      const model_prediction = model_ref.current.predict(tensor) as tfjs.Tensor
      const model_prediction_data = model_prediction.dataSync()
      const _prediction: BasicPrediction_t = {
        labels: iModelInstance_ref.current.CLASSES,
        data  : Array.from(model_prediction_data).map((item) => item.toFixed(4)),
      }
      setPrediction(_prediction)
    } catch (error) {
      console.error(error)
      await alertHelper.alertError("Error, option not valid")
    }

    setIsButtonToPredictDisabled(false)
  }

  const handleRequest_ExplainPrediction = async (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (showExplain) {
      setShowExplain(false)
      return
    }

    setIsCalculo(true)
    try {
      if (!vectorToPredict || vectorToPredict.length === 0) {
        await alertHelper.alertInfo(t("info.insert-input"))
        setIsCalculo(false)
        return
      }
      if (model_ref.current === null) {
        setIsCalculo(false)
        return
      }

      // La instancia debe ser numérica (vectorToPredict puede traer strings en datasets
      // categóricos como Lymphography). Lo parseamos igual que hace el predict.
      const instance = vectorToPredict.map((v) => parseFloat(String(v)))
      // Background muestreado del dataset (mismo espacio que la instancia).
      const nFeatures = instance.length
      const backgroundData = buildShapBackground(backgroundPool_ref.current, nFeatures)

      const predictor = myModelWrapper(model_ref)
      explainer.current = new KernelSHAP(predictor, backgroundData, 0.2022)

      const nSamples = Number(nSamplesExplain) || 1000
      const shapValues = await explainer.current.explainOneInstance(
        instance,
        nSamples,
      )

      setExplanationData(shapValues)
      setShowExplain(true)
      setIsCalculo(false)
    } catch (error) {
      console.error("Error calculating explainability", { error })
      await alertHelper.alertError(t("Error calculating explainability"))
      setIsCalculo(false)
    }
  }

  // SHAP global: explica una muestra de instancias del dataset y agrega la media de los
  // valores absolutos (mean|SHAP|) por feature para la clase seleccionada. Es la importancia
  // global estándar de SHAP: agregar muchas explicaciones locales.
  const handleRequest_ExplainGlobal = async (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (showGlobalExplain) {
      setShowGlobalExplain(false)
      return
    }
    if (model_ref.current === null) return

    const nFeatures = vectorToPredict.length
    if (nFeatures === 0) {
      await alertHelper.alertInfo(t("info.insert-input"))
      return
    }

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
      // Background = muestra del dataset; instancias a explicar = otra muestra del dataset.
      const backgroundData = buildShapBackground(pool, nFeatures)
      const predictor = myModelWrapper(model_ref)

      const instances = sampleRowsWithoutReplacement(pool, Math.min(nInstancesGlobal, pool.length))
      const nSamples = Number(nSamplesExplain) || 1000

      // Matriz que almacena TODO: una fila por instancia con el valor SHAP de cada feature
      // (clase seleccionada). De aquí se deriva el bar plot y, más adelante, el beeswarm.
      const shapMatrix: number[][] = []
      for (let k = 0; k < instances.length; k++) {
        // KernelSHAP no resetea su estado interno (nSamplesAdded) entre llamadas, así que
        // creamos un explainer nuevo por instancia (igual que hace el SHAP local).
        const explainerGlobal = new KernelSHAP(predictor, backgroundData, 0.2022)
        const shap = await explainerGlobal.explainOneInstance(instances[k], nSamples)
        const classShap = shap[selectedClassIndex] ?? []
        shapMatrix.push(Array.from({ length: nFeatures }, (_, f) => classShap[f] ?? 0))
        setGlobalProgress(Math.round(((k + 1) / instances.length) * 100))
      }

      // Guardamos la matriz SHAP + los valores de las features (estos últimos para el beeswarm).
      setGlobalShap({ shap: shapMatrix, featureValues: instances })
      setShowGlobalExplain(true)
    } catch (error) {
      console.error("Error calculating global explainability", { error })
      await alertHelper.alertError(t("Error calculating explainability"))
    } finally {
      setIsCalculoGlobal(false)
    }
  }

  // Al cambiar de clase, la matriz global queda obsoleta (se calculó para la clase anterior).
  // La reseteamos y ocultamos el gráfico para forzar un recálculo explícito por parte del usuario.
  const handleChange_SelectedClass = (index: number) => {
    setSelectedClassIndex(index)
    setGlobalShap(null)
    setShowGlobalExplain(false)
  }

  const setExample = (example: Record<string, any>) => {
    setDataToPredict(example)
  }

  const handleChange_Example = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const example = JSON.parse(e.target.value)
    setExample(example)
  }

  const handleClick_openSummary = async () => {
    if (model_ref.current === null) {
      console.error("Error, model is null")
      return
    }
    if (!tfvis.visor().isOpen()) {
      await tfvis.show.modelSummary({ name: "Model Summary" }, model_ref.current)
      tfvis.visor().open()
    } else {
      tfvis.visor().close()
    }
  }
  if (iModelInstance_ref.current === null) {
    return <>Error iModelInstance is null</>
  }
  if (model_ref.current === null) {
    return <>Error model is null</>
  }

  if (VERBOSE) console.debug("render ModelReviewTabularClassification")
  return (
    <>
      <Container>
        <Row className={"mt-2"}>
          <Col xl={12}>
            <div className="d-flex justify-content-between">
              <h1>
                <Trans i18nKey={"modality.0"} />
              </h1>
            </div>
          </Col>
        </Row>
      </Container>

      <Container id={"ModelReviewTabularClassification"} data-testid={"Test-ModelReviewTabularClassification"}>
        <Row>
          <Col>
            {isLoading && (
              <ProgressBar
                label={progress < 100 ? t("downloading") : t("downloaded")}
                striped={true}
                animated={true}
                now={progress}
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
            <div className={"sticky-top"} style={{ zIndex: 0 }}>
            <Card className={"mt-3 border-info"}>
              <Card.Header className={"d-flex align-items-center justify-content-between"}>
                <h2>
                  <Trans i18nKey={"pages.playground.0-tabular-classification.general.model"} />
                </h2>
                {import.meta.env.VITE_SHOW_NEW_FEATURE === "true" && (
                  <div className="d-flex">
                    <Button size={"sm"} variant={"outline-info"} onClick={handleClick_openSummary}>
                      Summary
                    </Button>
                  </div>
                )}
              </Card.Header>
              <Card.Body>
                <Card.Title>
                  <Trans i18nKey={iModelInstance_ref.current?.TITLE ?? "loading"} />
                </Card.Title>
                {iModelInstance_ref.current.DESCRIPTION()}
              </Card.Body>
            </Card>

            {/* Panel narrativo de explicabilidad: aparece al pedir una explicación y describe,
                según el caso, el SHAP local (una instancia) y/o la importancia global. */}
            {(showExplain || showGlobalExplain) && (
              <Card className={"mt-3 border-success"} style={{ zIndex: 0 }}>
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
                          i18nKey={"pages.playground.0-tabular-classification.general.explain-panel-local-body"}
                          defaults={
                            "SHAP explains a single prediction by distributing the difference between this prediction and the model's average prediction (base value) across the features. Each bar shows how much, and in which direction, a feature pushes: positive toward the selected class, negative against it."
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
            <ModelReviewTabularClassificationDatasetTable
              iModelInstance={iModelInstance_ref.current}
            />

            <ModelReviewTabularClassificationDatasetInfo
              dataset={dataset}
              iModelInstance={iModelInstance_ref.current}
            />

            <Card className={"mt-3"}>
              <Card.Header className={"d-flex align-items-center justify-content-between"}>
                <h3>
                  <Trans i18nKey={"pages.playground.0-tabular-classification.general.description-features"} />
                </h3>
                <div className="d-flex">
                  <Form.Group controlId={"plot"}>
                    <Form.Select aria-label={"example"} size={"sm"} onChange={(e) => handleChange_Example(e)}>
                      {iModelInstance_ref.current.LIST_EXAMPLES.map((value, index) => {
                        if (iModelInstance_ref.current === null) {
                          console.error("Form.Select, model instance is null")
                          return null
                        }
                        const LIST = iModelInstance_ref.current.LIST_EXAMPLES_RESULTS
                        return (
                          <option key={"option_" + index} value={JSON.stringify(value)}>
                            <Trans i18nKey={"example-i"} values={{ i: LIST[index] }} />
                          </option>
                        )
                      })}
                    </Form.Select>
                  </Form.Group>
                </div>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit_PredictVector}>
                  <ModelReviewTabularClassificationPredictForm
                    iModelInstance={iModelInstance_ref.current}
                    dataToTest={dataToPredict}
                    setDataToTest={setDataToPredict}
                  />
                  <Row className={"mt-3"}>
                    <Col>
                      <Form.Group controlId={"formInputData"}>
                        <Form.Label>
                          <Trans i18nKey={"pages.playground.0-tabular-classification.general.description-data"} />
                        </Form.Label>
                        <Form.Control size={"sm"} disabled={true} value={Object.values(dataToPredict).join(",")} />
                        <Form.Text className="text-muted">
                          <Trans i18nKey={"pages.playground.form.data-to-check"} />
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId={"formInputVector"}>
                        <Form.Label>
                          <Trans i18nKey={"pages.playground.0-tabular-classification.general.description-vector"} />
                        </Form.Label>
                        <Form.Control size={"sm"} disabled={true} value={vectorToPredict.join(",")} />
                        <Form.Text className="text-muted">
                          <Trans i18nKey={"pages.playground.form.vector-to-check"} />
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  {/*<Row><Col><pre>[[{vectorToPredict.join(',')}], [1, {vectorToPredict.length}]]</pre></Col></Row>*/}
                  <Row className={"mt-3"}>
                    <Col>
                      <div className="d-grid gap-2">
                        <Button variant={"primary"} size={"lg"} type={"submit"} disabled={isButtonToPredictDisabled}>
                          <Trans i18nKey={"pages.playground.form.button-check-result"} />
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

            <ModelReviewTabularClassificationPredict prediction={prediction} />

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
                    <Form.Group controlId="selectPredictedClass">
                      <Form.Label>
                        <Trans
                          i18nKey={"pages.playground.0-tabular-classification.general.select-class"}
                          defaults={"Select class"}
                        />
                      </Form.Label>
                      <Form.Select
                        size={"sm"}
                        value={selectedClassIndex}
                        onChange={(e) => handleChange_SelectedClass(Number(e.target.value))}
                      >
                        {(iModelInstance_ref.current?.CLASSES || []).map((c, idx) => (
                          <option key={`class_${idx}`} value={idx}>
                            {c}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-2">
                    <Form.Group controlId="inputNSamples">
                      <Form.Label>
                        <Trans
                          i18nKey={"pages.playground.0-tabular-classification.general.n-samples"}
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
                          i18nKey={"pages.playground.0-tabular-classification.general.n-samples-help"}
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
                        disabled={isCalculo || prediction?.labels?.length === 0}
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
                        predictedClass={selectedClassIndex}
                        predictionProbs={prediction}
                        features={
                          iModelInstance_ref.current?.FORM?.map((f: any) =>
                            String(f.name)
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c: string) => c.toUpperCase()),
                          ) || []
                        }
                      />
                    )}
                  </Col>
                </Row>

                {/* === SHAP global: importancia media de las características (mean|SHAP|) === */}
                <hr />
                <Row className={"mb-2"}>
                  <Col md={4} className="mb-2">
                    <Form.Group controlId="inputNInstancesGlobal">
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
                      <Form.Text className="text-muted">
                        <Trans
                          i18nKey={"pages.playground.0-tabular-classification.general.n-instances-help"}
                          defaults={"Dataset instances aggregated to compute the global importance (mean |SHAP|)"}
                        />
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4} className="mb-2">
                    <Form.Group controlId="selectGlobalChartType">
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
                      <Form.Group controlId="selectGlobalSortOrder">
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
                          features={
                            iModelInstance_ref.current?.FORM?.map((f: any) =>
                              String(f.name)
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c: string) => c.toUpperCase()),
                            ) || []
                          }
                        />
                      ) : (
                        <ShapBeeswarmChart
                          shap={globalShap.shap}
                          featureValues={globalShap.featureValues}
                          features={
                            iModelInstance_ref.current?.FORM?.map((f: any) =>
                              String(f.name)
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c: string) => c.toUpperCase()),
                            ) || []
                          }
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
