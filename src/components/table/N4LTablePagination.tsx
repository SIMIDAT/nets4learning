import './N4LTablePagination.css'
import { useState } from 'react'
import { Table } from 'react-bootstrap'
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

  return <>
    <div className={'n4l-table-paginator-table-wrapper-scroll-x'}>
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

    <N4LPagination activePage={activePage} pageCount={pageCount} onChange={handleClick_ChangePage} className={'mt-2 n4l-pagination'} />
  </>
}


