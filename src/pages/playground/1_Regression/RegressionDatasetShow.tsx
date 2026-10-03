import { lazy } from 'react'
import { Card, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { DEFAULT_SELECTOR_DATASET_INDEX, VERBOSE } from '@/CONSTANTS'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import N4LSummary from '@components/summary/N4LSummary'
import N4LDatasetViews from '@components/dataframe/N4LDatasetViews'
import { useRegressionContext } from '@context/useRegressionContext'

// Las estadísticas usan Plotly (1,1 MB): se descargan al abrir su apartado, no con la página
const N4LDataFrameDescribe = lazy(() => import('@components/dataframe/N4LDataFrameDescribe'))

/**
 * El conjunto de datos con el que se entrena, ya procesado: tal cual, codificado y escalado (lo que recibe la red), en
 * pestañas; su información y las estadísticas de cada columna. Si el conjunto tiene varios ficheros (vino tinto y
 * blanco, matemáticas y portugués…), se elige cuál.
 */
export default function RegressionDatasetShow() {
  const { datasets, setDatasets } = useRegressionContext()
  const { t } = useTranslation()
  const prefix = 'pages.playground.generator.dataset.'

  const datasetSelected = datasets.index !== DEFAULT_SELECTOR_DATASET_INDEX && datasets.index >= 0 ? datasets.data[datasets.index] : undefined
  const isReady = Boolean(datasetSelected?.is_dataset_processed)
  // La columna que se predice: se resalta en las tablas y en las estadísticas
  const target = datasetSelected?.data_processed?.column_name_target ?? null

  if (VERBOSE) console.debug('render RegressionDatasetShow')
  return (
    <Card>
      <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
        <h3 className={'mb-0'}><Trans i18nKey={prefix + 'title'} /></h3>
        {datasets.data.length > 1 &&
          <Form.Group controlId={'regression-dataset-file'} className={'d-flex align-items-center gap-2'}>
            <Form.Label className={'small mb-0 text-body-secondary'}>{t('dataset-view.file')}</Form.Label>
            <Form.Select size={'sm'} className={'w-auto'} value={datasets.index}
              onChange={(event) => {
                const index = Number(event.target.value)
                setDatasets((prevState) => ({ ...prevState, index }))
              }}>
              {datasets.data.map(({ csv }, index) => <option key={csv + index} value={index}>{csv}</option>)}
            </Form.Select>
          </Form.Group>}
      </Card.Header>
      <Card.Body>
        {!isReady && <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-process'} />}
        {isReady && datasetSelected !== undefined && <>
          <N4LDatasetViews dataset={datasetSelected} />
          <hr />
          {!datasetSelected.is_dataset_upload &&
            <N4LSummary title={<Trans i18nKey={prefix + 'details.info'} />} info={datasetSelected.container_info} />}
          <N4LSummary title={t('dataset-view.statistics')}
            info={<N4LDataFrameDescribe dataframe={datasetSelected.dataframe_processed} target={target} />} />
        </>}
      </Card.Body>
    </Card>
  )
}
