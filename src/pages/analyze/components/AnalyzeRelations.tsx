import { useMemo, useState } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import type { Data } from 'plotly.js'

import { isMissing, type CorrelationMatrix_t, type ProblemType_t } from '@core/dataframe/eda'
import { TARGET_COLOR } from '@core/dataframe/DataFrameTable'
import { classColor } from '@core/dataframe/plotlyTheme'
import N4LPlot from '@components/dataframe/N4LPlot'

// Azul (inversa), blanco (sin relación) y rojo (directa), con la escala fija de −1 a 1
const CORRELATION_SCALE: Array<[number, string]> = [[0, '#2166ac'], [0.25, '#67a9cf'], [0.5, '#f7f7f7'], [0.75, '#ef8a62'], [1, '#b2182b']]

type AnalyzeRelationsProps = {
  correlations: CorrelationMatrix_t
  columnValues: Map<string, unknown[]>
  numbers     : Map<string, number[]>
  target      : string | null
  problem     : ProblemType_t | null
  classes     : string[]
}

/** Qué variables se mueven juntas: matriz de correlación, correlación con el objetivo y dispersión de dos variables */
export default function AnalyzeRelations({ correlations, columnValues, numbers, target, problem, classes }: AnalyzeRelationsProps) {
  const prefix = 'pages.dataframe.relations.'
  const { t, i18n } = useTranslation()
  const format = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }), [i18n.language])
  const { names, matrix } = correlations

  // Correlación de cada variable con el objetivo (si es numérico), de más fuerte a más débil
  const targetIndex = target === null ? -1 : names.indexOf(target)
  const withTarget = useMemo(() => targetIndex === -1 ? [] : names
    .map((name, index) => ({ name, value: matrix[targetIndex][index] }))
    .filter(({ name, value }) => name !== target && !Number.isNaN(value))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value)), [names, matrix, target, targetIndex])

  // Por defecto, las dos variables más relacionadas con el objetivo (o las dos primeras)
  const features = names.filter((name) => name !== target)
  const defaults = withTarget.length >= 2 ? [withTarget[0].name, withTarget[1].name] : [features[0], features[1] ?? features[0]]
  const [xSelected, setX] = useState<string | null>(null)
  const [ySelected, setY] = useState<string | null>(null)
  const x = xSelected !== null && names.includes(xSelected) ? xSelected : defaults[0]
  const y = ySelected !== null && names.includes(ySelected) ? ySelected : defaults[1]

  if (names.length < 2) return <p className={'text-body-secondary'}>{t(prefix + 'not-enough')}</p>

  const tick = (name: string) => (name === target ? `<b><span style="color:${TARGET_COLOR}">${name}</span></b>` : name)
  const showValues = names.length <= 14

  const scatter = scatterTraces(x, y, numbers, columnValues, target, problem, classes)

  return <>
    <Row className={'g-4'}>
      <Col xl={withTarget.length > 0 ? 8 : 12}>
        <h4 className={'h6'}>{t(prefix + 'correlation')}</h4>
        <N4LPlot height={Math.min(720, Math.max(320, 36 * names.length + 120))}
          label={t(prefix + 'correlation')}
          data={[{
            type         : 'heatmap',
            x            : names,
            y            : names,
            z            : matrix.map((row) => row.map((value) => (Number.isNaN(value) ? null : value))),
            zmin         : -1,
            zmax         : 1,
            colorscale   : CORRELATION_SCALE,
            texttemplate : showValues ? '%{z:.2f}' : undefined,
            textfont     : { size: 12 },
            xgap         : 1,
            ygap         : 1,
            hovertemplate: '%{y} · %{x}: %{z:.3f}<extra></extra>',
            colorbar     : { thickness: 12 },
          } as Data]}
          layout={{
            xaxis : { tickvals: names, ticktext: names.map(tick), tickangle: -40, showgrid: false },
            yaxis : { tickvals: names, ticktext: names.map(tick), autorange: 'reversed', showgrid: false },
            margin: { l: 110, r: 16, t: 16, b: 110 },
          }} />
        <p className={'small text-body-secondary mb-0'}>{t(prefix + 'correlation-help')}</p>
      </Col>
      {withTarget.length > 0 &&
        <Col xl={4}>
          <h4 className={'h6'}><Trans i18nKey={prefix + 'target-correlation'} values={{ target }} components={{ code: <code /> }} /></h4>
          <N4LPlot height={Math.max(220, 28 * withTarget.length + 80)}
            label={t(prefix + 'target-correlation', { target })}
            data={[{
              type         : 'bar',
              orientation  : 'h',
              y            : withTarget.map(({ name }) => name),
              x            : withTarget.map(({ value }) => value),
              text         : withTarget.map(({ value }) => format.format(value)),
              textposition : 'auto',
              marker       : { color: withTarget.map(({ value }) => (value >= 0 ? '#b2182b' : '#2166ac')) },
              hovertemplate: '%{y}: %{x:.3f}<extra></extra>',
            } as Data]}
            layout={{ xaxis: { range: [-1, 1], title: { text: 'r' } }, yaxis: { type: 'category', autorange: 'reversed' }, showlegend: false, margin: { l: 110, r: 16, t: 8, b: 40 } }} />
          <p className={'small text-body-secondary mb-0'}>{t(prefix + 'target-correlation-help')}</p>
        </Col>}
    </Row>

    <h4 className={'h6 mt-4'}>{t(prefix + 'scatter')}</h4>
    <Row className={'g-3 align-items-end mb-2'}>
      <Col sm={6} lg={4}>
        <Form.Group controlId={'analyze-scatter-x'}>
          <Form.Label className={'small fw-semibold mb-1'}>{t(prefix + 'x')}</Form.Label>
          <Form.Select size={'sm'} value={x} onChange={(e) => setX(e.target.value)}>
            {names.map((name) => <option key={name} value={name}>{name}</option>)}
          </Form.Select>
        </Form.Group>
      </Col>
      <Col sm={6} lg={4}>
        <Form.Group controlId={'analyze-scatter-y'}>
          <Form.Label className={'small fw-semibold mb-1'}>{t(prefix + 'y')}</Form.Label>
          <Form.Select size={'sm'} value={y} onChange={(e) => setY(e.target.value)}>
            {names.map((name) => <option key={name} value={name}>{name}</option>)}
          </Form.Select>
        </Form.Group>
      </Col>
      <Col lg={4} className={'small text-body-secondary'}>
        {target !== null && <Trans i18nKey={prefix + 'color-help'} values={{ target }} components={{ code: <code /> }} />}
        {' '}r = {format.format(matrix[names.indexOf(x)][names.indexOf(y)])}
      </Col>
    </Row>
    <N4LPlot height={420} label={t(prefix + 'scatter')} data={scatter}
      layout={{ xaxis: { title: { text: x } }, yaxis: { title: { text: y } }, showlegend: problem === 'classification' }} />
  </>
}

