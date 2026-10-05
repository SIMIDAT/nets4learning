import { useState } from 'react'
import { Table, Card, Button, Container, Row, Col } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as tfvis from '@tensorflow/tfjs-vis'

import { VERBOSE } from '@/CONSTANTS'
import { bestModelIndex, formatEpochs } from '@core/history/trainingSummary'
import N4LFinalMetrics, { N4LBestBadge } from '@components/neural-network/N4LFinalMetrics'
import N4LTrainingCurves from '@components/neural-network/N4LTrainingCurves'
import N4LConfusionMatrix from '@components/neural-network/N4LConfusionMatrix'
import { nnLabel } from '@core/nn-utils/ArchitectureTypesHelper'
import { layersSummary } from '@components/neural-network/layerSummary'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import type { ImageClassificationGeneratedModel_t } from '@core/types'
import N4LPagination from '@components/table/N4LPagination'
import { useParams } from 'react-router'
import { TASKS } from '@/TASKS'
import N4LReportButton from '@components/report/N4LReportButton'
import { historyNumbers } from '@core/report/trainingReport'
import { layerSummaryParts } from '@components/neural-network/layerSummary'
import N4LDownloadTrained from '@components/n4l/N4LDownloadTrained'
import type { N4LPackage_t } from '@core/n4l/source'
import { n4lLayersOf } from './models/n4lLayers'

type ImageClassificationTableModelsProps = {
  GeneratedModels: ImageClassificationGeneratedModel_t[],
  rowsPerPage    : number
  /** El paquete .n4l del conjunto: cada modelo se puede guardar en uno (con el conjunto y sus textos) */
  pkg?           : N4LPackage_t | null
  /** Las clases, en el orden de las salidas */
  classes?       : string[]
}
const DEFAULT_PROPS: ImageClassificationTableModelsProps = {
  GeneratedModels: [],
  rowsPerPage    : 3
}
export default function ImageClassificationTableModels(props: ImageClassificationTableModelsProps = DEFAULT_PROPS) {

  const {
    GeneratedModels,
    rowsPerPage,
    pkg = null,
    classes = [],
  } = props

  const prefix = 'generator.table-models.'

  const [activePage, setActivePage] = useState(0)

  const showTable = GeneratedModels.length > 0
  const pageCount = Math.ceil(GeneratedModels.length / rowsPerPage)

  // Historial de cada modelo (mismo orden que la tabla) y el de menor pérdida final, si hay con quién comparar
  const histories = GeneratedModels.map((generated) => generated.history.history)
  const bestIndex = histories.length > 1 ? bestModelIndex(histories) : -1
  // Para compararlos: lo que cambia de un entrenamiento a otro (las métricas solo se miden, no cambian cómo aprende)
  const { t } = useTranslation()
  const { example } = useParams()
  const parameters = GeneratedModels.map(({ params }) => ({
    'learning-rate': String(params.learning_rate),
    'n-epochs'     : String(params.n_epochs),
    'test-size'    : params.test_size + '%',
    'layers'       : layersSummary(t, params.layers),
    'id-optimizer' : nnLabel(params.id_optimizer),
    'id-loss'      : nnLabel(params.id_loss),
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

  const handleClick_DownloadGeneratedModel = ({ model }: ImageClassificationGeneratedModel_t, index: number) => {
    model.save('downloads://image-classification-model-' + index)
  }

  if (VERBOSE) console.debug('render ImageClassificationTableModels')
  return <>
    <Card>
      <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
        <h3><Trans i18nKey={prefix + 'list-models-generated'} /> | {GeneratedModels.length}</h3>
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
                          <th className={'text-nowrap'}>{(activePage * rowsPerPage) + index + 1}{(activePage * rowsPerPage) + index === bestIndex && <N4LBestBadge />}</th>
                          <td>{value.params.learning_rate}</td>
                          <td>{value.params.test_size}%</td>
                          <td>{formatEpochs(value.history.epoch.length, value.params.n_epochs)}</td>
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
                            <N4LFinalMetrics logs={value.history.history} />
                          </td>
                          <td>
                            <Button variant={'outline-primary'}
                              size={'sm'}
                              onClick={() => handleClick_DownloadGeneratedModel(value, (activePage * rowsPerPage) + index + 1)}>
                              <Trans i18nKey={prefix + 'download'} />
                            </Button>
                            <N4LDownloadTrained pkg={pkg} task={TASKS.IMAGE_CLASSIFICATION} model={value.model} classes={classes}
                              layers={n4lLayersOf(value.params.layers)} history={value.history.history as Record<string, number[]>}
                              number={(activePage * rowsPerPage) + index + 1} />
                            <N4LReportButton getReport={() => ({
                                version   : 1,
                                task      : TASKS.IMAGE_CLASSIFICATION,
                                dataset   : example ?? '',
                                model     : (activePage * rowsPerPage) + index + 1,
                                createdAt : new Date().toISOString(),
                                layers    : value.params.layers.map((layer) => layerSummaryParts(t, layer).join(' · ')),
                                parameters: parameters[(activePage * rowsPerPage) + index],
                                history   : historyNumbers(value.history.history),
                                ...(value.evaluation !== undefined) && { evaluation: value.evaluation },
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
                <N4LTrainingCurves histories={histories} parameters={parameters}
                  renderDetails={(index) => GeneratedModels[index].evaluation !== undefined && <N4LConfusionMatrix {...GeneratedModels[index].evaluation} />} />
              </Col>
            </Row>
          </>}

        </Container>
      </Card.Body>
    </Card>
  </>
}