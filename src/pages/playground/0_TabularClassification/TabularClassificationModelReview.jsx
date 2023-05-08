import React from 'react'
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import * as tf from '@tensorflow/tfjs'
import * as alertHelper from '../../../utils/alertHelper'
import {
  getKeyDatasetByID_TabularClassification,
  MODEL_UPLOAD,
  LIST_MODELS_TABULAR_CLASSIFICATION,
  MODEL_CAR,
  MODEL_IRIS,
  MODEL_LYMPHOGRAPHY
} from "../../../DATA_MODEL";
import { CONSOLE_LOG_h3 } from "../../../Constantes";
import { isProduction } from "../../../utils/utils";
import N4LTablePagination from "../../../components/table/N4LTablePagination";
import DragAndDrop from "../../../components/dragAndDrop/DragAndDrop";
import ReactGA from "react-ga4";
import { Trans, withTranslation } from "react-i18next";
import { MODEL_TABULAR_CLASSIFICATION } from "./models/_model";

class TabularClassificationModelReview extends React.Component {
  constructor(props) {
    super(props);
    this.translate = props.t;
    this.dataset = props.dataset
    this.dataset_ID = parseInt(props.dataset ?? "0")
    this.dataset_key = getKeyDatasetByID_TabularClassification(this.dataset_ID)
    ReactGA.send({
      hitType: "pageview",
      page   : "/TabularClassificationModelReview/" + this.dataset_key,
      title  : this.dataset_key
    });

    this.state = {
      loading         :
        <>
          <div className="spinner-border"
               role="status"
               style={{
                 fontSize: "0.5em",
                 height  : "1rem",
                 width   : "1rem"
               }}>
            <span className="sr-only"></span>
          </div>
        </>,
      model           : null,
      activePage      : 0,
      textToTest      : "",
      isButtonDisabled: true,
      dataToTest      : {},
      filesUpload     : true
    }
    this.files = {
      binary: null,
      json  : null,
      csv   : null
    }
    this._model = new MODEL_TABULAR_CLASSIFICATION(props.t)

    switch (this.dataset_key) {
      case MODEL_UPLOAD: {
        this.state.loading = ""
        break
      }
      case MODEL_CAR.KEY: {
        this._model = new MODEL_CAR(props.t)
        if (!isProduction) console.log('%cCargando modelo coches', CONSOLE_LOG_h3)
        break;
      }
      case MODEL_IRIS.KEY: {
        this._model = new MODEL_IRIS(props.t)
        if (!isProduction) console.log('%cCargando modelo petalos', CONSOLE_LOG_h3)
        break;
      }
      case MODEL_LYMPHOGRAPHY.KEY: {
        this._model = new MODEL_LYMPHOGRAPHY(props.t)
        if (!isProduction) console.log('%cCargando modelo linfomas', CONSOLE_LOG_h3)
        break;
      }
      default: {
        console.error("Error, conjunto de datos no reconocido")
        return;
      }
    }

    this.handleChange_TestInput = this.handleChange_TestInput.bind(this)
    this.handleChange_Parameter = this.handleChange_Parameter.bind(this)
    this.handleClick_TestVector = this.handleClick_TestVector.bind(this)
    this.handleClick_ChangePage = this.handleClick_ChangePage.bind(this)
    this.handleClick_LoadModel = this.handleClick_LoadModel.bind(this)

    this.handleFileUpload_JSON = this.handleFileUpload_JSON.bind(this)
    this.handleFileUpload_Binary = this.handleFileUpload_Binary.bind(this)
    this.handleFileUpload_CSV = this.handleFileUpload_CSV.bind(this)

  }

  componentDidMount() {
    this.init()
      .then(() => undefined)
      .catch((reason) => console.log(reason))
  }

  async init() {
    console.log("e", this.props.dataset)
    const key = getKeyDatasetByID_TabularClassification(this.props.dataset)
    const isValid = LIST_MODELS_TABULAR_CLASSIFICATION.some((e) => e === key)
    if (!isValid) {
      await alertHelper.alertError("Error en la selección del modelo")
      return
    }

    switch (this.dataset_key) {
      case MODEL_UPLOAD: {
        break
      }
      case MODEL_CAR.KEY:
      case MODEL_IRIS.KEY:
      case MODEL_LYMPHOGRAPHY.KEY:
        try {
          this.setState({ dataToTest: this._model.DATA_DEFAULT }, () => {
            this.setState({ textToTest: Object.values(this.state.dataToTest).join(";") })
          })
          this.model = await this._model.loadModel()
          this.setState({ loading: "" })
          this.setState({ isButtonDisabled: false })
          await alertHelper.alertSuccess(this.translate("model-loaded-successfully"))
        } catch (e) {
          console.error("Error, no se ha podido cargar el modelo")
        }
        break
      default: {
        console.error("Opción no válida")
        return
      }
    }
  }

