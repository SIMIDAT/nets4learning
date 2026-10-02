import { useMemo, useState } from 'react'
import { Col, Form, Row, Table } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import type { Data } from 'plotly.js'

import { binCenters, binCounts, boxStats, countValues, histogram, isMissing, profileColumn, valueCounts, type ColumnProfile_t, type ProblemType_t } from '@core/dataframe/eda'
import { classColor } from '@core/dataframe/plotlyTheme'
import N4LPlot from '@components/dataframe/N4LPlot'

const BINS = [0, 10, 20, 30, 50]

type AnalyzeDistributionsProps = {
  profiles    : ColumnProfile_t[]
  /** Valores de cada columna en el orden de las filas */
  columnValues: Map<string, unknown[]>
  numbers     : Map<string, number[]>
  target      : string | null
  problem     : ProblemType_t | null
  classes     : string[]
  variable    : string
  onVariable  : (column: string) => void
}

/** Cómo se reparten los valores de una variable y, si el objetivo es una clase, cómo cambian de una clase a otra */
export default function AnalyzeDistributions({ profiles, columnValues, numbers, target, problem, classes, variable, onVariable }: AnalyzeDistributionsProps) {
  const prefix = 'pages.dataframe.distributions.'
  const { t, i18n } = useTranslation()
  const format = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 }), [i18n.language])
  const [byClass, setByClass] = useState(true)
  const [bins, setBins] = useState(0)

  const profile = profiles.find(({ name }) => name === variable)
  const canSplit = problem === 'classification' && target !== null && variable !== target && classes.length > 1
  const split = canSplit && byClass
  // Filas de cada clase (índices), en el orden de los colores
  const rowsByClass = useMemo(() => {
    const targetValues = target === null ? [] : (columnValues.get(target) ?? [])
    return classes.map((label) => targetValues
      .map((value, row) => (!isMissing(value) && String(value) === label ? row : -1))
      .filter((row) => row !== -1))
  }, [classes, columnValues, target])

  // Estadísticos de la variable en cada clase: dónde se separan las clases. Memorizados: antes se recalculaban en
  // cada render (y cada uno ordena los valores de su clase)
  const perClass = useMemo(() => {
    if (!profile || profile.kind !== 'numeric' || !(canSplit && byClass)) return []
    const values = columnValues.get(profile.name) ?? []
    return rowsByClass.map((rows, index) => ({ label: classes[index], profile: profileColumn(profile.name, rows.map((row) => values[row]), profile.dtype) }))
  }, [profile, canSplit, byClass, columnValues, rowsByClass, classes])

  // Histograma y diagrama de caja ya calculados (barras y cajas con sus cuartiles): Plotly los calcularía a partir de
  // cada punto y, con cientos de miles de filas, eso bloquea la página más de un segundo
  const numericCharts = useMemo(() => {
    const nums = profile ? numbers.get(profile.name) : undefined
    if (!profile || profile.kind !== 'numeric' || !nums) return null
    const groups = canSplit && byClass
      ? rowsByClass.map((rows, index) => ({ name: classes[index], color: classColor(index), values: rows.map((row) => nums[row]) }))
      : [{ name: profile.name, color: profile.name === target ? 'rgba(214, 51, 132, 0.75)' : classColor(0), values: nums }]
    // Los mismos intervalos para todas las clases, para poder compararlas
    const { edges } = histogram(nums, bins > 0 ? bins : undefined)
    const { centers, width } = binCenters(edges)
    const distribution = groups.map(({ name, color, values }) => ({
      type         : 'bar', name, x            : centers, y            : binCounts(values, edges), width, opacity      : groups.length > 1 ? 0.65 : 1,
      marker       : { color },
      hovertemplate: `${name}<br>%{x}: %{y}<extra></extra>`,
    } as Data))
    const box = groups.flatMap(({ name, color, values }) => {
      const stats = boxStats(values)
      if (stats === null) return []
      return [
        {
          type       : 'box', name, y          : [name], orientation: 'h', marker     : { color }, boxpoints  : false,
          q1         : [stats.q1], median     : [stats.median], q3         : [stats.q3], mean       : [stats.mean],
          lowerfence : [stats.lowerfence], upperfence : [stats.upperfence],
        } as unknown as Data,
        // Los atípicos aparte (como mucho 500 por grupo)
        {
          type         : 'scatter', mode         : 'markers', x            : stats.outliers, y            : stats.outliers.map(() => name), showlegend   : false,
          marker       : { color, size: 5, opacity: 0.6 },
          hovertemplate: '%{x}<extra></extra>',
        } as Data,
      ]
    })
    return { distribution, box }
  }, [profile, numbers, canSplit, byClass, rowsByClass, classes, target, bins])

  if (!profile) return null
  const values = columnValues.get(profile.name) ?? []

  let distribution: Data[]
  let box: Data[] | null = null
  if (numericCharts !== null) {
    distribution = numericCharts.distribution
    box = numericCharts.box
  } else {
    // Categórica: frecuencia de cada valor (los 30 más frecuentes), apilada por clase
    const frequencies = valueCounts(values, 30)
    const categories = frequencies.map(({ value }) => value)
    distribution = split
      ? rowsByClass.map((rows, index) => {
        const counts = countValues(rows.map((row) => values[row]))
        return { type: 'bar', name: classes[index], x: categories, y: categories.map((value) => counts.get(value) ?? 0), marker: { color: classColor(index) } } as Data
      })
      : [{ type: 'bar', name: profile.name, x: categories, y: frequencies.map(({ count }) => count), marker: { color: profile.name === target ? 'rgba(214, 51, 132, 0.75)' : classColor(0) } } as Data]
  }

  return <>
    <Row className={'g-3 align-items-end mb-2'}>
      <Col sm={6} lg={4}>
        <Form.Group controlId={'analyze-distribution-variable'}>
          <Form.Label className={'small fw-semibold mb-1'}>{t(prefix + 'variable')}</Form.Label>
          <Form.Select size={'sm'} value={profile.name} onChange={(e) => onVariable(e.target.value)}>
            {profiles.map(({ name, kind }) => (
              <option key={name} value={name}>{name} · {t('pages.dataframe.variables.kind-' + kind)}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
      {profile.kind === 'numeric' &&
        <Col sm={6} lg={3}>
          <Form.Group controlId={'analyze-distribution-bins'}>
            <Form.Label className={'small fw-semibold mb-1'}>{t(prefix + 'bins')}</Form.Label>
            <Form.Select size={'sm'} value={bins} onChange={(e) => setBins(Number(e.target.value))}>
              {BINS.map((value) => <option key={value} value={value}>{value === 0 ? t(prefix + 'bins-auto') : value}</option>)}
            </Form.Select>
          </Form.Group>
        </Col>}
      {canSplit &&
        <Col lg={'auto'}>
          <Form.Check type={'switch'} id={'analyze-distribution-by-class'} checked={byClass} onChange={(e) => setByClass(e.target.checked)}
            label={<Trans i18nKey={prefix + 'by-class'} values={{ target }} components={{ code: <code /> }} />} />
        </Col>}
    </Row>

    <Row className={'g-3'}>
      <Col xl={box ? 7 : 12}>
        <h4 className={'h6'}>{t(prefix + (profile.kind === 'numeric' ? 'histogram' : 'frequencies'))}</h4>
        <N4LPlot data={distribution} height={340}
          label={t(prefix + (profile.kind === 'numeric' ? 'histogram' : 'frequencies'))}
          layout={{
            barmode   : split ? (profile.kind === 'numeric' ? 'overlay' : 'stack') : undefined,
            showlegend: split,
            bargap    : 0.05,
            xaxis     : { title: { text: profile.name }, type: profile.kind === 'categorical' ? 'category' : undefined },
            yaxis     : { title: { text: t(prefix + 'count') } },
          }} />
        <p className={'small text-body-secondary mb-0'}>{t(prefix + (profile.kind === 'numeric' ? 'help-histogram' : 'help-frequencies'))}</p>
      </Col>
      {box &&
        <Col xl={5}>
          <h4 className={'h6'}>{t(prefix + 'boxplot')}</h4>
          <N4LPlot data={box} height={340} label={t(prefix + 'boxplot')}
            layout={{ showlegend: false, xaxis: { title: { text: profile.name } }, yaxis: { type: 'category', automargin: true } }} />
          <p className={'small text-body-secondary mb-0'}>{t(prefix + 'help-boxplot')}</p>
        </Col>}
    </Row>

    {perClass.length > 0 &&
      <div className={'overflow-x-auto mt-3'}>
        <Table size={'sm'} className={'n4l-eda-table align-middle mb-0'}>
          <caption className={'caption-top small'}>
            <Trans i18nKey={prefix + 'by-class-table'} values={{ column: profile.name, target }} components={{ code: <code /> }} />
          </caption>
          <thead>
            <tr>
              <th>{t(prefix + 'class')}</th>
              <th className={'text-end'}>n</th>
              {(['mean', 'std', 'min', 'median', 'max'] as const).map((stat) => (
                <th key={stat} className={'text-end'}>{t('pages.dataframe.variables.' + stat)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {perClass.map(({ label, profile: classProfile }, index) => (
              <tr key={label}>
                <th scope={'row'}><span className={'n4l-eda-swatch'} style={{ backgroundColor: classColor(index) }} />{label}</th>
                <td className={'text-end'}>{format.format(classProfile.count)}</td>
                {(['mean', 'std', 'min', 'median', 'max'] as const).map((stat) => (
                  <td key={stat} className={'text-end'}>{classProfile.numeric ? format.format(classProfile.numeric[stat]) : '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>}
  </>
}
