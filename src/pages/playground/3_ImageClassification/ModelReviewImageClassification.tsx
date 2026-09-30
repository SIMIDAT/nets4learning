import { useEffect, useRef, useState } from "react"
import { Button, Card, Col, Container, Modal, Row } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import * as _chartjs from "chart.js"
import * as tfjs from "@tensorflow/tfjs"
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from "chart.js"
import { Bar } from "react-chartjs-2"
import { Trans, useTranslation } from "react-i18next"
import ReactGA from "react-ga4"


import type I_MODEL_IMAGE_CLASSIFICATION from "./models/_model"
import { VERBOSE } from "@/CONSTANTS"
import { UPLOAD } from "@/TASKS"
import alertHelper from "@utils/alertHelper"
import FakeProgressBar from "@components/loading/FakeProgressBar"
import DragAndDrop from "@components/dragAndDrop/DragAndDrop"

import ModelReviewImageClassificationMNIST from "@pages/playground/3_ImageClassification/ModelReviewImageClassificationMNIST"
import { MAP_IC_CLASSES } from "@pages/playground/3_ImageClassification/models"
import { IC_MODEL_KEYS } from "@/MODEL_KEYS"
import { hasModel, loadModelClass } from "@core/models/modelRegistry"
import { DEFAULT_BAR_DATA } from "@pages/playground/3_ImageClassification/CONSTANTS"
import { UTILS_image } from "@pages/playground/3_ImageClassification/utils/utils"
import type { BarOptions_t } from "@/types/types"

import {
  ImageExplainResults,
  ShapImageControls,
  type ImageExplainResult_t,
} from "@core/explainability/ImageExplainPanel"
import { DEFAULT_SHAP_IMAGE_OPTIONS } from "@core/explainability/shapImageOptions"
import { explainErrorKey } from "@core/explainability/explainError"
import {
  runImageClassificationExplain,
  runImageClassificationExplainLrp,
  supportsLrp,
} from "@pages/playground/3_ImageClassification/explainPrediction/runImageClassificationExplain"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)