  handleChange_TestInput() {
    this.setState({ textToTest: document.getElementById(`formTestInput`).value })
  }

  handleClick_ChangePage = (pageNumber) => {
    this.setState({ activePage: pageNumber });
  }

  async handleClick_LoadModel() {
    if (this.files.json === null || this.files.binary === null) {
      await alertHelper.alertError(`Debes subir los ficheros JSON y binario`)
      return;
    }
    try {
      this.model = await tf.loadLayersModel(tf.io.browserFiles([this.files.json, this.files.binary]),)
      this.setState({ loading: "", isButtonDisabled: false })
      await alertHelper.alertSuccess(this.translate("model-loaded-successfully"))
    } catch (error) {
      console.error(error)
    }
  }

  async handleClick_TestVector() {
    this.setState({ isButtonDisabled: true })
    if (this.state.textToTest === undefined || this.state.textToTest.length < 1) {
      await alertHelper.alertWarning('Introduce unos valores a probar')
      this.setState({ isButtonDisabled: false })
      return;
    }

    switch (this.dataset_key) {
      case MODEL_UPLOAD: {

        break;
      }
      case MODEL_CAR.KEY:
      case MODEL_IRIS.KEY:
      case MODEL_LYMPHOGRAPHY.KEY: {
        try {
          let array = this.state.textToTest.split(';')
          let input = [[], [1, array.length]]
          for (let index = 0; index < array.length; index++) {
            input[0].push(await this._model.function_v_input(array[index], index, this._model.DATA_OBJECT_KEYS[index]))
          }
          const tensor = tf.tensor2d(input[0], input[1])
          if (!isProduction()) console.log({ input_0: input[0], tensor })
          const prediction = this.model.predict(tensor)
          const predictionWithArgMax = prediction.argMax(-1).dataSync()
          await alertHelper.alertInfo(this.translate("prediction-class", { num: predictionWithArgMax }), this._model.CLASSES[predictionWithArgMax], prediction)
        } catch (error) {
          console.error(error)
          await alertHelper.alertError(error)
        }
        break;
      }
      default: {
        console.error("Error, conjunto de datos no reconocido")
        break
      }
    }

    this.setState({ isButtonDisabled: false })
  }

  handleFileUpload_JSON(files) {
    this.files.json = new File([files[0]], files[0].name, { type: files[0].type });
    this.setState({ filesUpload: (this.files.json === null || this.files.binary === null) })
  }

  handleFileUpload_Binary(files) {
    this.files.binary = new File([files[0]], files[0].name, { type: files[0].type });
    this.setState({ filesUpload: (this.files.json === null || this.files.binary === null) })
  }

  handleFileUpload_CSV(files) {
    this.files.csv = new File([files[0]], files[0].name, { type: files[0].type });
    const reader = new FileReader();
    reader.readAsText(this.files.csv)

    const that = this
    reader.onload = function ($event) {
      const csv = $event.target.result
      const lines = csv.split("\n")
      const header = lines[0].split(",")
      const body = []
      for (let row_i = 1; row_i < lines.length; row_i++) {
        const new_row = []
        const row = lines[row_i].split(",")
        for (let col_i = 0; col_i < row.length; col_i++) {
          new_row.push(row[col_i])
        }
        body.push(new_row)
      }

      that.setState({ header, body })
    }
  }

  Print_HTML_InfoDataset() {
    switch (this.dataset_key) {
      case MODEL_UPLOAD:
        return <>
          <p>
            <Trans i18nKey={"datasets-models.0-tabular-classification.upload.html-example.text"} />
            <br />
            <b><Trans i18nKey={"datasets-models.0-tabular-classification.upload.html-example.items"} /></b>
          </p>
        </>
      case MODEL_CAR.KEY:
      case MODEL_IRIS.KEY:
      case MODEL_LYMPHOGRAPHY.KEY:
        return this._model.HTML_EXAMPLE()
      default:
        return <><p>DEFAULT</p></>
    }
  }

