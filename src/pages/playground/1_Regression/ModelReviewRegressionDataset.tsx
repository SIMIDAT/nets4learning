import { useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { Card, Nav, Tab } from 'react-bootstrap'

import type * as _Types from '@core/types'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import { VERBOSE } from '@/CONSTANTS'
import N4LTablePagination from '@components/table/N4LTablePagination'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import N4LDataFrameDescribe from '@components/dataframe/N4LDataFrameDescribe'

type ModelReviewRegressionDatasetProps = {
  /** undefined mientras se carga */
  dataset: _Types.DatasetProcessed_t | undefined
}

type Tab_t = 'original' | 'processed'

/**
 * El conjunto de datos del modelo en dos pestañas: tal cual (original) y procesado, con cada valor categórico
 * convertido en un número, y su descripción estadística.
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
    <Card className={'mt-3'} data-testid={'Test-ModelReviewDataset'}>
      <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(key === 'processed' ? 'processed' : 'original')}>
        <Card.Header>
          <Nav variant={'tabs'} className={'card-header-tabs'}>
            <Nav.Item>
              <Nav.Link eventKey={'original'}><Trans i18nKey={'table.dataset'} /></Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey={'processed'}><Trans i18nKey={prefix + 'dataframe.title'} /></Nav.Link>
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
              <N4LDataFrameDescribe dataframe={dataset.dataframe_processed} target={target} />
            </Tab.Pane>
          </Tab.Content>}
        </Card.Body>
      </Tab.Container>
    </Card>
  )
}
