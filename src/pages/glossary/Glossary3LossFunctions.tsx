import N4LLatex from "@components/latex/N4LLatex"
import { Accordion, Col, Row, Table } from "react-bootstrap"
import { Trans, useTranslation } from "react-i18next"

export default function Glossary3LossFunctions() {
  const { t } = useTranslation()

  return (
    <>
      <Accordion defaultValue={""} defaultActiveKey={""}>
        <Accordion.Item eventKey={"functions-losses"}>
          <Accordion.Header>
            <h2>
              <Trans i18nKey={"pages.glossary.loss-functions.title"} />
            </h2>
          </Accordion.Header>
          <Accordion.Body>
            <p>
              <Trans i18nKey={"pages.glossary.loss-functions.text.0"} />
            </p>
            <p>
              <Trans i18nKey={"pages.glossary.loss-functions.text.1"} />
            </p>
            <p>
              <Trans i18nKey={"pages.glossary.loss-functions.text.2"} />
            </p>
            <Table striped bordered hover responsive={true}>
              <thead>
                <tr>
                  <th>{t("pages.glossary.table-head.function")}</th>
                  <th>{t("pages.glossary.table-head.description")}</th>
                  {/*<th>{t("pages.glossary.table-head.references")}</th>*/}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>AbsoluteDifference</th>
                  <td>
                    <Trans i18nKey={"pages.glossary.loss-functions.table.AbsoluteDifference.description"} />
                  </td>
                  {/*<td><Trans i18nKey={"pages.glossary.loss-functions.table.AbsoluteDifference.references"} /></td>*/}
                </tr>
                <tr>
                  <th>ComputeWeightedLoss</th>
                  <td>
                    <Trans i18nKey={"pages.glossary.loss-functions.table.ComputeWeightedLoss.description"} />
                  </td>
                  {/*<td><Trans i18nKey={"pages.glossary.loss-functions.table.ComputeWeightedLoss.references"} /></td>*/}
                </tr>
                <tr>
                  <th>CosineDistance</th>
                  <td>
                    <Trans i18nKey={"pages.glossary.loss-functions.table.CosineDistance.description"} />
                  </td>
                  {/*<td><Trans i18nKey={"pages.glossary.loss-functions.table.CosineDistance.references"} /></td>*/}
                </tr>
                <tr>
                  <th>HingeLoss</th>
                  <td>
                    <Trans i18nKey={"pages.glossary.loss-functions.table.HingeLoss.description"} />
                  </td>
                  {/*<td><Trans i18nKey={"pages.glossary.loss-functions.table.HingeLoss.references"} /></td>*/}
                </tr>
                <tr>
                  <th>HuberLoss</th>
                  <td>
                    <Trans i18nKey={"pages.glossary.loss-functions.table.HuberLoss.description"} />
                  </td>
                  {/*<td><Trans i18nKey={"pages.glossary.loss-functions.table.HuberLoss.references"} /></td>*/}
                </tr>
                <tr>
                  <th>LogLoss</th>
                  <td>
                    <Trans i18nKey={"pages.glossary.loss-functions.table.LogLoss.description"} />
                  </td>
                  {/*<td><Trans i18nKey={"pages.glossary.loss-functions.table.LogLoss.references"} /></td>*/}
                </tr>
                <tr>
                  <th>MeanSquaredError</th>
                  <td>
                    <Trans i18nKey={"pages.glossary.loss-functions.table.MeanSquaredError.description"} />
                  </td>
                  {/*<td><Trans i18nKey={"pages.glossary.loss-functions.table.MeanSquaredError.references"} /></td>*/}
                </tr>
                <tr>
                  <th>CategoricalCrossEntropy</th>
                  <td>
                    <Trans i18nKey={"pages.glossary.loss-functions.table.CategoricalCrossEntropy.description"} />
                  </td>
                  {/*<td><Trans i18nKey={"pages.glossary.loss-functions.table.CategoricalCrossEntropy.references"} /></td>*/}
                </tr>
                <tr>
                  <th>SigmoidCrossEntropy</th>
                  <td>
                    <Trans i18nKey={"pages.glossary.loss-functions.table.SigmoidCrossEntropy.description"} />
                  </td>
                  {/*<td><Trans i18nKey={"pages.glossary.loss-functions.table.SigmoidCrossEntropy.references"} /></td>*/}
                </tr>
                <tr>
                  <th>SoftmaxCrossEntropy</th>
                  <td>
                    <Trans i18nKey={"pages.glossary.loss-functions.table.SoftmaxCrossEntropy.description"} />
                  </td>
                  {/*<td><Trans i18nKey={"pages.glossary.loss-functions.table.SoftmaxCrossEntropy.references"} /></td>*/}
                </tr>
              </tbody>
            </Table>

            <Trans i18nKey={"references"} />
            <ol>
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="link-secondary"
                  href="https://js.tensorflow.org/api/3.14.0/#Training-Losses"
                >
                  TensorFlow JS. Training / Losses
                </a>
              </li>
            </ol>
          </Accordion.Body>
        </Accordion.Item>
        {import.meta.env.VITE_SHOW_NEW_FEATURE === "true" && (
          <Accordion.Item eventKey={"equations-losses"}>
            <Accordion.Header>
              <h2>{t("equations.title-losses")}</h2>
            </Accordion.Header>
            <Accordion.Body>
              <Row xs={1} sm={1} md={2} lg={2} xl={2} xxl={2}>
                <Col className={"mt-3"}>
                  <h4 className={"text-lg-center"}>{t("equations.loss-functions.cross-entropy.title")}</h4>
                  <N4LLatex>{t("equations.loss-functions.cross-entropy.text-1")}</N4LLatex>
                  <br />
                  <N4LLatex>{"$$ -{(y\\log(p) + (1 - y)\\log(1 - p))} $$"}</N4LLatex>
                  <N4LLatex>{t("equations.loss-functions.cross-entropy.text-2")}</N4LLatex>
                  <N4LLatex>{"$$ -\\sum_{c=1}^My_{o,c}\\log(p_{o,c}) $$"}</N4LLatex>
                  <p style={{ fontSize: "0.75em" }}>
                    <N4LLatex>{t("equations.loss-functions.cross-entropy.text-3")}</N4LLatex>
                  </p>
                </Col>

                <Col className={"mt-3"}>
                  <h4 className={"text-lg-center"}>{t("equations.loss-functions.negative-log.title")}</h4>
                  <N4LLatex>{"$$ NLL(y) = -{\\log(p(y))} $$"}</N4LLatex>
                  <p>{t("equations.loss-functions.negative-log.text-1")}</p>
                  <N4LLatex>{"$$ \\min_{\\theta} \\sum_y {-\\log(p(y;\\theta))} $$"}</N4LLatex>
                  <p>{t("equations.loss-functions.negative-log.text-2")}</p>
                  <N4LLatex>{"$$ \\max_{\\theta} \\prod_y p(y;\\theta) $$"}</N4LLatex>
                </Col>

                <Col className={"mt-3"}>
                  <h4 className={"text-lg-center"}>{t("equations.loss-functions.kj-divergence.title")}</h4>
                  <N4LLatex>
                    {"$$ KL(\\hat{y} || y) = \\sum_{c=1}^{M}\\hat{y}_c \\log{\\frac{\\hat{y}_c}{y_c}} $$"}
                  </N4LLatex>
                  <N4LLatex>
                    {
                      "$$ JS(\\hat{y} || y) = \\frac{1}{2}(KL(y||\\frac{y+\\hat{y}}{2}) + KL(\\hat{y}||\\frac{y+\\hat{y}}{2})) $$"
                    }
                  </N4LLatex>
                </Col>

                <Col className={"mt-3"}>
                  <h4 className={"text-lg-center"}>{t("equations.loss-functions.cosine-distance.title")}</h4>
                  <N4LLatex>
                    {
                      "$$ S_{C}(A,B):=\\cos(\\theta )={\\mathbf {A} \\cdot \\mathbf {B}  \\over \\|\\mathbf {A} \\|\\|\\mathbf {B} \\|}={\\frac {\\sum \\limits _{i=1}^{n}{A_{i}B_{i}}}{{\\sqrt {\\sum \\limits _{i=1}^{n}{A_{i}^{2}}}}{\\sqrt {\\sum \\limits _{i=1}^{n}{B_{i}^{2}}}}}} $$"
                    }
                  </N4LLatex>
                </Col>

                <Col className={"mt-3"}>
                  <h4 className={"text-lg-center"}>{t("equations.loss-functions.mae.title")}</h4>
                  <N4LLatex>{"$$ MAE = \\frac{1}{m}\\sum^{m}_{i=1}|h(x^{(i)})-y^{(i)}| $$"}</N4LLatex>
                </Col>
                <Col className={"mt-3"}>
                  <h4 className={"text-lg-center"}>{t("equations.loss-functions.mse.title")}</h4>
                  <N4LLatex>{"$$ MSE = \\frac{1}{m}\\sum^{m}_{i=1}(y^{(i)} - \\hat{y}^{(i)})^2\n $$"}</N4LLatex>
                </Col>
                <Col className={"mt-3"}>
                  <h4 className={"text-lg-center"}>{t("equations.loss-functions.rmse.title")}</h4>
                  <N4LLatex>{"$$ RMSE = \\sqrt{\\frac{1}{m}\\sum^{m}_{i=1}(h(x^{(i)})-y^{(i)})^2} $$"}</N4LLatex>
                </Col>
                <Col className={"mt-3"}>
                  <h4 className={"text-lg-center"}>{t("equations.loss-functions.huber-loss.title")}</h4>
                  <N4LLatex>{t("equations.loss-functions.huber-loss.text-1")}</N4LLatex>
                  <br />
                  <N4LLatex>
                    {`$$ 
                      L_{\\delta}=
                        \\left\\{\\begin{matrix}
                            \\frac{1}{2}(y - \\hat{y})^{2} & if \\left | (y - \\hat{y})  \\right | < \\delta\\\\
                            \\delta ((y - \\hat{y}) - \\frac1 2 \\delta) & otherwise
                        \\end{matrix}\\right. 
                    $$`}
                  </N4LLatex>
                </Col>
                <Col className={"mt-3"}>
                  <h4 className={"text-lg-center"}>{t("equations.loss-functions.hinge-loss.title")}</h4>
                  <N4LLatex>{"$$ l(y) = max(0, 1 - t \\cdot y) $$"}</N4LLatex>
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>
        )}
      </Accordion>
    </>
  )
}