const DEFAULT_INFO: { image_src: string | null; image_upload: File | null; modal_image: File | null } = {
  image_src   : null,
  image_upload: null,
  modal_image : null,
}
type ModelReviewImageClassificationProps = {
  dataset: string
}
export default function ModelReviewImageClassification({ dataset }: ModelReviewImageClassificationProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [iModelInstance, setIModelInstance] = useState<I_MODEL_IMAGE_CLASSIFICATION | null>(null)
  const [model, setModel] = useState<tfjs.LayersModel | null>(null)

  const iChartRef_modal = useRef<_chartjs.Chart<"bar">>(null)
  const iChartRef_image = useRef<_chartjs.Chart<"bar">>(null)

  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const canvas_original_image_ref = useRef<HTMLCanvasElement>(null)
  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const canvas_result_ref = useRef<HTMLCanvasElement>(null)
  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const canvas_image_ref = useRef<HTMLCanvasElement>(null)
  /**
   * @type {ReturnType<typeof useRef<HTMLCanvasElement>>}
   */
  const canvas_modal_image_ref = useRef<HTMLCanvasElement>(null)

  const [isLoading, setIsLoading] = useState(true)

  const [isImageUploaded, setIsImageUploaded] = useState(false)
  const [isModalShow, setIsModelShow] = useState(false)
  const [info, setInfo] = useState(DEFAULT_INFO)

  const [barDataImage, setBarDataImage] = useState(DEFAULT_BAR_DATA)
  const [barDataModal, setBarDataModal] = useState(DEFAULT_BAR_DATA)

  // === Explicabilidad (SHAP / LRP) ===
  // Imagen clasificada que se explicará (misma ImageData que recibió el modelo).
  const imgData_ref = useRef<ImageData | null>(null)
  const [hasExplainInput, setHasExplainInput] = useState(false)
  const [explainResult, setExplainResult] = useState<ImageExplainResult_t | null>(null)
  const [showExplain, setShowExplain] = useState(false)
  const [isCalculo, setIsCalculo] = useState(false)
  // MNIST solo ofrece LRP; el resto elige entre SHAP y LRP (si el modelo implementa LRP).
  const [explainMethod, setExplainMethod] = useState<"shap" | "lrp">("shap")
  const [lrpAvailable, setLrpAvailable] = useState(false)
  const [shapOptions, setShapOptions] = useState(DEFAULT_SHAP_IMAGE_OPTIONS)

  /**
   * @type {*|BarOptions_t}
   */
  const bar_option: BarOptions_t = {
    responsive: true,
    plugins   : {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text   : t("prediction"),
      },
    },
  }

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: `/ModelReviewImageClassification/${dataset}`, title: dataset })
  }, [dataset])

  useEffect(() => {
    if (VERBOSE) console.debug("useEffect[init][ dataset, t, history ]")
    const init = async () => {
      await tfjs.ready()
      // =========================
      if (dataset === UPLOAD) {
        console.error("Error, data set not valid")
      } else if (hasModel(MAP_IC_CLASSES, dataset)) {
        try {
          const _iModelClass = await loadModelClass(MAP_IC_CLASSES, dataset)
          const _iModelInstance = new _iModelClass(t)
          setIModelInstance(_iModelInstance)
          setModel(await _iModelInstance.ENABLE_MODEL() as tfjs.LayersModel)
          setLrpAvailable(supportsLrp(_iModelInstance))
          setIsLoading(false)
          await alertHelper.alertSuccess(t("model-loaded-successfully"))
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

    init().then()
  }, [dataset, t, navigate])

  useEffect(() => {
    console.debug("useEffect [barDataModal]")
    if (iChartRef_modal.current) {
      iChartRef_modal.current.update()
    }
  }, [barDataModal])

  useEffect(() => {
    console.debug("useEffect [barDataImage]")
    if (iChartRef_image.current) {
      iChartRef_image.current.update()
    }
  }, [barDataImage])

  const isMNIST = () => {
    return dataset === IC_MODEL_KEYS.MNIST
  }

  const handleClick_ImageByExamples_OpenDrawAndPredict = (image_src: string) => {
    setInfo((prevState) => {
      return {
        ...prevState,
        image_src: image_src,
      }
    })

    setIsModelShow(true)
  }

  const handleFileUpload_Image = (files: File[]) => {
    try {
      const blob = files[0]
      setInfo((prevState) => {
        return {
          ...prevState,
          image_upload: new File([blob], blob.name, { type: blob.type }),
        }
      })
      setIsImageUploaded(true)
    } catch (error) {
      console.error(error)
    }
  }

  const handleModal_Close = () => {
    setIsModelShow(false)
  }
  const handleModal_Exited = () => { }

  const handleModal_Entered = async () => {
    if (iModelInstance === null) return
    // const canvas = document.getElementById('modal_canvas_image')
    const canvas = canvas_modal_image_ref.current as HTMLCanvasElement
    const canvas_modal_ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    canvas_modal_ctx.clearRect(0, 0, canvas.width, canvas.height)
    const image = new Image()
    image.src = info.image_src!
    image.addEventListener('error', (e: Event) => {
      UTILS_image.failed(e)
    })
    image.onload = async () => {
      UTILS_image.drawImageInCanvasWithContainer(image, canvas)
      const imageData = await iModelInstance.GET_IMAGE_DATA(canvas, canvas_modal_ctx)
      const { predictions } = await iModelInstance.CLASSIFY_IMAGE(model, imageData)
      const barDataPrediction = await iModelInstance.PREDICTION_FORMAT(predictions)

      // La pintamos también en el canvas original (id "originalImage"), que es la imagen base
      // del heatmap; si no, al explicar un ejemplo el mapa de calor se ve sobre blanco.
      if (canvas_original_image_ref.current) {
        UTILS_image.drawImageInCanvasWithContainer(image, canvas_original_image_ref.current)
      }
      setExplainInput(imageData)

      setBarDataModal(barDataPrediction)
    }
  }

  const handleClick_ImageUploaded_Predict = async () => {
    if (iModelInstance === null) return
    if (!isImageUploaded || !info.image_upload) {
      await alertHelper.alertError(t("error.need-to-upload-image"))
      return
    }
    const image = new Image()
    image.src = URL.createObjectURL(info.image_upload)
    image.addEventListener('error', (e: Event) => {
      UTILS_image.failed(e)
    })

    const canvas = canvas_original_image_ref.current
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("HTMLCanvasElement")
    }

    const canvas_ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    canvas_ctx.clearRect(0, 0, canvas.width, canvas.height)
    image.onload = async () => {
      UTILS_image.drawImageInCanvasWithContainer(image, canvas)
      const imageData = await iModelInstance.GET_IMAGE_DATA(canvas, canvas_ctx)
      const { predictions } = await iModelInstance.CLASSIFY_IMAGE(model, imageData)
      const barDataPrediction = await iModelInstance.PREDICTION_FORMAT(predictions)

      setExplainInput(imageData)

      setBarDataImage(barDataPrediction)
    }
  }

  // Nueva imagen clasificada: pasa a ser la entrada de la explicabilidad y se descarta
  // la explicación anterior.
  const setExplainInput = (imageData: ImageData | null) => {
    imgData_ref.current = imageData
    setHasExplainInput(imageData !== null)
    clearExplainResult()
  }

  // Limpia el heatmap previo (al volver a dibujar/escribir un número, o al borrar el lienzo).
  const clearExplainResult = () => {
    setShowExplain(false)
    setExplainResult(null)
  }

  const handleRequest_ExplainPrediction = async () => {
    if (showExplain) {
      setShowExplain(false)
      return
    }

    const imageData = imgData_ref.current
    const modelInstance = model
    if (!imageData || !modelInstance || iModelInstance === null) {
      await alertHelper.alertInfo(t("info.insert-input"))
      return
    }

    const useLrp = isMNIST() || explainMethod === "lrp"
    if (useLrp && !lrpAvailable) {
      await alertHelper.alertError(t("ui.explain.lrp-not-available"))
      return
    }

    setIsCalculo(true)
    try {
      const result = useLrp
        ? await runImageClassificationExplainLrp({ iModel: iModelInstance, modelInstance, imageData })
        : await runImageClassificationExplain({ iModel: iModelInstance, modelInstance, imageData, ...shapOptions })

      setExplainResult({
        method            : useLrp ? "lrp" : "shap",
        values            : result.shapValues,
        labels            : result.selectedLabels,
        galleryImages     : result.debugImages,
        imageSrc          : canvas_original_image_ref.current?.toDataURL(),
        segmentationMap   : result.segmentationMapArray,
        segmentationWidth : imageData.width,
        segmentationHeight: imageData.height,
        baseValues        : result.baseValues,
        predictedValues   : result.predictedValues,
      })
      setShowExplain(true)
    } catch (error) {
      console.error("Error calculating explainability", { error })
      await alertHelper.alertError(t(explainErrorKey(error)))
    } finally {
      setIsCalculo(false)
    }
  }

  if (VERBOSE) console.debug("render ModelReviewImageClassification")
  return (
    <>
      <Container id={"ModelReviewImageClassification"} data-testid={"Test-ModelReviewImageClassification"}>
        <Row className={"mt-2"}>
          <Col>
            <div className="d-flex justify-content-between">
              <h1>
                <Trans i18nKey={"modality.3"} />
              </h1>
            </div>
          </Col>
        </Row>
        <Row>
          <Col>
            <FakeProgressBar isLoading={isLoading} />
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
            <div className={"sticky-top"} style={{ zIndex: 0 }}>
              <Card className={"mt-3 border-info"}>
                <Card.Header>
                  <h2>
                    {iModelInstance !== null && <Trans i18nKey={iModelInstance.TITLE} />}
                  </h2>
                </Card.Header>
                <Card.Body>{dataset !== UPLOAD && iModelInstance?.DESCRIPTION()}</Card.Body>
              </Card>

              {/* Panel narrativo del método de explicabilidad (idéntico patrón al review tabular). */}
              <Card className={"mt-3 border-success"}>
                <Card.Header>
                  <h2 className={"h5 mb-0"}>
                    <Trans i18nKey={"pages.playground.0-tabular-classification.general.explain-panel-title"} />
                  </h2>
                </Card.Header>
                <Card.Body>
                  <p className={"small mb-0"}>
                    {isMNIST() || explainMethod === "lrp"
                      ? t("ui.explain.about-lrp")
                      : t("ui.explain.about-shap")}
                  </p>
                </Card.Body>
              </Card>
            </div>
          </Col>

          <Col xs={12} sm={12} md={12} xl={9} xxl={9}>
            <Row>
              <Col>
                <Card className={"mt-3"}>
                  <Card.Header>
                    <h2>
                      <Trans i18nKey={"datasets-models.3-image-classifier.interface.process-examples.title"} />
                    </h2>
                  </Card.Header>
                  <Card.Body>
                    <Container fluid={true}>
                      <Row className={(isMNIST() ? "" : "row-cols-3") + " justify-content-center g-2"}>
                        {(iModelInstance?.LIST_IMAGES_EXAMPLES() ?? []).map((image, index) => {
                          const path_image = import.meta.env.VITE_PATH + "/assets/" + image
                          return (
                            <Col className={"border"} key={index}>
                              <img
                                className={"img-fluid w-100 h-100 object-fit-cover cursor-pointer"}
                                src={import.meta.env.VITE_PATH + "/assets/" + image}
                                alt={image}
                                onClick={async () => {
                                  await handleClick_ImageByExamples_OpenDrawAndPredict(path_image)
                                }}
                              />
                            </Col>
                          )
                        })}
                      </Row>
                    </Container>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row>
              <Col
                className={"d-grid"}
                xs={12}
                sm={12}
                md={isMNIST() ? 6 : 12}
                xl={isMNIST() ? 6 : 12}
                xxl={isMNIST() ? 6 : 12}
              >
                <Card className={"mt-3"}>
                  <Card.Header>
                    <h3>
                      <Trans i18nKey={"datasets-models.3-image-classifier.interface.process-image.title"} />
                    </h3>
                  </Card.Header>
                  <Card.Body className={"d-grid"} style={{ alignContent: "space-between" }}>
                    <DragAndDrop
                      id={"drop-zone-image-instance"}
                      name={"doc"}
                      text={t("drag-and-drop.image")}
                      labelFiles={t("drag-and-drop.label-files-one")}
                      accept={{
                        "image/png": [".png"],
                        "image/jpg": [".jpg"],
                      }}
                      function_DropAccepted={handleFileUpload_Image}
                    />

                    <div className="d-flex gap-2 justify-content-center mx-auto">
                      <Button type={"button"} onClick={handleClick_ImageUploaded_Predict} variant={"primary"}>
                        <Trans i18nKey={"datasets-models.3-image-classifier.interface.process-image.validate"} />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              {isMNIST() && (
                <>
                  <ModelReviewImageClassificationMNIST
                    iModelInstance={iModelInstance}
                    model={model}
                    iChartRef_image={iChartRef_image}
                    setBarDataImage={setBarDataImage}
                    canvasResultRef={canvas_original_image_ref}
                    onResetExplain={clearExplainResult}
                    onImageDataReady={setExplainInput}
                  />
                </>
              )}
            </Row>

            <Card className={"mt-3"}>
              <Card.Header>
                <h3>
                  <Trans i18nKey={"datasets-models.3-image-classifier.interface.result"} />
                </h3>
              </Card.Header>
              <Card.Body>
                <Container fluid={true}>
                  <Row>
                    <Col className={"d-flex align-items-center justify-content-center"} id={"container_canvas"}>
                      <Row>
                        <Col className={"col-12 d-flex justify-content-center"}>
                          <canvas
                            id="originalImage"
                            ref={canvas_original_image_ref}
                            width={200}
                            height={200}
                            className={"nets4-border-1"}
                          ></canvas>
                        </Col>
                        <Col className={"col-12 d-flex justify-content-center"}>
                          <canvas
                            id="resultCanvas"
                            ref={canvas_result_ref}
                            style={{ display: "none" }}
                            width={250}
                            height={250}
                            className={"nets4-border-1"}
                          ></canvas>
                        </Col>
                        <Col className={"col-12 d-flex justify-content-center"}>
                          <canvas
                            id="imageCanvas"
                            ref={canvas_image_ref}
                            style={{ display: "none" }}
                            width={250}
                            height={250}
                            className={"nets4-border-1"}
                          ></canvas>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                  <Row className={"mt-3"}>
                    <Col className={"d-flex align-items-center justify-content-center"}>
                      <Bar
                        ref={iChartRef_image}
                        options={bar_option}
                        data={barDataImage}
                      />
                    </Col>
                  </Row>
                </Container>
              </Card.Body>
            </Card>

            <Card className={"mt-3"} data-testid={"explainability-card"}>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h3>{t("pages.playground.0-tabular-classification.general.explain-panel-title")} ({isMNIST() || explainMethod === "lrp" ? "LRP" : "SHAP"})</h3>
                {!isMNIST() && (
                  <div className="d-flex align-items-center gap-2">
                    <span className="small">{t("ui.explain.method")}:</span>
                    <Button
                      type="button"
                      size="sm"
                      variant={explainMethod === "shap" ? "primary" : "outline-primary"}
                      onClick={() => setExplainMethod("shap")}
                    >
                      SHAP
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={explainMethod === "lrp" ? "primary" : "outline-primary"}
                      onClick={() => setExplainMethod("lrp")}
                      disabled={!lrpAvailable}
                    >
                      LRP
                    </Button>
                  </div>
                )}
              </Card.Header>
              <Card.Body>
                {showExplain && explainResult && <ImageExplainResults result={explainResult} />}

                <div className="mt-3">
                  {!isMNIST() && explainMethod === "shap" && (
                    <ShapImageControls idPrefix={"ic-explain"} options={shapOptions} onChange={setShapOptions} />
                  )}

                  <Button
                    type="button"
                    variant={"outline-info"}
                    onClick={handleRequest_ExplainPrediction}
                    disabled={isCalculo || !hasExplainInput}
                  >
                    {isCalculo
                      ? t("ui.explain.calculating")
                      : showExplain
                        ? t("ui.explain.hideExplanation")
                        : t("ui.explain.explainPrediction")}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal
        show={isModalShow}
        fullscreen={"md-down"}
        onHide={handleModal_Close}
        onEntered={handleModal_Entered}
        onExited={handleModal_Exited}
        size={"xl"}
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            <Trans i18nKey={"datasets-models.3-image-classifier.interface.modal.title"} />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ display: "flex", alignItems: "center" }}>
          <Container fluid={true}>
            <Row style={{ alignItems: "center" }}>
              <Col xs={12} sm={5} md={5} xl={3} xxl={3}>
                <div className={"d-flex align-items-center justify-content-center"} id={"modal_canvas_container"}>
                  <canvas id="modal_canvas_image" ref={canvas_modal_image_ref} className={"nets4-border-1"}></canvas>
                </div>
              </Col>
              <Col xs={12} sm={7} md={7} xl={9} xxl={9}>
                <div className={"d-flex align-items-center justify-content-center"}>
                  <Bar ref={iChartRef_modal} options={bar_option} data={barDataModal} />
                </div>
              </Col>
            </Row>
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleModal_Close}>
            <Trans i18nKey={"datasets-models.3-image-classifier.interface.button-accept"} />
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
