import './N4LTablePagination.css'
import React, { useState } from 'react'
import { Pagination, Table } from 'react-bootstrap'

export default function N4LTablePagination ({ data_head, data_body, rows_per_page = 10 }) {

  const [activePage, setActivePage] = useState(0)

  const rowsPerPage = rows_per_page
  const rowsCount = data_body.length
  const startPage = 0
  const pageCount = Math.ceil(rowsCount / rowsPerPage)

  const handleClick_ChangePage = (pageNumber) => {
    setActivePage(pageNumber)
  }

  return <>
    <div className={'n4l-table-paginator-table-wrapper-scroll-x'}>
      <Table className={'n4l-table-paginator-table'} striped={true} size={'sm'}>
        <thead>
        <tr>
          <th>ID</th>
          {data_head.map((v, i) => {
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

    <Pagination size="sm" className={'n4l-pagination justify-content-center'}>
      {(activePage > 0) && <></>}
      <Pagination.First disabled={!(activePage > 0)}
                        onClick={() => handleClick_ChangePage(0)} />

      {(activePage - 1 >= startPage) && <></>}
      <Pagination.Prev disabled={!(activePage - 1 >= startPage)}
                       onClick={() => handleClick_ChangePage(activePage - 1)} />

      {(activePage - 3 >= startPage) && <></>}
      <Pagination.Item disabled={!(activePage - 3 >= startPage)}
                       onClick={() => handleClick_ChangePage(activePage - 3)}>
        {(activePage - 3 >= startPage) ? activePage - 3 : '-'}
      </Pagination.Item>

      {(activePage - 2 >= startPage) && <></>}
      <Pagination.Item disabled={!(activePage - 2 >= startPage)}
                       onClick={() => handleClick_ChangePage(activePage - 2)}>
        {(activePage - 2 >= startPage) ? activePage - 2 : '-'}
      </Pagination.Item>

      {(activePage - 1 >= startPage) && <></>}
      <Pagination.Item disabled={!(activePage - 1 >= startPage)}
                       onClick={() => handleClick_ChangePage(activePage - 1)}>
        {(activePage - 1 >= startPage) ? activePage - 1 : '-'}
      </Pagination.Item>
      <Pagination.Item active={true}>
        {activePage}
      </Pagination.Item>
      <Pagination.Item disabled={!(activePage + 1 < pageCount)}
                       onClick={() => handleClick_ChangePage(activePage + 1)}>
        {(activePage + 1 < pageCount) ? activePage + 1 : '-'}
      </Pagination.Item>
      {(activePage + 1 < pageCount) && <></>}

      <Pagination.Item disabled={!(activePage + 2 < pageCount)}
                       onClick={() => handleClick_ChangePage(activePage + 2)}>
        {(activePage + 2 < pageCount) ? activePage + 2 : '-'}
      </Pagination.Item>
      {(activePage + 2 < pageCount) && <></>}

      <Pagination.Item disabled={!(activePage + 3 < pageCount)}
                       onClick={() => handleClick_ChangePage(activePage + 3)}>
        {(activePage + 3 < pageCount) ? activePage + 3 : '-'}
      </Pagination.Item>
      {(activePage + 3 < pageCount) && <></>}


      {(activePage + 1 < pageCount) && <></>}
      <Pagination.Next disabled={!(activePage + 1 < pageCount)}
                       onClick={() => handleClick_ChangePage(activePage + 1)} />
      {(activePage + 1 <= pageCount - 1) && <></>}
      <Pagination.Last disabled={!(activePage + 1 <= pageCount - 1)}
                       onClick={() => handleClick_ChangePage(pageCount - 1)} />
    </Pagination>
  </>
}


