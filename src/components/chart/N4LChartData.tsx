import { useId, useMemo, useState } from 'react'
import { Button, Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import N4LPagination from '@components/table/N4LPagination'

export type ChartDataCell_t = string | number | null | undefined

type N4LChartDataProps = {
  /** Qué tabla es («Pérdida por época»): su título y el nombre de su región */
  caption   : string
  /** Encabezados; la primera columna es el encabezado de cada fila (la época, la fecha, la clase…) */
  columns   : string[]
  rows      : ChartDataCell_t[][]
  /** Filas por página: con más, la tabla se pagina */
  pageSize? : number
  /** Decimales como mucho de los números */
  digits?   : number
  className?: string
}

/**
 * «Ver los datos» de una gráfica (WCAG 1.1.1, 1.3.1): un botón que despliega una tabla con lo que está dibujado, para
 * quien no ve la gráfica o prefiere leer los valores. La frase que describe la gráfica (su aria-label) dice lo
 * importante; la tabla, todo.
 */
export default function N4LChartData({ caption, columns, rows, pageSize = 25, digits = 4, className = '' }: N4LChartDataProps) {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [page, setPage] = useState(0)
  const panelId = useId()
  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: digits }), [i18n.language, digits])
  const format = (value: ChartDataCell_t) => (value === null || value === undefined || (typeof value === 'number' && !Number.isFinite(value))
    ? '—'
    : typeof value === 'number' ? number.format(value) : value)

  const pageCount = Math.ceil(rows.length / pageSize)
  const current = Math.min(page, Math.max(0, pageCount - 1))
  const shown = rows.slice(current * pageSize, (current + 1) * pageSize)

  return (
    <div className={className} data-testid={'Test-ChartData'}>
      <Button size={'sm'} variant={'link'} className={'px-0'} aria-expanded={isOpen} aria-controls={isOpen ? panelId : undefined}
        onClick={() => setIsOpen(!isOpen)} data-testid={'Test-ChartData-Toggle'}>
        {t('chart-data.show')}<span className={'visually-hidden'}>: {caption}</span>
      </Button>
      {isOpen && <div id={panelId}>
        <div className={'table-responsive'} tabIndex={0} role={'region'} aria-label={caption}>
          <Table size={'sm'} striped={true} className={'mb-1 small'}>
            <caption className={'caption-top'}>
              {caption}
              {pageCount > 1 && <span className={'text-body-secondary'}>, {t('chart-data.rows', { from: current * pageSize + 1, to: current * pageSize + shown.length, total: rows.length })}</span>}
            </caption>
            <thead>
              <tr>{columns.map((column) => <th key={column} scope={'col'}>{column}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((row, index) => (
                <tr key={current * pageSize + index}>
                  {row.map((cell, column) => (column === 0
                    ? <th key={column} scope={'row'} className={'fw-normal'}>{format(cell)}</th>
                    : <td key={column} className={typeof cell === 'number' ? 'text-end' : undefined}>{format(cell)}</td>))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <N4LPagination activePage={current} pageCount={pageCount} onChange={setPage} label={`${t('pagination.label')}: ${caption}`} />
      </div>}
    </div>
  )
}
