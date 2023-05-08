import React, { useEffect, useRef } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { Trans, useTranslation } from "react-i18next";
import { Bar } from "react-chartjs-2";
import { MODEL_UPLOAD } from "../../../DATA_MODEL";

const backgroundColorDefault = [
  "rgba(255, 99, 132, 0.4)",
  "rgba(255, 159, 64, 0.4)",
  "rgba(255, 205, 86, 0.4)",
  "rgba(75, 192, 192, 0.4)",
  "rgba(54, 162, 235, 0.4)",
  "rgba(153, 102, 255, 0.4)",
  "rgba(175, 175, 175, 0.4)",
];
const borderColorDefault = [
  "rgb(255, 99, 132)",
  "rgb(255, 159, 64)",
  "rgb(255, 205, 86)",
  "rgb(75, 192, 192)",
  "rgb(54, 162, 235)",
  "rgb(153, 102, 255)",
  "rgb(175, 175, 175)",
];

/**
 *
 * @param props
 * @return {JSX.Element}
 * @constructor
 */
export default function TabularClassificationPredictionDynamicForm(props) {
  const {
    dataset_JSON,
    dataset_key,
    stringToPredict = "",
    setStringToPredict,
    // objectToPredict = {},
    setObjectToPredict,
    predictionBar,
    // list_encoded_classes = [],

    handleClick_PredictVector,
  } = props;

  const { t } = useTranslation();
  const prefix = "pages.playground.0-tabular-classification.generator.dynamic-form-dataset.";
  const ref_bar = useRef(0);
  const bar_options = {
    responsive: true,
    plugins   : {
      legend: {
        position: "top",
      },
      title : {
        display: true,
        text   : t("prediction"),
      },
    },
  };

  useEffect(() => {
    const rowDefault = dataset_JSON.data[0];
    const defaultString = rowDefault.slice(0, -1).join(";");
    setStringToPredict(defaultString);

    dataset_JSON.attributes.forEach((att) => {
      setObjectToPredict(oldState => ({
        ...oldState,
        [att.name]: rowDefault[att.index_column],
      }));
    });
  }, [dataset_JSON, setStringToPredict, setObjectToPredict]);

  const handleChange_Float = (e, column_name, index_column) => {
    const text_split = stringToPredict.split(";");
    text_split[index_column] = parseFloat(e.target.value);
    setStringToPredict(text_split.join(";"));
    setObjectToPredict(oldState => ({
      ...oldState,
      [column_name]: parseFloat(e.target.value),
    }));

    console.log(text_split.join(";"), parseFloat(e.target.value));
  };

  const handleChange_Number = (e, column_name, index_column) => {
    const text_split = stringToPredict.split(";");
    text_split[index_column] = parseInt(e.target.value);
    setStringToPredict(text_split.join(";"));
    setObjectToPredict(oldState => ({
      ...oldState,
      [column_name]: parseInt(e.target.value),
    }));

    console.log(text_split.join(";"), parseInt(e.target.value));
  };

  const handleChange_Select = (e, column_name, index_column) => {
    const text_split = stringToPredict.split(";");
    text_split[index_column] = (e.target.value);
    setStringToPredict(text_split.join(";"));
    setObjectToPredict(oldState => ({
      ...oldState,
      [column_name]: parseInt(e.target.value),
    }));

    console.log(text_split.join(";"), e.target.value);
  };

  const handleChange_ROW = (e) => {
    let row_index = parseInt(e.target.value);
    setStringToPredict(dataset_JSON.data[row_index].slice(0, -1).join(";"));

    dataset_JSON.attributes.forEach((att) => {
      setObjectToPredict(oldState => ({
        ...oldState,
        [att.name]: dataset_JSON.data[row_index][att?.index_column],
      }));

      document.getElementById("FormControl_" + att.index_column).value =
        dataset_JSON.data[row_index][att?.index_column];
    });
  };

  console.debug("Render TabularClassificationDynamicFormPrediction");
  return <>
    <Form onSubmit={(event) => event.preventDefault()}>
      <Container>
        <Row className={"mt-3"}>
          <Col xl={12}>
            <Card>
              <Card.Header className={"d-flex align-items-center"}>
                <h3><Trans i18nKey={prefix + "title"} /></h3>
                <div className={"ms-3"}>
                  <Form.Group controlId={"DATA"}>
                    {/*<Form.Label>Carga una fila del dataset</Form.Label>*/}
                    <Form.Select aria-label={t(prefix + "title")}
                                 size={"sm"}
                                 onChange={(e) => handleChange_ROW(e)}>
                      {dataset_JSON.data.map((row, index) => {
                        return <option key={"option_" + index} value={index}>Id row: {index.toString().padStart(3, "0")} - Target: {row.slice(-1)}</option>;
                      })}
                    </Form.Select>
                  </Form.Group>
                </div>
              </Card.Header>
              <Card.Body>
                <Card.Text>
                  <Trans i18nKey={prefix + "text-0"} />
                  <br />
                  <b>({dataset_JSON.attributes.map(att => att.name).join(", ")}).</b>
                </Card.Text>


                <Row>
                  {dataset_JSON.attributes.map((attribute, index) => {
                    // VALUES:
                    // { name: "type1", type: "int32" },
                    // { name: "type2", type: "float32"  },
                    // { name: "type3", type: "string", options: [{value: "", text: ""] },

                    const column_index = attribute.index_column;
                    const column_type = attribute.type;
                    const column_name = attribute.name;
                    const column_options = attribute.options;

                    switch (column_type) {
                      case "int32": {
                        return <Col key={"form" + index} className={"mb-3"}
                                    xs={6} sm={6} md={4} lg={4} xl={4} xxl={3}>
                          <Form.Group controlId={"FormControl_" + column_index}>
                            <Form.Label><b>{column_name}</b></Form.Label>
                            <Form.Control type="number"
                                          size={"sm"}
                                          placeholder={"int32"}
                                          min={0}
                                          step={1}
                                          defaultValue={parseInt(dataset_JSON.data[0][column_index])}
                                          onChange={(e) => handleChange_Number(e, column_name, column_index)} />
                            <Form.Text className="text-muted">{column_name} | {column_type}</Form.Text>
                          </Form.Group>
                        </Col>;
                      }
                      case "float32": {
                        return <Col key={"form" + index} className={"mb-3"}
                                    xs={6} sm={6} md={4} lg={4} xl={4} xxl={3}>
                          <Form.Group controlId={"FormControl_" + column_index}>
                            <Form.Label><b>{column_name}</b></Form.Label>
                            <Form.Control type="number"
                                          size={"sm"}
                                          placeholder={"float32"}
                                          min={0}
                                          step={0.1}
                                          defaultValue={parseFloat(dataset_JSON.data[0][column_index])}
                                          onChange={(e) => handleChange_Float(e, column_name, column_index)} />
                            <Form.Text className="text-muted">{column_name} | {column_type}</Form.Text>
                          </Form.Group>
                        </Col>;
                      }
                      case "string": {
                        return <Col key={"form" + index} className={"mb-3"}
                                    xs={6} sm={6} md={4} lg={4} xl={4} xxl={3}>
                          <p className={"text-center"}>Texto</p>
                        </Col>;
                      }
                      case "label-encoder": {
                        return <Col key={"form" + index} className={"mb-3"}
                                    xs={6} sm={6} md={4} lg={4} xl={4} xxl={3}>
                          <Form.Group controlId={"FormControl_" + column_index}>
                            <Form.Label><b>{column_name}</b></Form.Label>
                            <Form.Select aria-label="select"
                                         size={"sm"}
                                         defaultValue={dataset_JSON.data[0][column_index]}
                                         onChange={(e) => handleChange_Select(e, column_name, column_index)}>
                              {column_options.map((option_value, option_index) => {
                                return <option key={column_name + "_option_" + option_index}
                                               value={option_value.value}>
                                  {option_value.text}
                                </option>;
                              })}
                            </Form.Select>
                            <Form.Text className="text-muted">{column_name} | {column_type}</Form.Text>
                          </Form.Group>
                        </Col>;
                      }
                      case "one-hot-encoder": {
                        return <Col key={"form" + index} className={"mb-3"}
                                    xs={6} sm={6} md={4} lg={4} xl={4} xxl={3}>
                          <p className={"text-center"}>OneHotEncoder</p>
                        </Col>;
                      }
                      default:
                        console.error("Error, option not valid");
                        return <></>;
                    }
                  })}
                </Row>

                <Form.Group className="mb-3" controlId={"formTestInput"}>
                  <Form.Label><Trans i18nKey={prefix + "test-vector"} /></Form.Label>
                  <Form.Control placeholder={t(prefix + "input-vector")}
                                disabled={true}
                                value={stringToPredict}
                                onChange={(e) => setStringToPredict(e.target.value)} />
                </Form.Group>

                {/* SUBMIT BUTTON */}
                <div className="d-grid gap-2">
                  <Button onClick={handleClick_PredictVector}
                          size={"lg"}
                          variant="primary">
                    {t("predict")}
                  </Button>
                </div>
                {
                  dataset_key === MODEL_UPLOAD &&
                  <>
                    <hr />
                    <Row>
                      <Col>
                        <ul start="0">
                          {
                            predictionBar
                              .list_encoded_classes
                              .map((item, index) => <li key={index}>{item}</li>)
                          }
                        </ul>
                        <Bar ref={ref_bar}
                             options={bar_options}
                             data={{
                               labels  : [...predictionBar.labels],
                               datasets: [
                                 {
                                   label          : t("prediction"),
                                   data           : [...predictionBar.data],
                                   backgroundColor: backgroundColorDefault,
                                   borderColor    : borderColorDefault,
                                   borderWidth    : 1,
                                 },
                               ],
                             }} />
                      </Col>
                    </Row>
                  </>
                }
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Form>
  </>;
}