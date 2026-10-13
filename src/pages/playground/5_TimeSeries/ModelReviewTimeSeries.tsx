import { useEffect, useMemo, useState } from 'react'
import { Alert, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'

import { TASKS } from '@/TASKS'
import { taskOptions } from '@/TASK_OPTIONS'
import { builtinN4LPackage, n4lPackageByKey } from '@core/n4l/catalog'
import { n4lLayersModels, n4lNamespace } from '@core/n4l/format'
import { loadN4LLayersModel } from '@core/n4l/tfjsModel'
import { trackDownloads } from '@core/downloadProgress'
import { prepareSeries } from '@core/timeSeries/series'
import { evaluateSeriesModel } from '@core/timeSeries/seriesModel'
import N4LPageHeader from '@components/neural-network/N4LPageHeader'
import N4LModelAside from '@components/neural-network/N4LModelAside'
import N4LModelCard from '@components/neural-network/N4LModelCard'
import N4LModelSummaryButton from '@components/neural-network/N4LModelSummaryButton'
import N4LPackageDescription from '@components/n4l/N4LPackageDescription'
import N4LDownloadPackage from '@components/n4l/N4LDownloadPackage'
import N4LDownloadProgress from '@components/loading/N4LDownloadProgress'

import ModelReviewTimeSeriesDataset from './ModelReviewTimeSeriesDataset'
import ModelReviewTimeSeriesPredict from './ModelReviewTimeSeriesPredict'
import TimeSeriesForecast from './TimeSeriesForecast'
import TimeSeriesTestMetrics from './TimeSeriesTestMetrics'
import { usePackageSeries } from './usePackageSeries'
import { initialPrep, prefix, type ForecastModel_t } from './timeSeriesConfig'
import { timeSeriesReviewGuide } from './modelReviewGuide'

/**
 * El modelo ya entrenado de una serie de un paquete, como las páginas de los modelos de las demás tareas: a la
 * izquierda su ficha (el resumen de la red, el paquete, cómo predice lo que no vio y la descripción) y a la derecha la
 * serie (tal cual, en una gráfica y preparada para la red), predecir un valor con los anteriores y cómo predice toda
 * la parte de prueba y lo que viene después
 */
export default function ModelReviewTimeSeries({ dataset }: { dataset: string }) {
  const { t } = useTranslation()
  const pkg = useMemo(() => n4lPackageByKey(TASKS.TIME_SERIES, dataset), [dataset])
  const option = useMemo(() => taskOptions(TASKS.TIME_SERIES, 'dataset').find(({ value }) => value === dataset), [dataset])
  const { series, error } = usePackageSeries(pkg, option?.info?.files?.[0])
  const entry = pkg === undefined ? undefined : n4lLayersModels(pkg.section)[0]
  const forecast = pkg?.section.forecast
  const [loaded, setLoaded] = useState<ForecastModel_t | null>(null)
  const [loadError, setLoadError] = useState(false)
  const guideSteps = useMemo(() => timeSeriesReviewGuide(t, dataset), [t, dataset])

  // El modelo (con el progreso de la descarga) y cómo predice la prueba de su serie, preparada como al entrenarlo
  useEffect(() => {
    if (pkg === undefined || entry === undefined || series === null) return
    let isCancelled = false
    const run = async () => {
      const model = await trackDownloads(() => loadN4LLayersModel(builtinN4LPackage(pkg.entry).source, entry.path), 'model_load')
      const prepared = prepareSeries(series.values, initialPrep(series.values.length, series.frequency, forecast).prep)
      if (isCancelled) return
      setLoaded({ model, prepared, evaluation: null })
      const evaluation = await evaluateSeriesModel(model, series.values, prepared)
      if (!isCancelled) setLoaded({ model, prepared, evaluation })
    }
    run().catch((reason: unknown) => {
      console.error(reason)
      if (!isCancelled) setLoadError(true)
    })
    return () => { isCancelled = true }
  }, [pkg, entry, series, forecast])

  if (pkg === undefined || entry === undefined) return <Alert variant={'danger'}>{t('error.model-selected')}</Alert>
  const ns = n4lNamespace(pkg.entry.id)
  const name = t(`${ns}:tasks.time-series.name`)

  return (
    <>
      <Container className={'n4l-container-wide'}>
        <N4LPageHeader intro={'review'} title={<Trans i18nKey={'modality.time-series'} />} guideId={'time-series.' + dataset} guideSteps={guideSteps} className={'mt-2'} />
      </Container>

      <Container className={'n4l-container-wide'} data-testid={'Test-TimeSeries-ModelReview'}>
        <Row>
          <Col>
            <N4LDownloadProgress isLoading={loaded === null && !error && !loadError} />
          </Col>
        </Row>
        {(error || loadError) && <Alert variant={'danger'}>{t('error.file-upload')}</Alert>}
        <Row>
          <Col xs={12} xl={3}>
            <N4LModelAside>
              <N4LModelCard title={name}
                actions={<>
                  <N4LModelSummaryButton model={loaded?.model ?? null} title={name} />
                  <N4LDownloadPackage pkg={builtinN4LPackage(pkg.entry)} />
                  <Link to={`/playground/time-series/dataset/${dataset}`} className={'btn btn-outline-primary btn-sm'} data-testid={'Test-TimeSeries-TrainYours'}>
                    {t(prefix + 'model.train-yours')}
                  </Link>
                </>}>
                <TimeSeriesTestMetrics metrics={entry.metrics} testSize={forecast?.testSize ?? 20} />
                <N4LPackageDescription manifest={pkg.entry} namespace={ns} task={TASKS.TIME_SERIES} />
              </N4LModelCard>
            </N4LModelAside>
          </Col>

          <Col xs={12} xl={9}>
            {/* La serie: tal cual, en una gráfica con la prueba marcada y preparada para la red */}
            <ModelReviewTimeSeriesDataset series={series} prepared={loaded?.prepared ?? null} name={name} />

            {series !== null && loaded !== null &&
              <ModelReviewTimeSeriesPredict model={loaded.model} series={series} prepared={loaded.prepared} />}

            {/* Toda la prueba (a un paso o seguida) frente a las predicciones sencillas, y lo que viene después */}
            {series !== null && loaded !== null &&
              <div className={'mt-3'}>
                <TimeSeriesForecast series={series} models={[loaded]} selected={0} onSelect={() => {}} season={forecast?.season}
                  modelName={t(prefix + 'model.name')} />
              </div>}
          </Col>
        </Row>
      </Container>
    </>
  )
}
