import React from "react";
import * as tf from "@tensorflow/tfjs";
import * as tfVis from "@tensorflow/tfjs-vis";
import { Button, Card, Col, Row } from "react-bootstrap";
import { MODEL_CAR } from "../../../DATA_MODEL";

export default function DebugLoadCSV() {
  const _isDebug = process.env.REACT_APP_ENVIRONMENT !== "production"


  const handleClick_Layers = async () => {

  }

  const handleClick_Compile = async () => {

  }

  const handleClick_Fit = async () => {

  }

  const handleClick_debug_ALL = async () => {
    const __model = tf.sequential()
    __model.add(tf.layers.dense({ name: 'layer1', activation: 'relu', units: 10, inputShape: [12] }))
    __model.add(tf.layers.dense({ name: 'layer2', activation: 'relu', units: 10 }))
    __model.add(tf.layers.dense({ name: 'layer3', activation: 'relu', units: 10 }))
    __model.add(tf.layers.dense({ name: 'layer4', activation: 'relu', units: 10 }))
    __model.add(tf.layers.dense({ name: 'layer5', activation: 'relu', units: 10 }))
    __model.add(tf.layers.dense({ name: 'layer6', activation: 'softmax', units: 5 }))

    const surface = { name: 'Model Summary', tab: 'Model Inspection' };
    await tfVis.show.modelSummary(surface, __model);

    for (let i = 1; i < 6; i++) {
      const surface1 = { name: 'Layer Summary' + i, tab: 'Layer' + i };
      await tfVis.show.layer(surface1, __model.getLayer('layer' + 1));
    }

    const dataset = [
      [13, 12, 1, 2, 1, 1, 3, 4],
      [13, 12, 1, 2, 1, 1, 3, 3],
      [13, 10, 1, 2, 1, 1, 3, 2],
      [13, 8, 1, 2, 1, 1, 3, 1],
    ] // tus datos de entrenamiento en una matriz

    const numFeatures = dataset[0].length - 1; // número de características
    const numClasses = 4

    const xs = tf.tensor2d(dataset.map(row => row.slice(0, numFeatures))); // matriz de características
    const ys = tf.tensor1d(dataset.map(row => row[numFeatures]).map(label => tf.oneHot(label, numClasses))); // matriz de etiquetas
    // Train the model using the data.

    await __model.fit(xs, ys, {
      batchSize: 128,
      epochs   : 200
    })

    // Use the model to do inference on a data point the model hasn't seen before:
    const d = __model.predict(tf.tensor1d([32, 1, 38.5, 70.3, 18, 24.7, 3.9, 11.17, 4.8, 74, 15.6, 76.5]))
    console.log({ d })
  }

  const handleClick_Download = () => {

  }

  console.debug("DebugLoadCSV")
  return <>
    {
      (_isDebug) &&
      <Row className={"mt-3"}>
        <Col>
          <Card>
            <Card.Header><h3>Debug</h3></Card.Header>
            <Card.Body>
              <Card.Title>Pruebas modelo</Card.Title>


              <div className="d-grid gap-2 mt-3">
                <Button type="button"
                        onClick={async () => {
                          let m = await MODEL_CAR.loadModel()
                          m.summary()
                        }}
                        size={"small"}
                        variant="primary">
                  Debug
                </Button>
                <Button type="button"
                        onClick={() => handleClick_debug_ALL}
                        size={"small"}
                        variant="primary">
                  CLEAR DATA
                </Button>
                <hr />

                <Button type="button"
                        onClick={() => tfVis.visor().toggle()}
                        size={"small"}
                        variant="outline-primary">
                  Conmutar visor
                </Button>
                <Button type="button"
                        onClick={() => handleClick_Layers}
                        size={"small"}
                        variant="outline-secondary">
                  Definir capas
                </Button>
                <Button type="button"
                        onClick={() => handleClick_Compile}
                        size={"small"}
                        variant="outline-warning">
                  Compilar
                </Button>
                <Button type="button"
                        onClick={() => handleClick_Fit}
                        size={"small"}
                        variant="outline-danger">
                  Entrenar
                </Button>
                <Button type="button"
                        onClick={() => handleClick_Download}
                        size={"small"}
                        variant="outline-success">
                  Descargar
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    }
  </>
}