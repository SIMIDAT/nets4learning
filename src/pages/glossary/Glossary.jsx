import React from "react";
import { Accordion, Col, Container, Row, Table } from "react-bootstrap";
import { Trans, useTranslation } from "react-i18next";

export default function Glossary() {
  const { t } = useTranslation()
  console.log("render")
  return (
    <>
      <main className={"mb-3"} data-title={"Glossary"}>
        <Container>
          <Row className={"mt-2"}>
            <Col xl={12}>
              <h1>Glosario</h1>
            </Col>
            <Col xl={12} className={"mt-3"}>
              <Accordion defaultValue={"classification-tabular"}>
                <Accordion.Item eventKey={"classification-tabular"}>
                  <Accordion.Header><h3>{t("pages.glossary.tabular-classification.title")}</h3></Accordion.Header>
                  <Accordion.Body>
                    <p>{t("pages.glossary.tabular-classification.text-1")}</p>
                    <p>{t("pages.glossary.tabular-classification.text-2")}</p>
                    <p>{t("pages.glossary.tabular-classification.text-3")}</p>
                    <p>{t("pages.glossary.tabular-classification.text-4")}</p>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey={"objects-detection"}>
                  <Accordion.Header><h3>{t("pages.glossary.object-identification.title")}</h3></Accordion.Header>
                  <Accordion.Body>
                    <p>{t("pages.glossary.object-identification.text-1")}</p>
                    <p>{t("pages.glossary.object-identification.text-2")}</p>
                    <p>{t("pages.glossary.object-identification.text-3")}</p>
                    <p>{t("pages.glossary.object-identification.text-4")}</p>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey={"classification-imagen"}>
                  <Accordion.Header><h3>{t("pages.glossary.image-classification.title")}</h3></Accordion.Header>
                  <Accordion.Body>
                    <p>{t("pages.glossary.image-classification.text-1")}</p>
                    <p>{t("pages.glossary.image-classification.text-2")}</p>
                    <p>{t("pages.glossary.image-classification.text-3")}</p>
                    <p>{t("pages.glossary.image-classification.text-4")}</p>
                    <p>{t("pages.glossary.image-classification.text-5")}</p>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
              <hr />
              <Accordion>
                <Accordion.Item eventKey={"functions-activations"}>
                  <Accordion.Header><h3>{t("pages.glossary.activation-functions.title")}</h3></Accordion.Header>
                  <Accordion.Body>
                    <p>{t("pages.glossary.activation-functions.text-1")}</p>
                    <Table striped bordered hover>
                      <thead>
                      <tr>
                        <th>{t("pages.glossary.table-head.name")}</th>
                        <th>{t("pages.glossary.table-head.description")}</th>
                        <th>{t("pages.glossary.table-head.characteristics")}</th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr>
                        <th>Softmax</th>
                        <td><Trans i18nKey={"pages.glossary.activation-functions.table.softmax.description"} /></td>
                        <td>
                          <ol>
                            <li>{t("pages.glossary.activation-functions.table.softmax.characteristics.0")}</li>
                            <li>{t("pages.glossary.activation-functions.table.softmax.characteristics.1")}</li>
                            <li>{t("pages.glossary.activation-functions.table.softmax.characteristics.2")}</li>
                          </ol>
                        </td>
                      </tr>
                      <tr>
                        <th>Sigmoid</th>
                        <td><Trans i18nKey={"pages.glossary.activation-functions.table.sigmoid.description"} /></td>
                        <td>
                          <ol>
                            <li>{t("pages.glossary.activation-functions.table.sigmoid.characteristics.0")}</li>
                            <li>{t("pages.glossary.activation-functions.table.sigmoid.characteristics.1")}</li>
                            <li>{t("pages.glossary.activation-functions.table.sigmoid.characteristics.2")}</li>
                          </ol>
                        </td>
                      </tr>
                      <tr>
                        <th>ReLU</th>
                        <td><Trans i18nKey={"pages.glossary.activation-functions.table.relu.description"} /></td>
                        <td>
                          <ol>
                            <li>{t("pages.glossary.activation-functions.table.relu.characteristics.0")}</li>
                            <li>{t("pages.glossary.activation-functions.table.relu.characteristics.1")}</li>
                          </ol>
                        </td>
                      </tr>
                      </tbody>
                    </Table>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey={"functions-optimizers"}>
                  <Accordion.Header><h3>{t("pages.glossary.optimization-functions.title")}</h3></Accordion.Header>
                  <Accordion.Body>
                    <p>{t("pages.glossary.optimization-functions.text-1")}</p>
                    <p>{t("pages.glossary.optimization-functions.text-2")}</p>
                    <Table striped bordered hover>
                      <thead>
                      <tr>
                        <th>{t("pages.glossary.table-head.function")}</th>
                        <th>{t("pages.glossary.table-head.references")}</th>
                        <th>{t("pages.glossary.table-head.description")}</th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr>
                        <th>SGD</th>
                        <td><Trans i18nKey={"pages.glossary.optimization-functions.table.sgd.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.optimization-functions.table.sgd.description"} /></td>
                      </tr>
                      <tr>
                        <th>Momentum</th>
                        <td></td>
                        <td><Trans i18nKey={"pages.glossary.optimization-functions.table.momentum.description"} /></td>
                      </tr>
                      <tr>
                        <th>AdaGrad</th>
                        <td><Trans i18nKey={"pages.glossary.optimization-functions.table.adagrad.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.optimization-functions.table.adagrad.description"} /></td>
                      </tr>
                      <tr>
                        <th>Adadelta</th>
                        <td><Trans i18nKey={"pages.glossary.optimization-functions.table.adadelta.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.optimization-functions.table.adadelta.description"} /></td>
                      </tr>
                      <tr>
                        <th>RMSProp</th>
                        <td><Trans i18nKey={"pages.glossary.optimization-functions.table.rmsprop.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.optimization-functions.table.rmsprop.description"} /></td>
                      </tr>
                      <tr>
                        <th>Adam</th>
                        <td><Trans i18nKey={"pages.glossary.optimization-functions.table.adam.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.optimization-functions.table.adam.description"} /></td>
                      </tr>
                      </tbody>
                    </Table>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey={"functions-losses"}>
                  <Accordion.Header><h3>{t("pages.glossary.loss-functions.title")}</h3></Accordion.Header>
                  <Accordion.Body>
                    <p>{t("pages.glossary.loss-functions.text-1")}</p>
                    <p>{t("pages.glossary.loss-functions.text-2")}</p>
                    <p>{t("pages.glossary.loss-functions.text-3")}</p>
                    <p>{t("pages.glossary.loss-functions.text-4")}</p>
                    <Table striped bordered hover>
                      <thead>
                      <tr>
                        <th>{t("pages.glossary.table-head.function")}</th>
                        <th>{t("pages.glossary.table-head.references")}</th>
                        <th>{t("pages.glossary.table-head.description")}</th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr>
                        <th>AbsoluteDifference</th>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.AbsoluteDifference.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.AbsoluteDifference.description"} /></td>
                      </tr>
                      <tr>
                        <th>ComputeWeightedLoss</th>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.ComputeWeightedLoss.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.ComputeWeightedLoss.description"} /></td>
                      </tr>
                      <tr>
                        <th>CosineDistance</th>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.CosineDistance.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.CosineDistance.description"} /></td>
                      </tr>
                      <tr>
                        <th>HingeLoss</th>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.HingeLoss.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.HingeLoss.description"} /></td>
                      </tr>
                      <tr>
                        <th>HuberLoss</th>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.HuberLoss.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.HuberLoss.description"} /></td>
                      </tr>
                      <tr>
                        <th>LogLoss</th>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.LogLoss.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.LogLoss.description"} /></td>
                      </tr>
                      <tr>
                        <th>MeanSquaredError</th>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.MeanSquaredError.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.MeanSquaredError.description"} /></td>
                      </tr>
                      <tr>
                        <th>CategoricalCrossEntropy</th>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.CategoricalCrossEntropy.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.CategoricalCrossEntropy.description"} /></td>
                      </tr>
                      <tr>
                        <th>SigmoidCrossEntropy</th>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.SigmoidCrossEntropy.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.SigmoidCrossEntropy.description"} /></td>
                      </tr>
                      <tr>
                        <th>SoftmaxCrossEntropy</th>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.SoftmaxCrossEntropy.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.loss-functions.table.SoftmaxCrossEntropy.description"} /></td>
                      </tr>
                      </tbody>
                    </Table>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey={"functions-metrics"}>
                  <Accordion.Header><h3>{t("pages.glossary.metric-functions.title")}</h3></Accordion.Header>
                  <Accordion.Body>
                    <p>{t("pages.glossary.metric-functions.text-1")}</p>
                    <p>{t("pages.glossary.metric-functions.text-2")}</p>
                    <p>{t("pages.glossary.metric-functions.text-3")}</p>
                    <Table striped bordered hover>
                      <thead>
                      <tr>
                        <th>{t("pages.glossary.table-head.function")}</th>
                        <th>{t("pages.glossary.table-head.references")}</th>
                        <th>{t("pages.glossary.table-head.description")}</th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr>
                        <th>BinaryAccuracy</th>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.BinaryAccuracy.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.BinaryAccuracy.description"} /></td>
                      </tr>
                      <tr>
                        <th>BinaryCrossentropy</th>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.BinaryCrossentropy.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.BinaryCrossentropy.description"} /></td>
                      </tr>
                      <tr>
                        <th>CategoricalAccuracy</th>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.CategoricalAccuracy.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.CategoricalAccuracy.description"} /></td>
                      </tr>
                      <tr>
                        <th>CategoricalCrossentropy</th>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.CategoricalCrossentropy.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.CategoricalCrossentropy.description"} /></td>
                      </tr>
                      <tr>
                        <th>CosineProximity</th>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.CosineProximity.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.CosineProximity.description"} /></td>
                      </tr>
                      <tr>
                        <th>MeanAbsoluteError</th>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.MeanAbsoluteError.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.MeanAbsoluteError.description"} /></td>
                      </tr>
                      <tr>
                        <th>MeanAbsolutePercentageError</th>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.MeanAbsolutePercentageError.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.MeanAbsolutePercentageError.description"} /></td>
                      </tr>
                      <tr>
                        <th>MeanSquaredError</th>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.MeanSquaredError.references"} /></td>
                        <td><Trans i18nKey={"pages.glossary.metric-functions.table.MeanSquaredError.description"} /></td>
                      </tr>
                      </tbody>
                    </Table>
                  </Accordion.Body>
                </Accordion.Item>

                {/*TODO*/}
                <Accordion.Item eventKey={"layers"} style={{ display: 'none' }}>
                  <Accordion.Header><h3>Tipos de capas</h3></Accordion.Header>
                  <Accordion.Body>
                    <Table striped bordered hover>
                      <thead>
                      <tr>
                        <th>{t("pages.glossary.table-head.name")}</th>
                        <th>{t("pages.glossary.table-head.description")}</th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr>
                        <th>Dense</th>
                        <td>Esta función se utiliza para crear capas completamente conectadas, en las que cada salida depende de cada entrada.</td>
                      </tr>
                      <tr>
                        <th>Convolutional</th>
                        <td>Existen tres tipos de capas Convolutional, 1d, 2d y 3d. Estas capas nos permiten crear un núcleo de convolución que se transforma con los datos de entrada sobre el número de dimensiones elegido según la capa.
                        </td>
                      </tr>
                      <tr>
                        <th>Merge</th>
                        <td>Se trata de un conjunto de funciones que definen diferentes operaciones como añadir o concatenar tensores a una capa.</td>
                      </tr>
                      <tr>
                        <th>Normalization</th>
                        <td>Nos permite normalizar la activación de la capa anterior es decir mantiene la activación media cerca de 0 y la desviación estándar de activación cerca de 1.</td>
                      </tr>
                      </tbody>
                    </Table>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey={"normalization"} style={{ display: 'none' }}>
                  <Accordion.Header><h3>Normalización</h3></Accordion.Header>
                  <Accordion.Body>
                    <p>La normalización de datos es un paso importante en el procesamiento de datos para redes neuronales. La normalización se refiere a la transformación de los datos de entrada para que tengan una escala común.</p>
                    <p>La normalización de datos se utiliza en redes neuronales por varias razones:</p>
                    <ol>
                      <li><b>Mejora la estabilidad numérica</b>: Al normalizar los datos, los valores de entrada se escalan a un rango más pequeño y manejable, lo que ayuda a evitar problemas numéricos como la explosión del gradiente.</li>
                      <li><b>Mejora la velocidad de entrenamiento</b>: La normalización de datos puede ayudar a que los algoritmos de aprendizaje automático converjan más rápido, ya que los valores de entrada se encuentran en un rango más
                        pequeño y uniforme, lo que permite que el optimizador pueda ajustar los pesos más fácilmente.
                      </li>
                      <li><b>Mejora la precisión del modelo</b>: La normalización de datos puede ayudar a mejorar la precisión del modelo. En algunos casos, la normalización de datos puede ayudar a reducir la cantidad de ruido en los datos
                        y puede hacer que los patrones en los datos sean más visibles.
                      </li>
                      <li><b>Mejora la generalización del model</b>: La normalización de datos puede ayudar a reducir la varianza y mejorar la generalización del modelo. Al normalizar los datos, se puede hacer que el modelo sea más
                        resistente a la presencia de valores atípicos y variaciones en los datos.
                      </li>
                    </ol>
                    <p>En resumen, normalizar los datos es una buena práctica en el procesamiento de datos para redes neuronales, ya que puede mejorar la estabilidad numérica, la velocidad de entrenamiento, la precisión del modelo y
                      la generalización del modelo.</p>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  )
}