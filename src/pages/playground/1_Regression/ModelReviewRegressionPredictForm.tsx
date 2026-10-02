import { useId, useMemo } from 'react'
import { Row, Col, Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import * as _Types from '@core/types'
import { VERBOSE } from '@/CONSTANTS'
import { DataFrameSetCellValue } from '@core/dataframe/DataFrameUtils'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

type ModelReviewRegressionPredictFormProps_t = {
  customModel  : _Types.CustomModel_t,
  dataset      : _Types.DatasetProcessed_t,
  prediction   : _Types.StatePrediction_t,
  setPrediction: React.Dispatch<React.SetStateAction<_Types.StatePrediction_t>>
}

type Field_t =
  | { name: string, type: 'int32' | 'float32', min: number, max: number }
  | { name: string, type: 'string', options: string[] }

/** Un campo por atributo que recibe el modelo, con su tipo y los valores que toma en el conjunto de datos */
export default function ModelReviewRegressionPredictForm(props: ModelReviewRegressionPredictFormProps_t) {
  const { customModel, dataset, prediction, setPrediction } = props

  const { t, i18n } = useTranslation()
  const formId = useId()

  const ready = !!(
    dataset?.dataframe_processed &&
    prediction?.input_1_dataframe_original?.values?.length > 0 &&
    customModel?.model
  )

  // Los atributos que recibe el modelo (las columnas de X): sin la variable objetivo, que es lo que se predice, ni
  // las columnas descartadas al procesar
  const fields = useMemo<Field_t[]>(() => {
    if (!dataset?.data_processed) return []
    return dataset.data_processed.dataframe_X.columns
      .map((name): Field_t => {
        const column = dataset.dataframe_original[name]
        if (column.dtype === 'string') {
          return { name, type: 'string', options: [...new Set((column.values as unknown[]).map((value) => String(value)))].sort() }
        }
        return { name, type: column.dtype === 'int32' ? 'int32' : 'float32', min: column.min(), max: column.max() }
      })
  }, [dataset])

  const updateInput = (column_name: string, new_value: number | string, new_value_encoding: number | string) => {
    setPrediction((prevState) => {
      if (dataset.data_processed === undefined) {
        console.error('Error: dataset.data_processed is undefined')
        return prevState
      }
      const newInputDataFrameEncoding = DataFrameSetCellValue(prevState.input_2_dataframe_encoding, 0, column_name, new_value_encoding)
      return {
        ...prevState,
        input_1_dataframe_original : DataFrameSetCellValue(prevState.input_1_dataframe_original, 0, column_name, new_value),
        input_1_dataframe_processed: DataFrameSetCellValue(prevState.input_1_dataframe_processed, 0, column_name, new_value),
        input_2_dataframe_encoding : newInputDataFrameEncoding,
        input_3_dataframe_scaling  : dataset.data_processed.scaler.transform(newInputDataFrameEncoding),
      }
    })
  }

  const handleChange_Number = (column_name: string, value: string) => {
    const number = value === '' ? NaN : Number(value)
    updateInput(column_name, number, number)
  }

  const handleChange_String = (column_name: string, value: string) => {
    if (dataset.data_processed === undefined) return
    const [value_encoding] = dataset.data_processed.encoders[column_name].encoder.transform([value])
    updateInput(column_name, value, value_encoding)
  }

  const numberFormat = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 })
  const helpText = (field: Field_t) => {
    if (field.type === 'string') return t('pages.playground.form.type-categorical', { count: field.options.length })
    const type = t(field.type === 'int32' ? 'pages.playground.form.type-integer' : 'pages.playground.form.type-decimal')
    return `${type} · ${t('pages.playground.form.range', { min: numberFormat.format(field.min), max: numberFormat.format(field.max) })}`
  }

  if (VERBOSE) console.debug('render ModelReviewRegressionPredictForm')
  // La instancia tiene que ser de este conjunto de datos (al cambiar de conjunto, llega un momento después)
  const instanceColumns = ready ? prediction.input_1_dataframe_original.columns : []
  if (!ready || !fields.every((field) => instanceColumns.includes(field.name))) return <WaitingPlaceholder i18nKey_title={'Waiting'} />
  return (
    <Row xs={1} sm={2} lg={3} xxl={4}>
      {fields.map((field, index) => {
        const controlId = `${formId}-${index}`
        const value = prediction.input_1_dataframe_original[field.name].values[0]
        // NaN mientras se borra un número: el campo se queda vacío en vez de mostrar "NaN"
        const inputValue = typeof value === 'number' && Number.isNaN(value) ? '' : value ?? ''
        return (
          <Col key={controlId} className={'mb-3'}>
            <Form.Group controlId={controlId}>
              <Form.Label className={'fw-semibold mb-1'}>{field.name}</Form.Label>
              {field.type === 'string'
                ? <Form.Select size={'sm'} value={inputValue} onChange={(e) => handleChange_String(field.name, e.target.value)}>
                  {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </Form.Select>
                : <Form.Control type={'number'} size={'sm'}
                  step={field.type === 'int32' ? 1 : 'any'}
                  value={inputValue}
                  onChange={(e) => handleChange_Number(field.name, e.target.value)} />}
              <Form.Text className={'text-body-secondary'}>{helpText(field)}</Form.Text>
            </Form.Group>
          </Col>
        )
      })}
    </Row>
  )
}
