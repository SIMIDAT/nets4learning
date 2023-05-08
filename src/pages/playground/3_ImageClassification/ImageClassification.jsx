import React, { useEffect, useState } from 'react'
import { Accordion, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from "react-i18next";
import * as tf from '@tensorflow/tfjs'
// eslint-disable-next-line
import { Sequential } from '@tensorflow/tfjs'
import * as tfvis from "@tensorflow/tfjs-vis";
import ReactGA from "react-ga4";

import * as TrainMNIST from './custom/Train_MNIST'
import CustomCanvasDrawer from './components/customCanvasDrawer'
import GraphicRed from '../../../utils/graphicRed/GraphicRed'
import LayerEdit from './LayerEdit'
import * as alertHelper from "../../../utils/alertHelper";
import * as ImageClassificationUtils from "./utils/utils";
import {
  getKeyDatasetByID_ImageClassification,
  MODEL_IMAGE_MNIST,
  MODEL_IMAGE_MOBILENET,
  MODEL_IMAGE_RESNET
} from "../../../DATA_MODEL";
import { TYPE_CLASS, TYPE_LOSSES, TYPE_METRICS, TYPE_OPTIMIZER } from "../../../core/nn-utils/ArchitectureTypesHelper";

import { MODEL_IMAGE_CLASSIFICATION } from "./models/_model";

const NumberEpochs_default = 5
const LearningRate_default = 1

const DEFAULT_ID_OPTIMIZATION = "adam";
const DEFAULT_ID_LOSS = "metrics-categoricalCrossentropy";
const DEFAULT_ID_METRICS = "accuracy";


export default function ImageClassification(props) {
  const { dataset } = props
  const { t } = useTranslation()
  const [modelInfo, set_ModelInfo] = useState(new MODEL_IMAGE_CLASSIFICATION(t));

  const prefix = "pages.playground.0-tabular-classification.generator.";

  // TODO: DEPENDIENDO DEL TIPO QUE SEA SE PRE CARGAN UNOS AJUSTES U OTROS

  /**
   * @typedef {Object} Layer_t
   * @property {string} class
   * @property {string} activation
   * @property {string} kernelInitializer
   * @property {[number, number]} poolSize
   * @property {[number, number]} strides2
   * @property {number} kernelSize
   * @property {number} filters
   * @property {number} strides
   */
  const [Layers, setLayers] = useState(/**@type Array<Layer_t>*/[])
  const [ActiveLayer, setActiveLayer] = useState()
  const [Contador, setContador] = useState(0)

  const [idOptimizer, setIdOptimizer] = useState(DEFAULT_ID_OPTIMIZATION)
  const [idLoss, setIdLoss] = useState(DEFAULT_ID_LOSS)
  const [idMetrics, setIdMetrics] = useState(DEFAULT_ID_METRICS)
  const [NumberEpochs, setNumberEpochs] = useState(NumberEpochs_default)
  const [LearningRate, setLearningRate] = useState(LearningRate_default)
  /**
   * @typedef {Sequential} Model_t
   */
  const [Model, setModel] = useState(/**@type {Model_t}*/null)

  const [Recarga, setRecarga] = useState(false)
  /**
   * @typedef {Object} GeneratedModels_t
   * @property {string} optimizer
   * @property {string} loss
   * @property {string} metric
   */
  const [GeneratedModels, setGeneratedModels] = useState(/**@type Array<GeneratedModels_t> */[])

  useEffect(() => {
    const dataset_ID = parseInt(dataset)
    const dataset_key = getKeyDatasetByID_ImageClassification(dataset_ID)
    ReactGA.send({ hitType: "pageview", page: "/ImageClassification/" + dataset_key, title: dataset_key });
    switch (dataset_key) {
      case MODEL_IMAGE_MNIST.KEY: {
        set_ModelInfo(new MODEL_IMAGE_MNIST(t))
        break
      }
      case MODEL_IMAGE_MOBILENET.KEY: {
        set_ModelInfo(new MODEL_IMAGE_MOBILENET(t))
        break
      }
      case MODEL_IMAGE_RESNET.KEY: {
        set_ModelInfo(new MODEL_IMAGE_RESNET(t))
        break
      }
      default: {
        console.error("Error, opción no disponible")
      }
    }

  }, [dataset, t])

  useEffect(() => {
    if (!Recarga) {
      const uploadedArchitecture = localStorage.getItem('custom-architecture-IMG')
      if (uploadedArchitecture !== '{}') {
        setLayers([
          {
            class            : 'Conv2D',
            kernelSize       : 5,
            filters          : 10,
            strides          : 1,
            activation       : 'Sigmoid',
            kernelInitializer: 'varianceScaling',
          },
          {
            class   : 'MaxPooling2D',
            poolSize: [2, 2],
            strides2: [2, 2]
          },
          {
            class            : 'Conv2D',
            kernelSize       : 5,
            filters          : 16,
            strides          : 1,
            activation       : 'relu',
            kernelInitializer: 'varianceScaling',
          },
          {
            class   : 'MaxPooling2D',
            poolSize: [2, 2],
            strides2: [2, 2]
          },
        ])
        setRecarga(true)
        setActiveLayer(0)
      } else {
        setLayers([
          {
            class            : 'Conv2D',
            kernelSize       : 5,
            filters          : 10,
            strides          : 1,
            activation       : 'Sigmoid',
            kernelInitializer: 'varianceScaling',
          },
          {
            class   : 'MaxPooling2D',
            poolSize: [2, 2],
            strides2: [2, 2]
          },
          {
            class            : 'Conv2D',
            kernelSize       : 5,
            filters          : 16,
            strides          : 1,
            activation       : 'relu',
            kernelInitializer: 'varianceScaling',
          },
          {
            class   : 'MaxPooling2D',
            poolSize: [2, 2],
            strides2: [2, 2]
          },
        ])
        setRecarga(true)
        setActiveLayer(0)
      }
    }
  }, [Contador, Recarga])

  // CREACIÓN DEL MODELO Y TESTEO
  const handleSubmit_Play = async (event) => {
    event.preventDefault()
    const params = {
      LearningRate
    };
    if (Layers[0].class === 'Conv2D') {
      const model = await TrainMNIST.MNIST_run({
        numberOfEpoch: NumberEpochs,
        idLoss       : idLoss,
        idOptimizer  : idOptimizer,
        idMetrics    : idMetrics,
        layerList    : Layers,
        params       : params,
      });
      setModel(model);
      setGeneratedModels(oldModels => [...oldModels, {
        optimizer: idOptimizer,
        metric   : idMetrics,
        loss     : idLoss,
        model    : model
      }])
      await alertHelper.alertSuccess("Modelo entrenado con éxito")
    } else {
      await alertHelper.alertWarning('La primera capa debe de ser tel tipo Conv2D',)
    }
  }

  const handleVectorTest = async () => {
    if (Model === undefined) {
      await alertHelper.alertWarning('Antes debes de crear y entrenar el modelo.')
    } else {
      const canvas = document.getElementById('drawCanvas')
      const smallcanvas = document.getElementById('smallcanvas')
      const ctx2 = smallcanvas.getContext('2d')
      ImageClassificationUtils.resample_single(canvas, 28, 28, smallcanvas)

      const imgData = ctx2.getImageData(0, 0, 28, 28)
      let arr = [] // El arreglo completo
      let arr28 = [] //Al llegar a 28 posiciones se pone en 'arr' como un nuevo índice
      for (let p = 0; p < imgData.data.length; p += 4) {
        let valor = imgData.data[p + 3] / 255
        arr28.push([valor]) //Agregar al arr28 y normalizar a 0-1. Aparte guarda dentro de un arreglo en el índice 0... again
        if (arr28.length === 28) {
          arr.push(arr28)
          arr28 = []
        }
      }

      arr = [arr]
      // Meter el arreglo en otro arreglo porque si no tio tensorflow se enoja >:(
      // Nah básicamente Debe estar en un arreglo nuevo en el índice 0, por ser un tensor4d en forma 1, 28, 28, 1
      const tensor4 = tf.tensor4d(arr)
      const resultados = Model.predict(tensor4).dataSync()
      const mayorIndice = resultados.indexOf(Math.max.apply(null, resultados))

      console.log('Predicción', mayorIndice)
      // document.getElementById('demo').innerHTML = mayorIndice

      await alertHelper.alertInfo('¿El número es un ' + mayorIndice + '?', mayorIndice)
    }
  }

  const handleVectorTestImageUpload = async () => {
    if (Model === undefined) {
      await alertHelper.alertWarning('Antes debes de crear y entrenar el modelo.')
    } else {
      const canvas = document.getElementById('imageCanvas')
      const smallcanvas = document.getElementById('smallcanvas')
      const ctx2 = smallcanvas.getContext('2d')
      ImageClassificationUtils.resample_single(canvas, 28, 28, smallcanvas)

      const imgData = ctx2.getImageData(0, 0, 28, 28)
      let arr = [] //El arreglo completo
      let arr28 = [] //Al llegar a 28 posiciones se pone en 'arr' como un nuevo índice
      for (let p = 0; p < imgData.data.length; p += 4) {
        let valor = imgData.data[p + 3] / 255
        arr28.push([valor]) //Agregar al arr28 y normalizar a 0-1. Aparte guarda dentro de un arreglo en el indice 0... again
        if (arr28.length === 28) {
          arr.push(arr28)
          arr28 = []
        }
      }

      arr = [arr] //Meter el arreglo en otro arreglo porque si no tio tensorflow se enoja >:(
      //Nah básicamente Debe estar en un arreglo nuevo en el índice 0, por ser un tensor4d en forma 1, 28, 28, 1
      const tensor4 = tf.tensor4d(arr)
      const resultados = Model.predict(tensor4).dataSync()
      const mayorIndice = resultados.indexOf(Math.max.apply(null, resultados))

      console.log('Predicción', mayorIndice)
      // document.getElementById('demo').innerHTML = mayorIndice

      await alertHelper.alertInfo('¿El número es un ' + mayorIndice + '?', mayorIndice)
    }
  }

  const handleClick_DownloadModel = () => {
    Model.save('downloads://my-model')
  }

  // CONTROL DE LAS CAPAS
  const handleClick_AddLayer_Start = async () => {
    if (Layers.length < 10) {
      setLayers(oldLayers => [{
        class            : 'Conv2D',
        kernelSize       : 0,
        filters          : 0,
        strides          : 0,
        activation       : 'sigmoid',
        kernelInitializer: 'varianceScaling',
      }, ...oldLayers]);
    } else {
      await alertHelper.alertWarning("No se pueden añadir más capas")
    }
  }
  const handleClick_AddLayer_End = async () => {
    if (Layers.length < 10) {
      setLayers(oldLayers => [...oldLayers, {
        class            : 'Conv2D',
        kernelSize       : 0,
        filters          : 0,
        strides          : 0,
        activation       : 'sigmoid',
        kernelInitializer: 'varianceScaling',
      }]);
    } else {
      await alertHelper.alertWarning("No se pueden añadir más capas")
    }
  }

  const handleClick_RemoveLayer = async (idLayer) => {
    let array = Layers
    let array2 = []
    if (array.length === 1) {
      await alertHelper.alertWarning('No puedes eliminar la última capa')
    } else {
      for (let i = 0; i < array.length; i++) {
        if (i !== idLayer) array2.push(array[i])
      }
      if (ActiveLayer === idLayer && idLayer > 0) setActiveLayer(idLayer - 1)
      setLayers(array2)
    }
  }

  const handleChange_Class = (e) => {
    const option = e.target.value
    let a = Contador
    a = a + 1
    let array = Layers
    array[ActiveLayer].class = option
    if (option === 'Conv2D') {
      array[ActiveLayer] = {
        class            : 'Conv2D',
        kernelSize       : 5,
        filters          : 10,
        strides          : 1,
        activation       : 'Sigmoid',
        kernelInitializer: 'varianceScaling',
      }
    } else {
      array[ActiveLayer] = {
        class   : 'MaxPooling2D',
        poolSize: [2, 2],
        strides2: [2, 2],
      }
    }
    setContador(a)
    setLayers(array)
  }
  //PARÁMETROS DE LAS CAPAS

  const handleChange_Kernel = (index, e) => {
    Layers[index].kernelSize = parseInt(e.target.value);
    setLayers(Layers);
  }

  const handleChange_Filters = (index, e) => {
    Layers[index].filters = parseInt(e.target.value);
    setLayers(Layers);
  }

  const handleChange_Strides = (index, e) => {
    Layers[index].strides = parseInt(e.target.value);
    setLayers(Layers);
  }

  const handleChange_PoolSize = (index, id, e) => {
    Layers[index].poolSize[id] = parseInt(e.target.value);
    setLayers(Layers);
  }

  const handleChange_StridesMax = (index, id, e) => {
    Layers[index].strides[id] = parseInt(e.target.value);
    setLayers(Layers);
  }

  const handleChange_Activation = (index, e) => {
    Layers[index].activation = e.target.value;
    setLayers(Layers);
  }

  // PARÁMETROS GENERALES
  const handleChange_LearningRate = (e) => {
    setLearningRate(parseInt(e.target.value));
  }
  const handleChange_NumberEpochs = (e) => {
    setNumberEpochs(parseInt(e.target.value));
  }

  const handleChange_Loss = (e) => {
    setIdLoss(e.target.value);
  }

  const handleChange_Optimization = (e) => {
    setIdOptimizer(e.target.value);
  }

  const handleChange_Metrics = (e) => {
    setIdMetrics(e.target.value)

  }

  const handleChange_FileUpload = async (e) => {
    const tgt = e.target || window.event.srcElement
    const files = tgt.files

    const canvas = document.getElementById('imageCanvas')
    const ctx = canvas.getContext('2d')

    function draw() {
      canvas.width = 200
      canvas.height = 200
      ctx.drawImage(this, 0, 0)
    }

    function failed() {
      console.error("The provided file couldn't be loaded as an Image media")
    }

    const img = new Image()
    img.onload = draw
    img.onerror = failed
    img.src = URL.createObjectURL(files[0])
  }


  const isDisabledDownloadModel = () => {
    return GeneratedModels.length === 0
  }

  return (
    <>
      {/* MANUAL */}
      <Container>
        <Row>
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
            <Accordion>
              <Accordion.Item eventKey={"manual"}>
                <Accordion.Header><h3>Manual</h3></Accordion.Header>
                <Accordion.Body>
                  <ul>
                    <li>Interfaz de edición de arquitectura.</li>

                    <li>
                      <b>A la izquierda:</b><br />
                      Se pueden ver las capas de neuronas, puedes agregar tantas como desees pulsando el botón "Añadir capa". <br />
                      Puedes modificar dos parámetros:
                    </li>
                    <ul>
                      <li><b>Unidades de la capa:</b><br />Cuantas unidades deseas que tenga esa capa.</li>
                      <li><b>Función de activación:</b><br />Función de activación para esa capa.</li>
                    </ul>

                    <li>
                      <b>A la derecha </b><br />
                      Se pueden ver parámetros generales necesarios para la creación del modelo. <br />
                      Estos parámetros son:
                    </li>
                    <ul>
                      <li>
                        <b>Tasa de entrenamiento:</b><br />
                        Valor entre 0 y 100 el cual indica a la red qué cantidad de datos debe usar para el entrenamiento
                        y reglas para el test.
                      </li>
                      <li>
                        <b>Número de iteraciones:</b><br />
                        Cantidad de ciclos que va a realizar la red (a mayor número, más tiempo tarda en entrenar).
                      </li>
                      <li>
                        <b>Optimizador:</b><br />
                        Es una función que como su propio nombre indica se usa para optimizar los modelos.
                        Esto es frecuentemente usado para evitar estancarse en un máximo local.
                      </li>
                      <li>
                        <b>Función de pérdida:</b><br />
                        Es un método para evaluar qué tan bien un algoritmo específico modela los datos otorgados.
                      </li>
                      <li>
                        <b>Métrica:</b><br />
                        Es evaluación para valorar el rendimiento de un modelo de aprendizaje automático.
                      </li>
                    </ul>

                    <li>
                      <b>Crear y entrenar modelo.</b><br />
                      Una vez se han rellenado todos los campos anteriores podemos crear el modelo pulsando el botón.
                    </li>

                    <li>
                      <b>Exportar modelo. </b><br />
                      Si hemos creado el modelo correctamente nos aparece este botón que nos permite exportar el modelo y
                      guardarlo localmente.
                    </li>

                    <li>
                      <b>Resultado. </b><br />
                      Un formulario que nos permite predecir el valor de salida a partir de los valores de entrada que
                      introducimos, para ver la salida solamente hay que pulsar "Ver resultado".
                    </li>
                  </ul>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey={"description-dataset"}>
                <Accordion.Header>
                  <h3>
                    <Trans i18nKey={dataset !== "0" ? modelInfo.TITLE : prefix + "dataset.upload-dataset"} />
                  </h3>
                </Accordion.Header>
                <Accordion.Body>
                  {modelInfo.DESCRIPTION()}
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey={"info"}>
                <Accordion.Header><h3>Información adicional capas</h3></Accordion.Header>
                <Accordion.Body>
                  <p>
                    Adicionalmente hay dos capas más que son comunes al resto de redes de aprendizaje automático enfocadas en la clasificación de imágenes
                  </p>
                  <ul>
                    <li>
                      <b>flatten_Flatten:</b><br />
                      Esta capa aplana la salida 2D en un vector 1D preparando el modelo para entrar en la última capa.
                    </li>
                    <li>
                      <b>dense_Dense1:</b><br />
                      Es la última capa y tiene 10 unidades de salida, una por cada posible valor (del 0 al 9)
                    </li>
                  </ul>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Col>
        </Row>
      </Container>

      {/* EDITOR */}
      <Form onSubmit={handleSubmit_Play} id={"ImageClassification"}>
        <Container className={"mt-3"}>
          <Row>
            <Col xl={12}>
              <Card>
                <Card.Header>
                  <h3><Trans i18nKey={prefix + "layers.title"} /></h3>
                </Card.Header>
                <Card.Body>
                  <GraphicRed layer={Layers} setActiveLayer={setActiveLayer} tipo={1} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row>
            {/* Layers PARAMETERS */}
            <Col className={"mt-3"} xl={6}>
              <Card>
                <Card.Header className={"d-flex align-items-center justify-content-between"}>
                  <h3><Trans i18nKey={prefix + "editor-layers.title"} /></h3>
                  <div className={"d-flex"}>
                    <Button onClick={() => handleClick_AddLayer_Start()}
                            size={"sm"}
                            variant="outline-primary">
                      <Trans i18nKey={prefix + "editor-layers.add-layer-start"} />
                    </Button>
                    <Button onClick={() => handleClick_AddLayer_End()}
                            size={"sm"}
                            variant="outline-primary"
                            className={"ms-3"}>
                      <Trans i18nKey={prefix + "editor-layers.add-layer-end"} />
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Accordion>
                    {Layers.map((item, index) => {
                      return <Accordion.Item key={index} eventKey={index.toString()}>
                        <Accordion.Header>Capa {index + 1}</Accordion.Header>
                        <Accordion.Body>
                          <div className="d-grid gap-2">
                            <Button onClick={() => handleClick_RemoveLayer(index)}
                                    variant={"outline-danger"}>
                              <Trans i18nKey={prefix + "editor-layers.delete-layer"} values={{ value: index + 1 }} />
                            </Button>
                          </div>

                          {/* UNITS */}
                          <Form.Group className="mt-3"
                                      controlId={'formClass' + index}>
                            <Form.Label>Clase de la capa</Form.Label>
                            <Form.Select aria-label="Selecciona la clase de la capa"
                                         defaultValue={Layers[index].class}
                                         onChange={handleChange_Class}>
                              {TYPE_CLASS.map(({ key, label }, index) => {
                                return (<option key={index} value={key}>{label}</option>)
                              })}
                            </Form.Select>
                          </Form.Group>
                          <LayerEdit index={index}
                                     item={Layers[index]}
                                     handler_RemoveLayer={handleClick_RemoveLayer}
                                     handleChange_Kernel={handleChange_Kernel}
                                     handleChange_Activation={handleChange_Activation}
                                     handleChange_Filters={handleChange_Filters}
                                     handleChange_Strides={handleChange_Strides}
                                     handleChange_PoolSize={handleChange_PoolSize}
                                     handleChange_StridesMax={handleChange_StridesMax} />
                        </Accordion.Body>
                      </Accordion.Item>
                    })}
                  </Accordion>
                </Card.Body>
              </Card>
            </Col>

            {/* GENERAL PARAMETERS */}
            <Col className={"mt-3"} xl={6}>
              <Card className={"sticky-top"} style={{ zIndex: 10 }}>
                <Card.Header><h3><Trans i18nKey={prefix + "general-parameters.title"} /></h3></Card.Header>

                <Card.Body>
                  {/* LEARNING RATE */}
                  <Form.Group className="mb-3" controlId="formTrainRate">
                    <Form.Label>Tasa de entrenamiento</Form.Label>
                    <Form.Control type="number"
                                  placeholder="Introduce la tasa de entrenamiento"
                                  defaultValue={LearningRate_default}
                                  onChange={(e) => handleChange_LearningRate(e)} />
                    <Form.Text className="text-muted">
                      Recuerda que debe ser un valor entre 0 y 100 (es un porcentaje)
                    </Form.Text>
                  </Form.Group>

                  {/* Número OF ITERATIONS */}
                  <Form.Group className="mb-3" controlId="FormNumberOfEpochs">
                    <Form.Label>Número de iteraciones</Form.Label>
                    <Form.Control type="number"
                                  placeholder="Introduce el número de iteraciones"
                                  defaultValue={NumberEpochs_default}
                                  onChange={(e) => handleChange_NumberEpochs(e)}
                    />
                    <Form.Text className="text-muted">
                      *Mientras más alto sea, mas tardará en ejecutarse el entrenamiento
                    </Form.Text>
                  </Form.Group>

                  {/* OPTIMIZATION FUNCTION */}
                  <Form.Group className="mb-3" controlId="FormOptimizer">
                    <Form.Label>Selecciona el optimizador</Form.Label>
                    <Form.Select aria-label="Selecciona el optimizador"
                                 defaultValue={idOptimizer}
                                 onChange={handleChange_Optimization}>
                      {TYPE_OPTIMIZER.map(({ key, label }, _index) => {
                        return (<option key={_index} value={key}>{label}</option>)
                      })}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Será el optimizador que se usará para activar la función
                    </Form.Text>
                  </Form.Group>
                  {/* LOSS FUNCTION */}
                  <Form.Group className="mb-3" controlId="FormLoss">
                    <Form.Label>Selecciona la función de pérdida</Form.Label>
                    <Form.Select aria-label="Selecciona la función de pérdida"
                                 defaultValue={idLoss}
                                 onChange={handleChange_Loss}>
                      <optgroup label={"Losses"}>
                        {TYPE_LOSSES.map(({ key, label }, index) => {
                          return (<option key={index} value={"losses-" + key}>{label}</option>);
                        })}
                      </optgroup>
                      <optgroup label={"Metrics"}>
                        {TYPE_METRICS.map(({ key, label }, index) => {
                          return (<option key={index} value={"metrics-" + key}>{label}</option>);
                        })}
                      </optgroup>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Será la perdida que se usará para la evaluación
                    </Form.Text>
                  </Form.Group>

                  {/* METRICS FUNCTION */}
                  <Form.Group className="mb-3" controlId="FormMetrics">
                    <Form.Label>Selecciona la métrica</Form.Label>
                    <Form.Select aria-label="Selecciona la función de métrica"
                                 defaultValue={idMetrics}
                                 onChange={(e) => handleChange_Metrics(e)}>
                      {TYPE_METRICS.map(({ key, label }, _index) => {
                        return (<option key={_index} value={key}>{label}</option>)
                      })}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Será la métrica que se usará para la evaluación
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className={"mt-3"}>
            <Col>
              {/* BLOCK  BUTTON */}
              <div className="d-grid gap-2">
                <Button type={"submit"}
                        variant="primary"
                        onClick={() => {
                          console.log("TODO")
                        }}>
                  <Trans i18nKey={prefix + "models.button-submit"} />
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </Form>

      {/* GENERATED MODELS */}
      <Container className={"mt-3"}>
        <Row>
          <Col>
            <Card>
              <Card.Header className={"d-flex align-items-center"}>
                <h3><Trans i18nKey={prefix + "models.title"} /> | {GeneratedModels.length + 1}</h3>
                <div className={"d-flex"}>
                  <Button variant={"outline-primary"}
                          className={"ms-3"}
                          size={"sm"}
                          onClick={() => {
                            tfvis.visor().open();
                          }}>
                    <Trans i18nKey={prefix + "models.open-visor"} />
                  </Button>
                  <Button variant={"outline-primary"}
                          className={"ms-1"}
                          size={"sm"}
                          onClick={() => {
                            tfvis.visor().close();
                          }}>
                    <Trans i18nKey={prefix + "models.close-visor"} />
                  </Button>
                  {(Model !== undefined) &&
                    <Button className={"ms-1"}
                            disabled={isDisabledDownloadModel()}
                            onClick={() => handleClick_DownloadModel()}
                            size={"sm"}
                            variant="outline-primary">
                      <Trans i18nKey={prefix + "models.export-current-model"} />
                    </Button>
                  }
                </div>
              </Card.Header>
              <Card.Body>

                <div id="resultado"></div>
                <div id="salida"></div>
                <div id="demo"></div>

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* BLOCK 2 */}
      <Container className={"mt-3"}>
        <Row>
          <Col>
            <Card className="mt-3">
              <Card.Header><h3>Resultado</h3></Card.Header>
              <Card.Body>
                {/* VECTOR TEST */}
                <Row>
                  <Col>
                    <CustomCanvasDrawer submitFunction={handleVectorTest}
                                        clearFunction={() => {
                                        }}
                    />
                  </Col>
                  <Col>
                    <input style={{ marginBottom: '2rem' }}
                           type="file"
                           name="doc"
                           onChange={handleChange_FileUpload} />

                    <Row>
                      <Col className={"d-flex justify-content-center"}>
                        <canvas id="imageCanvas"
                                height="100"
                                width="100"
                                className={"nets4-border-1"}></canvas>
                      </Col>
                      <Col className={"d-flex justify-content-center"}>
                        <canvas id="smallcanvas"
                                width="28"
                                height="28"
                                className={"nets4-border-1"}></canvas>
                      </Col>
                    </Row>


                    <div className="d-grid gap-2 mt-3">
                      <Button variant="primary"
                              onClick={handleVectorTestImageUpload}>
                        Validar
                      </Button>
                    </div>
                  </Col>
                </Row>


                {/* SUBMIT BUTTON */}

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

    </>
  )
}