  Print_HTML_EXAMPLES() {
    switch (this.dataset_key) {
      case MODEL_UPLOAD:
        return <></>
      case MODEL_CAR.KEY:
      case MODEL_IRIS.KEY:
      case MODEL_LYMPHOGRAPHY.KEY:
        return <>
          <div className="d-flex gap-2">
            {this._model.LIST_EXAMPLES.map((example, index) => {
              return <Button key={"example_" + index}
                             onClick={() => this.setExample(example)}>
                <Trans i18nKey={"example-i"} values={{ i: index + 1 + " - " + this._model.LIST_EXAMPLES_RESULTS[index] }} />
              </Button>
            })}
          </div>
        </>
      default:
        return <><p>DEFAULT</p></>
    }
  }

  Print_HTML_TABLE_DATASET() {
    let head = []
    let body = [[]]
    switch (this.dataset_key) {
      case MODEL_UPLOAD: {
        if (this.files.csv !== null) {
          head = this.state.header
          body = this.state.body
        }
        break
      }
      case MODEL_CAR.KEY:
      case MODEL_IRIS.KEY:
      case MODEL_LYMPHOGRAPHY.KEY:
        head = this._model.TABLE_HEADER
        body = this._model.DATA
        break
      default: {
        console.error("Opción no válida")
        return <></>
      }
    }

    return <>
      <Col xs={12} sm={12} md={12} xl={12} xxl={12}>
        <Card className={"mt-3"}>
          <Card.Header><h3>{this.translate("table.dataset")}</h3></Card.Header>
          <Card.Body className={"overflow-x-scroll"}>

            <N4LTablePagination data_head={head}
                                data_body={body} />
          </Card.Body>
        </Card>
      </Col>
    </>
  }

  handleChange_Parameter(key_parameter, value) {
    if (!isProduction()) console.log({ key_parameter, value })
    this.setState((prevState) => ({
      dataToTest: { ...prevState.dataToTest, [key_parameter]: value },
      textToTest: Object.values({ ...prevState.dataToTest, [key_parameter]: value }).join(";")
    }))
  }

  setExample(example) {
    if (!isProduction()) console.log(example)
    this.setState({
      dataToTest: example,
      textToTest: Object.values(example).join(";")
    })
  }

