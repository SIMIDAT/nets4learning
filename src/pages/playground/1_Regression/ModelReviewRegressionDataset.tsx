import { lazy, Suspense, useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { Card, Nav, Tab } from 'react-bootstrap'

import type * as _Types from '@core/types'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import { VERBOSE } from '@/CONSTANTS'
import N4LTablePagination from '@components/table/N4LTablePagination'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
// La descripción y el análisis usan Plotly (tablas y gráficos): se descargan al abrir su pestaña, no con la página
const N4LDataFrameDescribe = lazy(() => import('@components/dataframe/N4LDataFrameDescribe'))
const AnalyzeEssentials = lazy(() => import('@pages/analyze/components/AnalyzeEssentials'))

type ModelReviewRegressionDatasetProps = {
  /** undefined mientras se carga */
  dataset: _Types.DatasetProcessed_t | undefined
}

const TABS = ['original', 'processed', 'analysis'] as const
type Tab_t = typeof TABS[number]

/**
 * El conjunto de datos del modelo en tres pestañas: tal cual (original); procesado, con cada valor categórico
 * convertido en un número, y su descripción estadística; y lo más importante de su análisis exploratorio.
 */
export default function ModelReviewRegressionDataset({ dataset }: ModelReviewRegressionDatasetProps) {
  const prefix = 'pages.playground.1-regression.'
  const [activeTab, setActiveTab] = useState<Tab_t>('original')

  const originalRows = useMemo(() => (dataset ? DataFrameUtils.DataFrameIterRows(dataset.dataframe_original) : []), [dataset])
  const processedRows = useMemo(() => (dataset ? DataFrameUtils.DataFrameIterRows(dataset.dataframe_processed) : []), [dataset])

  // La variable que se predice: se resalta en las tablas y en las estadísticas
  const target = dataset?.data_processed?.column_name_target ?? null
  const targetIndexIn = (columns: string[]) => (target === null ? -1 : columns.indexOf(target))

  if (VERBOSE) console.debug('render ModelReviewRegressionDataset')
  return (
    <Card className={'mt-3'} data-testid={'Test-ModelReviewDataset'} data-guide={'dataset'}>
      <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(TABS.find((tab) => tab === key) ?? 'original')}>
        <Card.Header>
          <Nav variant={'tabs'} className={'card-header-tabs'}>
            <Nav.Item>
              <Nav.Link eventKey={'original'}><Trans i18nKey={'table.dataset'} /></Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey={'processed'} data-guide={'dataset-processed'}><Trans i18nKey={prefix + 'dataframe.title'} /></Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey={'analysis'} data-testid={'Test-ModelReviewDataset-AnalysisTab'} data-guide={'dataset-analysis'}>
                <Trans i18nKey={'pages.dataframe.essentials.tab'} />
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body>
          {dataset === undefined && <WaitingPlaceholder />}
          {dataset && <Tab.Content>
            <Tab.Pane eventKey={'original'}>
              <div className={'overflow-x-auto'}>
                <N4LTablePagination data_head={dataset.dataframe_original.columns} data_body={originalRows}
                  highlight_column={targetIndexIn(dataset.dataframe_original.columns)} />
              </div>
            </Tab.Pane>
            <Tab.Pane eventKey={'processed'} mountOnEnter={true}>
              <p className={'text-body-secondary'}>
                <Trans i18nKey={prefix + 'dataframe.help'}
                  values={{ target: dataset.data_processed?.column_name_target ?? '' }}
                  components={{ code: <code /> }} />
              </p>
              <div className={'overflow-x-auto'}>
                <N4LTablePagination data_head={dataset.dataframe_processed.columns} data_body={processedRows}
                  highlight_column={targetIndexIn(dataset.dataframe_processed.columns)} />
              </div>
              <hr />
              <h4 className={'h5'}><Trans i18nKey={prefix + 'details.description-processed.describe'} /></h4>
              <Suspense fallback={<WaitingPlaceholder />}>
                <N4LDataFrameDescribe dataframe={dataset.dataframe_processed} target={target} />
              </Suspense>
            </Tab.Pane>
            {/* Al abrirla por primera vez: el análisis (en un worker) y sus gráficos no hacen falta antes */}
            <Tab.Pane eventKey={'analysis'} mountOnEnter={true}>
              <Suspense fallback={<WaitingPlaceholder i18nKey_title={'pages.dataframe.analyzing'} />}>
                <AnalyzeEssentials dataframe={dataset.dataframe_original} target={target} problem={'regression'} csv={dataset.csv} />
              </Suspense>
            </Tab.Pane>
          </Tab.Content>}
        </Card.Body>
      </Tab.Container>
    </Card>
  )
}
