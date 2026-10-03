import { lazy } from 'react'
import { Trans } from 'react-i18next'
import { Card, Col, Row } from 'react-bootstrap'

import { VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'

import N4LSummary from '@components/summary/N4LSummary'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import N4LDatasetViews from '@components/dataframe/N4LDatasetViews'

import TabularClassificationDatasetShowInfo from '@pages/playground/0_TabularClassification/TabularClassificationDatasetShowInfo'
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'
import N4LHelpLink from '@components/helpLink/N4LHelpLink'

// Tablas de Plotly dentro de apartados plegados: se descargan (1,1 MB) al abrirlos, no con la página
const N4LDataFrameDescribe = lazy(() => import('@components/dataframe/N4LDataFrameDescribe'))

/**
 * El conjunto de datos con el que se entrena, como en regresión (N4LDatasetViews): tal cual, codificado y escalado (lo
 * que recibe la red, con la clase en one-hot), en pestañas; su información y las estadísticas de cada columna.
 */
export default function TabularClassificationDatasetShow() {
  const { datasets } = useTabularClassificationContext()
  const prefix = 'pages.playground.generator.dataset.'

  const datasetSelected = datasets.index >= 0 ? datasets.datasets[datasets.index] : undefined
  const showDataset = Boolean(datasetSelected?.is_dataset_processed)
  // Columna que se clasifica: se resalta en las tablas y en las estadísticas
  const target = datasetSelected?.data_processed?.column_name_target ?? null

  if (VERBOSE) console.debug('render TabularClassificationDatasetShow')
  return <>
    <Card className={'mt-3'}>
      <Card.Header>
        <h3 className={'mb-0'}><Trans i18nKey={prefix + 'title'} /></h3>
      </Card.Header>
      <Card.Body>
        {!showDataset && <>
          <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-process'} />
        </>}
        {showDataset && datasetSelected !== undefined && <>
          <N4LDatasetViews dataset={datasetSelected} />
          <hr />
          <TabularClassificationDatasetShowInfo
            datasets={datasets}
          />
          <hr />
          <Row>
            <Col>
              <N4LSummary
                title={<Trans i18nKey={prefix + 'details.description-original'} />}
                info={<N4LDataFrameDescribe dataframe={datasetSelected.dataframe_original} target={target} />} />
              <N4LSummary
                title={<Trans i18nKey={prefix + 'details.description-processed'} />}
                info={<N4LDataFrameDescribe dataframe={datasetSelected.dataframe_processed} target={target} />} />
            </Col>
          </Row>
        </>}
      </Card.Body>
      <Card.Footer className={'text-end'}>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans
            i18nKey={'more-information-in-link'}
            components={{
              link1: <N4LHelpLink page={'glossary'} action={GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_2_DATASET} />,
            }} />
        </p>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans
            i18nKey={'more-information-in-tutorial'}
            components={{
              link1: <N4LHelpLink page={'manual'} action={MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_2_DATASET} />,
            }} />
        </p>
      </Card.Footer>

    </Card>
  </>
}