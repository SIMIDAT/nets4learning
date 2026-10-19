import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Card, Nav, Tab } from 'react-bootstrap'

import type * as _Types from '@core/types'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import { VERBOSE } from '@/CONSTANTS'
import N4LTablePagination from '@components/table/N4LTablePagination'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import TabularClassificationDatasetShowInfo from '@pages/playground/0_TabularClassification/TabularClassificationDatasetShowInfo'
import type I_MODEL_TABULAR_CLASSIFICATION from './models/_model'

// La descripción y el análisis usan Plotly (1,1 MB, tablas y gráficos): se descargan al abrir su pestaña, no con la página
const N4LDataFrameDescribe = lazy(() => import('@components/dataframe/N4LDataFrameDescribe'))
const AnalyzeEssentials = lazy(() => import('@pages/analyze/components/AnalyzeEssentials'))

type ModelReviewTabularClassificationDatasetProps = {
  iModelInstance: I_MODEL_TABULAR_CLASSIFICATION
}

const TABS = ['original', 'processed', 'analysis'] as const
type Tab_t = typeof TABS[number]

/**
 * El conjunto de datos del modelo en tres pestañas: tal cual (original); tal como lo recibe el modelo, con cada valor
 * categórico convertido en un número (LabelEncoder), la correspondencia de atributos y clases y su descripción; y lo más
 * importante de su análisis exploratorio.
 */
export default function ModelReviewTabularClassificationDataset({ iModelInstance }: ModelReviewTabularClassificationDatasetProps) {
  const prefix = 'pages.playground.generator.dataset.'
  const { t } = useTranslation()
  // undefined mientras se carga; null si el modelo no tiene conjunto de datos (p. ej. uno propio)
  const [dataset, setDataset] = useState<_Types.DatasetProcessed_t | null | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<Tab_t>('original')

  useEffect(() => {
    let isCancelled = false
    iModelInstance.DATASETS().then((datasets) => {
      if (!isCancelled) setDataset(datasets[0] ?? null)
    })
    return () => { isCancelled = true }
  }, [iModelInstance])

  const originalRows = useMemo(() => (dataset ? DataFrameUtils.DataFrameIterRows(dataset.dataframe_original) : []), [dataset])
  const processedRows = useMemo(() => (dataset ? DataFrameUtils.DataFrameIterRows(dataset.dataframe_processed) : []), [dataset])

  if (dataset === null) return null

  const tableHeader = iModelInstance.TABLE_HEADER.map((name) => t(name))
  // Las columnas procesadas son las mismas que las originales: se usan sus nombres traducidos si coinciden
  const processedHeader = dataset && tableHeader.length === dataset.dataframe_processed.columns.length
    ? tableHeader
    : dataset?.dataframe_processed.columns ?? []

  // La clase: se resalta en las tablas y en las estadísticas
  const target = dataset?.data_processed?.column_name_target ?? null
  const targetIndexIn = (columns: string[]) => (target === null ? -1 : columns.indexOf(target))

  if (VERBOSE) console.debug('render ModelReviewTabularClassificationDataset')
  return (
    <Card className={'mt-3'} data-testid={'Test-ModelReviewDataset'} data-guide={'dataset'}>
      <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(TABS.find((tab) => tab === key) ?? 'original')}>
        <Card.Header>
          <Nav variant={'tabs'} className={'card-header-tabs'}>
            <Nav.Item>
              <Nav.Link eventKey={'original'}><Trans i18nKey={'table.dataset'} /></Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey={'processed'} data-guide={'dataset-processed'}><Trans i18nKey={prefix + 'details.dataframe-processed'} /></Nav.Link>
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
                <N4LTablePagination data_head={tableHeader} data_body={originalRows}
                  highlight_column={targetIndexIn(dataset.dataframe_original.columns)} />
              </div>
            </Tab.Pane>
            <Tab.Pane eventKey={'processed'} mountOnEnter={true}>
              <p className={'text-body-secondary'}>
                <Trans i18nKey={'pages.playground.0-tabular-classification.general.dataframe-processed-help'} />
              </p>
              <div className={'overflow-x-auto'}>
                <N4LTablePagination data_head={processedHeader} data_body={processedRows}
                  highlight_column={targetIndexIn(dataset.dataframe_processed.columns)} />
              </div>
              <hr />
              <TabularClassificationDatasetShowInfo datasets={{ index: 0, datasets: [dataset] }} />
              <hr />
              <h4 className={'h5'}><Trans i18nKey={prefix + 'details.description-processed'} /></h4>
              <Suspense fallback={<WaitingPlaceholder />}>
                <N4LDataFrameDescribe dataframe={dataset.dataframe_processed} target={target} />
              </Suspense>
            </Tab.Pane>
            {/* Al abrirla por primera vez: el análisis (en un worker) y sus gráficos no hacen falta antes */}
            <Tab.Pane eventKey={'analysis'} mountOnEnter={true}>
              <Suspense fallback={<WaitingPlaceholder i18nKey_title={'pages.dataframe.analyzing'} />}>
                <AnalyzeEssentials dataframe={dataset.dataframe_original} target={target} problem={'classification'} csv={dataset.csv} />
              </Suspense>
            </Tab.Pane>
          </Tab.Content>}
        </Card.Body>
      </Tab.Container>
    </Card>
  )
}
