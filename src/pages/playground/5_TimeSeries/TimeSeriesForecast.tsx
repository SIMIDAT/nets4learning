import { useEffect, useMemo, useState } from 'react'
import { Alert, Card, Col, Form, Row, Spinner, Table, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { trackEvent } from '@core/analytics'
import { baselineErrors, nextDates, type ForecastErrors_t } from '@core/timeSeries/series'
import { forecastFuture } from '@core/timeSeries/seriesModel'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import N4LNumberField from '@components/form/N4LNumberField'

import TimeSeriesChart from './TimeSeriesChart'
import { prefix, seriesColors, type ForecastModel_t, type LoadedSeries_t } from './timeSeriesConfig'
import { useTheme } from '@hooks/useTheme'

type Mode_t = 'one-step' | 'recursive'
type Range_t = 'all' | 'test'

const MAX_FUTURE = 500
/** Lo que tiene que mejorar la red a la mejor línea base para decir que predice mejor (5 %) */
const MARGIN = 0.05

type TimeSeriesForecastProps = {
  series    : LoadedSeries_t
  models    : ForecastModel_t[]
  selected  : number
  onSelect  : (index: number) => void
  season?   : number
  /** Cómo se llama el modelo (sin él, «Modelo N», el de la tabla) */
  modelName?: string
}

/** Los errores de la red y de las líneas base con los mismos valores */
type Comparison_t = { model: ForecastErrors_t, naive: ForecastErrors_t, seasonal?: ForecastErrors_t }

/** La mejor de las líneas base (la que menos se equivoca) y cuánto mejora la red su error */
function verdict({ model, naive, seasonal }: Comparison_t) {
  const baseline = seasonal !== undefined && seasonal.mae < naive.mae ? 'seasonal' : 'naive'
  const baselineMae = baseline === 'seasonal' ? seasonal!.mae : naive.mae
  const improvement = baselineMae > 0 ? 1 - model.mae / baselineMae : 0
  return { baseline, improvement, level: improvement > MARGIN ? 'better' : improvement < -MARGIN ? 'worse' : 'similar' } as const
}

/**
 * Lo que predice el modelo elegido: la parte de prueba a un paso (cada valor con los reales de antes) o recursivamente
 * (toda seguida, con los ya predichos), cuánto se equivoca frente a las predicciones más sencillas y lo que viene después
 * del último valor
 */
export default function TimeSeriesForecast({ series, models, selected, onSelect, season, modelName }: TimeSeriesForecastProps) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumSignificantDigits: 4 }), [i18n.language])
  const percent = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 0 }), [i18n.language])
  const [mode, setMode] = useState<Mode_t>('one-step')
  const [range, setRange] = useState<Range_t>('all')
  const [showTrain, setShowTrain] = useState(false)
  const current = models[selected] as ForecastModel_t | undefined
  const [steps, setSteps] = useState(() => Math.min(MAX_FUTURE, season ?? 12))
  // El futuro del modelo elegido (con los pasos pedidos); null mientras se calcula. Por su modelo de TF.js: la fila de
  // la tabla cambia al terminar de medirlo, el modelo no
  const [future, setFuture] = useState<{ model: ForecastModel_t['model'], steps: number, values: number[] } | null>(null)
  const model = current?.model
  const modelPrepared = current?.prepared
  useEffect(() => {
    if (model === undefined || modelPrepared === undefined) return
    let isCancelled = false
    forecastFuture(model, series.values, modelPrepared, steps).then(
      (values) => { if (!isCancelled) setFuture({ model, steps, values }) },
      (error: unknown) => console.error(error),
    )
    return () => { isCancelled = true }
  }, [model, modelPrepared, series.values, steps])

  const futureValues = future !== null && future.model === model && future.steps === steps ? future.values : null
  const futureDates = useMemo(() => nextDates(series.dates[series.dates.length - 1], series.frequency, steps), [series, steps])
  // Las líneas base no dependen del modelo: se recalculan al cambiar la estación, sin volver a usar la red
  const baselines = useMemo(() => (modelPrepared === undefined ? null : baselineErrors(series.values, modelPrepared, season)), [series.values, modelPrepared, season])

  if (current === undefined) return <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-training'} />
  const { evaluation, prepared } = current
  const { testStart, test, train } = prepared
  const comparison: Comparison_t | null = evaluation === null || baselines === null
    ? null
    : { model: mode === 'one-step' ? evaluation.errors.oneStep : evaluation.errors.recursive, ...(mode === 'one-step' ? baselines.oneStep : baselines.recursive) }
  const result = comparison === null ? null : verdict(comparison)
  const name = modelName ?? t('model.__index__', { index: selected + 1 })

  const errorsRow = (label: string, errors: ForecastErrors_t | undefined, testId: string, strong = false) => errors !== undefined && (
    <tr data-testid={testId} className={strong ? 'fw-semibold' : undefined}>
      <th scope={'row'} className={strong ? undefined : 'fw-normal'}>{label}</th>
      <td className={'text-end'}>{number.format(errors.mae)}</td>
      <td className={'text-end'}>{number.format(errors.rmse)}</td>
    </tr>
  )

  return (
    <Card data-testid={'Test-TimeSeries-Forecast'}>
      <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
        <h3 className={'h5 mb-0'}>{t(prefix + 'forecast.title', { model: name })}</h3>
        {models.length > 1 &&
          <Form.Select size={'sm'} className={'w-auto'} aria-label={t(prefix + 'forecast.model')} value={selected}
            onChange={(event) => onSelect(Number(event.target.value))}>
            {models.map((_model, index) => <option key={index} value={index}>{t('model.__index__', { index: index + 1 })}</option>)}
          </Form.Select>}
      </Card.Header>
      <Card.Body>
        {evaluation === null && <div className={'d-flex align-items-center gap-2'} role={'status'}><Spinner size={'sm'} /> {t(prefix + 'models.evaluating')}</div>}
        {evaluation !== null && comparison !== null && result !== null && <>
          <div className={'d-flex flex-wrap align-items-center gap-3 mb-2'} data-guide={'forecast-mode'}>
            <ToggleButtonGroup type={'radio'} name={'time-series-mode'} value={mode} onChange={(value: Mode_t) => setMode(value)}>
              <ToggleButton id={'time-series-mode-one-step'} value={'one-step'} variant={'outline-primary'} size={'sm'}>{t(prefix + 'forecast.one-step')}</ToggleButton>
              <ToggleButton id={'time-series-mode-recursive'} value={'recursive'} variant={'outline-primary'} size={'sm'}>{t(prefix + 'forecast.recursive')}</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup type={'radio'} name={'time-series-range'} value={range} onChange={(value: Range_t) => setRange(value)}>
              <ToggleButton id={'time-series-range-all'} value={'all'} variant={'outline-primary'} size={'sm'}>{t(prefix + 'forecast.range-all')}</ToggleButton>
              <ToggleButton id={'time-series-range-test'} value={'test'} variant={'outline-primary'} size={'sm'}>{t(prefix + 'forecast.range-test')}</ToggleButton>
            </ToggleButtonGroup>
            <Form.Check type={'switch'} id={'time-series-show-train'} label={t(prefix + 'forecast.show-train')}
              checked={showTrain} onChange={() => setShowTrain(!showTrain)} />
          </div>
          <p className={'small text-body-secondary'}>{t(prefix + (mode === 'one-step' ? 'forecast.one-step-help' : 'forecast.recursive-help'))}</p>

          <div data-guide={'forecast-chart'}>
            <TimeSeriesChart labels={[...series.dates, ...futureDates]} values={series.values} valueLabel={series.valueColumn}
              split={{ index: testStart, label: t(prefix + 'chart.test') }}
              train={showTrain ? { label: t(prefix + 'chart.train-prediction'), targets: train.targets, values: evaluation.trainOneStep } : undefined}
              test={{ label: t(prefix + (mode === 'one-step' ? 'chart.test-one-step' : 'chart.test-recursive')), targets: test.targets, values: mode === 'one-step' ? evaluation.testOneStep : evaluation.testRecursive }}
              future={futureValues === null ? undefined : { label: t(prefix + 'chart.future'), values: futureValues }}
              from={range === 'test' ? Math.max(0, testStart - test.targets.length) : 0}
              description={t(prefix + 'chart.forecast-description', { model: name, mae: number.format(comparison.model.mae), steps })}
              testId={'Test-TimeSeries-ForecastChart'} />
          </div>

          <Row className={'g-4 mt-1'}>
            <Col lg={6} data-guide={'errors'}>
              <h4 className={'h6'}>{t(prefix + 'forecast.errors-title')}</h4>
              <Table size={'sm'} className={'mb-2'} data-testid={'Test-TimeSeries-Errors'}>
                <thead>
                  <tr>
                    <th scope={'col'}>{t(prefix + 'forecast.prediction')}</th>
                    <th scope={'col'} className={'text-end'}><abbr title={t(prefix + 'forecast.mae-title')}>MAE</abbr></th>
                    <th scope={'col'} className={'text-end'}><abbr title={t(prefix + 'forecast.rmse-title')}>RMSE</abbr></th>
                  </tr>
                </thead>
                <tbody>
                  {errorsRow(t(prefix + 'forecast.network', { model: name }), comparison.model, 'Test-TimeSeries-Errors-Model', true)}
                  {errorsRow(t(prefix + (mode === 'one-step' ? 'forecast.naive-one-step' : 'forecast.naive-recursive')), comparison.naive, 'Test-TimeSeries-Errors-Naive')}
                  {errorsRow(t(prefix + (mode === 'one-step' ? 'forecast.seasonal-one-step' : 'forecast.seasonal-recursive'), { season }), comparison.seasonal, 'Test-TimeSeries-Errors-Seasonal')}
                </tbody>
              </Table>
              <Alert variant={result.level === 'better' ? 'success' : result.level === 'similar' ? 'info' : 'warning'} className={'py-2 small'} data-testid={'Test-TimeSeries-Verdict'}>
                <Trans i18nKey={prefix + 'forecast.verdict-' + result.level}
                  values={{ baseline: t(prefix + 'forecast.baseline-' + result.baseline), percent: percent.format(Math.abs(result.improvement)) }} />
              </Alert>
              <p className={'small text-body-secondary mb-0'}>
                {t(prefix + 'forecast.train-vs-test', { train: number.format(evaluation.errors.train.mae), test: number.format(evaluation.errors.oneStep.mae) })}
                {evaluation.errors.oneStep.mae > 2 * evaluation.errors.train.mae && <> {t(prefix + 'forecast.overfitting')}</>}
              </p>
            </Col>
            <Col lg={6} data-testid={'Test-TimeSeries-Future'} data-guide={'future'}>
              <h4 className={'h6'}>{t(prefix + 'forecast.future-title')}</h4>
              <N4LNumberField className={'mb-2'} controlId={'time-series-future-steps'} controlClassName={'w-auto'}
                label={t(prefix + 'forecast.future-steps')} value={steps} min={1} max={MAX_FUTURE}
                help={t(prefix + 'forecast.future-help')}
                onChange={(value) => {
                  setSteps(value)
                  trackEvent('predict', { input: 'forecast' })
                }} />
              {/* Siempre del mismo alto: al llegar los valores (o al pedir otros) no se mueve lo de alrededor */}
              <div className={'table-responsive'} style={{ height: '16rem' }} tabIndex={0} role={'region'} aria-label={t(prefix + 'forecast.future-title')}>
                {futureValues === null && <Spinner size={'sm'} className={'m-2'} role={'status'} aria-label={t(prefix + 'models.evaluating')} />}
                {futureValues !== null &&
                  <Table size={'sm'} className={'mb-0'}>
                    <thead>
                      <tr>
                        <th scope={'col'}>{t(prefix + 'windows.date')}</th>
                        <th scope={'col'} className={'text-end'}>
                          <span className={'n4l-compare-swatch'} style={{ backgroundColor: seriesColors(theme).future }} aria-hidden={true} />
                          {series.valueColumn}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {futureValues.map((value, i) => (
                        <tr key={i}>
                          <td>{futureDates[i]}</td>
                          <td className={'text-end font-monospace'}>{number.format(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>}
              </div>
            </Col>
          </Row>
        </>}
      </Card.Body>
    </Card>
  )
}
