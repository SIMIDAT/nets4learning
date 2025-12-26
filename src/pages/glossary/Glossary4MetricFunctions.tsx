import { Accordion, Col, Row, Table } from "react-bootstrap"
import { Trans, useTranslation } from "react-i18next"
import N4LLatex from "@components/latex/N4LLatex"


export default function Glossary4MetricFunctions() {
  const { t } = useTranslation()

  return (
    <>
      <Accordion defaultValue={""} defaultActiveKey={""}>
        <Accordion.Item eventKey={"functions-metrics"}>
          <Accordion.Header>
            <h2>{t("pages.glossary.metric-functions.title")}</h2>
          </Accordion.Header>
          <Accordion.Body>
            <Row>
              <Col>
                <p>
                  <Trans i18nKey={"pages.glossary.metric-functions.text-1"} />
                </p>
                <p>
                  <Trans i18nKey={"pages.glossary.metric-functions.text-2"} />
                </p>
                <p>
                  <Trans i18nKey={"pages.glossary.metric-functions.text-3"} />
                </p>
                <p>
                  <Trans i18nKey={"pages.glossary.metric-functions.text-4"} />
                </p>
              </Col>
            </Row>
            <Row>
              <Col>
                <Trans i18nKey={"references"} />
                <ol>
                  <li>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      className="link-info"
                      href="https://js.tensorflow.org/api/3.14.0/#Metrics"
                    >
                      TensorFlow JS. Metrics
                    </a>
                  </li>
                </ol>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>
        {import.meta.env.VITE_SHOW_NEW_FEATURE === "true" && (
          <Accordion.Item eventKey={"equation-metric"}>
            <Accordion.Header>
              <h2>{t("equations.title-metrics")}</h2>
            </Accordion.Header>
            <Accordion.Body>
              <Row xs={1} sm={1} md={2} lg={2} xl={2} xxl={2}>
                <Col>
                  {/**/}
                  <h4 className={"text-lg-center"}>{t("equations.metric-functions.acc-prec-recall-f1.title")}</h4>
                  <hr />
                  <N4LLatex>{"$$ Accuracy = \\frac{TP+TN}{TP+TN+FP+FN} $$"}</N4LLatex>
                  <N4LLatex>{"$$ Precision = \\frac{TP}{TP+FP} $$"}</N4LLatex>
                  <N4LLatex>{"$$ Recall = \\frac{TP}{TP+FN} $$"}</N4LLatex>
                  <N4LLatex>{"$$ F1 = \\frac{2*Precision*Recall}{Precision+Recall} = \\frac{2*TP}{2*TP+FP+FN} $$"}</N4LLatex>
                </Col>
                <Col>
                  <h4 className={"text-lg-center"}>{t("equations.metric-functions.sen-spe-auc.title")}</h4>
                  <hr />
                  <N4LLatex>{"$$ Sensitivity = Recall = \\frac{TP}{TP+FN} $$"}</N4LLatex>
                  <N4LLatex>{"$$ Specificity = \\frac{TN}{FP+TN}\n $$"}</N4LLatex>
                  <N4LLatex>{t("equations.metric-functions.sen-spe-auc.text-1")}</N4LLatex>
                </Col>
              </Row>
              <hr />
              <Row>
                <Col>
                  <Table>
                    <thead>
                      <tr>
                        <th>Alias</th>
                        <th>Ingles</th>
                        <th>Español</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <N4LLatex>{"$ TP $"}</N4LLatex>
                        </td>
                        <td>True Positive</td>
                        <td>Positivos Verdaderos</td>
                      </tr>
                      <tr>
                        <td>
                          <N4LLatex>{"$ TN $"}</N4LLatex>
                        </td>
                        <td>True Negative</td>
                        <td>Negativos Verdaderos</td>
                      </tr>
                      <tr>
                        <td>
                          <N4LLatex>{"$ FP $"}</N4LLatex>
                        </td>
                        <td>False Positive</td>
                        <td>Positivos Falsos</td>
                      </tr>
                      <tr>
                        <td>
                          <N4LLatex>{"$ FN $"}</N4LLatex>
                        </td>
                        <td>False Negative</td>
                        <td>Negativos Falsos</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Trans i18nKey={"references"} />
                  <ol>
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="link-info"
                        href="https://www.iartificial.net/precision-recall-f1-accuracy-en-clasificacion/"
                      >
                        Precision, Recall, F1, Accuracy en clasificación
                      </a>
                    </li>
                  </ol>
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>
        )}
      </Accordion>
    </>
  )
}
