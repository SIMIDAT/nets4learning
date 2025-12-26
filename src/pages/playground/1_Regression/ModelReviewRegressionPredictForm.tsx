import styles from '@pages/playground/1_Regression/Regression.module.css'
import { Row, Col, Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'

import * as _Types from '@core/types'
import { VERBOSE } from '@/CONSTANTS'
import { DataFrameSetCellValue } from '@core/dataframe/DataFrameUtils'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

/**
 * @typedef ModelReviewRegressionPredictFormProps_t
 * @property {_Types.CustomModel_t} customModel
 * @property {_Types.DatasetProcessed_t} dataset
 * @property {_Types.StatePrediction_t} prediction
 * @property {React.Dispatch<React.SetStateAction<_Types.StatePrediction_t>>} setPrediction 
 */
type ModelReviewRegressionPredictFormProps_t = {
  customModel  : _Types.CustomModel_t,
  dataset      : _Types.DatasetProcessed_t,
  prediction   : _Types.StatePrediction_t,
  setPrediction: React.Dispatch<React.SetStateAction<_Types.StatePrediction_t>>
}

/**
 * 
 * @param {ModelReviewRegressionPredictFormProps_t} props 
 * @returns 
 */
export default function ModelReviewRegressionPredictForm(props: ModelReviewRegressionPredictFormProps_t) {
  const { customModel, dataset, prediction, setPrediction } = props

  const { t } = useTranslation()

  // const [ready, setReady] = useState(false)

  // useEffect(() => {
  //   setReady(!!(
  //     dataset
  //     && dataset.dataframe_processed
  //     && prediction
  //     && prediction.input_1_dataframe_original.values.length > 0
  //     && customModel
  //     && customModel.model
  //   ))
  // }, [dataset, prediction, customModel, setReady])
  const ready = !!(
    dataset &&
    dataset.dataframe_processed &&
    prediction &&
    prediction.input_1_dataframe_original &&
    prediction.input_1_dataframe_original.values &&
    prediction.input_1_dataframe_original.values.length > 0 &&
    customModel &&
    customModel.model
  )




  /**
   * 
   * @param {_Types.DatasetProcessed_t} dataset
   * @param {string} column_name 
   * @returns 
   */
  const isDisabled = (dataset: _Types.DatasetProcessed_t, column_name: string) => {
    if (dataset === undefined || dataset.data_processed === undefined) {
      return true
    }
    if (dataset.data_processed.column_name_target === column_name) {
      return true
    }
    if (dataset.dataset.some(v => v.column_name === column_name)) {
      return false
    }
    return true
  }

  /**
   * 
   * @param {_Types.DatasetProcessed_t} dataset
   * @param {string} column_name 
   * @returns 
   */
  const getColor = (dataset: _Types.DatasetProcessed_t, column_name: string) => {
    if (dataset === undefined || dataset.data_processed === undefined) {
      console.error('Error: dataset or dataset.data_processed is undefined')
      return
    }
    if (dataset.data_processed.column_name_target === column_name) {
      return styles.border_green
    }
    if (dataset.dataset.some(v => v.column_name === column_name)) {
      return styles.border_blue
    }
    return styles.border_red
  }

  const handleChange_Parameter_int32_float32 = (column_name: string, new_value: number | string) => {
    setPrediction((prevState) => {
      if (dataset.data_processed === undefined) {
        console.error('Error: dataset.data_processed is undefined')
        return prevState
      }
      const newInputDataFrameOriginal = DataFrameSetCellValue(prediction.input_1_dataframe_original, 0, column_name, new_value)
      const newInputDataFrameProcessed = DataFrameSetCellValue(prediction.input_1_dataframe_processed, 0, column_name, new_value)
      const newInputDataFrameEncoding = DataFrameSetCellValue(prediction.input_2_dataframe_encoding, 0, column_name, new_value)
      // const newInputDataFrameScaling = DataFrameSetCellValue(prediction.input_2_dataframe_encoding, 0, column_name, new_value)
      const newInputDataFrameScaling = dataset.data_processed.scaler.transform(newInputDataFrameEncoding)

      return {
        ...prevState,
        input_1_dataframe_original : newInputDataFrameOriginal,
        input_1_dataframe_processed: newInputDataFrameProcessed,
        input_2_dataframe_encoding : newInputDataFrameEncoding,
        input_3_dataframe_scaling  : newInputDataFrameScaling
      }
    })
  }

  const handleChange_Parameter_string = (column_name: string, new_value: string) => {
        setPrediction((prevState) => {
      if (dataset.data_processed === undefined) {
        console.error('Error: dataset.data_processed is undefined')
        return prevState
      }
      const [new_value_encoding] = dataset.data_processed.encoders[column_name].encoder.transform([new_value])
      const newInputDataFrameOriginal = DataFrameSetCellValue(prediction.input_1_dataframe_original, 0, column_name, new_value)
      const newInputDataFrameProcessed = DataFrameSetCellValue(prediction.input_1_dataframe_processed, 0, column_name, new_value)
      const newInputDataFrameEncoding = DataFrameSetCellValue(prediction.input_2_dataframe_encoding, 0, column_name, new_value_encoding)
      const newInputDataFrameScaling = dataset.data_processed.scaler.transform(newInputDataFrameEncoding)
      return {
        ...prevState,
        input_1_dataframe_original : newInputDataFrameOriginal,
        input_1_dataframe_processed: newInputDataFrameProcessed,
        input_2_dataframe_encoding : newInputDataFrameEncoding,
        input_3_dataframe_scaling  : newInputDataFrameScaling
      }
    })
  }



  if (VERBOSE) console.debug('render ModelReviewLinearRegressionPredictForm')
  return <>
    <Row>
      {!ready && <>
        <WaitingPlaceholder i18nKey_title={'Waiting'} />
      </>}
    </Row>
    <Row xs={2} sm={2} md={3} lg={4} xl={4} xxl={4}>
      {ready && <>
        {dataset
          .dataframe_processed
          .columns
          .map((column_name: string, index: number) => {
            const column_type = (/** @type {_Types.DataFrameColumnType_t} */(dataset.dataframe_original[column_name].dtype))
            const column_value = prediction.input_1_dataframe_original[column_name].values[0]

            switch (column_type) {
              case 'int32': {
                return <Col key={'form' + index} className={'mb-md-3'}>
                  <Form.Group controlId={'regression-form-' + column_name}>
                    <Form.Label><small>{t('pages.playground.form.parameter')}: <b>{column_name}</b></small></Form.Label>
                    <Form.Control type="number"
                      size={'sm'}
                      placeholder={t('pages.playground.form.parameter-integer')}
                      min={0}
                      value={column_value}
                      className={getColor(dataset, column_name)}
                      disabled={isDisabled(dataset, column_name)}
                      onChange={($event) => handleChange_Parameter_int32_float32(column_name, $event.target.value)} />
                    <Form.Text className="text-muted"><small>Dtype: {column_type}</small></Form.Text>
                  </Form.Group>
                </Col>
              }
              case 'float32': {
                return <Col key={'form' + index} className={'mb-md-3'}>
                  <Form.Group controlId={'regression-form-' + column_name}>
                    <Form.Label><small>{t('pages.playground.form.parameter')}: <b>{column_name}</b></small></Form.Label>
                    <Form.Control type="number"
                      size={'sm'}
                      placeholder={t('pages.playground.form.parameter-decimal')}
                      min={0}
                      value={column_value}
                      className={getColor(dataset, column_name)}
                      disabled={isDisabled(dataset, column_name)}
                      onChange={($event) => handleChange_Parameter_int32_float32(column_name, $event.target.value)} />
                    <Form.Text className="text-muted"><small>Dtype: {column_type}</small></Form.Text>
                  </Form.Group>
                </Col>
              }
              case 'string': {
                const labelEncoder = new dfd.LabelEncoder()
                labelEncoder.fit(dataset.dataframe_original[column_name])
                return <Col key={'form' + index} className={'mb-md-3'}>
                  <Form.Group controlId={'regression-form-' + column_name}>
                    <Form.Label><small>{t('pages.playground.form.parameter')}: <b>{column_name}</b></small></Form.Label>
                    <Form.Select aria-label={'regression-form-' + column_name}
                      size={'sm'}
                      value={column_value}
                      className={getColor(dataset, column_name)}
                      disabled={isDisabled(dataset, column_name)}
                      onChange={e => handleChange_Parameter_string(column_name, e.target.value)}>
                      <>
                        {Object.entries(labelEncoder.classes)
                          .map(([text, _value]: [string, unknown], index_options: number) => {
                            return <option key={index_options} value={text}>{text}</option>
                          })
                        }
                      </>
                    </Form.Select>
                    <Form.Text className="text-muted"><small>Dtype: {column_type}</small></Form.Text>
                  </Form.Group>
                </Col>
              }
              default:
                return <>default</>
            }

          }

          )}
      </>}
    </Row>
  </>

}