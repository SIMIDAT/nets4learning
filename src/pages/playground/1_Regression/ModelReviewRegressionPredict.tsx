import { Trans } from 'react-i18next'
import { Button, Col, Form, Row } from 'react-bootstrap'
import * as tfjs from '@tensorflow/tfjs'

import * as _Types from '@core/types'
import { VERBOSE } from '@/CONSTANTS'
import ModelReviewRegressionPredictForm from './ModelReviewRegressionPredictForm'
import RegressionPredictionInfo from './RegressionPredictionInfo'

/**
 * @typedef ModelReviewRegressionPredictProps_t
 * 
 * @property {_Types.CustomModel_t} customModel  
 * @property {_Types.DatasetProcessed_t} dataset
 * @property {_Types.StatePrediction_t} prediction
 * @property {React.Dispatch<React.SetStateAction<_Types.StatePrediction_t>>} setPrediction
 */
type ModelReviewRegressionPredictProps_t = {
  customModel  : _Types.CustomModel_t,
  dataset      : _Types.DatasetProcessed_t,
  prediction   : _Types.StatePrediction_t,
  setPrediction: React.Dispatch<React.SetStateAction<_Types.StatePrediction_t>>
}

/**
 * 
 * @param {ModelReviewRegressionPredictProps_t} props 
 * @returns 
 */
export default function ModelReviewRegressionPredict(props: ModelReviewRegressionPredictProps_t) {
  const {
    customModel,
    dataset,
    prediction,
    setPrediction
  } = props


  const handleSubmit_Predict = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (customModel.model === undefined) {
      console.error('Error: customModel.model is undefined')
      return
    }
    const _model = customModel.model

    const vector = prediction.input_3_dataframe_scaling.values[0]
    // 2. Usamos tf.tidy para limpiar automáticamente los tensores intermedios
    const result = tfjs.tidy(() => {
      const tensor = tfjs.tensor2d([vector as number[]]);

      // 3. Forzamos el tipo o comprobamos si es un array
      const output = _model.predict(tensor);

      // Si el modelo tiene varias salidas, output será un array. 
      // Si solo tiene una, lo tratamos como Tensor único.
      const predictions = Array.isArray(output)
        ? output[0].dataSync()
        : output.dataSync();

      // 4. Convertimos a array de JS estándar
      return Array.from(predictions);
    });

    setPrediction((prevState) => ({
      ...prevState,
      result: result
    }))
  }

  if (VERBOSE) console.debug('ModelReviewLinearRegressionPredict')
  return (
    <Form onSubmit={handleSubmit_Predict} noValidate>

      <ModelReviewRegressionPredictForm customModel={customModel}
        dataset={dataset}
        prediction={prediction}
        setPrediction={setPrediction} />

      <hr />

      <Row>
        <Col>
          <div className={'d-grid gap-2'}>
            <Button variant={'primary'}
              size={'lg'}
              type={'submit'}>
              <Trans i18nKey={'Predict'} />
            </Button>
          </div>
        </Col>
      </Row>

      <hr />

      <RegressionPredictionInfo prediction={prediction} />

    </Form>
  )
}