import { useEffect, useEffectEvent, useState } from 'react'
import { Alert, Card, Col, Form, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { TASKS } from '@/TASKS'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import { DATASET_ACCEPT } from '@core/dataframe/datasetFormats'
import { readDatasetInWorker } from '@core/dataframe/datasetReaderClient'
import { inferFrequency, parseDate, readSeries } from '@core/timeSeries/series'
import { useProjectDatasetUpload } from '@hooks/useProjectDatasetUpload'
import { datasetKey, datasetVariables, projectDatasetByKey } from '@pages/analyze/projectDatasets'

import { prefix, type LoadedSeries_t } from './timeSeriesConfig'

/** Lo leído del fichero */
type Table_t = { name: string, columns: string[], rows: unknown[][], numeric: boolean[] }

const NO_DATE = ''

/** Si casi todos los valores de una columna de texto son fechas (1949-01, 1981-01-01, 2024-03-01 10:00…) */
function looksLikeDates(rows: unknown[][], column: number): boolean {
  const sample = rows.slice(0, 50).map((row) => String(row[column] ?? '').trim()).filter((value) => value !== '')
  return sample.length > 0 && sample.filter((value) => Number.isFinite(parseDate(value))).length >= sample.length * 0.9
}

/**
 * Subir una serie propia (CSV, ARFF, JSON, JSONL o Parquet) y elegir la columna con sus valores y, si la tiene, la de
 * sus fechas. Se proponen las de su ficha (si es un CSV del proyecto) o la última numérica y la primera con fechas
 */
export default function TimeSeriesUpload({ onLoaded }: { onLoaded: (series: LoadedSeries_t | null) => void }) {
  const { t } = useTranslation()
  const [table, setTable] = useState<Table_t | null>(null)
  const [valueColumn, setValueColumn] = useState('')
  const [dateColumn, setDateColumn] = useState(NO_DATE)
  const [error, setError] = useState(false)

  const handleUpload = async (files: File[]) => {
    if (files.length !== 1) return
    try {
      const { columns, rows, dtypes } = await readDatasetInWorker(files[0])
      const numeric = dtypes.map((dtype) => dtype === 'float32' || dtype === 'int32')
      // Un CSV del proyecto (desde /datasets, o descargado y vuelto a subir): su objetivo y su fecha, según su ficha
      const project = projectDatasetByKey(datasetKey(files[0].name))
      const variables = project === undefined ? undefined : datasetVariables(project.file)
      const target = variables?.find(({ role, name }) => role === 'Target' && columns.includes(name))?.name
      const date = variables?.find(({ type, name }) => type === 'Date' && columns.includes(name))?.name
      setTable({ name: files[0].name, columns, rows, numeric })
      setValueColumn(target ?? [...columns].reverse().find((_column, i) => numeric[columns.length - 1 - i]) ?? '')
      setDateColumn(date ?? columns.find((_column, i) => !numeric[i] && looksLikeDates(rows, i)) ?? NO_DATE)
      setError(false)
    } catch (reason) {
      console.error(reason)
      setTable(null)
      setError(true)
    }
  }

  // Desde «Entrenar» en /datasets (?dataset=…): se carga como si se hubiera subido
  useProjectDatasetUpload(TASKS.TIME_SERIES, true, (files) => { void handleUpload(files) })

  // La serie, cada vez que se elige otra columna
  const notify = useEffectEvent(onLoaded)
  useEffect(() => {
    if (table === null || valueColumn === '') {
      notify(null)
      return
    }
    const series = readSeries(table.columns, table.rows, valueColumn, dateColumn === NO_DATE ? null : dateColumn)
    notify({ ...series, name: table.name, valueColumn, frequency: dateColumn === NO_DATE ? undefined : inferFrequency(series.dates) })
  }, [table, valueColumn, dateColumn])

  return (
    <Card data-testid={'Test-TimeSeries-Upload'}>
      <Card.Header><h3 className={'h5 mb-0'}>{t(prefix + 'upload.title')}</h3></Card.Header>
      <Card.Body>
        <p>{t(prefix + 'upload.text')}</p>
        <DragAndDrop id={'drop-zone-time-series'} name={'csv'} accept={DATASET_ACCEPT} text={t('drag-and-drop.dataset')}
          labelFiles={t('drag-and-drop.label-files-one')} function_DropAccepted={(files) => { void handleUpload(files) }} />
        {error && <Alert variant={'danger'} className={'mt-3 mb-0'}>{t('error.file-upload')}</Alert>}
        {table !== null && !table.numeric.some(Boolean) &&
          <Alert variant={'warning'} className={'mt-3 mb-0'}>{t(prefix + 'upload.no-numeric')}</Alert>}
        {table !== null && table.numeric.some(Boolean) &&
          <Row className={'g-3 mt-1'}>
            <Col md={6}>
              <Form.Group controlId={'time-series-value-column'}>
                <Form.Label className={'fw-semibold'}>{t(prefix + 'upload.value-column')}</Form.Label>
                <Form.Select value={valueColumn} onChange={(event) => setValueColumn(event.target.value)}>
                  {table.columns.map((column, i) => table.numeric[i] && <option key={column} value={column}>{column}</option>)}
                </Form.Select>
                <Form.Text className={'text-muted'}>{t(prefix + 'upload.value-column-help')}</Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={'time-series-date-column'}>
                <Form.Label className={'fw-semibold'}>{t(prefix + 'upload.date-column')}</Form.Label>
                <Form.Select value={dateColumn} onChange={(event) => setDateColumn(event.target.value)}>
                  <option value={NO_DATE}>{t(prefix + 'upload.no-date')}</option>
                  {table.columns.map((column) => column !== valueColumn && <option key={column} value={column}>{column}</option>)}
                </Form.Select>
                <Form.Text className={'text-muted'}>{t(prefix + 'upload.date-column-help')}</Form.Text>
              </Form.Group>
            </Col>
          </Row>}
      </Card.Body>
    </Card>
  )
}
