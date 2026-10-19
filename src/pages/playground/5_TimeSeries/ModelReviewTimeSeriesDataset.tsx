import { useEffect, useMemo, useState } from 'react'
import { Card, Nav, Tab } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { testStartOf, type PreparedSeries_t } from '@core/timeSeries/series'
import N4LTablePagination from '@components/table/N4LTablePagination'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

import TimeSeriesChart from './TimeSeriesChart'
import TimeSeriesWindows from './TimeSeriesWindows'
import { prefix, seriesSummary, type LoadedSeries_t } from './timeSeriesConfig'
import { announce } from '@core/a11y/announce'

type ModelReviewTimeSeriesDatasetProps = {
  /** null mientras se carga */
  series  : LoadedSeries_t | null
  /** Cómo se preparó para el modelo (null hasta tener el modelo) */
  prepared: PreparedSeries_t | null
  name    : string
}

const TABS = ['original', 'chart', 'windows'] as const
type Tab_t = typeof TABS[number]

/**
 * La serie del modelo en tres pestañas, como el conjunto de datos de las demás tareas: tal cual (sus fechas y sus
 * valores), en una gráfica con la parte de prueba marcada y preparada para la red (las ventanas que recibe y su escala)
 */
export default function ModelReviewTimeSeriesDataset({ series, prepared, name }: ModelReviewTimeSeriesDatasetProps) {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab_t>('original')
  // Al cargar la serie, lo que tiene (también para el lector de pantalla: WCAG 4.1.3)
  const summary = series === null ? '' : seriesSummary(t, series)
  useEffect(() => announce(summary), [summary])
  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumSignificantDigits: 4 }), [i18n.language])
  const rows = useMemo(() => (series === null ? [] : series.dates.map((date, i) => [date, series.values[i]])), [series])
  const testStart = series === null || prepared === null ? 0 : testStartOf(series.values.length, prepared.prep.testSize)
  const range = (from: number, to: number) => (series === null ? '' : t(prefix + 'data.range', { first: series.dates[from], last: series.dates[to - 1], count: to - from }))

  return (
    <Card className={'mt-3'} data-testid={'Test-ModelReviewDataset'} data-guide={'dataset'}>
      <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(TABS.find((tab) => tab === key) ?? 'original')}>
        <Card.Header>
          <Nav variant={'tabs'} className={'card-header-tabs'}>
            <Nav.Item>
              <Nav.Link eventKey={'original'}><Trans i18nKey={'table.dataset'} /></Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey={'chart'} data-guide={'dataset-chart'}><Trans i18nKey={prefix + 'review.tab-chart'} /></Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey={'windows'} data-guide={'dataset-windows'} data-testid={'Test-ModelReviewDataset-WindowsTab'}>
                <Trans i18nKey={prefix + 'review.tab-windows'} />
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body>
          {series === null && <WaitingPlaceholder />}
          {series !== null && <Tab.Content>
            <Tab.Pane eventKey={'original'}>
              <p className={'small text-body-secondary mb-2'} data-testid={'Test-TimeSeries-Summary'}>
                {summary}
              </p>
              <div className={'overflow-x-auto'}>
                <N4LTablePagination data_head={[t(prefix + 'windows.date'), series.valueColumn]} data_body={rows} highlight_column={1} />
              </div>
            </Tab.Pane>
            <Tab.Pane eventKey={'chart'} mountOnEnter={true}>
              <TimeSeriesChart labels={series.dates} values={series.values} valueLabel={series.valueColumn}
                split={prepared === null ? undefined : { index: testStart, label: t(prefix + 'chart.test') }}
                description={t(prefix + 'chart.description', { name, count: series.values.length, first: series.dates[0], last: series.dates[series.dates.length - 1] })}
                dataCaption={t(prefix + 'chart-data-series', { value: series.valueColumn })} />
              {prepared !== null &&
                <p className={'small mt-2 mb-0'} data-testid={'Test-TimeSeries-Split'}>
                  <Trans i18nKey={prefix + 'data.split'} values={{ train: range(0, testStart), test: range(testStart, series.values.length) }} />
                </p>}
            </Tab.Pane>
            <Tab.Pane eventKey={'windows'} mountOnEnter={true}>
              {prepared === null && <WaitingPlaceholder />}
              {prepared !== null && <>
                <p data-testid={'Test-TimeSeries-Preparation'}>
                  <Trans i18nKey={prefix + (prepared.prep.difference ? 'review.preparation-difference' : 'review.preparation')}
                    values={{
                      window: prepared.prep.window,
                      last  : series.dates[testStart - 1],
                      first : series.dates[testStart],
                      min   : number.format(prepared.scale.min),
                      max   : number.format(prepared.scale.max),
                    }} />
                </p>
                <TimeSeriesWindows dates={series.dates} values={series.values} prep={prepared.prep} />
              </>}
            </Tab.Pane>
          </Tab.Content>}
        </Card.Body>
      </Tab.Container>
    </Card>
  )
}
