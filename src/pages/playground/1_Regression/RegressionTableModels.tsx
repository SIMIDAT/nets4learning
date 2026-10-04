import { useState } from 'react'
import { Table, Card, Button, Container, Row, Col } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as tfvis from '@tensorflow/tfjs-vis'

import { VERBOSE } from '@/CONSTANTS'
import { bestModelIndex, formatEpochs } from '@core/history/trainingSummary'
import N4LFinalMetrics, { N4LBestBadge } from '@components/neural-network/N4LFinalMetrics'
import N4LTrainingCurves from '@components/neural-network/N4LTrainingCurves'
import { nnLabel } from '@core/nn-utils/ArchitectureTypesHelper'
import { layersSummary } from '@components/neural-network/layerSummary'
import { useRegressionContext } from '@context/useRegressionContext'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import type { CustomModelGenerated_t } from '@core/types'
import N4LPagination from '@components/table/N4LPagination'
import { useParams } from 'react-router'
import { TASKS } from '@/TASKS'
import N4LReportButton from '@components/report/N4LReportButton'
import { historyNumbers } from '@core/report/trainingReport'
import { denseLayerSummary } from '@components/neural-network/layerSummary'

export default function RegressionTableModels({ rowsPerPage = 3 }) {
  const prefix = 'generator.table-models.'

  const {
    listModels
  } = useRegressionContext()

  const [activePage, setActivePage] = useState(0)

  const showTable = listModels.data.length > 0
  const pageCount = Math.ceil(listModels.data.length / rowsPerPage)

  // Historial de cada modelo (mismo orden que la tabla) y el de menor pérdida final, si hay con quién comparar
  const histories = listModels.data.map((generated) => generated.history.history)
  const bestIndex = histories.length > 1 ? bestModelIndex(histories) : -1
  // Para compararlos: lo que cambia de un entrenamiento a otro (las métricas solo se miden, no cambian cómo aprende)
  const { t } = useTranslation()
  const { example } = useParams()
  const parameters = listModels.data.map(({ params_training, params_layers }) => ({
    'learning-rate': String(params_training.learning_rate),
    'n-of-epochs'  : String(params_training.n_of_epochs),
    'test-size'    : params_training.test_size + '%',
    'layers'       : layersSummary(t, params_layers),
    'id-optimizer' : nnLabel(params_training.id_optimizer),
    'id-loss'      : nnLabel(params_training.id_loss),
  }))

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
      <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
        <h2><Trans i18nKey={prefix + 'list-models-generated'} /> | {listModels.data.length}</h2>
        <div className="d-flex gap-1">
          <Button 
            variant={'outline-primary'}
            size={'sm'}
            className={'text-nowrap'}
            onClick={handleClick_OpenVisor}>
            <Trans i18nKey={prefix + 'open-visor'} />
          </Button>
          <Button 
            variant={'outline-primary'}
            size={'sm'}
            className={'text-nowrap'}
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
                          <th className={'text-nowrap'}>{(activePage * rowsPerPage) + index + 1}{(activePage * rowsPerPage) + index === bestIndex && <N4LBestBadge />}</th>
                          <td>{value.params_training.learning_rate}</td>
                          <td>{value.params_training.test_size}%</td>
                          <td>{formatEpochs(value.history.epoch.length, value.params_training.n_of_epochs)}</td>
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
                            <N4LFinalMetrics logs={value.history.history} />
                          </td>
                          <td>
                            <Button
                              variant={'outline-primary'}
                              size={'sm'}
                              onClick={() => handleClick_DownloadGeneratedModel(value, (activePage * rowsPerPage) + index + 1)}
                            >
                              <Trans i18nKey={prefix + 'download'} />
                            </Button>
                            <N4LReportButton getReport={() => ({
                                version   : 1,
                                task      : TASKS.REGRESSION,
                                dataset   : example ?? '',
                                model     : (activePage * rowsPerPage) + index + 1,
                                createdAt : new Date().toISOString(),
                                layers    : value.params_layers.map((layer) => denseLayerSummary(t, layer)),
                                parameters: parameters[(activePage * rowsPerPage) + index],
                                history   : historyNumbers(value.history.history),
                              })} />
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
            <Row>
              <Col>
                <N4LTrainingCurves histories={histories} parameters={parameters} />
              </Col>
            </Row>
          </>}
        </Container>
      </Card.Body>
    </Card>
  </>
}