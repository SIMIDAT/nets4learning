import styles from '@pages/playground/1_Regression/Regression.module.css'
import React, { useContext } from 'react'
import { Row, Col, Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'

import * as _Types from '@core/types'
import { VERBOSE } from '@/CONSTANTS'
import { DataFrameSetCellValue } from '@/core/dataframe/DataFrameUtils'
import RegressionContext from '@/context/RegressionContext'

/**
 * @typedef {Object} RegressionPredictionFormProps_t
 * @property {_Types.CustomModelGenerated_t} generatedModel
 * @property {Object} [dynamicObject = {}]
 */

/**
 * 
 * @param {RegressionPredictionFormProps_t} props 
 * @returns 
 */
export default function RegressionPredictionForm ({ generatedModel }) {

  const {
    prediction,
    setPrediction
  } = useContext(RegressionContext)

  const { t } = useTranslation()

  const getColor = (generatedModel, column_name) => {
    if (generatedModel.params_features.Y_target === column_name) {
      return styles.border_green
    }
    if (generatedModel.params_features.X_features.has(column_name)) {
      return styles.border_blue
    }
    return styles.border_red
  }
  
  const isDisabled = (generatedModel, column_name) => {
    if (generatedModel.params_features.Y_target === column_name) {
      return true
    }
     if (generatedModel.params_features.X_features.has(column_name)) {
      return false
    }
    return true
  }

  const handleChange_EditInstanceEncoding = (column_name, new_value) => {
    const [new_value_encoding] = generatedModel.dataset_processed.data_processed.encoders[column_name].encoder.transform([new_value])
    const newInputDataFrameOriginal = DataFrameSetCellValue(prediction.input_1_dataframe_original, 0, column_name, new_value)
    const newInputDataFrameProcessed = DataFrameSetCellValue(prediction.input_1_dataframe_processed, 0, column_name, new_value)
    const newInputDataFrameEncoding = DataFrameSetCellValue(prediction.input_2_dataframe_encoding, 0, column_name, new_value_encoding)
    const newInputDataFrameScaling = generatedModel.dataset_processed.data_processed.scaler.transform(newInputDataFrameEncoding)
    
    setPrediction((prevState) => {
      return {
        ...prevState,
        input_1_dataframe_original : newInputDataFrameOriginal,
        input_1_dataframe_processed: newInputDataFrameProcessed,
        input_2_dataframe_encoding : newInputDataFrameEncoding,
        input_3_dataframe_scaling  : newInputDataFrameScaling
      }
    })
  }
  
  const handleChange_EditInstance = (column_name, new_value) => {
    setPrediction((prevState) => {
      const newInputDataFrameOriginal = DataFrameSetCellValue(prediction.input_1_dataframe_original, 0, column_name, new_value)
      const newInputDataFrameProcessed = DataFrameSetCellValue(prediction.input_1_dataframe_processed, 0, column_name, new_value)
      const newInputDataFrameEncoding = DataFrameSetCellValue(prediction.input_2_dataframe_encoding, 0, column_name, new_value)
      // const newInputDataFrameScaling = DataFrameSetCellValue(prediction.input_2_dataframe_encoding, 0, column_name, new_value)
      const newInputDataFrameScaling = generatedModel.dataset_processed.data_processed.scaler.transform(newInputDataFrameEncoding)

      return {
        ...prevState,
        input_1_dataframe_original : newInputDataFrameOriginal,
        input_1_dataframe_processed: newInputDataFrameProcessed,
        input_2_dataframe_encoding : newInputDataFrameEncoding,
        input_3_dataframe_scaling  : newInputDataFrameScaling
      }
    })
  }

  if (VERBOSE) console.debug('render RegressionPredictionForm')
  return <Row xs={1} sm={2} md={3} lg={4} xl={4} xxl={4}>
    {generatedModel
      .dataset_processed
      .dataframe_processed
      .columns
      .map((column_name, index) => {
      const column_type = generatedModel.dataset_processed.dataframe_original[column_name].dtype
      const column_value = prediction.input_1_dataframe_original[column_name].values[0]
      
      switch (column_type) {
        case 'int32': {
          return <Col key={index} className={'mb-md-3'}>
            <Form.Group controlId={'regression-dynamic-form-' + column_name}>
              <Form.Label><small>{t('pages.playground.form.parameter')}: <b>{column_name}</b></small></Form.Label>
              <Form.Control type="number"
                            step={1}
                            size={'sm'}
                            placeholder={'int32'}
                            value={column_value}
                            className={getColor(generatedModel, column_name)}
                            disabled={isDisabled(generatedModel, column_name)}
                            onChange={e => handleChange_EditInstance(column_name, parseInt(e.target.value))} />
              <Form.Text className="text-muted"><small>Dtype: {column_type}</small></Form.Text>
            </Form.Group>
          </Col>
        }
        case 'float32': {
          return <Col key={index} className={'mb-md-3'}>
            <Form.Group controlId={'regression-dynamic-form-' + column_name}>
              <Form.Label><small>{t('pages.playground.form.parameter')}: <b>{column_name}</b></small></Form.Label>
              <Form.Control type="number"
                            step={0.1}
                            placeholder={'float32'}
                            size={'sm'}
                            value={column_value}
                            className={getColor(generatedModel, column_name)}
                            disabled={isDisabled(generatedModel, column_name)}
                            onChange={e => handleChange_EditInstance(column_name, parseFloat(e.target.value))} />
              <Form.Text className="text-muted"><small>Dtype: {column_type}</small></Form.Text>
            </Form.Group>
          </Col>
        }
        case 'string': {
          const labelEncoder = new dfd.LabelEncoder()
          labelEncoder.fit(generatedModel.dataset_processed.dataframe_original[column_name])
          return <Col key={index} className={'mb-md-3'}>
            <Form.Group controlId={'regression-dynamic-form-' + column_name}>
              <Form.Label><small>{t('pages.playground.form.parameter')}: <b>{column_name}</b></small></Form.Label>
              <Form.Select aria-label={'regression-dynamic-form-' + column_name}
                           size={'sm'}
                           value={column_value}
                           className={getColor(generatedModel, column_name)}
                           disabled={isDisabled(generatedModel, column_name)}
                           onChange={e => handleChange_EditInstanceEncoding(column_name, e.target.value)}>
                <>
                  {Object.entries(labelEncoder.classes)
                    .map(([text, _value], index_options) => {
                        return <option key={index_options} value={text}>{text}</option>
                    })
                  }
                </>
              </Form.Select>
              <Form.Text className="text-muted"><small>Dtype: {column_type}</small></Form.Text>
            </Form.Group>
          </Col>
        }
        default: {
          return <Col key={index} className="mb-3">
            Error, option not valid
          </Col>
        }
      }
    })}
  </Row>
}
