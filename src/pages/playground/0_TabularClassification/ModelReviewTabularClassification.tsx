import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { Trans, useTranslation } from "react-i18next"
import { Button, Card, Col, Container, Form, ProgressBar, Row } from "react-bootstrap"
import ReactGA from "react-ga4"
import * as tfjs from "@tensorflow/tfjs"
import * as tfvis from "@tensorflow/tfjs-vis"

import alertHelper from "@utils/alertHelper"
import type I_MODEL_TABULAR_CLASSIFICATION from "./models/_model"
import { VERBOSE } from "@/CONSTANTS"
import { MAP_TC_CLASSES } from "@pages/playground/0_TabularClassification/models"
import { hasModel, loadModelClass } from "@core/models/modelRegistry"
import ModelReviewTabularClassificationDatasetTable from "@pages/playground/0_TabularClassification/ModelReviewTabularClassificationDatasetTable"
import ModelReviewTabularClassificationDatasetInfo from "@pages/playground/0_TabularClassification/ModelReviewTabularClassificationDatasetInfo"
import ModelReviewTabularClassificationPredict from "@pages/playground/0_TabularClassification/ModelReviewTabularClassificationPredict"
import ModelReviewTabularClassificationPredictForm from "@pages/playground/0_TabularClassification/ModelReviewTabularClassificationPredictForm"
import * as DataFrameUtils from "@core/dataframe/DataFrameUtils"
import { UPLOAD } from "@/TASKS"
import type { BasicPrediction_t, DatasetProcessed_t } from "@core/types"
import TabularShapPanel from "@core/explainability/TabularShapPanel"
import { dataframeRowsToNumbers, formatFeatureName } from "@core/explainability/shapSampling"
type Props = {
  dataset: string
}
export default function ModelReviewTabularClassification(props: Props) {
  const { dataset } = props

  //const prefix = 'pages.playground.0-tabular-classification'
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [iModelInstance, setIModelInstance] = useState<I_MODEL_TABULAR_CLASSIFICATION | null>(null)
  const [model, setModel] = useState<tfjs.LayersModel | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  const [isButtonToPredictDisabled, setIsButtonToPredictDisabled] = useState(true)

  // Datos a predecir crudos
  const [dataToPredict, setDataToPredict] = useState({})
  // Datos a predecir después de codificar
  const [vectorToPredict, setVectorToPredict] = useState<number[]>([])

  const [prediction, setPrediction] = useState<BasicPrediction_t>({ labels: [], data: [] })

  // === Explicabilidad (SHAP) ===
  // Filas del dataset (codificadas, sin escalar: el mismo espacio que recibe el modelo) y la
  // última entrada predicha, que es la que se explica.
  const backgroundPool_ref = useRef<number[][]>([])
  const predictedVector_ref = useRef<number[] | null>(null)
  // Valores del formulario (categorías y unidades originales) de la entrada predicha.
  const predictedDisplay_ref = useRef<Array<string | number> | null>(null)
  const [explainMeta, setExplainMeta] = useState<{ features: string[], classes: string[] }>({ features: [], classes: [] })
  const [predictedClassIndex, setPredictedClassIndex] = useState(0)

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
      // Hasta que termina la carga no hay datos que codificar (los encoders fallan con valores vacíos)
      if (iModelInstance === null || Object.keys(dataToPredict).length === 0) return
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
  }, [dataToPredict, iModelInstance])

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
      } else if (hasModel(MAP_TC_CLASSES, dataset)) {
        try {
          const _iModelClass = await loadModelClass(MAP_TC_CLASSES, dataset)
          const _iModelInstance = new _iModelClass(t, () => {})
          setIModelInstance(_iModelInstance)
          setModel(await _iModelInstance.LOAD_LAYERS_MODEL({
            onProgress: handleChange_onProgress,
          }))
          setDataToPredict(_iModelInstance.DATA_DEFAULT)
          const _datasets: DatasetProcessed_t[] = await _iModelInstance.DATASETS()
          if (!_datasets.length || !_datasets[0].data_processed) {
            console.warn("No datasets available.")
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
          setExplainMeta({
            features: _iModelInstance.FORM.map((field) => formatFeatureName(field.name)),
            classes : _iModelInstance.CLASSES,
          })
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
    if (model === null) {
      console.error("Error, model is null")
      return
    }
    if (iModelInstance === null) {
      console.error("Error, model instance is null")
      return
    }

    try {
      const parse_vectorToPredict = vectorToPredict.map((item) => parseFloat(item.toString()))
      const tensor = tfjs.tensor2d(parse_vectorToPredict, [1, parse_vectorToPredict.length])
      // FIX
      // TypeScript error
      const model_prediction = model.predict(tensor) as tfjs.Tensor
      const model_prediction_data = model_prediction.dataSync()
      const _prediction: BasicPrediction_t = {
        labels: iModelInstance.CLASSES,
        data  : Array.from(model_prediction_data).map((item) => item.toFixed(4)),
      }
      predictedVector_ref.current = parse_vectorToPredict
      predictedDisplay_ref.current = iModelInstance.DATA_DEFAULT_KEYS.map((key) => (dataToPredict as Record<string, string | number>)[key])
      const probabilities = Array.from(model_prediction_data)
      setPredictedClassIndex(probabilities.indexOf(Math.max(...probabilities)))
      setPrediction(_prediction)
    } catch (error) {
      console.error(error)
      await alertHelper.alertError("Error, option not valid")
    }

    setIsButtonToPredictDisabled(false)
  }

  const setExample = (example: Record<string, any>) => {
    setDataToPredict(example)
  }

  const handleChange_Example = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const example = iModelInstance?.LIST_EXAMPLES[parseInt(e.target.value)]
    if (example) setExample(example)
  }

  // Ejemplo que coincide con los datos del formulario; -1 si no es ninguno (datos por defecto o editados a mano).
  // Así el selector nunca anuncia un ejemplo distinto del que se va a predecir, y se puede volver a elegir.
  const exampleIndex = iModelInstance?.LIST_EXAMPLES.findIndex((example) =>
    iModelInstance.DATA_DEFAULT_KEYS.every((key) => String(example[key]) === String((dataToPredict as Record<string, unknown>)[key]))
  ) ?? -1

  const handleClick_openSummary = async () => {
    if (model === null) {
      console.error("Error, model is null")
      return
    }
    if (!tfvis.visor().isOpen()) {
      await tfvis.show.modelSummary({ name: "Model Summary" }, model)
      tfvis.visor().open()
    } else {
      tfvis.visor().close()
    }
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
        {iModelInstance !== null && model !== null && <Row>
          <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
            <Card className={"sticky-top mt-3 border-info"} style={{ zIndex: 0 }}>
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
                  <Trans i18nKey={iModelInstance.TITLE} />
                </Card.Title>
                {iModelInstance.DESCRIPTION()}
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={12} xl={9} xxl={9}>
            <ModelReviewTabularClassificationDatasetTable
              iModelInstance={iModelInstance}
            />

            <ModelReviewTabularClassificationDatasetInfo
              dataset={dataset}
              iModelInstance={iModelInstance}
            />

            <Card className={"mt-3"}>
              <Card.Header className={"d-flex align-items-center justify-content-between"}>
                <h3>
                  <Trans i18nKey={"pages.playground.0-tabular-classification.general.description-features"} />
                </h3>
                <div className="d-flex">
                  <Form.Group controlId={"plot"}>
                    <Form.Select aria-label={"example"} size={"sm"} value={exampleIndex} onChange={(e) => handleChange_Example(e)}>
                      {exampleIndex === -1 && (
                        <option value={-1} disabled>{t("example-custom")}</option>
                      )}
                      {iModelInstance.LIST_EXAMPLES.map((_value, index) => {
                        const LIST = iModelInstance.LIST_EXAMPLES_RESULTS
                        return (
                          <option key={"option_" + index} value={index}>
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
                    iModelInstance={iModelInstance}
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

            <TabularShapPanel
              features={explainMeta.features}
              classes={explainMeta.classes}
              predictedClassIndex={predictedClassIndex}
              inputKey={prediction}
              getModel={() => model}
              getInstance={() => predictedVector_ref.current}
              getPool={() => backgroundPool_ref.current}
              getInstanceDisplay={() => predictedDisplay_ref.current}
            />
          </Col>
        </Row>}
      </Container>
    </>
  )
}
