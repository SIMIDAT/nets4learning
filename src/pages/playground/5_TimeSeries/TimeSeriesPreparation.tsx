import { useEffect } from 'react'
import { Alert, Card, Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { canPrepare, testStartOf, type SeriesPrep_t } from '@core/timeSeries/series'

import TimeSeriesChart from './TimeSeriesChart'
import TimeSeriesWindows from './TimeSeriesWindows'
import { prefix, seriesSummary, type LoadedSeries_t } from './timeSeriesConfig'
import { announce } from '@core/a11y/announce'
import N4LNumberField from '@components/form/N4LNumberField'

type TimeSeriesPreparationProps = {
  series  : LoadedSeries_t
  title   : string
  prep    : SeriesPrep_t
  season? : number
  onPrep  : (prep: SeriesPrep_t) => void
  onSeason: (season: number | undefined) => void
  disabled: boolean
}

/**
 * La serie y cómo se prepara para la red: con cuántos valores anteriores se predice el siguiente (la ventana), cuántos
 * se apartan al final para probar, si se predice el cambio en lugar del valor y la estación (para comparar). Debajo, las
 * primeras ventanas, para ver qué recibe la red y qué tiene que predecir
 */
export default function TimeSeriesPreparation({ series, title, prep, season, onPrep, onSeason, disabled }: TimeSeriesPreparationProps) {
  const { t } = useTranslation()
  const { dates, values } = series
  const testStart = testStartOf(values.length, prep.testSize)
  const isValid = canPrepare(values.length, prep)
  const range = (from: number, to: number) => t(prefix + 'data.range', { first: dates[from], last: dates[to - 1], count: to - from })
  // Al cargar la serie, lo que tiene (también para el lector de pantalla: WCAG 4.1.3)
  const summary = seriesSummary(t, series)
  useEffect(() => announce(summary), [summary])

  return (
    <Card data-testid={'Test-TimeSeries-Data'} data-guide={'dataset'}>
      <Card.Header><h3 className={'h5 mb-0'}>{title}</h3></Card.Header>
      <Card.Body>
        <p className={'small text-body-secondary mb-2'} data-testid={'Test-TimeSeries-Summary'}>
          {summary}
        </p>
        {series.dropped > 0 && <Alert variant={'warning'} className={'py-2'}>{t(prefix + 'data.dropped', { count: series.dropped })}</Alert>}
        {series.sorted && <Alert variant={'info'} className={'py-2'}>{t(prefix + 'data.sorted')}</Alert>}

        <Row className={'g-4'}>
          <Col xl={8}>
            <TimeSeriesChart labels={dates} values={values} valueLabel={series.valueColumn}
              split={isValid ? { index: testStart, label: t(prefix + 'chart.test') } : undefined}
              description={t(prefix + 'chart.description', { name: title, count: values.length, first: dates[0], last: dates[dates.length - 1] })}
              dataCaption={t(prefix + 'chart-data-series', { value: series.valueColumn })}
              testId={'Test-TimeSeries-SeriesChart'} />
            {isValid &&
              <p className={'small mt-2 mb-0'} data-testid={'Test-TimeSeries-Split'}>
                <Trans i18nKey={prefix + 'data.split'} values={{ train: range(0, testStart), test: range(testStart, values.length) }} />
              </p>}
          </Col>
          <Col xl={4}>
            <fieldset disabled={disabled} data-guide={'preparation'}>
              <legend className={'h6'}>{t(prefix + 'prep.title')}</legend>
              {/* Sin máximo: con una ventana demasiado grande para la serie, el aviso de debajo explica por qué no se puede */}
              <N4LNumberField className={'mb-3'} controlId={'time-series-window'} labelClassName={'fw-semibold'}
                label={t(prefix + 'prep.window')} value={prep.window} min={1}
                help={<>{t(prefix + 'prep.window-help')} {season !== undefined && t(prefix + 'prep.window-season', { season })}</>}
                onChange={(window) => onPrep({ ...prep, window })} />
              <N4LNumberField className={'mb-3'} controlId={'time-series-test-size'} labelClassName={'fw-semibold'}
                label={t(prefix + 'prep.test-size')} value={prep.testSize} min={5} max={50}
                help={t(prefix + 'prep.test-size-help')}
                onChange={(testSize) => onPrep({ ...prep, testSize })} />
              <Form.Check type={'switch'} id={'time-series-difference'} className={'mb-1'} label={t(prefix + 'prep.difference')}
                checked={prep.difference} onChange={() => onPrep({ ...prep, difference: !prep.difference })} />
              <Form.Text className={'text-muted d-block mb-3'}>{t(prefix + 'prep.difference-help')}</Form.Text>
              <N4LNumberField controlId={'time-series-season'} labelClassName={'fw-semibold'}
                label={t(prefix + 'prep.season')} value={season ?? 0} min={0} help={t(prefix + 'prep.season-help')}
                onChange={(value) => onSeason(value > 1 ? value : undefined)} />
            </fieldset>
          </Col>
        </Row>

        {!isValid && <Alert variant={'warning'} className={'mt-3 mb-0'} data-testid={'Test-TimeSeries-TooShort'}>{t(prefix + 'prep.too-short')}</Alert>}
        {isValid && <div className={'mt-4'}><TimeSeriesWindows dates={dates} values={values} prep={prep} /></div>}
      </Card.Body>
    </Card>
  )
}
