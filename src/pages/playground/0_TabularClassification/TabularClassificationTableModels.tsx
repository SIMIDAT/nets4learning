import { useMemo, useState } from 'react'
import { Table, Card, Button, Container, Row, Col } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import * as tfvis from '@tensorflow/tfjs-vis'

import { VERBOSE } from '@/CONSTANTS'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import { bestModelIndex, formatEpochs } from '@core/history/trainingSummary'
import N4LFinalMetrics, { N4LBestBadge } from '@components/neural-network/N4LFinalMetrics'
import N4LTrainingCurves from '@components/neural-network/N4LTrainingCurves'
import N4LConfusionMatrix from '@components/neural-network/N4LConfusionMatrix'
import { nnLabel } from '@core/nn-utils/ArchitectureTypesHelper'
import type { TabularClassificationGeneratedModel_t } from '@core/types'
import N4LPagination from '@components/table/N4LPagination'
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'

type TabularClassificationTableModelsProps_t = {
  rowsPerPage?: number,
}
export default function TabularClassificationTableModels(props: TabularClassificationTableModelsProps_t) {
    const { rowsPerPage = 5 } = props
  const { generatedModels: listModels, isTraining } = useTabularClassificationContext()
  const prefix = 'generator.table-models.'

  const [activePage, setActivePage] = useState(0)
  // const [pageCount, setPageCount] = useState(0)

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

  // Historial de cada modelo (mismo orden que la tabla) y el de menor pérdida final, si hay con quién comparar
  const histories = listModels.map((generated) => generated.history.history)
  const bestIndex = histories.length > 1 ? bestModelIndex(histories) : -1

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
      <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
        <h3><Trans i18nKey={prefix + 'list-models-generated'} /> | {listModels.length}</h3>
        <div className="d-flex gap-1">
          <Button variant={'outline-primary'}
            size={'sm'}
            className={'text-nowrap'}
            onClick={handleClick_OpenVisor}>
            <Trans i18nKey={prefix + 'open-visor'} />
          </Button>
          <Button variant={'outline-primary'}
            size={'sm'}
            className={'text-nowrap'}
            onClick={handleClick_CloseVisor}>
            <Trans i18nKey={prefix + 'close-visor'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {listModels.length === 0 && <>
          <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-training'} />
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
                          <th className={'text-nowrap'}>{(activePage * rowsPerPage) + index + 1}{(activePage * rowsPerPage) + index === bestIndex && <N4LBestBadge />}</th>
                          <td><span className={'n4l-table-cell'}>{value.learningRate}</span></td>
                          <td><span className={'n4l-table-cell'}>{formatEpochs(value.history.epoch.length, value.numberOfEpoch)}</span></td>
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
                          <td><span className={'n4l-table-cell'}>{nnLabel(value.idOptimizer)}</span></td>
                          <td><span className={'n4l-table-cell'}>{nnLabel(value.idLoss)}</span></td>
                          <td><span className={'n4l-table-cell'}>{nnLabel(value.idMetrics)}</span></td>
                          <td>
                            <N4LFinalMetrics logs={value.history.history} />
                          </td>
                          <td>
                            <Button variant={'outline-primary'}
                              size={'sm'}
                              onClick={() => handleClick_DownloadGeneratedModel(value, (activePage * rowsPerPage) + index + 1)}
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
                <N4LPagination activePage={activePage} pageCount={pageCount} onChange={handleClick_ChangePage} />
              </Col>
            </Row>
            <Row>
              <Col>
                <N4LTrainingCurves histories={histories}
                  renderDetails={(index) => listModels[index].evaluation !== undefined && <N4LConfusionMatrix {...listModels[index].evaluation} />} />
              </Col>
            </Row>
          </Container>
        </>}
      </Card.Body>
    </Card>
  </>
}
