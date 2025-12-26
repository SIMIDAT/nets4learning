import { useMemo, useState } from 'react'
import { Table, Card, Button, Container, Row, Col, Pagination } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import * as tfvis from '@tensorflow/tfjs-vis'

import { VERBOSE } from '@/CONSTANTS'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import { parseIDOptimizer, parseLogs, parseLossAndMetric } from '@core/history/utils'
import type { TabularClassificationGeneratedModel_t } from '@core/types'

type TabularClassificationTableModelsProps_t = {
  listModels  : TabularClassificationGeneratedModel_t[],
  rowsPerPage?: number,
  isTraining? : boolean,
}
export default function TabularClassificationTableModels(props: TabularClassificationTableModelsProps_t) {
  const {
    listModels = [],
    rowsPerPage = 5,
    isTraining,
  } = props
  const prefix = 'generator.table-models.'

  const [activePage, setActivePage] = useState(0)
  // const [pageCount, setPageCount] = useState(0)
  const startPage = 0

  // useEffect(() => {
  //   if (VERBOSE) console.debug('useEffect[listModels.length, rowsPerPage]')
  //   const rowsCount = listModels.length
  //   const pageCount = Math.ceil(rowsCount / rowsPerPage)

  //   setPageCount(pageCount)
  // }, [listModels.length, rowsPerPage])
  const pageCount = useMemo(
    () => Math.ceil(listModels.length / rowsPerPage),
    [listModels.length, rowsPerPage]
  );

  const handleClick_ChangePage = (pageNumber: number) => {
    setActivePage(pageNumber)
  }

  const handleClick_CloseVisor = () => {
    tfvis.visor().close()
  }
  const handleClick_OpenVisor = () => {
    tfvis.visor().open()
  }

  const handleClick_DownloadGeneratedModel = ({ model }: TabularClassificationGeneratedModel_t, index: number) => {
    model.save('downloads://cl-model-' + index)
  }


  if (VERBOSE) console.debug('render TabularClassificationTableModels')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={prefix + 'list-models-generated'} /> | {listModels.length}</h3>
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
        {listModels.length === 0 && <>
          <WaitingPlaceholder />

        </>}
        {listModels.length > 0 && <>
          <Container fluid={true}>
            <Row>
              <Col>
                <Table size={'sm'} striped={true} bordered={false} hover={true} responsive={true}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th><Trans i18nKey={prefix + 'learning-rate'} /></th>
                      <th><Trans i18nKey={prefix + 'n-of-epochs'} /></th>
                      <th><Trans i18nKey={prefix + 'test-size'} /></th>
                      <th><Trans i18nKey={prefix + 'layers'} /></th>
                      <th><Trans i18nKey={prefix + 'id-optimizer'} /></th>
                      <th><Trans i18nKey={prefix + 'id-loss'} /></th>
                      <th><Trans i18nKey={prefix + 'id-metrics'} /></th>
                      <th><Trans i18nKey={prefix + 'history'} /></th>
                      <th><Trans i18nKey={prefix + 'download'} /></th>
                    </tr>
                  </thead>

                  <tbody>
                    {Array
                      .from(listModels)
                      .slice(activePage * rowsPerPage, (activePage * rowsPerPage) + rowsPerPage)
                      .map((value, index) => {
                        return <tr key={index}>
                          <th>{(activePage * rowsPerPage) + index + 1}</th>
                          <td><span className={'n4l-table-cell'}>{value.learningRate * 100}%</span></td>
                          <td><span className={'n4l-table-cell'}>{value.numberOfEpoch}</span></td>
                          <td><span className={'n4l-table-cell'}>{value.testSize * 100}%</span></td>
                          <td>
                            {value.layerList
                              .map((value, index2) => {
                                return (
                                  <span key={index2} className={'n4l-table-cell'}>
                                    <small>{value.units.toString().padStart(2, '0')} - {value.activation}</small><br />
                                  </span>
                                )
                              })}
                          </td>
                          <td><span className={'n4l-table-cell'}>{parseIDOptimizer(value.idOptimizer)}</span></td>
                          <td><span className={'n4l-table-cell'}>{parseLossAndMetric(value.idLoss)}</span></td>
                          <td><span className={'n4l-table-cell'}>{parseLossAndMetric(value.idMetrics)}</span></td>
                          <td>
                            {Object.entries(value.history.history)
                              .map(([key, logs], index2) => {
                                const logsArray = logs as Array<number | string>
                                return <span key={index2} className={'n4l-table-cell'}>
                                  <small>{key} {parseLogs(logsArray)}</small><br />
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
                {isTraining && <>
                  <WaitingPlaceholder />
                </>}
              </Col>
            </Row>
            <Row>
              <Col>
                <Pagination size="sm" className={'justify-content-center'}>
                  <Pagination.First disabled={!(activePage > 0)}
                    onClick={() => handleClick_ChangePage(0)}
                  />

                  <Pagination.Prev disabled={!(activePage - 1 >= startPage)}
                    onClick={() => handleClick_ChangePage(activePage - 1)}
                  />

                  <Pagination.Item disabled={!(activePage - 3 >= startPage)}
                    onClick={() => handleClick_ChangePage(activePage - 3)}
                  >
                    {(activePage - 3 >= startPage) ? activePage - 3 : '-'}
                  </Pagination.Item>

                  <Pagination.Item
                    disabled={!(activePage - 2 >= startPage)}
                    onClick={() => handleClick_ChangePage(activePage - 2)}
                  >
                    {(activePage - 2 >= startPage) ? activePage - 2 : '-'}
                  </Pagination.Item>

                  <Pagination.Item
                    disabled={!(activePage - 1 >= startPage)}
                    onClick={() => handleClick_ChangePage(activePage - 1)}
                  >
                    {(activePage - 1 >= startPage) ? activePage - 1 : '-'}
                  </Pagination.Item>

                  <Pagination.Item active={true}>
                    {activePage}
                  </Pagination.Item>

                  <Pagination.Item
                    disabled={!(activePage + 1 < pageCount)}
                    onClick={() => handleClick_ChangePage(activePage + 1)}
                  >
                    {(activePage + 1 < pageCount) ? activePage + 1 : '-'}
                  </Pagination.Item>

                  <Pagination.Item
                    disabled={!(activePage + 2 < pageCount)}
                    onClick={() => handleClick_ChangePage(activePage + 2)}
                  >
                    {(activePage + 2 < pageCount) ? activePage + 2 : '-'}
                  </Pagination.Item>

                  <Pagination.Item
                    disabled={!(activePage + 3 < pageCount)}
                    onClick={() => handleClick_ChangePage(activePage + 3)}
                  >
                    {(activePage + 3 < pageCount) ? activePage + 3 : '-'}
                  </Pagination.Item>

                  <Pagination.Next
                    disabled={!(activePage + 1 < pageCount)}
                    onClick={() => handleClick_ChangePage(activePage + 1)}
                  />

                  <Pagination.Last
                    disabled={!(activePage + 1 <= pageCount - 1)}
                    onClick={() => handleClick_ChangePage(pageCount - 1)}
                  />
                </Pagination>
              </Col>
            </Row>
          </Container>
        </>}
      </Card.Body>
    </Card>
  </>
}
