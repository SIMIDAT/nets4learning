import { useState } from 'react'
import { Trans } from 'react-i18next'
import { Button, Col, Form, Row } from 'react-bootstrap'
import * as tfjs from '@tensorflow/tfjs'

import * as _Types from '@core/types'
import { trackEvent } from '@core/analytics'
import { VERBOSE } from '@/CONSTANTS'
import ModelReviewRegressionPredictForm from './ModelReviewRegressionPredictForm'
import RegressionPredictionInfo from './RegressionPredictionInfo'

type ModelReviewRegressionPredictProps_t = {
  customModel  : _Types.CustomModel_t,
  dataset      : _Types.DatasetProcessed_t,
  prediction   : _Types.StatePrediction_t,
  setPrediction: React.Dispatch<React.SetStateAction<_Types.StatePrediction_t>>
  /** Valor real de la instancia del formulario, si es una del conjunto de datos sin cambios */
  actualValue? : number | null
}

export default function ModelReviewRegressionPredict(props: ModelReviewRegressionPredictProps_t) {
  const {
    customModel,
    dataset,
    prediction,
    setPrediction,
    actualValue = null,
  } = props
  // El valor real de lo que se predijo: si después se edita el formulario, el resultado sigue siendo de esa instancia
  const [resultActual, setResultActual] = useState<number | null>(null)

  const handleSubmit_Predict = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (customModel.model === undefined) {
      console.error('Error: customModel.model is undefined')
      return
    }
    const _model = customModel.model
    const vector = prediction.input_3_dataframe_scaling.values[0] as number[]
    // Si el modelo tiene varias salidas, se usa la primera
    const output = tfjs.tidy(() => {
      const result = _model.predict(tfjs.tensor2d([vector]))
      return Array.isArray(result) ? result[0] : result
    })
    // Lectura asíncrona: con WebGPU las síncronas detienen la GPU
    const result = Array.from(await output.data<'float32'>())
    output.dispose()

    setResultActual(actualValue)
    setPrediction((prevState) => ({
      ...prevState,
      result: result
    }))
    trackEvent('predict', { input: 'form' })
  }

  if (VERBOSE) console.debug('ModelReviewLinearRegressionPredict')
  return (
    <Form onSubmit={handleSubmit_Predict} noValidate>

      <ModelReviewRegressionPredictForm customModel={customModel}
        dataset={dataset}
        prediction={prediction}
        setPrediction={setPrediction} />

      <Row className={'mt-2'}>
        <Col>
          <div className={'d-grid gap-2'} data-guide={'predict'}>
            <Button variant={'primary'}
              size={'lg'}
              type={'submit'}
              disabled={customModel?.model === undefined}>
              <Trans i18nKey={'pages.playground.1-regression.predict.button-submit'} />
            </Button>
          </div>
        </Col>
      </Row>

      <hr />

      <div data-guide={'result'}>
        <RegressionPredictionInfo prediction={prediction}
          targetName={dataset?.data_processed?.column_name_target}
          actual={resultActual} />
      </div>

    </Form>
  )
}
