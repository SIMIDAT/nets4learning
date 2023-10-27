import React, { useEffect, useState } from 'react'
import { Col, Container, Pagination, Row, Table } from 'react-bootstrap'
import { VERBOSE } from '@/CONSTANTS'

export default function DataFrameDataset ({ dataframe, }) {

  const [activePage, setActivePage] = useState(0)
  const [pageCount, setPageCount] = useState(0)
  const [data, setData] = useState([])
  const startPage = 0
  const rowsPerPage = 10

  const dataFrameToMatrix = (dataframe) => {
    const matrix = []
    for (const column_name of dataframe.columns) {
      const row = []
      for (const value of dataframe[column_name].values) {
        row.push(value)
      }
      matrix.push(row)
    }

    return matrix
  }

  const transposeMatrix = (matrix) => {
    const numRows = matrix.length
    const numCols = matrix[0].length
    const transposedMatrix = []
    for (let i = 0; i < numCols; i++) {
      transposedMatrix[i] = []
    }
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        transposedMatrix[j][i] = matrix[i][j]
      }
    }
    return transposedMatrix
  }

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[ dataframe ]')
    if (dataframe.columns.length > 0) {
      const _data = transposeMatrix(dataFrameToMatrix(dataframe))
      const _rowsCount = _data.length
      const _pageCount = Math.ceil(_rowsCount / rowsPerPage)
      setPageCount(_pageCount)
      setData(_data)
    }
  }, [dataframe])

  const handleClick_ChangePage = (pageNumber) => {
    setActivePage(pageNumber)
  }

  return <>
    <Container fluid={true}>
      <Row>
        <Col>
          <Table striped={true} hover={true} responsive={true} size={'sm'}>
            <thead>
            <tr>
              <th>ID</th>
              {dataframe
                .columns
                .map((v, i) => {
                  return <th key={'thead_' + i}>{v}</th>
                })}
            </tr>
            </thead>
            <tbody>
            {Array
              .from(data)
              .slice(activePage * rowsPerPage, (activePage * rowsPerPage) + rowsPerPage)
              .map((row_value, row_index) => {
                return <tr key={'tbody_' + row_index}>

                  <th key={'tbody_id_' + row_index}>{(activePage * rowsPerPage) + row_index}</th>

                  {row_value.map((column_value, column_index) => {
                    return <td key={'tbody_' + row_index + '_' + column_index}>{column_value}</td>
                  })}

                </tr>
              })}
            </tbody>
          </Table>
        </Col>
      </Row>
      <Row>
        <Col>
          <Pagination size="sm" className={'justify-content-center mt-3'}>
            <Pagination.First disabled={!(activePage > 0)}
                              onClick={() => handleClick_ChangePage(0)} />

            <Pagination.Prev disabled={!(activePage - 1 >= startPage)}
                             onClick={() => handleClick_ChangePage(activePage - 1)} />


            <Pagination.Item disabled={!(activePage - 3 >= startPage)}
                             onClick={() => handleClick_ChangePage(activePage - 3)}>
              {(activePage - 3 >= startPage) ? activePage - 3 : '-'}
            </Pagination.Item>

            <Pagination.Item disabled={!(activePage - 2 >= startPage)}
                             onClick={() => handleClick_ChangePage(activePage - 2)}>
              {(activePage - 2 >= startPage) ? activePage - 2 : '-'}
            </Pagination.Item>

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

            <Pagination.Item disabled={!(activePage + 3 < pageCount)}
                             onClick={() => handleClick_ChangePage(activePage + 3)}>
              {(activePage + 3 < pageCount) ? activePage + 3 : '-'}
            </Pagination.Item>


            <Pagination.Next disabled={!(activePage + 1 < pageCount)}
                             onClick={() => handleClick_ChangePage(activePage + 1)} />
            {(activePage + 1 <= pageCount - 1) && <></>}
            <Pagination.Last disabled={!(activePage + 1 <= pageCount - 1)}
                             onClick={() => handleClick_ChangePage(pageCount - 1)} />
          </Pagination>
        </Col>
      </Row>
    </Container>
  </>
}