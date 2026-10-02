import { useMemo, useState } from 'react'
import { Badge, Button, Col, Form, Row, Table } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import type * as dfd from 'danfojs'

import type { ColumnProfile_t } from '@core/dataframe/eda'
import {
  dataframeToCSV,
  preprocessDataFrame,
  type ColumnAction_t,
  type MissingStrategy_t,
  type Scaler_t,
} from '@core/dataframe/preprocess'
import N4LDataFrameTable from '@components/dataframe/N4LDataFrameTable'

type AnalyzePreprocessProps = {
  dataframe: dfd.DataFrame
  profiles : ColumnProfile_t[]
  target   : string | null
  /** Nombre del CSV, para el del descargado */
  name     : string
}

const defaultActions = (profiles: ColumnProfile_t[]): Record<string, ColumnAction_t> =>
  Object.fromEntries(profiles.map(({ name, kind }) => [name, kind === 'categorical' ? 'label-encoder' : 'keep']))

/**
 * Prepara el conjunto para un modelo: qué hacer con cada columna, con los ausentes, con las filas repetidas y con la
 * escala. El resultado se recalcula con cada cambio y se puede descargar como CSV.
 */
export default function AnalyzePreprocess({ dataframe, profiles, target, name }: AnalyzePreprocessProps) {
  const prefix = 'pages.dataframe.preprocess.'
  const { t } = useTranslation()
  const [actions, setActions] = useState(() => defaultActions(profiles))
  const [missing, setMissing] = useState<MissingStrategy_t>('keep')
  const [duplicates, setDuplicates] = useState(false)
  const [scaler, setScaler] = useState<Scaler_t>('none')

  // Otro conjunto de datos: el formulario vuelve a empezar (se ajusta al renderizar, no en un efecto)
  const [prevDataframe, setPrevDataframe] = useState(dataframe)
  if (dataframe !== prevDataframe) {
    setPrevDataframe(dataframe)
    setActions(defaultActions(profiles))
  }

  const result = useMemo(() => preprocessDataFrame(dataframe, { columns: actions, missing, duplicates, scaler, target }),
    [dataframe, actions, missing, duplicates, scaler, target])
  const encoded = Object.entries(result.encodings)

  const handleClick_Download = () => {
    const blob = new Blob([dataframeToCSV(result.dataframe)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name.replace(/\.csv$/i, '') + '-processed.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return <>
    <p className={'text-body-secondary'}>{t(prefix + 'help')}</p>
    <Row className={'g-3 mb-3'}>
      <Col md={4}>
        <Form.Group controlId={'analyze-preprocess-missing'}>
          <Form.Label className={'small fw-semibold mb-1'}>{t(prefix + 'missing')}</Form.Label>
          <Form.Select size={'sm'} value={missing} onChange={(e) => setMissing(e.target.value as MissingStrategy_t)}>
            {(['keep', 'drop-rows', 'impute'] as const).map((key) => <option key={key} value={key}>{t(prefix + 'missing-' + key)}</option>)}
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group controlId={'analyze-preprocess-scaler'}>
          <Form.Label className={'small fw-semibold mb-1'}>{t(prefix + 'scaler')}</Form.Label>
          <Form.Select size={'sm'} value={scaler} onChange={(e) => setScaler(e.target.value as Scaler_t)}>
            {(['none', 'min-max', 'standard'] as const).map((key) => <option key={key} value={key}>{t(prefix + 'scaler-' + key)}</option>)}
          </Form.Select>
          <Form.Text>{t(prefix + 'scaler-help')}</Form.Text>
        </Form.Group>
      </Col>
      <Col md={4} className={'d-flex align-items-center'}>
        <Form.Check type={'switch'} id={'analyze-preprocess-duplicates'} checked={duplicates}
          onChange={(e) => setDuplicates(e.target.checked)} label={t(prefix + 'duplicates')} />
      </Col>
    </Row>

    <div className={'overflow-x-auto'}>
      <Table size={'sm'} className={'n4l-eda-table align-middle'}>
        <thead>
          <tr>
            <th>{t('pages.dataframe.variables.column')}</th>
            <th>{t('pages.dataframe.variables.type')}</th>
            <th className={'text-end'}>{t('pages.dataframe.variables.missing')}</th>
            <th style={{ minWidth: '14rem' }}>{t(prefix + 'action')}</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map(({ name: column, kind, missing: columnMissing }) => {
            const isTarget = column === target
            return (
              <tr key={column} className={isTarget ? 'n4l-eda-target-row' : undefined}>
                <th scope={'row'}>
                  <code>{column}</code>
                  {isTarget && <Badge bg={''} className={'n4l-target-badge ms-2'}>{t('pages.dataframe.variables.target')}</Badge>}
                </th>
                <td>{t('pages.dataframe.variables.kind-' + kind)}</td>
                <td className={'text-end'}>{columnMissing}</td>
                <td>
                  <Form.Select size={'sm'} aria-label={t(prefix + 'action') + ': ' + column}
                    value={actions[column] ?? 'keep'}
                    onChange={(e) => setActions((prev) => ({ ...prev, [column]: e.target.value as ColumnAction_t }))}>
                    <option value={'keep'}>{t(prefix + 'action-keep')}</option>
                    <option value={'label-encoder'}>{t(prefix + 'action-label-encoder')}</option>
                    {/* El objetivo es lo que se predice: no se puede descartar */}
                    <option value={'drop'} disabled={isTarget}>{t(prefix + 'action-drop')}</option>
                  </Form.Select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>

    <div className={'d-flex flex-wrap align-items-center justify-content-between gap-2 mt-4 mb-2'}>
      <h4 className={'h6 mb-0'}>{t(prefix + 'result')}</h4>
      <Button size={'sm'} variant={'outline-primary'} onClick={handleClick_Download} data-testid={'Test-AnalyzeDownload'}>{t(prefix + 'download')}</Button>
    </div>
    {(result.removedRows.duplicates > 0 || result.removedRows.missing > 0) &&
      <p className={'small text-body-secondary mb-2'}>
        {t(prefix + 'removed-rows', { duplicates: result.removedRows.duplicates, missing: result.removedRows.missing })}
      </p>}
    <N4LDataFrameTable dataframe={result.dataframe} target={target} subtitles={result.applied} />

    {(encoded.length > 0 || Object.keys(result.imputed).length > 0) &&
      <Row className={'g-3 mt-2'}>
        {encoded.length > 0 &&
          <Col lg={8}>
            <h5 className={'h6'}>{t(prefix + 'encodings')}</h5>
            <dl className={'n4l-eda-encodings small mb-0'}>
              {encoded.map(([column, classes]) => (
                <div key={column}>
                  <dt><code>{column}</code></dt>
                  <dd>{classes.slice(0, 20).map((value, code) => (
                    <span key={value} className={'n4l-eda-chip'}>{value} → {code}</span>
                  ))}{classes.length > 20 && <span className={'text-body-secondary'}> {t('pages.dataframe.variables.more', { count: classes.length - 20 })}</span>}</dd>
                </div>
              ))}
            </dl>
          </Col>}
        {Object.keys(result.imputed).length > 0 &&
          <Col lg={4}>
            <h5 className={'h6'}>{t(prefix + 'imputed')}</h5>
            <ul className={'small mb-0'}>
              {Object.entries(result.imputed).map(([column, value]) => (
                <li key={column}><Trans i18nKey={prefix + 'imputed-value'} values={{ column, value: typeof value === 'number' ? Number(value.toFixed(3)) : value }} components={{ code: <code /> }} /></li>
              ))}
            </ul>
          </Col>}
      </Row>}
  </>
}
