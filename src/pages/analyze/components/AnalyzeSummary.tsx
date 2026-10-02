import { useMemo } from 'react'
import { Badge, Card, Col, ListGroup, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { binCenters, binCounts, histogram, type ColumnProfile_t, type DataFrameProfile_t, type DataWarning_t, type ProblemType_t } from '@core/dataframe/eda'
import type { Data } from 'plotly.js'
import { classColor } from '@core/dataframe/plotlyTheme'
import N4LPlot from '@components/dataframe/N4LPlot'

type AnalyzeSummaryProps = {
  profile      : DataFrameProfile_t
  targetProfile: ColumnProfile_t | undefined
  /** Valores del objetivo como números (regresión) */
  targetNumbers: number[] | undefined
  /** Clases del objetivo, en el orden de sus colores (clasificación) */
  classes      : string[]
  problem      : ProblemType_t | null
  warnings     : DataWarning_t[]
}

/** El conjunto de un vistazo: tamaño, ausentes, repetidas, la variable objetivo y los problemas que conviene revisar */
export default function AnalyzeSummary({ profile, targetProfile, targetNumbers, classes, problem, warnings }: AnalyzeSummaryProps) {
  const prefix = 'pages.dataframe.summary.'
  const { t, i18n } = useTranslation()
  const format = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }), [i18n.language])
  const percent = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 1 }), [i18n.language])
  const numeric = profile.profiles.filter(({ kind }) => kind === 'numeric').length
  const cells = profile.rows * profile.columns

  const tiles = [
    { key: 'rows', value: format.format(profile.rows) },
    { key: 'columns', value: format.format(profile.columns), detail: t(prefix + 'columns-detail', { numeric, categorical: profile.columns - numeric }) },
    { key: 'missing', value: format.format(profile.missingCells), detail: t(prefix + 'missing-detail', { percent: percent.format(cells ? profile.missingCells / cells : 0) }), warn: profile.missingCells > 0 },
    { key: 'duplicates', value: format.format(profile.duplicateRows), detail: t(prefix + 'duplicates-detail', { percent: percent.format(profile.rows ? profile.duplicateRows / profile.rows : 0) }), warn: profile.duplicateRows > 0 },
  ]

  // Histograma ya calculado (barras): Plotly lo calcularía a partir de cada valor, y con muchas filas tarda
  const targetHistogram = useMemo((): Data[] => {
    if (!targetNumbers) return []
    const { edges } = histogram(targetNumbers)
    const { centers, width } = binCenters(edges)
    return [{ type: 'bar', x: centers, y: binCounts(targetNumbers, edges), width, marker: { color: 'rgba(214, 51, 132, 0.75)' }, hovertemplate: '%{x}: %{y}<extra></extra>' }]
  }, [targetNumbers])

  const classCounts = useMemo(() => {
    if (!targetProfile) return []
    const counts = new Map(targetProfile.top.map(({ value, count }) => [value, count]))
    return classes.map((value) => ({ value, count: counts.get(value) ?? 0 }))
  }, [targetProfile, classes])

  return <>
    <Row xs={2} lg={4} className={'g-3'}>
      {tiles.map(({ key, value, detail, warn }) => (
        <Col key={key}>
          <Card className={'h-100 n4l-eda-tile'} data-testid={'Test-AnalyzeTile-' + key}>
            <Card.Body>
              <div className={'small text-body-secondary'}>{t(prefix + key)}</div>
              <div className={'fs-3 fw-semibold' + (warn ? ' text-warning-emphasis' : '')}>{value}</div>
              {detail && <div className={'small text-body-secondary'}>{detail}</div>}
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>

    {/* La variable objetivo y los avisos, cada uno en su tarjeta (como el resto de apartados del análisis) */}
    <Row xs={1} lg={2} className={'g-3 mt-1'}>
      <Col>
        <Card className={'h-100'} data-testid={'Test-AnalyzeTargetCard'}>
          <Card.Header>
            <h3>
              {targetProfile
                ? <Trans i18nKey={prefix + 'target-distribution'} values={{ target: targetProfile.name }} components={{ code: <code /> }} />
                : t(prefix + 'target-distribution-none')}
            </h3>
          </Card.Header>
          <Card.Body>
            {targetProfile && problem === 'classification' &&
              <N4LPlot height={Math.max(180, 44 * classCounts.length + 60)}
                label={t(prefix + 'target-distribution', { target: targetProfile.name })}
                data={[{
                  type         : 'bar',
                  orientation  : 'h',
                  y            : classCounts.map(({ value }) => value),
                  x            : classCounts.map(({ count }) => count),
                  text         : classCounts.map(({ count }) => `${format.format(count)} (${percent.format(count / targetProfile.count)})`),
                  textposition : 'auto',
                  marker       : { color: classCounts.map((_, index) => classColor(index)) },
                  hovertemplate: '%{y}: %{x}<extra></extra>',
                }]}
                layout={{ yaxis: { type: 'category', autorange: 'reversed' }, xaxis: { title: { text: t(prefix + 'rows') } }, showlegend: false }} />}
            {targetProfile && problem === 'regression' && targetNumbers &&
              <N4LPlot height={260}
                label={t(prefix + 'target-distribution', { target: targetProfile.name })}
                data={targetHistogram}
                layout={{ xaxis: { title: { text: targetProfile.name } }, yaxis: { title: { text: t(prefix + 'rows') } }, bargap: 0.05 }} />}
            {!targetProfile && <p className={'text-body-secondary mb-0'}>{t(prefix + 'no-target')}</p>}
          </Card.Body>
        </Card>
      </Col>
      <Col>
        <Card className={'h-100'} data-testid={'Test-AnalyzeWarningsCard'}>
          <Card.Header className={'d-flex align-items-center justify-content-between'}>
            <h3>{t(prefix + 'warnings')}</h3>
            {warnings.length > 0 && <Badge bg={'warning'} text={'dark'} pill>{warnings.length}</Badge>}
          </Card.Header>
          <Card.Body>
            {warnings.length === 0
              ? <p className={'text-success-emphasis mb-0'}>{t(prefix + 'no-warnings')}</p>
              : <ListGroup variant={'flush'} className={'n4l-eda-warnings'} data-testid={'Test-AnalyzeWarnings'}>
                {warnings.map((warning, index) => (
                  <ListGroup.Item key={index} className={'px-0 small'}>
                    <WarningText warning={warning} format={format} percent={percent} />
                  </ListGroup.Item>
                ))}
              </ListGroup>}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </>
}

function WarningText({ warning, format, percent }: { warning: DataWarning_t, format: Intl.NumberFormat, percent: Intl.NumberFormat }) {
  const values: Record<string, string> = { type: warning.type }
  if ('column' in warning) values.column = warning.column
  if ('count' in warning) values.count = format.format(warning.count)
  if ('ratio' in warning) values.percent = percent.format(warning.ratio)
  if (warning.type === 'imbalance') values.minority = warning.minority
  if (warning.type === 'correlation') {
    values.other = warning.other
    values.value = format.format(warning.value)
  }
  return <Trans i18nKey={'pages.dataframe.warnings.' + warning.type} values={values} components={{ code: <code /> }} />
}
