import { useMemo, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import type * as tfjs from '@tensorflow/tfjs'

import { trackEvent } from '@core/analytics'
import { firstTarget, testStartOf, toValue, windowAt, type PreparedSeries_t } from '@core/timeSeries/series'
import { predictWindows } from '@core/timeSeries/seriesModel'
import N4LVirtualSelect, { type VirtualSelectOption_t } from '@components/select/N4LVirtualSelect'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import N4LSummary from '@components/summary/N4LSummary'

import { prefix as seriesPrefix, type LoadedSeries_t } from './timeSeriesConfig'

const prefix = seriesPrefix + 'review.'

type ModelReviewTimeSeriesPredictProps = {
  model   : tfjs.LayersModel
  series  : LoadedSeries_t
  prepared: PreparedSeries_t
}

/** Lo que se predijo: con qué valores, el resultado y, si eran los de la serie sin cambiar, el valor real */
type Result_t = { target: number, inputs: number[], vector: number[], value: number, actual: number | null }

/**
 * Predecir un valor de la serie, como el formulario de las demás tareas: se elige un valor de la serie y el formulario
 * se rellena con los anteriores (la ventana; al diferenciar, uno más, para calcular los cambios), que se pueden cambiar.
 * Debajo, lo que recibe la red (escalado) y el resultado, con el valor real si los valores son los de la serie
 */
export default function ModelReviewTimeSeriesPredict({ model, series, prepared }: ModelReviewTimeSeriesPredictProps) {
  const { t, i18n } = useTranslation()
  const { prep, scale } = prepared
  const { dates, values } = series
  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 }), [i18n.language])
  const percent = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 1 }), [i18n.language])
  const testStart = testStartOf(values.length, prep.testSize)
  const first = firstTarget(prep)
  // Los valores que necesita: la ventana y, al diferenciar, el anterior a ella
  const size = prep.window + (prep.difference ? 1 : 0)
  const inputsOf = (target: number) => values.slice(target - size, target)

  // El valor elegido de la serie (de entrada, el primero de la prueba, que la red no vio) y el formulario
  const [target, setTarget] = useState(testStart)
  const [inputs, setInputs] = useState<number[]>(() => inputsOf(testStart))
  const [result, setResult] = useState<Result_t | null>(null)

  const options = useMemo<VirtualSelectOption_t[]>(() => Array.from({ length: values.length - first }, (_value, i) => {
    const position = first + i
    return { value: position, label: `${dates[position]}: ${number.format(values[position])}${position >= testStart ? ' (' + t(prefix + 'test') + ')' : ''}` }
  }), [dates, values, first, testStart, number, t])

  // El formulario es el de ese valor mientras no se cambie: solo entonces se sabe el valor real
  const original = inputsOf(target)
  const isUnchanged = inputs.every((value, i) => value === original[i])
  const isValid = inputs.every(Number.isFinite)
  const vector = isValid ? windowAt(inputs, inputs.length, prep, scale) : []

  const handleChange_Target = (position: number) => {
    setTarget(position)
    setInputs(inputsOf(position))
  }

  const handleSubmit_Predict = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid) return
    const [predicted] = await predictWindows(model, [vector], prep.window)
    setResult({ target, inputs: [...inputs], vector, value: toValue(predicted, inputs[inputs.length - 1], prep, scale), actual: isUnchanged ? values[target] : null })
    trackEvent('predict', { input: isUnchanged ? 'sample' : 'form' })
  }

  const error = result === null || result.actual === null ? null : result.value - result.actual
  const changes = result === null || !prep.difference ? null : result.inputs.slice(1).map((value, i) => value - result.inputs[i])

  return (
    <Card className={'mt-3'} data-testid={'Test-TimeSeries-Predict'}>
      <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
        <h2><Trans i18nKey={prefix + 'predict-title'} /></h2>
        <div className={'d-flex flex-wrap gap-2 n4l-card-header-controls'}>
          <div className={'n4l-instance-select'} data-guide={'instances'}>
            <N4LVirtualSelect options={options}
              value={isUnchanged ? target : null}
              onChange={handleChange_Target}
              size={'sm'}
              label={t('pages.playground.generator.example-from-dataset')}
              placeholder={t('example-custom')}
              searchPlaceholder={t('pages.playground.generator.dynamic-form-dataset.search-entity')}
              noResultsText={t('pages.playground.generator.dynamic-form-dataset.no-entity')}
              countText={(shown, total) => t('pages.playground.generator.dynamic-form-dataset.entity-count', { shown, total })} />
          </div>
          <Form.Group controlId={'time-series-model-select'} data-guide={'models'}>
            <Form.Select size={'sm'} aria-label={t(prefix + 'model-select')} value={0} onChange={() => {}}>
              <option value={0}>{t('model.__index__', { index: 1 })}</option>
            </Form.Select>
          </Form.Group>
        </div>
      </Card.Header>
      <Card.Body>
        <p className={'text-body-secondary'}>{t(prefix + 'choose-instance', { count: size })}</p>
        <Form onSubmit={handleSubmit_Predict} noValidate>
          <Row xs={2} sm={3} lg={4} xxl={6} className={'g-2'} data-guide={'form'} data-testid={'Test-TimeSeries-PredictForm'}>
            {inputs.map((value, i) => {
              const position = target - size + i
              return (
                <Col key={i}>
                  <Form.Group controlId={'time-series-input-' + i}>
                    <Form.Label className={'small fw-semibold mb-1'}>{dates[position]}</Form.Label>
                    <Form.Control type={'number'} size={'sm'} step={'any'} value={Number.isNaN(value) ? '' : value}
                      onChange={(event) => setInputs((current) => current.map((item, k) => (k === i ? (event.target.value === '' ? NaN : Number(event.target.value)) : item)))} />
                  </Form.Group>
                </Col>
              )
            })}
          </Row>
          <Form.Group className={'mt-3'} controlId={'time-series-vector'} data-guide={'vector'}>
            <Form.Label>{t(prefix + 'vector')}</Form.Label>
            <Form.Control size={'sm'} disabled={true} value={vector.map((item) => number.format(item)).join(', ')} />
            <Form.Text className={'text-muted'}>{t(prefix + (prep.difference ? 'vector-help-difference' : 'vector-help'))}</Form.Text>
          </Form.Group>
          <div className={'d-grid gap-2 mt-3'} data-guide={'predict'}>
            <Button variant={'primary'} size={'lg'} type={'submit'} disabled={!isValid} data-testid={'Test-TimeSeries-PredictButton'}>
              <Trans i18nKey={prefix + 'button-submit'} />
            </Button>
          </div>
        </Form>

        <hr />

        <div data-guide={'result'}>
          {result === null && <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-prediction'} />}
          {result !== null &&
            <div data-testid={'Test-TimeSeries-PredictResult'}>
              <div className={'d-flex flex-wrap align-items-baseline column-gap-3 row-gap-1'}>
                <span className={'text-body-secondary'}>{t(prefix + 'predicted-value', { target: series.valueColumn, date: dates[result.target] })}</span>
                <span className={'display-6'} data-testid={'Test-TimeSeries-PredictValue'}>{number.format(result.value)}</span>
                {result.actual !== null && error !== null && <>
                  <span data-testid={'Test-TimeSeries-PredictActual'}>{t(prefix + 'actual-value', { value: number.format(result.actual) })}</span>
                  <span className={'text-body-secondary'}>
                    {t(prefix + 'error', {
                      value  : (error > 0 ? '+' : '') + number.format(error),
                      percent: result.actual === 0 ? '—' : percent.format(Math.abs(error / result.actual)),
                    })}
                  </span>
                </>}
              </div>
              <div className={'mt-3'}>
                <N4LSummary title={<Trans i18nKey={prefix + 'input-details'} />}>
                  <dl className={'mb-0'}>
                    {([
                      ['step-values', result.inputs],
                      ...(changes === null ? [] : [['step-changes', changes] as const]),
                      ['step-scaled', result.vector],
                    ] as const).map(([key, items]) => (
                      <div key={key} className={'mb-2'}>
                        <dt>{t(prefix + key + '.title')} <small className={'fw-normal text-body-secondary'}>{t(prefix + key + '.text')}</small></dt>
                        <dd className={'mb-0 font-monospace small text-break'}>{items.map((item) => number.format(item)).join(', ')}</dd>
                      </div>
                    ))}
                  </dl>
                </N4LSummary>
              </div>
            </div>}
        </div>
      </Card.Body>
    </Card>
  )
}