  render() {
    console.debug("render")
    return (
      <>
        <Container id={"TabularClassificationModelReview"}>
          <Row>
            <Col xs={12} sm={12} md={12} xl={3} xxl={3}>
              <Card className={"sticky-top mt-3 border-info"} style={{ "zIndex": 0 }}>
                <Card.Header>
                  <h3>
                    <Trans i18nKey={"pages.playground.0-tabular-classification.general.model"} />
                  </h3>
                </Card.Header>
                <Card.Body>
                  <Card.Title>
                    <Trans i18nKey={this._model?.TITLE ?? "pages.playground.0-tabular-classification.0_upload.upload"} />
                    {this.state.loading}
                  </Card.Title>

                  {this.dataset_key === MODEL_UPLOAD ? (
                    <>
                      <Card.Subtitle className="mb-3 text-muted">
                        <Trans i18nKey={"pages.playground.0-tabular-classification.0_upload.upload-your-model"} />
                      </Card.Subtitle>
                      <Card.Text>
                        <Trans i18nKey={"pages.playground.0-tabular-classification.0_upload.upload-your-model-description"} />
                      </Card.Text>
                      <Row>
                        <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
                          <DragAndDrop name={"json"}
                                       id={"json-upload"}
                                       accept={{ 'application/json': ['.json'] }}
                                       text={this.translate("drag-and-drop.json")}
                                       labelFiles={this.translate("drag-and-drop.label-files-one")}
                                       function_DropAccepted={this.handleFileUpload_JSON} />
                        </Col>
                        <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
                          <DragAndDrop name={"bin"}
                                       id={"weights-upload"}
                                       accept={{ 'application/octet-stream': ['.bin'] }}
                                       text={this.translate("drag-and-drop.binary")}
                                       labelFiles={this.translate("drag-and-drop.label-files-one")}
                                       function_DropAccepted={this.handleFileUpload_Binary} />
                        </Col>
                        <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
                          <div className="d-grid gap-2">
                            <Button type="button"
                                    onClick={this.handleClick_LoadModel}
                                    size={"lg"}
                                    disabled={this.state.filesUpload}
                                    variant="primary">
                              <Trans i18nKey={""} />
                            </Button>
                          </div>
                        </Col>
                        <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} className={"mt-3"}>
                          <DragAndDrop name={"csv"}
                                       id={"dataset-upload"}
                                       accept={{ 'text/csv': ['.csv'] }}
                                       text={this.translate("drag-and-drop.csv")}
                                       labelFiles={this.translate("drag-and-drop.label-files-one")}
                                       function_DropAccepted={this.handleFileUpload_CSV} />
                        </Col>
                      </Row>
                    </>
                  ) : (
                    <>
                      {this._model.DESCRIPTION()}
                    </>
                    // <> {getHTML_DATASET_DESCRIPTION(0, this.dataset)}</>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={12} md={12} xl={9} xxl={9}>
              <Col xs={12} sm={12} md={12} xl={12} xxl={12}>
                <Card className={"mt-3"}>
                  <Card.Header><h3>{this.translate("pages.playground.0-tabular-classification.general.description-input")}</h3></Card.Header>
                  <Card.Body>
                    {this.Print_HTML_InfoDataset()}
                    {this.Print_HTML_EXAMPLES()}
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={12} sm={12} md={12} xl={12} xxl={12}>
                <Card className={"mt-3"}>
                  <Card.Header>
                    <h3>
                      <Trans i18nKey={"pages.playground.0-tabular-classification.general.description-features"} />
                    </h3>
                  </Card.Header>
                  <Card.Body>
                    <div>
                      {(this.dataset_key === MODEL_CAR.KEY) &&
                        <>
                          <Row className={"mt-3"}>
                            {Object.entries(this._model.DATA_OBJECT).map(([key_parameter, values]) => {
                              return <Col key={key_parameter} xs={6} sm={6} md={4} xl={4} xxl={4}>
                                <Form.Group controlId={key_parameter}>
                                  <Form.Label>{this.translate("pages.playground.form.select-parameter")}</Form.Label>
                                  <Form.Select aria-label="Default select example"
                                               size={"sm"}
                                               value={this.state.dataToTest[key_parameter]}
                                               onChange={($event) => this.handleChange_Parameter(key_parameter, $event.target.value)}>
                                    {values.map((itemAct, indexAct) => {
                                      return (<option key={indexAct} value={itemAct}>{itemAct}</option>)
                                    })}
                                  </Form.Select>
                                  <Form.Text className="text-muted">
                                    {this.translate("pages.playground.form.parameter")}: {key_parameter}
                                  </Form.Text>
                                </Form.Group>
                              </Col>
                            })}
                          </Row>
                        </>
                      }
                      {(this.dataset_key === MODEL_IRIS.KEY) &&
                        <>
                          <Row className={"mt-3"}>
                            {Object.entries(this._model.DATA_OBJECT).map(([key_parameter, value]) => {
                              return <Col key={key_parameter} xs={6} sm={6} md={4} xl={6} xxl={6}>
                                <Form.Group controlId={key_parameter}>
                                  <Form.Label>{this.translate("pages.playground.form.select-parameter")}</Form.Label>
                                  <Form.Control type="number"
                                                min={0}
                                                size={"sm"}
                                                placeholder={"Enter parameter"}
                                                step={0.1}
                                                value={this.state.dataToTest[key_parameter] ?? value}
                                                onChange={($event) => this.handleChange_Parameter(key_parameter, $event.target.value)} />
                                  <Form.Text className="text-muted">
                                    {this.translate("pages.playground.form.parameter")}: {key_parameter}
                                  </Form.Text>
                                </Form.Group>
                              </Col>
                            })}
                          </Row>
                        </>
                      }
                      {(this.dataset_key === MODEL_LYMPHOGRAPHY.KEY) &&
                        <>
                          <Row className={"mt-3"}>
                            {this._model.FORM.map((value, index) => {
                              // VALUES:
                              // {name: "type1", type: "int32" },
                              // {name: "type2", type: "float32" },
                              // {name: "type3", type: "string", options: [{value: "", text: ""] },
                              switch (value.type) {
                                case "int32": {
                                  return <Col key={"form" + index} className={"mb-3"}
                                              xs={6} sm={6} md={4} lg={4} xl={4} xxl={3}>
                                    <Form.Group>
                                      <Form.Label>{this.translate("pages.playground.form.select-parameter")} <b>{value.name}</b></Form.Label>
                                      <Form.Control type="number"
                                                    min={0}
                                                    size={"sm"}
                                                    placeholder={this.translate("pages.playground.form.parameter-integer")}
                                                    step={1}
                                                    value={this.state.dataToTest[value.name] ?? 0}
                                                    onChange={($event) => this.handleChange_Parameter(value.name, $event.target.value)} />
                                      <Form.Text className="text-muted">
                                        {this.translate("pages.playground.form.parameter-integer")}: {value.name}
                                      </Form.Text>
                                    </Form.Group>
                                  </Col>
                                }

                                case "float32": {
                                  return <Col key={"form" + index} className={"mb-3"}
                                              xs={6} sm={6} md={4} lg={4} xl={4} xxl={3}>
                                    <Form.Group controlId={value.name}>
                                      <Form.Label>{this.translate("pages.playground.form.select-parameter")} <b>{value.name}</b></Form.Label>
                                      <Form.Control type="number"
                                                    min={0}
                                                    size={"sm"}
                                                    placeholder={this.translate("pages.playground.form.parameter-decimal")}
                                                    step={0.1}
                                                    value={this.state.dataToTest[value.name] ?? 0.0}
                                                    onChange={($event) => this.handleChange_Parameter(value.name, $event.target.value)} />
                                      <Form.Text className="text-muted">
                                        {this.translate("pages.playground.form.parameter-decimal")}: {value.name}
                                      </Form.Text>
                                    </Form.Group>
                                  </Col>
                                }
                                case "label-encoder": {
                                  return <Col key={"form" + index} className={"mb-3"}
                                              xs={6} sm={6} md={4} lg={4} xl={4} xxl={3}>
                                    <Form.Group controlId={value.name}>
                                      <Form.Label>{this.translate("pages.playground.form.select-parameter")} <b>{value.name}</b></Form.Label>
                                      <Form.Select aria-label={this.translate("pages.playground.form.select-parameter")}
                                                   value={this.state.dataToTest[value.name] ?? 0}
                                                   size={"sm"}
                                                   onChange={($event) => this.handleChange_Parameter(value.name, $event.target.value)}>
                                        {value.options.map((option_value, option_index) => {
                                          return <option key={value.name + "_option_" + option_index}
                                                         value={option_value.value}>
                                            {option_value.text}
                                          </option>
                                        })}
                                      </Form.Select>
                                      <Form.Text className="text-muted">
                                        {this.translate("pages.playground.form.parameter-decimal")}: {value.name}
                                      </Form.Text>
                                    </Form.Group>
                                  </Col>
                                }
                                default:
                                  return <>ksjahfd</>
                              }
                            })}
                          </Row>
                        </>
                      }

                      <Row className={"mt-3"}>
                        <Col>
                          {/* VECTOR TEST */}
                          <Form.Group controlId={'formTestInput'}>
                            <Form.Label>{this.translate("pages.playground.form.vector-to-check")}</Form.Label>
                            <Form.Control placeholder={this.translate("pages.playground.form.vector-to-check")}
                                          autoComplete="off"
                                          disabled={this.dataset_key !== MODEL_UPLOAD}
                                          value={this.state.textToTest}
                                          onChange={this.handleChange_TestInput} />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className={"mt-3"}>
                        <Col>
                          {/* SUBMIT BUTTON */}
                          <div className="d-grid gap-2 mt-3">
                            <Button type="button"
                                    onClick={this.handleClick_TestVector}
                                    disabled={this.state.isButtonDisabled}
                                    size={"lg"}
                                    variant="primary">
                              {(this.state.isButtonDisabled) ?
                                <>
                                  <span className="spinner-border spinner-border-sm"
                                        role="status"
                                        aria-hidden="true"></span>
                                  <span className="visually-hidden">Loading...</span>
                                </>
                                :
                                <>
                                  {this.translate("pages.playground.form.button-check-result")}
                                </>
                              }
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {this.Print_HTML_TABLE_DATASET()}
            </Col>
          </Row>

          {/*<DebugLoadCSV />*/}

        </Container>
      </>
    )
  }
}


export default withTranslation()(TabularClassificationModelReview)
