// @ts-nocheck
import React, { useState } from 'react'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import * as tfvis from '@tensorflow/tfjs-vis'
import * as tfjs from '@tensorflow/tfjs'
import * as dfd from 'danfojs'
import MLR from 'ml-regression-multivariate-linear'

import { VERBOSE } from '@/CONSTANTS'
import AlertHelper from '@utils/alertHelper'
import TestComponentEasy from '@components/TestComponentEasy'
import { MODEL_1_SALARY, MODEL_2_AUTO_MPG, MODEL_3_HOUSING_PRICES } from '@/DATA_MODEL'
import { createRegressionCustomModel } from '@/core/controller/01-regression/RegressionModelController'
import { DataFrameSetCellValue } from '@/core/dataframe/DataFrameUtils'

export default function TestPageEasy () {


  const [counter, setCounter] = useState(0)
  const { t } = useTranslation()

  const handleClick_init = async () => {
    // const filename = process.env.REACT_APP_PATH + '/datasets/01-regression/auto-mpg/auto-mpg.csv'

  }

  const handleClick_dataframe = () => {
    let data = [
      [0, 2, 4, 'b'],
      [360, 180, 360, 'a'],
      [2, 4, 6, 'c']
    ]
    let df = new dfd.DataFrame(data)
    let df_vacio = new dfd.DataFrame([], { columns: df.columns, dtypes: df.dtypes })
    let new_df = df_vacio.append([[20, 40, 60, 'd']], [0])
    new_df.print()
  }

  const handleClick_dataframeEditCell = () => {
    // Crea un DataFrame de ejemplo
    let df = new dfd.DataFrame({
      'Nombre': ['Carlos', 'Ana', 'Pedro'],
      'Edad'  : [28, 22, 34],
      'Peso'  : [28, 22, 34]
    })
    const column_name = 'Edad'

    const df2 = DataFrameSetCellValue(df, 0, column_name, 300)
    df2.print()
  }

  const handleClick_toggle = () => {
    tfvis.visor().toggle()
  }

  const handleClick_Simple = () =>{
    const x = [
      [0, 0],
      [1, 2],
      [2, 3],
      [3, 4]
    ]
    // Y0 = X0 * 2, Y1 = X1 * 2, Y2 = X0 + X1
    const y = [
      [0, 0, 0],
      [2, 4, 3],
      [4, 6, 5],
      [6, 8, 12]
    ]
    const mlr = new MLR(x, y)
    console.log(mlr.predict([3, 3]))
  }
  
  const handleClick_TFJSMultiple = async () =>{
    // Sample data: let's assume X1, X2 are independent variables and Y is the dependent variable.
    // const X1 = [1, 2, 3, 4]
    // const X2 = [2, 2, 4, 3]
    const X = [[1,2], [2,2], [3,4], [4,3], [5,5]]
    const Y = [2,     4,      6,    8,     12]

    // Convert data to tensors
    const xs = tfjs.tensor2d(X)
    const ys = tfjs.tensor1d(Y)

    // Build a model
    const model = new tfjs.Sequential()
    // inputShape is 2 because we have 2 independent variables
    model.add(tfjs.layers.dense({units: 64, inputShape: [2]})) 
    model.add(tfjs.layers.dense({units: 32, activation: 'relu'})) 
    model.add(tfjs.layers.dense({units: 16, activation: 'relu'})) 
    model.add(tfjs.layers.dense({units: 8, activation: 'relu'})) 
    model.add(tfjs.layers.dense({units: 1, activation: 'linear'})) 

    // Compile the model
    model.compile({loss: 'meanSquaredError', optimizer: 'sgd'})

    await tfvis.show.modelSummary({
      name: 'Model Summary',
      tab : 'Example 1',
    // @ts-ignore
    }, model)

    // Train the model
    await model.fit(xs, ys, { 
      epochs   : 100,
      callbacks: tfvis.show.fitCallbacks(
        { 
          name: 'Training Performance' ,
          tab : 'Example 1',
        },
        ['loss', 'val_loss', 'acc', 'val_acc'],
        { 
          callbacks: ['onEpochEnd', 'onBatchEnd'] 
        }
      )
    })
    // @ts-ignore
    const p = model.predict(tfjs.tensor2d([[5, 5], [6, 7]])).dataSync() 
    console.log({ predict_1: p })
  }
  
  const handleClick_TFJSMultiple_2 = async () => {
    // Generate a synthetic dataset
    const generateDataset = (numSamples) => {
      const sizes = Array.from(
        { length: numSamples },
        (_v, i) => i + 500
      )
      const bedrooms = Array.from(
        { length: numSamples },
        (_v, i) => Math.floor(i * 5) + 1
      )
      const distances = Array.from(
        { length: numSamples },
        (_v, i) => i + 20
      )

      const prices = sizes.map(
        (size, i) =>
          size +
          bedrooms[i] -
          distances[i] +
          i 
      )

      return { sizes, bedrooms, distances, prices }
    }

    const numSamples = 1000
    const { sizes, bedrooms, distances, prices } = generateDataset(numSamples)

    // Store the generated dataset for inspection
    const datasetForInspection = { sizes, bedrooms, distances, prices }
    console.debug({ datasetForInspection })

    // Create tensors from the data
    const xs = tfjs
      .tensor2d([sizes, bedrooms, distances], [3, numSamples])
      .transpose()
    const ys = tfjs.tensor2d(prices, [numSamples, 1])

    // Model architecture
    const model = new tfjs.Sequential()
    model.add(tfjs.layers.dense({ units: 64, inputShape: [3], activation: 'relu' }))
    model.add(tfjs.layers.dense({ activation: 'relu', units: 32 }))
    model.add(tfjs.layers.dense({ activation: 'relu', units: 16 }))
    model.add(tfjs.layers.dense({ activation: 'relu', units: 8 }))
    model.add(tfjs.layers.dense({ activation: 'linear', units: 1 }))

    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' })

    await tfvis.show.modelSummary({
      name: 'Model Summary',
      tab : 'Example 2',
    // @ts-ignore
    }, model)

    // Training
    await model.fit(xs, ys, {
      epochs   : 10, 
      callbacks: tfvis.show.fitCallbacks(
        { 
          name: 'Training Performance' ,
          tab : 'Example 2',
        },
        ['loss', 'val_loss', 'acc', 'val_acc'],
        { 
          callbacks: ['onEpochEnd', 'onBatchEnd'] 
        }
      )
     })
    // Model is trained
    // You can use the trained model to make predictions
    const to_predict_size_bedroom_distance = [500, 1, 0]
    const prediction = model.predict( tfjs.tensor2d([to_predict_size_bedroom_distance]) )
    // @ts-ignore
    console.log('Predicted Price:', { predict_2: prediction.dataSync() })
  }

  const handleClick_TFJSMultiple_3 = async () => {
    const model_salary = new MODEL_1_SALARY(t)
    const datasets_salary = await model_salary.DATASETS()
    console.log({ datasets_salary })
    const salary = datasets_salary[0]
    const { scaler, X, y } = salary.data_processed
    console.log({ scaler, X, y })
    

    const {model} = await createRegressionCustomModel({
      dataset_processed: salary,
      learningRate     : 0.01,
      momentum         : 0,
      testSize         : 0.3,
      numberOfEpoch    : 40,
      idOptimizer      : 'sgd',
      idLoss           : 'losses-meanSquaredError',
      idMetrics        : 'meanSquaredError',
      layerList        : [
        {units: 64, activation: 'sigmoid'},
        {units: 1, activation: 'linear'},
      ],

    })

    console.log({ model })
    const years = 7.7200
    
    const years_n = scaler.transform([years])
    console.log(years_n)

    console.log({ 
      // @ts-ignore
      predict_3: model.predict( tfjs.tensor2d([years_n])).dataSync()[0],
      target   : 13 
    })
  }
  
  const handleClick_testLabelEncoder = () => {
    const data = {
      'B': ['bval1', 'bval2', 'bval3', 'bval4'],
      'C': [10, 20, 30, 40],
      'D': [1.2, 3.45, 60.1, 45],
      'E': ['test', 'train', 'test', 'train']
    }
    const df = new dfd.DataFrame(data)
    const encoder = new dfd.LabelEncoder()
    encoder.fit(df.values)
    console.log({c: encoder.classes})
    console.log({c: encoder.$labels})
  }


  const handleClick_TFJSMultiple_4 = async () => {
    const model_auto = new MODEL_2_AUTO_MPG(t)
    const datasets_auto = await model_auto.DATASETS()
    console.log({ datasets_auto })
    const auto = datasets_auto[0]
    const { scaler, X, y } = auto.data_processed
    console.log({ scaler, X, y })
    
    const {model} = await createRegressionCustomModel({
      dataset_processed: auto,
      name_model       : 'Auto MPG',
      learningRate     : 0.01,
      testSize         : 0.3,
      numberOfEpoch    : 50,
      idOptimizer      : 'sgd',
      idLoss           : 'losses-meanSquaredError',
      idMetrics        : 'meanSquaredError',
      layerList        : [
        {units: 64, activation: 'sigmoid'},
        {units: 1,  activation: 'linear'},
      ],
    })

    console.log({ model })
    const example_instance_1 = [2, 250, 100, 3329, 15.5, 1  ]
    const example_instance_2 = [6, 198, 95,  2833, 15.5, 70 ]
    const example_instance_3 = [8, 350, 175, 4100, 13,   73 ]
    
    const example_instance_n1 = scaler.transform(example_instance_1)
    const example_instance_n2 = scaler.transform(example_instance_2)
    const example_instance_n3 = scaler.transform(example_instance_3)

    console.log({ 
      // @ts-ignore
      predict_auto_1: model.predict( tfjs.tensor2d([example_instance_n1])).dataSync()[0],
      target_auto_1 : 17, 
      // @ts-ignore
      predict_auto_2: model.predict( tfjs.tensor2d([example_instance_n2])).dataSync()[0],
      target_auto_2 : 24,
      // @ts-ignore
      predict_auto_3: model.predict( tfjs.tensor2d([example_instance_n3])).dataSync()[0],
      target_auto_3 : 13,
    })
  }
  

  const handleClick_TFJSMultiple_5 = async () => {
    const model_housing_prices = new MODEL_3_HOUSING_PRICES(t)
    const datasets_housing_prices = await model_housing_prices.DATASETS()
    console.log({ datasets_housing_prices })
    const housing_prices = datasets_housing_prices[1]
    const { scaler, encoders, X, y } = housing_prices.data_processed
    console.log({ scaler, encoders, X, y })
    
    const {model} = await createRegressionCustomModel({
      name_model       : 'Housing Prices',
      dataset_processed: housing_prices,
      learningRate     : 0.02,
      testSize         : 0.3,
      numberOfEpoch    : 50,
      idOptimizer      : 'adam',
      idLoss           : 'losses-meanSquaredError',
      idMetrics        : ['meanSquaredError', 'meanAbsoluteError'],
      layerList        : [
        { units: 20, activation: 'relu' },
        { units: 20, activation: 'relu' },
        { units: 20, activation: 'relu' },
        { units: 20, activation: 'relu' },
        { units: 1,  activation: 'linear'  },
      ],
    })


    console.log({ model })
    // California
    const _example_instance_c = [2.4038, 41, 535, 123, 317, 119, 37.85, -122.28]
    const example_instance_b1 = [0.00632, 18.00, 2.310,    0,    0.5380, 6.5750,   65.20,  4.0900, 1,  296.0,  15.30,  4.98]
    
    const data = [
      [0.00632, 18.00, 2.310,    0,    0.5380, 6.5750,   65.20,  4.0900, 1,  296.0,  15.30,  4.98],
      [0.02731, 0.00,  7.070,    0,    0.4690, 6.4210,   78.90,  4.9671, 2,  242.0,  17.80,  9.14],
      [0.02729, 0.00,  7.070,    0,    0.4690, 7.1850,   61.10,  4.9671, 2,  242.0,  17.80,  4.03],
      [0.03237, 0.00,  2.180,    0,    0.4580, 6.9980,   45.80,  6.0622, 3,  222.0,  18.70,  2.94]
    ]
    const columns = ['CRIM', 'ZN', 'INDUS', 'CHAS', 'NOX', 'RM', 'AGE', 'DIS', 'RAD', 'TAX', 'PTRATIO', 'LSTAT']
    const df = new dfd.DataFrame(data, { columns: columns })
    
    const example_instance_df_n = scaler.transform(df)
    const example_instance_n = scaler.transform(example_instance_b1)
    console.log({example_instance_df_n, example_instance_n, p: model.predict(tfjs.tensor2d([example_instance_n])).dataSync()[0]})

    const list = []
    for (let index = 0; index < 10; index++) {
      const element_n = X.values[index]
      const element_o = y.values[index]
      const element_p  = model.predict(tfjs.tensor2d([element_n])).dataSync()[0]
      list.push([element_p, element_o])
    }
    console.log(list)
  }

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
              <div className="d-flex gap-2">
                <Button variant={'danger'}
                        onClick={async () => await AlertHelper.alertError('Error')}>Error</Button>
                <Button variant={'warning'}
                        onClick={async () => await AlertHelper.alertWarning('Waring')}>Waring</Button>
                <Button variant={'info'}
                        onClick={async () => await AlertHelper.alertInfo('Info')}>Info</Button>
                <Button variant={'success'}
                        onClick={async () => await AlertHelper.alertSuccess('Success')}>Success</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className='mt-3'>
        <Col>
          <Card>
            <Card.Header><h2>TestPage-Easy</h2></Card.Header>
            <Card.Body>
            <div className='d-grid gap-2 mt-3'>
                <Button variant={'primary'}
                        onClick={() => setCounter(c => c + 1)}>
                  Counter {counter}
                </Button>
                <hr />
                <TestComponentEasy />

                <Row>
                  <Col>
                    <Button variant={'outline-primary'} size={'sm'} onClick={handleClick_dataframe}>test Dataframe append</Button>
                  </Col>
                  <Col>
                    <Button variant={'outline-primary'} size={'sm'} onClick={handleClick_dataframeEditCell}>test Dataframe edit cell</Button>
                  </Col>
                  <Col>
                    <Button variant={'outline-primary'} size={'sm'} onClick={handleClick_testLabelEncoder}>test LabelEncoder</Button>
                  </Col>
                </Row>
                
                <TestComponentEasy />

                <Button variant={'outline-primary'}
                        size={'sm'}
                        onClick={handleClick_init}>
                  Init
                </Button>
                <Button variant={'outline-primary'}
                        size={'sm'}
                        onClick={handleClick_toggle}>
                  Toggle visor
                </Button>
                <hr />
                <Button variant={'outline-primary'}
                        size={'sm'}
                        onClick={handleClick_Simple}>
                  ml-regression-multivariate-linear
                </Button>
                <Button variant={'outline-primary'}
                        size={'sm'}
                        onClick={handleClick_TFJSMultiple}>
                  TFJS Multiple
                </Button>
                <Button variant={'outline-primary'}
                        size={'sm'}
                        onClick={handleClick_TFJSMultiple_2}>
                  TFJS Multiple 2
                </Button>
                <Button variant={'outline-primary'}
                        size={'sm'}
                        onClick={handleClick_TFJSMultiple_3}>
                  TFJS Multiple 3
                </Button>
                <Button variant={'outline-primary'}
                        size={'sm'}
                        onClick={handleClick_TFJSMultiple_4}>
                  TFJS Multiple 4
                </Button>
                <Button variant={'outline-primary'}
                        size={'sm'}
                        onClick={handleClick_TFJSMultiple_5}>
                  TFJS Multiple 5
                </Button>
              </div>

            </Card.Body>
          </Card>

        </Col>
      </Row>
    </Container>
  </>
}
