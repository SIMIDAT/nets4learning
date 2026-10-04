import { useId } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { VERBOSE } from '@/CONSTANTS'
import type I_MODEL_TABULAR_CLASSIFICATION from './models/_model'
import type { TabularFormField_t, TabularInstance_t } from './models/_model'

type ModelReviewTabularClassificationPredictFormProps = {
  iModelInstance: I_MODEL_TABULAR_CLASSIFICATION
  dataToTest    : TabularInstance_t
  setDataToTest : React.Dispatch<React.SetStateAction<TabularInstance_t>>
}

/** Clave de TABLE_HEADER (i18n) de un atributo: la que termina en su nombre ("00-tc.car.buying" para "Buying") */
function headerKeyOf(tableHeader: string[], name: string) {
  const lowerName = name.toLowerCase()
  return tableHeader.find((key) => key.toLowerCase() === lowerName || key.toLowerCase().endsWith('.' + lowerName))
}

/** Un campo por atributo de entrada, con su nombre traducido y el tipo de valor que admite */
export default function ModelReviewTabularClassificationPredictForm(
  props: ModelReviewTabularClassificationPredictFormProps,
) {
  const {
    iModelInstance,
    dataToTest,
    setDataToTest,
  } = props
  const { t } = useTranslation()
  const formId = useId()

  const handleChange_Parameter = (field: TabularFormField_t, value: string) => {
    setDataToTest((prevState) => ({
      ...prevState,
      [field.name]: field.type === 'int32' ? parseInt(value) : field.type === 'float32' ? parseFloat(value) : value,
    }))
  }

  const typeText = (field: TabularFormField_t) => {
    switch (field.type) {
      case 'int32': return t('pages.playground.form.type-integer')
      case 'float32': return t('pages.playground.form.type-decimal')
      case 'label-encoder': return t('pages.playground.form.type-categorical', { count: field.options.length })
      default: return ''
    }
  }

  if (VERBOSE) console.debug('render ModelReviewTabularClassificationPredictForm')
  return (
    <Row xs={1} sm={2} lg={3} xxl={4} data-guide={'form'}>
      {iModelInstance.FORM.map((field, index) => {
        const controlId = `${formId}-${index}`
        const headerKey = headerKeyOf(iModelInstance.TABLE_HEADER, field.name)
        const label = headerKey ? t(headerKey) : field.name
        // NaN mientras se borra un número: el campo se queda vacío en vez de mostrar "NaN"
        const value = dataToTest[field.name]
        const inputValue = typeof value === 'number' && Number.isNaN(value) ? '' : value ?? ''
        return (
          <Col key={controlId} className={'mb-3'} data-guide={'field-' + field.name}>
            <Form.Group controlId={controlId}>
              <Form.Label className={'fw-semibold mb-1'}>{label}</Form.Label>
              {field.type === 'label-encoder'
                ? <Form.Select size={'sm'} value={inputValue} onChange={($event) => handleChange_Parameter(field, $event.target.value)}>
                  {field.options.map((option, option_index) => (
                    <option key={controlId + '_option_' + option_index} value={option.value}>{option.text}</option>
                  ))}
                </Form.Select>
                : <Form.Control type={'number'} size={'sm'}
                  step={field.type === 'int32' ? 1 : 'any'}
                  value={inputValue}
                  onChange={($event) => handleChange_Parameter(field, $event.target.value)} />}
              <Form.Text className={'text-body-secondary'}>
                {/* El nombre del atributo en el conjunto de datos, si la traducción lo cambia */}
                {label.toLowerCase() !== field.name.toLowerCase() && <><code>{field.name}</code> · </>}
                {typeText(field)}
              </Form.Text>
            </Form.Group>
          </Col>
        )
      })}
    </Row>
  )
}
