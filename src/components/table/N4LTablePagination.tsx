import './N4LTablePagination.css'
import { useEffect, useRef, useState } from 'react'
import { Table } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import N4LPagination from '@components/table/N4LPagination'

type N4LTablePaginationProps = {
  data_head     : string[]
  data_body     : any[][]
  rows_per_page?: number
}

export default function N4LTablePagination (props: N4LTablePaginationProps) {
  const { data_head, data_body, rows_per_page = 10 } = props
  const [activePage, setActivePage] = useState<number>(0)

  const rowsPerPage = rows_per_page
  const rowsCount = data_body.length
  const pageCount = Math.ceil(rowsCount / rowsPerPage)

  const handleClick_ChangePage = (pageNumber: number) => {
    setActivePage(pageNumber)
  }

  // Si la tabla no cabe (sobre todo en móvil) se avisa de que se puede desplazar en horizontal
  const wrapper_ref = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  useEffect(() => {
    const wrapper = wrapper_ref.current
    if (wrapper === null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setIsOverflowing(wrapper.scrollWidth > wrapper.clientWidth + 1))
    // El contenedor cambia con la ventana y la tabla con los datos de cada página
    observer.observe(wrapper)
    if (wrapper.firstElementChild) observer.observe(wrapper.firstElementChild)
    return () => observer.disconnect()
  }, [])

  return <>
    <div className={'n4l-table-paginator-table-wrapper-scroll-x'} ref={wrapper_ref}>
      <Table className={'n4l-table-paginator-table'} striped={true} size={'sm'}>
        <thead>
        <tr>
          <th>ID</th>
          {data_head.map((v: string, i: number) => {
            return <th key={'thead_' + i}>{v}</th>
          })}
        </tr>
        </thead>
        <tbody>
        {Array
          .from(data_body)
          .slice(activePage * rowsPerPage, (activePage * rowsPerPage) + rowsPerPage)
          .map((r_v, r_i) => {
            return <tr key={'tbody_' + r_i}>
              <th key={'tbody_id_' + r_i}>{(activePage * rowsPerPage) + r_i}</th>
              {r_v.map((c_v, c_i) => {
                return <td key={'tbody_' + r_i + '_' + c_i}>{c_v}</td>
              })}
            </tr>
          })}
        </tbody>
      </Table>
    </div>
    {isOverflowing &&
      <p className={'small text-body-secondary mb-0 mt-1'}><Trans i18nKey={'ui.table-scroll-hint'} /></p>
    }

    <N4LPagination activePage={activePage} pageCount={pageCount} onChange={handleClick_ChangePage} className={'mt-2 n4l-pagination'} />
  </>
}


