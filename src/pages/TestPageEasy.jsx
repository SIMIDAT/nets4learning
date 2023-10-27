import { useRef, useState } from 'react'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import * as tfvis from '@tensorflow/tfjs-vis'
import Plot from 'react-plotly.js'

import TestComponentEasy from '@components/TestComponentEasy'
import * as LinearRegressionModelExample from '@core/controller/01-linear-regression/LinearRegressionModelExample'
import { PLOTLY_CONFIG_DEFAULT } from '@/CONSTANTS_ChartsJs'
import AlertHelper from '@utils/alertHelper'
import { VERBOSE } from '@/CONSTANTS'

export default function TestPageEasy () {

  const refPlotly = useRef()

  const [dataPredictionList, setDataPredictionList] = useState([])

  const handleClick_init = async () => {
    // const filename = process.env.REACT_APP_PATH + '/datasets/01-linear-regression/auto-mpg/auto-mpg.csv'
    // const columns = { x_name: 'horsepower', y_name: 'mpg' }
    // const columns = { x_name: 'cylinders', y_name: 'mpg' }

    const filename = process.env.REACT_APP_PATH + '/datasets/01-linear-regression/salary/salary.csv'
    const columns = { x_name: 'YearsExperience', y_name: 'Salary' }

    // const filename = process.env.REACT_APP_PATH + '/datasets/01-linear-regression/boston-housing/housing.csv'
    // const columns = { x_name: 'LSTAT', y_name: 'MEDV' } // features = ['LSTAT', 'RM']

    const { original, predicted } = await LinearRegressionModelExample.run(filename, columns)

    const original_x = original.map((v) => v.x)
    const original_y = original.map((v) => v.y)
    const predicted_x = predicted.map((v) => v.x)
    const predicted_y = predicted.map((v) => v.y)

    const newPrediction_group = [
      {
        name  : columns.x_name,
        x     : original_x,
        y     : original_y,
        type  : 'scatter',
        mode  : 'markers',
        marker: { color: 'blue' },
      },
      {
        name  : columns.y_name,
        x     : predicted_x,
        y     : predicted_y,
        type  : 'scatter',
        mode  : 'lines+markers',
        marker: { color: 'red' },
      },
    ]
    setDataPredictionList((prevState) => [...prevState, ...newPrediction_group])
  }

  const handleClick_toggle = () => {
    tfvis.visor().toggle()
  }
  const [counter, setCounter] = useState(0)

  if (VERBOSE) console.debug('render TestPageEasy')
  return <>
    <Container className={'mt-3'}>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h2>Alerts</h2>
            </Card.Header>
            <Card.Body>
              <Button variant={'danger'}
                      onClick={async () => await AlertHelper.alertError('Error')}>Error</Button>
              <Button variant={'warning'}
                      onClick={async () => await AlertHelper.alertWarning('Waring')}>Waring</Button>
              <Button variant={'info'}
                      onClick={async () => await AlertHelper.alertInfo('Info')}>Info</Button>
              <Button variant={'success'}
                      onClick={async () => await AlertHelper.alertSuccess('Success')}>Success</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col>

          <Card>
            <Card.Header><h2>TestPage-Easy</h2></Card.Header>
            <Card.Body>
              <Button variant={'primary'}
                      onClick={() => setCounter(c => c + 1)}>
                Counter {counter}
              </Button>
              <hr />
              <TestComponentEasy />

              <Button variant={'outline-primary'}
                      size={'sm'}
                      onClick={handleClick_init}>
                Init
              </Button>
              <Button variant={'outline-primary'}
                      size={'sm'}
                      className={'ms-3'}
                      onClick={handleClick_toggle}>
                Toggle visor
              </Button>

              <Container>
                <Row>
                  <Col>
                    <Plot ref={refPlotly}
                          data={dataPredictionList}
                          useResizeHandler={true}
                          style={PLOTLY_CONFIG_DEFAULT.STYLES}
                          layout={{ title: 'A Fancy Plot', autoSize: true, height: undefined, width: undefined }}
                    />
                  </Col>
                </Row>
              </Container>

            </Card.Body>
          </Card>

        </Col>
      </Row>
    </Container>
  </>
}
