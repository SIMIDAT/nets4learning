import React, { useEffect, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { Card } from 'react-bootstrap'
import Plot from 'react-plotly.js'

import { PLOTLY_CONFIG_DEFAULT } from '@/CONSTANTS_ChartsJs'

import * as LinearRegressionModelExample from '@core/LinearRegressionModelExample'
import { VERBOSE } from '@/CONSTANTS'

export default function LinearRegressionPredictionExample () {

  const refPlotJS = useRef()

  const [dataPredictionExample, setDataPredictionExample] = useState({
    dataOriginal_label : '',
    dataOriginal_x     : [],
    dataOriginal_y     : [],
    dataPredicted_label: '',
    dataPredicted_x    : [],
    dataPredicted_y    : []
  })

  const updateDataPrediction = async () => {
    // const filename = process.env.REACT_APP_PATH + '/datasets/01-linear-regression/auto-mpg/auto-mpg.csv'
    // const columns = { x_name: 'horsepower', y_name: 'mpg' }
    const filename = process.env.REACT_APP_PATH + '/datasets/01-linear-regression/salary/salary.csv'
    const columns = { x_name: 'YearsExperience', y_name: 'Salary' }
    const { original, predicted } = await LinearRegressionModelExample.run(filename, columns)

    const original_x = original.map((v) => v.x)
    const original_y = original.map((v) => v.y)
    const predicted_x = predicted.map((v) => v.x)
    const predicted_y = predicted.map((v) => v.y)

    setDataPredictionExample({
      dataOriginal_label : columns.x_name,
      dataOriginal_x     : original_x,
      dataOriginal_y     : original_y,
      dataPredicted_label: columns.y_name,
      dataPredicted_x    : predicted_x,
      dataPredicted_y    : predicted_y
    })
  }

  useEffect(() => {
    updateDataPrediction().then(_ => undefined)
  }, [])

  if (VERBOSE) console.debug('render LinearRegressionPrediction')
  return <>
    <Card>
      <Card.Header>
        <h3><Trans i18nKey={'pages.playground.1-linear-regression.prediction'} /></h3>
      </Card.Header>
      <Card.Body>
        <Plot ref={refPlotJS}
              data={[
                {
                  name  : dataPredictionExample.dataOriginal_label,
                  x     : dataPredictionExample.dataOriginal_x,
                  y     : dataPredictionExample.dataOriginal_y,
                  type  : 'scatter',
                  mode  : 'markers',
                  marker: { color: 'blue' },
                },
                {
                  name  : dataPredictionExample.dataPredicted_label,
                  x     : dataPredictionExample.dataPredicted_x,
                  y     : dataPredictionExample.dataPredicted_y,
                  type  : 'scatter',
                  mode  : 'lines+markers',
                  marker: { color: 'red' },
                },
              ]}
              useResizeHandler={true}
              style={PLOTLY_CONFIG_DEFAULT.STYLES}
              layout={{ title: '', ...PLOTLY_CONFIG_DEFAULT.LAYOUT }}
        />
      </Card.Body>
    </Card>
  </>
}