/** Un trazo por clase (clasificación) o uno solo con la escala de color del objetivo (regresión) */
function scatterTraces(x: string, y: string, numbers: Map<string, number[]>, columnValues: Map<string, unknown[]>,
  target: string | null, problem: ProblemType_t | null, classes: string[]): Data[] {
  const xs = numbers.get(x) ?? []
  const ys = numbers.get(y) ?? []
  const marker = { size: 7, opacity: 0.75, line: { width: 0.5, color: 'rgba(0, 0, 0, 0.25)' } }
  if (target !== null && problem === 'classification') {
    const targetValues = columnValues.get(target) ?? []
    return classes.map((label, index) => {
      const rows = targetValues.map((value, row) => (!isMissing(value) && String(value) === label ? row : -1)).filter((row) => row !== -1)
      return { type: 'scattergl', mode: 'markers', name: label, x: rows.map((row) => xs[row]), y: rows.map((row) => ys[row]), marker: { ...marker, color: classColor(index) } } as Data
    })
  }
  const colors = target !== null ? numbers.get(target) : undefined
  return [{
    type  : 'scattergl',
    mode  : 'markers',
    x     : xs,
    y     : ys,
    marker: colors
      ? { ...marker, color: colors, colorscale: 'Viridis', showscale: true, colorbar: { title: { text: target ?? '' }, thickness: 12 } }
      : { ...marker, color: classColor(0) },
  } as Data]
}
