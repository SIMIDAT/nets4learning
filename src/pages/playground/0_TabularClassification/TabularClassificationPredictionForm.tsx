import React, { useEffect } from 'react'
import { Row, Col, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { VERBOSE } from '@/CONSTANTS'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import * as _Types from '@core/types'

/**
 * @typedef {object} PropsTabularClassificationPredictionForm
 * @property {DatasetProcessed_t[]} datasets
 * @property {number} datasetIndex
 * @property {Array<_Types.N4LDataFrameType>} [inputDataToPredict = []]
 * @property {React.Dispatch<Array<_Types.N4LDataFrameType>>} setInputDataToPredict
 * @property {Array<_Types.N4LDataFrameType>} inputVectorToPredict
 * @property {React.Dispatch<Array<_Types.N4LDataFrameType>>} setInputVectorToPredict
 */
type PropsTabularClassificationPredictionForm = {
  datasets               : {index: number, datasets: _Types.DatasetProcessed_t[]},
  inputDataToPredict?    : Array<_Types.N4LDataFrameType>,
  setInputDataToPredict  : React.Dispatch<React.SetStateAction<Array<_Types.N4LDataFrameType>>>,
  inputVectorToPredict   : Array<_Types.N4LDataFrameType>,
  setInputVectorToPredict: React.Dispatch<React.SetStateAction<Array<_Types.N4LDataFrameType>>>,
}

/**
 * 
 * @param {PropsTabularClassificationPredictionForm} props 
 * @returns 
 */
export default function TabularClassificationPredictionForm(props: PropsTabularClassificationPredictionForm) {
  const {
    datasets,

    inputDataToPredict = [],
    setInputDataToPredict,

    inputVectorToPredict,
    setInputVectorToPredict
  } = props

  const prefix = 'pages.playground.generator.dynamic-form-dataset.'
  const { t } = useTranslation()

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect [datasets, datasetIndex, setInputDataToPredict]')
    const dataset_processed = datasets.datasets[datasets.index]
    const { dataframe_original, data_processed, dataset_transforms } = dataset_processed
    if (data_processed === undefined) {
      console.error('Error, data_processed is null')
      return
    }
    const { column_name_target } = data_processed
    const dataframe = DataFrameUtils.DataFrameDeepCopy(dataframe_original)
    dataframe.drop({ columns: [column_name_target], inplace: true })
    for (const { column_name, column_transform } of dataset_transforms) {
      if (column_transform === 'drop') {
        dataframe.drop({ columns: [column_name], inplace: true })
      }
    }
    const df = dataframe.head(1)
    const dataframe_row_default_data = df.values[0] as _Types.N4LDataFrameType[]
    setInputDataToPredict(dataframe_row_default_data)
  }, [datasets, setInputDataToPredict])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect [datasets, datasetIndex, inputDataToPredict, setInputVectorToPredict]')
    if (inputDataToPredict.length === 0) return
    const { data_processed } = datasets.datasets[datasets.index]
    if (data_processed === undefined) {
      console.error('Error, data_processed is null')
      return
    }
    const { encoders, X } = data_processed
    const _inputVectorToPredict = DataFrameUtils.DataFrameApplyEncodersVector(encoders, inputDataToPredict, X.columns)
    setInputVectorToPredict(_inputVectorToPredict)
  }, [datasets, inputDataToPredict, setInputVectorToPredict])

  // Cambiar el array de inputDataToPredict a un objeto que gestione mejor los tipos y los nombres de columnas
  const handleChange_Float = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, _column_name: string, index_column: number) => {
    setInputDataToPredict((prevState) => {
      return prevState.map((inputDataItem, index) => {
        if (index === index_column) {
          return parseFloat(e.target.value)
        }
        return inputDataItem
      })
    })
  }

  const handleChange_Number = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, _column_name: string, index_column: number) => {
    setInputDataToPredict((prevState) => {
      return prevState.map((inputDataItem, index) => {
        if (index === index_column) {
          return parseInt(e.target.value)
        }
        return inputDataItem
      })
    })
  }

  const handleChange_Select = (e: React.ChangeEvent<HTMLSelectElement>, _column_name: string, index_column: number) => {
    setInputDataToPredict((prevState) => {
      return prevState.map((inputDataItem, index) => {
        if (index === index_column) {
          return (e.target.value)
        }
        return inputDataItem
      })
    })
  }

  if (VERBOSE) console.debug('Render TabularClassificationPredictionForm')
  return <>
    <Row xs={2} sm={2} md={4} lg={6} xl={6} xxl={6}>
      {datasets.datasets[datasets.index].data_processed?.attributes?.map((attribute, index) => {
        // VALUES:
        // { name: "type1", type: "int32" },
        // { name: "type2", type: "float32"  },
        // { name: "type3", type: "string", options: [{value: "", text: ""] },
        const column_type = attribute.type
        const column_name = attribute.name
        const column_options = attribute.options

        if (!inputDataToPredict[index]) {
          if (VERBOSE) console.log('Error, inputDataToPredict[index] is undefined', { index, inputDataToPredict })
          return
        }

        switch (column_type) {
          case 'int32': {
            return <Col key={'form' + index} className={'mb-3'}>
              <Form.Group controlId={`FormControl_${column_name}__${index}`}>
                <Form.Label><b>{column_name}</b></Form.Label>
                <Form.Control
                  type="number"
                  inputMode={'numeric'}
                  size={'sm'}
                  placeholder={'int32'}
                  step={1}
                  value={Number(inputDataToPredict[index])}
                  onChange={(e) => handleChange_Number(e, column_name, index)} />
                <Form.Text className="text-muted">{column_name} | {column_type}</Form.Text>
              </Form.Group>
            </Col>
          }
          case 'float32': {
            return <Col key={'form' + index} className={'mb-3'}>
              <Form.Group controlId={`FormControl_${column_name}__${index}`}>
                <Form.Label><b>{column_name}</b></Form.Label>
                <Form.Control
                  type="number"
                  inputMode="decimal"
                  size={'sm'}
                  placeholder={'float32'}
                  step={0.01}
                  value={Number(inputDataToPredict[index])}
                  onChange={(e) => handleChange_Float(e, column_name, index)} />
                <Form.Text className="text-muted">{column_name} | {column_type}</Form.Text>
              </Form.Group>
            </Col>
          }
          case 'label-encoder': {
            return <Col key={'form' + index} className={'mb-3'}>
              <Form.Group controlId={`FormControl_${column_name}__${index}`}>
                <Form.Label><b>{column_name}</b></Form.Label>
                <Form.Select
                  aria-label="select"
                  size={'sm'}
                  value={String(inputDataToPredict[index])}
                  onChange={(e) => handleChange_Select(e, column_name, index)}>
                  {column_options
                    .map((option_value, option_index) => {
                      return <option key={column_name + '_option_' + option_index}
                        value={option_value.value}>
                        {option_value.text}
                      </option>
                    })}
                </Form.Select>
                <Form.Text className="text-muted">{column_name} | {column_type}</Form.Text>
              </Form.Group>
            </Col>
          }
          case 'string': {
            return <Col key={'form' + index} className={'mb-3'}>
              <p className={'text-center'}>Text: {inputDataToPredict[index]}</p>
            </Col>
          }
          case 'one-hot-encoder': {
            return <Col key={'form' + index} className={'mb-3'}>
              <p className={'text-center'}>OneHotEncoder</p>
            </Col>
          }
          default:
            // console.warn('Error, option not valid', { attribute })
            return <Col key={'form' + index} className={'mb-3'}>
              <p className={'text-center'}><b>{column_name}</b></p>
              <p className={'text-center'}>{column_type}</p>
            </Col>
        }
      })}
    </Row>
    <hr />
    <Row>
      <Col>
        <Form.Group className="mb-3" controlId={'formTestInput'}>
          <Form.Label><Trans i18nKey={prefix + 'test-input-data'} /></Form.Label>
          <Form.Control
            placeholder={t(prefix + 'input-data')}
            disabled={true}
            value={inputDataToPredict.join(',')} />
        </Form.Group>
      </Col>
      <Col>
        <Form.Group className="mb-3" controlId={'formTestVector'}>
          <Form.Label><Trans i18nKey={prefix + 'test-input-vector'} /></Form.Label>
          <Form.Control
            placeholder={t(prefix + 'input-vector')}
            disabled={true}
            value={inputVectorToPredict.join(',')} />
        </Form.Group>
      </Col>
    </Row>
  </>
}