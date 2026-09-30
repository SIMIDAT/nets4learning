import { useState } from 'react'
import { Table, Card, Button, Container, Row, Col } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import * as tfvis from '@tensorflow/tfjs-vis'

import { VERBOSE } from '@/CONSTANTS'
import { parseLogs } from '@core/history/utils'
import { nnLabel } from '@core/nn-utils/ArchitectureTypesHelper'
import { useRegressionContext } from '@context/useRegressionContext'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import type { CustomModelGenerated_t } from '@core/types'
import N4LPagination from '@components/table/N4LPagination'

export default function RegressionTableModels({ rowsPerPage = 3 }) {
  const prefix = 'generator.table-models.'

  const {
    listModels
  } = useRegressionContext()

  const [activePage, setActivePage] = useState(0)

  const showTable = listModels.data.length > 0
  const pageCount = Math.ceil(listModels.data.length / rowsPerPage)

  const handleClick_ChangePage = (pageNumber: number) => {
    setActivePage(pageNumber)
  }

  const handleClick_CloseVisor = () => {
    tfvis.visor().close()
  }
  const handleClick_OpenVisor = () => {
    tfvis.visor().open()
  }

  const handleClick_DownloadGeneratedModel = ({ model }: CustomModelGenerated_t, index: number) => {
    model.save('downloads://lr-model-' + index)
  }

  if (VERBOSE) console.debug('render RegressionTableModels')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h2><Trans i18nKey={prefix + 'list-models-generated'} /> | {listModels.data.length}</h2>
        <div className="d-flex">
          <Button 
            variant={'outline-primary'}
            size={'sm'}
            className={'ms-3'}
            onClick={handleClick_OpenVisor}>
            <Trans i18nKey={prefix + 'open-visor'} />
          </Button>
          <Button 
            variant={'outline-primary'}
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
                      .map((value: CustomModelGenerated_t, index: number) => {
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
                          <td><span className={'n4l-table-cell'}><small>{nnLabel(value.params_training.id_optimizer)}</small></span></td>
                          <td><span className={'n4l-table-cell'}><small>{nnLabel(value.params_training.id_loss)}</small></span></td>
                          <td>
                            {value.params_training.list_id_metrics
                              .map((metric, index2) => {
                                return <span key={index2} className={'n4l-table-cell'}>
                                  <small>{nnLabel(metric)}</small><br />
                                </span>
                              })}
                          </td>
                          <td>
                            {Object.entries(value.history.history)
                              .map(([key, logs], index2) => {
                                return <span key={index2} className={'n4l-table-cell'}>
                                  <small>{key} {parseLogs(logs as any)}</small><br />
                                </span>
                              })}
                          </td>
                          <td>
                            <Button
                              variant={'outline-primary'}
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
                <N4LPagination activePage={activePage} pageCount={pageCount} onChange={handleClick_ChangePage} />
              </Col>
            </Row>
          </>}
        </Container>
      </Card.Body>
    </Card>
  </>
}