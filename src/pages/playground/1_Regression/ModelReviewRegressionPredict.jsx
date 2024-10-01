import { Trans } from 'react-i18next'
import { Button, Col, Form, Row } from 'react-bootstrap'
import * as tfjs from '@tensorflow/tfjs'

import * as _Types from '@core/types'
import { VERBOSE } from '@/CONSTANTS'
import ModelReviewRegressionPredictForm from './ModelReviewRegressionPredictForm'
import RegressionPredictionInfo from './RegressionPredictionInfo'

/**
 * @typedef ModelReviewRegressionPredictProps_t
 * @property {_Types.CustomModel_t} customModel  
 * @property {_Types.DatasetProcessed_t} dataset
 * @property {_Types.StatePrediction_t} prediction
 * @property {React.Dispatch<React.SetStateAction<_Types.StatePrediction_t>>} setPrediction
 */
/**
 * 
 * @param {ModelReviewRegressionPredictProps_t} props 
 * @returns 
 */
export default function ModelReviewRegressionPredict (props) {
  const {
    customModel, 
    dataset,
    prediction,
    setPrediction 
  } = props


  const handleSubmit_Predict = (event) => {
    event.preventDefault()

    const vector = prediction.input_3_dataframe_scaling.values[0]
    // @ts-ignore
    const tensor = tfjs.tensor2d([vector])
    const result = [(/**@type {tfjs.Tensor}*/(customModel.model.predict(tensor))).dataSync()]
    
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