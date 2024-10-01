import styles from '@pages/playground/1_Regression/Regression.module.css'
import { Row, Col, Form } from 'react-bootstrap'
import { Trans } from'react-i18next'
import * as _Types from '@core/types'
import { useEffect, useState } from 'react'

/**
 * 
 * @param {{prediction: _Types.StatePrediction_t}} props 
 * @returns 
 */
export default function RegressionPredictionInfo({ prediction }) {

  const [ready, setReady] = useState(false)

  useEffect(()=>{
    setReady(
      prediction 
      && prediction.input_1_dataframe_original 
      && Array.isArray(prediction.input_1_dataframe_original.values) 
      && prediction.input_1_dataframe_original.values.length >= 1
    )
  }, [prediction, prediction.input_1_dataframe_original])
  
  return <>
    {ready && <>
    <Row xs={2} sm={2} md={2} lg={2} xl={2} xxl={2}>
      <Col>
        <Form.Group controlId={'FormInputRaw'}>
          <Form.Label>
            <Trans i18nKey={'prediction-input'} />
          </Form.Label>
          <Form.Control size={'sm'}
                        disabled={true}
                        className={`${styles.border_blue} ${styles.monospace}`}
                        value={[prediction.input_1_dataframe_original.values[0]].join(',')} />
          <Form.Text className={'text-muted'}>
            <Trans i18nKey={'prediction-input-description'} />
          </Form.Text>
        </Form.Group>
      </Col>
      {/* 
      <Col>
        <Form.Group controlId={'FormInputProcessed'}>
          <Form.Label>
            <Trans i18nKey={'prediction-input-encoding'} />
          </Form.Label>
          <Form.Control size={'sm'}
                        disabled={true}
                        className={`${styles.border_pink} ${styles.monospace}`}
                        value={[prediction.input_2_dataframe_encoding.values[0]].join(',')} />
          <Form.Text className={'text-muted'}>
            <Trans i18nKey={'prediction-input-encoding-description'} />
          </Form.Text>
        </Form.Group>
      </Col>
      <Col>
        <Form.Group controlId={'FormInputProcessed'}>
          <Form.Label>
            <Trans i18nKey={'prediction-input-scaling'} />
          </Form.Label>
          <Form.Control size={'sm'}
                        disabled={true}
                        className={`${styles.border_pink} ${styles.monospace}`}
                        value={[prediction.input_3_dataframe_scaling.values[0]].join(',')} />
          <Form.Text className={'text-muted'}>
            <Trans i18nKey={'prediction-input-scaling-description'} />
          </Form.Text>
        </Form.Group>
      </Col> 
      */}
      <Col>
        <Form.Group controlId={'FormPredictionResult'}>
          <Form.Label>
            <Trans i18nKey={'prediction-result'} />
          </Form.Label>
          <Form.Control size={'sm'}
                        disabled={true}
                        className={`${styles.border_green} ${styles.monospace}`}
                        value={prediction.result.join(',')} />
          <Form.Text className={'text-muted'}>
            <Trans i18nKey={'prediction-result-description'} />
          </Form.Text>
        </Form.Group>
      </Col>
    </Row>
    </>}
  </>
}