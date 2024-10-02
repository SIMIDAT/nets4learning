import React, { useContext, useEffect, useState } from 'react'
import { Table, Card, Button, Container, Row, Col, Pagination } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import * as tfvis from '@tensorflow/tfjs-vis'

import { VERBOSE } from '@/CONSTANTS'
import { parseIDOptimizer, parseLogs, parseLossAndMetric } from '@/core/history/utils'
import RegressionContext from '@/context/RegressionContext'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

export default function RegressionTableModels({ rowsPerPage = 3 }) {
  const prefix = 'generator.table-models.'

  const { 
    listModels 
  } = useContext(RegressionContext)
  const [showTable, setShowTable] = useState(false)

  const [activePage, setActivePage] = useState(0)
  const [pageCount, setPageCount] = useState(0)
  const startPage = 0

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[listModels.data, rowsPerPage]')
    const rowsCount = listModels.data.length
    const pageCount = Math.ceil(rowsCount / rowsPerPage)

    setPageCount(pageCount)
  }, [listModels, listModels.data, listModels.index, rowsPerPage])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[listModels.data]')
    if (listModels.data.length > 0) {
      setShowTable(true)
    }
  }, [listModels, listModels.data, listModels.index])

  const handleClick_ChangePage = (pageNumber) => {
    setActivePage(pageNumber)
  }

  const handleClick_CloseVisor = () => {
    tfvis.visor().close()
  }
  const handleClick_OpenVisor = () => {
    tfvis.visor().open()
  }

  const handleClick_DownloadGeneratedModel = ({ model }, index) => {
    model.save('downloads://lr-model-' + index)
  }

  if (VERBOSE) console.debug('render RegressionTableModels')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h2><Trans i18nKey={prefix + 'list-models-generated'} /> | {listModels.data.length}</h2>
        <div className="d-flex">
          <Button variant={'outline-primary'}
                  size={'sm'}
                  className={'ms-3'}
                  onClick={handleClick_OpenVisor}>
            <Trans i18nKey={prefix + 'open-visor'} />
          </Button>
          <Button variant={'outline-primary'}
                  size={'sm'}
                  className={'ms-1'}
                  onClick={handleClick_CloseVisor}>
            <Trans i18nKey={prefix + 'close-visor'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Container fluid={true}>
          {!showTable && <>
            <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-training'} />
          </>}
          {showTable && <>
            <Row>
              <Col>
                <Table size={'sm'} striped={true} bordered={false} hover={true} responsive={'md'}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th><Trans i18nKey={prefix + 'learning-rate'} /></th>
                      <th><Trans i18nKey={prefix + 'test-size'} /></th>
                      <th><Trans i18nKey={prefix + 'n-of-epochs'} /></th>
                      <th><Trans i18nKey={prefix + 'layers'} /></th>
                      {/* <th><Trans i18nKey={prefix + 'features'} /></th> */}
                      <th><Trans i18nKey={prefix + 'id-optimizer'} /></th>
                      <th><Trans i18nKey={prefix + 'id-loss'} /></th>
                      <th><Trans i18nKey={prefix + 'id-metrics'} /></th>
                      <th><Trans i18nKey={prefix + 'history'} /></th>
                      <th><Trans i18nKey={prefix + 'download'} /></th>
                    </tr>
                  </thead>

                  <tbody>
                    {Array
                      .from(listModels.data)
                      .slice(activePage * rowsPerPage, (activePage * rowsPerPage) + rowsPerPage)
                      .map((value, index) => {
                        return <tr key={index}>
                          <th>{(activePage * rowsPerPage) + index + 1}</th>
                          <td>{value.params_training.learning_rate}%</td>
                          <td>{value.params_training.test_size}%</td>
                          <td>{value.params_training.n_of_epochs}</td>
                          <td>
                            {value.params_layers
                              .map((value, index2) => {
                                return (
                                <span key={index2} className={'n4l-table-cell'}>
                                  <small>{value.units.toString().padStart(2, '0')} - {value.activation}</small><br />
                                </span>
                                )
                              })}
                          </td>
                          <td><span className={'n4l-table-cell'}><small>{parseIDOptimizer(value.params_training.id_optimizer)}</small></span></td>
                          <td><span className={'n4l-table-cell'}><small>{parseLossAndMetric(value.params_training.id_loss)}</small></span></td>
                          <td>
                            {value.params_training.list_id_metrics
                              .map((metric, index2) => {
                                return <span key={index2} className={'n4l-table-cell'}>
                                  <small>{parseLossAndMetric(metric)}</small><br />
                                </span>
                              })}
                          </td>
                          <td>
                            {Object.entries(value.history.history)
                              .map(([key, logs], index2) => {
                                return <span key={index2} className={'n4l-table-cell'}>
                                  <small>{key} {parseLogs(logs)}</small><br />
                                </span>
                              })}
                          </td>
                          <td>
                            <Button variant={'outline-primary'}
                                    size={'sm'}
                                    onClick={() => handleClick_DownloadGeneratedModel(value, index)}
                            >
                              <Trans i18nKey={prefix + 'download'} />
                            </Button>
                          </td>
                        </tr>
                      })}
                  </tbody>
                </Table>
              </Col>
            </Row>
            <Row>
              <Col>
                <Pagination size="sm" className={'justify-content-center'}>
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

                  <Pagination.Last disabled={!(activePage + 1 <= pageCount - 1)}
                    onClick={() => handleClick_ChangePage(pageCount - 1)} />
                </Pagination>
              </Col>
            </Row>
          </>}
        </Container>
      </Card.Body>
    </Card>
  </>
}