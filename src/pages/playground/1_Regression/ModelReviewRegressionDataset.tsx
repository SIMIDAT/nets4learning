import { useEffect, useId, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Card, Nav, Tab } from 'react-bootstrap'

import type * as _Types from '@core/types'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import { TABLE_PLOT_STYLE_CONFIG } from '@/CONSTANTS_DanfoJS'
import { VERBOSE } from '@/CONSTANTS'
import N4LSummary from '@components/summary/N4LSummary'
import N4LTablePagination from '@components/table/N4LTablePagination'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

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
  const { t } = useTranslation()
  const describePlotID = useId()
  const [activeTab, setActiveTab] = useState<Tab_t>('original')

  const originalRows = useMemo(() => (dataset ? DataFrameUtils.DataFrameIterRows(dataset.dataframe_original) : []), [dataset])
  const processedRows = useMemo(() => (dataset ? DataFrameUtils.DataFrameIterRows(dataset.dataframe_processed) : []), [dataset])

  // La descripción la dibuja danfo en su div, que solo existe con la pestaña abierta
  useEffect(() => {
    if (activeTab !== 'processed' || !dataset || document.getElementById(describePlotID) === null) return
    DataFrameUtils.DataFrameDescribePlot(dataset.dataframe_processed, describePlotID, {
      config   : TABLE_PLOT_STYLE_CONFIG,
      emptyText: t('dataframe.describe.no-numeric'),
      transpose: true,
    })
  }, [activeTab, dataset, describePlotID, t])

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
                <N4LTablePagination data_head={dataset.dataframe_original.columns} data_body={originalRows} />
              </div>
            </Tab.Pane>
            <Tab.Pane eventKey={'processed'} mountOnEnter={true}>
              <p className={'text-body-secondary'}>
                <Trans i18nKey={prefix + 'dataframe.help'}
                  values={{ target: dataset.data_processed?.column_name_target ?? '' }}
                  components={{ code: <code /> }} />
              </p>
              <div className={'overflow-x-auto'}>
                <N4LTablePagination data_head={dataset.dataframe_processed.columns} data_body={processedRows} />
              </div>
              <hr />
              <N4LSummary title={<Trans i18nKey={prefix + 'details.description-processed.describe'} />}
                info={<div id={describePlotID}></div>} />
            </Tab.Pane>
          </Tab.Content>}
        </Card.Body>
      </Tab.Container>
    </Card>
  )
}
