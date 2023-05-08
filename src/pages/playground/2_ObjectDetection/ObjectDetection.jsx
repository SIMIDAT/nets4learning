import React, { useState, useEffect } from 'react'
import { Col, Row, Form, CloseButton, Button, Container, Card, Accordion } from 'react-bootstrap'
import ReactGA from "react-ga4";

import * as tf from '@tensorflow/tfjs'
import * as classificationHelper_MNIST from '../3_ImageClassification/models/MODEL_MNIST'
import * as alertHelper from "../../../utils/alertHelper"

import CustomCanvasDrawer from '../3_ImageClassification/components/customCanvasDrawer'
import GraphicRed from '../../../utils/graphicRed/GraphicRed'
import {
  TYPE_CLASS,
  TYPE_OPTIMIZER,
  TYPE_LOSSES,
  TYPE_METRICS
} from "../../../core/nn-utils/ArchitectureTypesHelper";
import { DATASET_DESCRIPTION, getKeyDatasetByID_TabularClassification, LIST_MODEL_OPTIONS } from "../../../DATA_MODEL"

export default function ObjectDetection(props) {
  const { dataset } = props

  // TODO: DEPENDIENDO DEL TIPO QUE SEA SE PRE CARGAN UNOS AJUSTES U OTROS
  const [Layer, setLayer] = useState([])
  const [ActiveLayer, setActiveLayer] = useState()
  const [Contador, setContador] = useState(0)

  const NumberEpochs = 10
  const learningValue = 1
  const [Optimizer, setOptimizer] = useState('Adam')
  const [LossValue, setLossValue] = useState('CategoricalCrossentropy')
  const [MetricsValue, setMetricsValue] = useState('Accuracy')
  const [Model, setModel] = useState()
  const [NoEpochs, setNoEpochs] = useState(2)
  const [Recarga, setRecarga] = useState(false)

  useEffect(() => {
    const dataset_ID = parseInt(dataset)
    const dataset_key = getKeyDatasetByID_TabularClassification(dataset_ID)
    ReactGA.send({ hitType: "pageview", page: "/ObjectDetection/" + dataset_key, title: dataset_key });
  }, [dataset])

  useEffect(() => {
    if (!Recarga) {
      const uploadedArchitecture = localStorage.getItem('custom-architecture-IMG')
      if (uploadedArchitecture !== '{}') {
        setLayer([
          {
            class            : 'Conv2D',
            kernelSize       : 5,
            filters          : 10,
            strides          : 1,
            activation       : 'Sigmoid',
            kernelInitializer: 'varianceScaling',
          },
        ])
        setActiveLayer(0)
      } else {
        setLayer([
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
  const handleClickPlay = async (event) => {
    event.preventDefault()
    if (Layer[0].class === 'Conv2D') {
      const model = await classificationHelper_MNIST.MNIST_run(
        parseInt(NoEpochs),
        document.getElementById('FormOptimizer').value,
        Layer,
        LossValue,
        MetricsValue,
      )
      setModel(model)
      await alertHelper.alertSuccess("Modelo entrenado con éxito")
    } else {
      await alertHelper.alertWarning('La primera capa debe de ser tel tipo Conv2D')
    }
  }

  const handleVectorTest = async () => {
    if (Model === undefined) {
      await alertHelper.alertWarning('Antes debes de crear y entrenar el modelo.')
    } else {
      const canvas = document.getElementById('drawCanvas')

      const small_canvas = document.getElementById('small_canvas')
      const ctx2 = small_canvas.getContext('2d')
      classificationHelper_MNIST.resample_single(canvas, 28, 28, small_canvas)

      const imgData = ctx2.getImageData(0, 0, 28, 28)
      // El arreglo completo
      let arr = []
      // Al llegar a 28 posiciones se pone en 'arr' como un nuevo índice
      let arr28 = []
      for (let p = 0; p < imgData.data.length; p += 4) {
        let valor = imgData.data[p + 3] / 255
        // Agregar al arr28 y normalizar a 0-1. Aparte guarda dentro de un arreglo en el índice 0... again
        arr28.push([valor])
        if (arr28.length === 28) {
          arr.push(arr28)
          arr28 = []
        }
      }

      // Meter el arreglo en otro arreglo porque si no tio tensorflow se enoja >:(
      arr = [arr]
      // Nah básicamente Debe estar en un arreglo nuevo en el índice 0, por ser un tensor4d en forma 1, 28, 28, 1
      const tensor4 = tf.tensor4d(arr)
      const resultados = Model.predict(tensor4).dataSync()
      const mayorIndice = resultados.indexOf(Math.max.apply(null, resultados))
      console.log('Predicción', mayorIndice)
      document.getElementById('demo').innerHTML = mayorIndice.toString()

      await alertHelper.alertInfo('¿El número es un ' + mayorIndice + '?', mayorIndice)
    }
  }

  const handleVectorTestImageUpload = async () => {
    if (Model === undefined) {
      await alertHelper.alertWarning('Antes debes de crear y entrenar el modelo.')
      return
    }
    const canvas = document.getElementById('imageCanvas')
    const small_canvas = document.getElementById('smallcanvas')
    const ctx2 = small_canvas.getContext('2d')
    classificationHelper_MNIST.resample_single(canvas, 28, 28, small_canvas)

    const imgData = ctx2.getImageData(0, 0, 28, 28)
    //El arreglo completo
    let arr = []
    // Al llegar a 28 posiciones se pone en 'arr' como un nuevo índice
    let arr28 = []
    for (let p = 0; p < imgData.data.length; p += 4) {
      let valor = imgData.data[p + 3] / 255
      // Agregar al arr28 y normalizar a 0-1. Aparte guarda dentro de un arreglo en el indice 0... again
      arr28.push([valor])
      if (arr28.length === 28) {
        arr.push(arr28)
        arr28 = []
      }
    }

    // Meter el arreglo en otro arreglo porque si no tio tensorflow se enoja >:(
    arr = [arr]
    // Nah básicamente Debe estar en un arreglo nuevo en el índice 0, por ser un tensor4d en forma 1, 28, 28, 1
    const tensor4 = tf.tensor4d(arr)
    let resultados = Model.predict(tensor4).dataSync()
    let mayorIndice = resultados.indexOf(Math.max.apply(null, resultados))

    console.log('Predicción', mayorIndice)
    document.getElementById('demo').innerHTML = mayorIndice.toString()

    await alertHelper.alertInfo('¿El número es un ' + mayorIndice + '?', mayorIndice)

  }

  const handleDownloadModel = () => {
    Model.save('downloads://mymodel')
  }

  // CONTROL DE LAS CAPAS
  const handlerAddLayer = async () => {
    let array = Layer
    array.push({
      class            : 'Conv2D',
      kernelSize       : 0,
      filters          : 0,
      strides          : 0,
      activation       : 'Sigmoid',
      kernelInitializer: 'varianceScaling',
    })
    setLayer(array)
  }

  const handleClick_RemoveLayer = async (idLayer) => {
    let array = Layer
    let array2 = []
    if (array.length === 1) {
      await alertHelper.alertWarning('No puedes eliminar la última capa')
    } else {
      for (let i = 0; i < array.length; i++) {
        if (i !== idLayer) array2.push(array[i])
      }
      if (ActiveLayer === idLayer && idLayer > 0) setActiveLayer(idLayer - 1)
      setLayer(array2)
    }
  }

  //PARÁMETROS DE LAS CAPAS
  // const handleChangeKernel = (index) => {
  //   let array = Layer
  //   array[index].kernelSize = parseInt(document.getElementById(`formKernelLayer${index}`).value)
  //   setLayer(array)
  // }
  //
  // const handleChangeFilters = (index) => {
  //   let array = Layer
  //   array[index].filters = parseInt(document.getElementById(`formFiltersLayer${index}`).value)
  //   setLayer(array)
  // }
  //
  // const handleChangeStrides = (index) => {
  //   let array = Layer
  //   array[index].strides = parseInt(
  //     document.getElementById(`formStridesLayer${index}`).value,
  //   )
  //   setLayer(array)
  // }
  //
  // const handleChangePoolSize = (index, id) => {
  //   let array = Layer
  //   array[index].poolSize[id] = parseInt(
  //     document.getElementById(`formPoolSize${id}Layer${index}`).value,
  //   )
  //   setLayer(array)
  // }
  //
  // const handleChangeStridesMax = (index, id) => {
  //   let array = Layer
  //   array[index].strides[id] = parseInt(
  //     document.getElementById(`formStrides${id}Layer${index}`).value,
  //   )
  //   setLayer(array)
  // }
  //
  // const handleChangeClass = (index) => {
  //   let array = Layer
  //   array[index].class = document.getElementById(`formClass${index}`).value
  //   if (array[index].class === 'Conv2D') {
  //     array[index].kernelSize = 5
  //     array[index].filters = 10
  //     array[index].strides = 1
  //     array[index].activation = 'Sigmoid'
  //     array[index].kernelInitializer = 'varianceScaling'
  //   } else {
  //     array[index].poolSize = [2, 2]
  //     array[index].strides = [2, 2]
  //   }
  //   setLayer(array)
  //   let aux = Contador
  //   setContador(aux++)
  // }

  const handleChange_Class = (e) => {
    const option = e.target.value
    let a = Contador
    a = a + 1
    let array = Layer
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
    setLayer(array)
  }

  // const handleChangeActivation = (index) => {
  //   let array = Layer
  //   array[index].activation = document.getElementById(`formActivationLayer${index}`).value
  //   setLayer(array)
  // }

  // PARÁMETROS GENERALES
  const handleChange_NumberEpochs = () => {
    let aux = document.getElementById('FormNumberOfEpochs').value
    setNoEpochs(aux)
  }

  const handleChange_IdOptimization = () => {
    let aux = document.getElementById('FormOptimizer').value
    if (aux !== undefined) {
      setOptimizer(aux)
    }
  }

  const handleChange_IdLoss = () => {
    let aux = document.getElementById('FormLoss').value
    if (aux !== undefined) {
      setLossValue(aux)
    }
  }

  const handleChange_IdMetrics = () => {
    let aux = document.getElementById('FormMetrics').value
    if (aux !== undefined) {
      setMetricsValue(aux)
    }
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

  return (
    <>
      <Form onSubmit={handleClickPlay} id={"ObjectDetection"}>
        <Container>
          <Row>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Text>A continuación se ha pre cargado una arquitectura.</Card.Text>
                  <Card.Text>Programa dentro de la función "createArchitecture".</Card.Text>
                  <Card.Text>
                    A esta función se el pasa un array preparado que continue la información del conjunto de datos.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className={"mt-3"}>
            <Col>
              <Card>
                <Card.Header><h3>{LIST_MODEL_OPTIONS[3][dataset]}</h3></Card.Header>
                <Card.Body>
                  <Card.Text>
                    {DATASET_DESCRIPTION[3][dataset]}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className={"mt-3"}>
            <Col>
              <Card>
                <Card.Header><h3>{LIST_MODEL_OPTIONS[3][dataset]}</h3></Card.Header>
                <Card.Body>
                  <p>Ahora vamos a ver la interfaz de edición de arquitectura.</p>
                  <ul>
                    <li>
                      <b>A la izquierda:</b><br />
                      Se pueden ver las capas de neuronas, puedes agregar tantas como desees pulsando el botón "Añadir
                      capa".<br />
                      Puedes modificar dos parámetros:
                    </li>
                    <ul>
                      <li><b>Unidades de la capa:</b><br /> Cuantas unidades deseas que tenga esa capa</li>
                      <li><b>Función de activación:</b><br /> Función de activación para esa capa</li>
                    </ul>

                    <li>
                      <b>A la derecha:</b><br />
                      Se pueden ver parámetros generales necesarios para la creación del modelo. <br />
                      Estos parámetros son:
                    </li>
                    <ul>
                      <li>
                        <b>Tasa de entrenamiento:</b><br />
                        Valor entre 0 y 100 el cual indica a la red qué cantidad de datos debe usar para el
                        entrenamiento y
                        reglas para el test
                      </li>
                      <li>
                        <b>Número de iteraciones:</b><br />
                        Cantidad de ciclos que va a realizar la red (a mayor número, más tiempo tarda en entrenar)
                      </li>
                      <li>
                        <b>Optimizador:</b><br />
                        Es una función que como su propio nombre indica se usa para optimizar los modelos.
                        Esto es frecuentemente usado para evitar estancarse en un máximo local.
                      </li>
                      <li>
                        <b>Función de pérdida:</b><br />
                        Es un método para evaluar qué tan bien un algoritmo específico modela los datos otorgados
                      </li>
                      <li>
                        <b>Función de métrica:</b><br />
                        Es evaluación para valorar el rendimiento de un modelo de aprendizaje automático
                      </li>
                    </ul>

                    <li>
                      <b>Crear y entrenar modelo.</b><br />
                      Una vez se han rellenado todos los campos anteriores podemos crear el modelo pulsando el botón.
                    </li>

                    <li>
                      <b>Exportar modelo.</b><br />
                      Si hemos creado el modelo correctamente nos aparece este botón que nos permite exportar el modelo
                      y guardarlo localmente.
                    </li>

                    <li>
                      <b>Resultado.</b><br />
                      Un formulario que nos permite predecir el valor de salida a partir de los valores de entrada que
                      introducimos, para ver la salida solamente hay que pulsar "Ver resultado".
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>


          {/* BLOCK 1 */}
          <Row className={"mt-3"}>
            <Col xl={12}>
              <Card>
                <Card.Header><h3>Diseño de capas</h3></Card.Header>
                <Card.Body>
                  <GraphicRed layer={Layer} setActiveLayer={setActiveLayer} />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className={"mt-3"}>
            {/* SPECIFIC PARAMETERS */}
            <Col xl={6}>
              {/* TODO: falta el foreach */}
              {/* ADD LAYER */}
              <div className="d-grid gap-2">
                <Button type="button"
                        onClick={() => handlerAddLayer()}
                        size={"lg"}
                        variant="primary">
                  Añadir capa
                </Button>
              </div>

              <Accordion className={"mt-3"} defaultActiveKey={["0"]} alwaysOpen>
                {ActiveLayer !== undefined ? (
                  <Accordion.Item eventKey={"0"}>
                    <Accordion.Header>Capa {ActiveLayer + 1}</Accordion.Header>

                    {/* UNITS */}
                    <Accordion.Body>
                      <CloseButton onClick={() => handleClick_RemoveLayer(ActiveLayer)} />

                      <Form.Group className="mb-3"
                                  controlId={'formClass' + ActiveLayer}>
                        <Form.Label>Clase de la capa</Form.Label>
                        <Form.Select aria-label="Default select example"
                                     defaultValue={Layer[ActiveLayer].class}
                                     onChange={handleChange_Class}>
                          {TYPE_CLASS.map(({ key, label }, index) => {
                            return (<option key={index} value={key}>{<label for=""></label>}</option>)
                          })}
                        </Form.Select>
                      </Form.Group>
                    </Accordion.Body>
                  </Accordion.Item>
                ) : ("")}
              </Accordion>

            </Col>

            {/* GENERAL PARAMETERS */}
            <Col xl={6}>
              <Card className={"sticky-top"}>
                <Card.Body>
                  {/* LEARNING RATE */}
                  <Form.Group className="mb-3" controlId="formTrainRate">
                    <Form.Label>Tasa de entrenamiento</Form.Label>
                    <Form.Control type="number"
                                  placeholder="Introduce la tasa de entrenamiento"
                                  defaultValue={learningValue} />
                    <Form.Text className="text-muted">
                      Recuerda que debe ser un valor entre 0 y 100 (es un porcentaje)
                    </Form.Text>
                  </Form.Group>

                  {/* Número OT ITERATIONS */}
                  <Form.Group className="mb-3" controlId="FormNumberOfEpochs">
                    <Form.Label>Número de iteraciones</Form.Label>
                    <Form.Control type="number"
                                  placeholder="Introduce el número de iteraciones"
                                  defaultValue={NumberEpochs}
                                  onChange={handleChange_NumberEpochs} />
                    <Form.Text className="text-muted">
                      *Mientras más alto sea, mas tardará en ejecutarse el entrenamiento
                    </Form.Text>
                  </Form.Group>

                  {/* OPTIMIZATION FUNCTION */}
                  <Form.Group className="mb-3" controlId="FormOptimizer">
                    <Form.Label>Selecciona el optimizador</Form.Label>
                    <Form.Select aria-label="Default select example"
                                 defaultValue={Optimizer}
                                 onChange={handleChange_IdOptimization}>
                      <option>Selecciona el optimizador</option>
                      {TYPE_OPTIMIZER.map(({ key, label }, id) => {
                        return (<option key={id} value={key}>{label}</option>)
                      })}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Será el optimizador que se usará para activar la función
                    </Form.Text>
                  </Form.Group>
                  {/* LOSS FUNCTION */}
                  <Form.Group className="mb-3" controlId="FormLoss">
                    <Form.Label>Selecciona la función de pérdida</Form.Label>
                    <Form.Select aria-label="Default select example"
                                 defaultValue={LossValue}
                                 onChange={handleChange_IdLoss}>
                      <option>Selecciona la función de pérdida</option>
                      {TYPE_LOSSES.map(({ key, label }, id) => {
                        return (<option key={id} value={key}>{label}</option>)
                      })}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Será el optimizador que se usará para activar la función
                    </Form.Text>
                  </Form.Group>

                  {/* METRICS FUNCTION */}
                  <Form.Group className="mb-3" controlId="FormMetrics">
                    <Form.Label>Selecciona la métrica</Form.Label>
                    <Form.Select aria-label="Default select example"
                                 defaultValue={MetricsValue}
                                 onChange={handleChange_IdMetrics}>
                      <option>Selecciona la métrica</option>
                      {TYPE_METRICS.map(({ key, label }, id) => {
                        return (<option key={id} value={key}>{label}</option>)
                      })}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Será el optimizador que se usará para activar la función
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className={"mt-3"}>
            <Col>
              <Card>
                <Card.Body>
                  {/* INFO ADDITIONAL LAYERS */}
                  <Card.Text>
                    Adicionalmente hay dos capas más que son comunes al resto de redes de aprendizaje automático
                    enfocadas en la clasificación de imágenes
                  </Card.Text>
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
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className={"mt-3"}>
            {/* BLOCK  BUTTON */}
            <Col xl={12}>
              <div className="d-grid gap-2">
                <Button type="submit"
                        size={"lg"}
                        variant="primary">
                  Crear y entrenar modelo
                </Button>
              </div>
            </Col>
          </Row>

          <Row className={"mt-3"}>
            <Col xl={12}>
              <Card>
                <Card.Body>
                  <Card.Text>Para <b>ocultar y mostrar</b> el panel lateral pulsa la tecla <b>ñ</b>.</Card.Text>
                  <Card.Text>
                    Ahora puedes probar este modelo de dos formas, dibujando con el ratón o subiendo una imagen desde
                    tu equipo.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className={"mt-3"}>
            <Col xl={12}>
              <Card>
                <Card.Body>
                  <div id="salida"></div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {Model === undefined ? ('') : (
            <Row className={"mt-3"}>
              <Col xl={12}>
                <div className="d-grid gap-2">
                  <Button type="button"
                          onClick={handleDownloadModel}
                          size={"lg"}
                          variant="primary">
                    Exportar modelo
                  </Button>
                </div>
              </Col>
            </Row>
          )}

          {/* BLOCK 2 */}
          <Row>
            <div className="container-fluid container-fluid-w1900">
              <div className="container borde">
                <div className="title-pane">Resultado</div>
                {/* VECTOR TEST */}
                <Row>
                  <Col style={{
                    display       : 'flex',
                    flexDirection : 'column',
                    justifyContent: 'center',
                  }}>
                    <CustomCanvasDrawer submitFunction={handleVectorTest} />
                  </Col>
                  <Col style={{
                    display      : 'flex',
                    alignItems   : 'center',
                    flexDirection: 'column',
                    marginBottom : '2rem',
                  }}>
                    <input style={{ marginBottom: '2rem' }}
                           type="file"
                           name="doc"
                           onChange={handleChange_FileUpload}></input>
                    <canvas height="200" width="200" id="imageCanvas"></canvas>
                    <button type="button"
                            onClick={handleVectorTestImageUpload}
                            className="btn-custom-canvas green">
                      Validar
                    </button>
                  </Col>
                </Row>

                <canvas id="smallcanvas"
                        width="28"
                        height="28"
                        style={{ display: 'none' }}></canvas>
                <div id="resultado"></div>
                {/* SUBMIT BUTTON */}
              </div>
            </div>

            <div className="header-model-editor mt-3">
              <p>
                Ten en cuenta que no se han usado todos los datos para entrenar la red y puede que sus predicciones no
                sean correctas.
              </p>
            </div>
          </Row>

          {/* BLOCK 3 */}
          <Row className="mt-3">
            <Row>
              <Col>
                <Card>
                  <Card.Header><h3>Resultados</h3></Card.Header>
                  <Card.Body>
                    <div id="demo" className="console">
                      Aquí se muestran los resultados
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Row>
        </Container>

      </Form>
    </>
  )
}
