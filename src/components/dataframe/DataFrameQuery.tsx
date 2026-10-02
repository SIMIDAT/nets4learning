import { useMemo, useState } from 'react'
import { Col, InputGroup, Row, Form, Button } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'

import { VERBOSE } from '@/CONSTANTS'
import { parseDataFrameQuery } from '@core/dataframe/DataFrameQueryParser'
import N4LDataFrameTable from '@components/dataframe/N4LDataFrameTable'

const DEFAULT_QUERY = '.gt(5)'

type DataFrameQueryProps = {
  dataframe: dfd.DataFrame
  /** Columna objetivo, que se resalta en el resultado */
  target?  : string | null
}

type QueryResult_t = { dataframe: dfd.DataFrame } | { error: string }

export default function DataFrameQuery({ dataframe, target }: DataFrameQueryProps) {
  const { t } = useTranslation()
  const [stringToQuery, setStringToQuery] = useState(DEFAULT_QUERY)
  const [columnSelected, setColumnSelected] = useState<string>('')
  // La consulta que se muestra: la última aplicada con el botón (al principio, la de ejemplo sobre la primera columna)
  const [applied, setApplied] = useState({ column: '', query: DEFAULT_QUERY })
  // Si la columna elegida no está en el dataframe (al inicio o al cambiar de dataframe), se usa la primera
  const columnOf = (column: string) => (dataframe.columns.includes(column) ? column : (dataframe.columns[0] ?? ''))
  const columnToQuery = columnOf(columnSelected)

  const result = useMemo((): QueryResult_t | null => {
    const column = dataframe.columns.includes(applied.column) ? applied.column : dataframe.columns[0]
    if (column === undefined) return null
    try {
      return { dataframe: dataframe.query(parseDataFrameQuery(dataframe, column, applied.query)) }
    } catch (error) {
      console.error(error)
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }, [dataframe, applied])

  const handleSubmit_Query = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setApplied({ column: columnToQuery, query: stringToQuery })
  }

  if (VERBOSE) console.debug('render DataFrameQuery')
  return <>
    <Form onSubmit={handleSubmit_Query}>
      <Row className={'pb-3 g-2'}>
        <Col sm={4} lg={3}>
          <InputGroup size={'sm'}>
            <InputGroup.Text>df[</InputGroup.Text>
            <Form.Select
              aria-label={'column'}
              size={'sm'}
              value={columnToQuery}
              onChange={(e) => { setColumnSelected(e.target.value) }}>
              {dataframe.columns.map((column_name, index) => {
                return <option key={index} value={column_name}>{column_name}</option>
              })}
            </Form.Select>
            <InputGroup.Text>]</InputGroup.Text>
          </InputGroup>
        </Col>
        <Col sm={5} lg={7}>
          <Form.Label htmlFor="dataframe-query-input" visuallyHidden>
            <Trans i18nKey={'dataframe.query.query'} />
          </Form.Label>
          <Form.Control
            id="dataframe-query-input"
            size={'sm'}
            className={'font-monospace'}
            placeholder={'.gt(5).and(df["petal length"].gt(5))'}
            value={stringToQuery}
            onChange={(e) => { setStringToQuery(e.target.value) }} />
          <Form.Text className="text-muted">
            dataframe: <var>df</var>
          </Form.Text>
        </Col>
        <Col sm={3} lg={2}>
          <div className="d-grid gap-2">
            <Button type={'submit'} variant={'outline-primary'} size={'sm'}>
              <Trans i18nKey={'dataframe.query.query'} />
            </Button>
          </div>
        </Col>
      </Row>
    </Form>
    {result !== null && <>
      <p className={'small mb-2'}>
        <code>df[{JSON.stringify(columnOf(applied.column))}]{applied.query}</code>
      </p>
      {'error' in result && <p className={'text-danger small'}>{t('dataframe.query.error', { message: result.error })}</p>}
      {'dataframe' in result && (result.dataframe.shape[0] === 0
        ? <p className={'text-body-secondary'}>{t('dataframe.query.no-rows')}</p>
        : <N4LDataFrameTable dataframe={result.dataframe} target={target} />)}
    </>}
  </>
}
