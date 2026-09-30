import { useState } from 'react'
import { Table, Card, Button, Container, Row, Col } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import * as tfvis from '@tensorflow/tfjs-vis'

import { VERBOSE } from '@/CONSTANTS'
import { parseLogs } from '@core/history/utils'
import { nnLabel } from '@core/nn-utils/ArchitectureTypesHelper'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import type { ImageClassificationGeneratedModel_t } from '@core/types'
import N4LPagination from '@components/table/N4LPagination'

type ImageClassificationTableModelsProps = {
  GeneratedModels: ImageClassificationGeneratedModel_t[],
  rowsPerPage    : number
}
const DEFAULT_PROPS: ImageClassificationTableModelsProps = {
  GeneratedModels: [],
  rowsPerPage    : 3
}
export default function ImageClassificationTableModels(props: ImageClassificationTableModelsProps = DEFAULT_PROPS) {

  const {
    GeneratedModels,
    rowsPerPage
  } = props

  const prefix = 'generator.table-models.'

  const [activePage, setActivePage] = useState(0)

  const showTable = GeneratedModels.length > 0
  const pageCount = Math.ceil(GeneratedModels.length / rowsPerPage)

  const handleClick_ChangePage = (pageNumber: number) => {
    setActivePage(pageNumber)
  }

  const handleClick_CloseVisor = () => {
    tfvis.visor().close()
  }
  const handleClick_OpenVisor = () => {
    tfvis.visor().open()
  }

  const handleClick_DownloadGeneratedModel = ({ model }: ImageClassificationGeneratedModel_t, index: number) => {
    model.save('downloads://image-classification-model-' + index)
  }

  if (VERBOSE) console.debug('render ImageClassificationTableModels')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={prefix + 'list-models-generated'} /> | {GeneratedModels.length}</h3>
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
            <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-training'} />
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
                      <th><Trans i18nKey={prefix + 'n-epochs'} /></th>
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
                      .from(GeneratedModels)
                      .slice(activePage * rowsPerPage, (activePage * rowsPerPage) + rowsPerPage)
                      .map((value, index) => {
                        return <tr key={index}>
                          <th>{(activePage * rowsPerPage) + index + 1}</th>
                          <td>{value.params.learning_rate}</td>
                          <td>{value.params.test_size}%</td>
                          <td>{value.params.n_epochs}</td>
                          <td>
                            {value.params.layers
                              .map((value, index2) => {
                                return <span key={index2} className={'n4l-table-cell'}><small>{value._class}</small><br /></span>
                              })}
                          </td>
                          <td><span className={'n4l-table-cell'}><small>{nnLabel(value.params.id_optimizer)}</small></span></td>
                          <td><span className={'n4l-table-cell'}><small>{nnLabel(value.params.id_loss)}</small></span></td>
                          <td>
                            {value.params.id_metrics_list
                              .map((metric, index2) => {
                                return <span key={index2} className={'n4l-table-cell'}>
                                  <small>
                                    {nnLabel(metric)}</small><br />
                                </span>
                              })}
                          </td>
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
                              onClick={() => handleClick_DownloadGeneratedModel(value, (activePage * rowsPerPage) + index + 1)}>
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