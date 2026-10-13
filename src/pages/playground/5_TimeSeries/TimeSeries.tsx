import { useMemo, useState } from 'react'
import { Accordion, Alert, Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { TASKS, UPLOAD } from '@/TASKS'
import { GLOSSARY_ACTIONS } from '@/CONSTANTS_ACTIONS'
import { taskOptions } from '@/TASK_OPTIONS'
import { n4lPackageByKey } from '@core/n4l/catalog'
import { n4lNamespace } from '@core/n4l/format'
import { canPrepare, prepareSeries, type SeriesPrep_t } from '@core/timeSeries/series'
import { evaluateSeriesModel } from '@core/timeSeries/seriesModel'
import { SERIES_LAYER_CLASSES, type SeriesLayer_t } from '@core/timeSeries/seriesLayers'
import { trainSeriesModel } from '@core/controller/trainSeriesModel'
import { historyData } from '@core/training/buildModels'
import { reportTrainResult } from '@core/training/trainResult'
import { checkSeriesLayers } from '@core/nn-utils/checkLayers'
import { SessionError, type TrainingSession_t } from '@core/session/trainingSession'
import { useTrainingProgress } from '@hooks/useTrainingProgress'
import { useStoredModels } from '@hooks/useStoredModels'
import { useTrainerSession } from '@hooks/useTrainerSession'
import alertHelper from '@utils/alertHelper'
import N4LDivider from '@components/divider/N4LDivider'
import N4LSectionLayout from '@components/divider/N4LSectionLayout'
import N4LPageHeader from '@components/neural-network/N4LPageHeader'
import N4LTrainButton from '@components/neural-network/N4LTrainButton'
import N4LTrainingDiagnosis from '@components/neural-network/N4LTrainingDiagnosis'
import N4LStoredModelsNotice from '@components/neural-network/N4LStoredModelsNotice'
import N4LPackageDescription from '@components/n4l/N4LPackageDescription'
import { layersAreValid } from '@components/neural-network/alertLayerError'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import N4LHelpLink from '@components/helpLink/N4LHelpLink'
import type { IdLoss_t, IdOptimizer_t } from '@/types/nn-types'

import TimeSeriesUpload from './TimeSeriesUpload'
import TimeSeriesPreparation from './TimeSeriesPreparation'
import TimeSeriesModels from './TimeSeriesModels'
import TimeSeriesForecast from './TimeSeriesForecast'
import { usePackageSeries } from './usePackageSeries'
import { timeSeriesTrainerGuide } from './trainerGuide'
import { TimeSeriesEditorLayers, TimeSeriesHyperparameters } from './TimeSeriesEditor'
import {
  DEFAULT_HYPER,
  DEFAULT_LAYERS,
  initialPrep,
  prefix,
  SERIES_METRICS,
  seriesLayersOf,
  type LoadedSeries_t,
  type SeriesHyper_t,
  type StoredSeriesModel_t,
  type TrainedSeriesModel_t,
} from './timeSeriesConfig'

/** Las partes de «Cómo funciona» */
const MANUAL = ['windows', 'split', 'scale', 'modes', 'baselines', 'networks']

/**
 * Series temporales: predecir los siguientes valores de una serie con los anteriores. Se elige cuántos valores mira la
 * red (la ventana) y cuántos se apartan al final para probar, se monta y entrena la red (dense o recurrente) y se ve
 * cómo predice la prueba, a un paso o seguida, frente a las predicciones más sencillas, y lo que viene después
 */
export default function TimeSeries({ dataset }: { dataset: string }) {
  const { t } = useTranslation()
  const isUpload = dataset === UPLOAD
  const option = useMemo(() => taskOptions(TASKS.TIME_SERIES, 'dataset').find(({ value }) => value === dataset), [dataset])
  // Una vez: el catálogo da un objeto nuevo en cada llamada, y la serie se carga cuando cambia
  const pkg = useMemo(() => (isUpload ? undefined : n4lPackageByKey(TASKS.TIME_SERIES, dataset)), [isUpload, dataset])
  const training = useTrainingProgress()
  const steps = ['hr.information', ...(isUpload ? ['hr.process-dataset'] : []), 'hr.dataset', 'hr.model', 'hr.predict']
  const guideSteps = useMemo(() => timeSeriesTrainerGuide(t, dataset, isUpload), [t, dataset, isUpload])

  const [series, setSeries] = useState<LoadedSeries_t | null>(null)
  const [prep, setPrep] = useState<SeriesPrep_t>({ window: 12, testSize: 20, difference: false })
  const [season, setSeason] = useState<number | undefined>(undefined)
  const [layers, setLayers] = useState<SeriesLayer_t[]>(() => (pkg?.section.training ? seriesLayersOf(pkg.section.training.layers) : DEFAULT_LAYERS))
  const [hyper, setHyper] = useState<SeriesHyper_t>(() => ({
    ...DEFAULT_HYPER,
    ...(pkg?.section.training?.learningRate !== undefined && { learningRate: pkg.section.training.learningRate }),
    ...(pkg?.section.training?.epochs !== undefined && { epochs: pkg.section.training.epochs }),
  }))
  const [models, setModels] = useState<TrainedSeriesModel_t[]>([])
  // El modelo que se enseña en «Predecir»; null, el último entrenado
  const [chosen, setChosen] = useState<number | null>(null)
  const selected = chosen !== null && chosen < models.length ? chosen : models.length - 1

  /** Una serie nueva: su preparación (la del paquete o según su frecuencia) y sin los modelos de la anterior */
  const loadSeries = (loaded: LoadedSeries_t | null) => {
    setSeries(loaded)
    setModels([])
    setChosen(null)
    if (loaded === null) return
    const initial = initialPrep(loaded.values.length, loaded.frequency, pkg?.section.forecast)
    setPrep(initial.prep)
    setSeason(initial.season)
  }

  // Los conjuntos de los paquetes: su serie, que se prepara al llegar
  const { error } = usePackageSeries(pkg, option?.info?.files?.[0], loadSeries)

  /** Mide cómo predice un modelo (a un paso y seguido) y lo apunta en su fila */
  const evaluate = async (entry: TrainedSeriesModel_t, values: number[]) => {
    try {
      const evaluation = await evaluateSeriesModel(entry.model, values, entry.prepared)
      setModels((current) => current.map((item) => (item.model === entry.model ? { ...item, evaluation } : item)))
    } catch (reason) {
      console.error(reason)
    }
  }

  // Los modelos entrenados antes con este conjunto (guardados en el navegador); los de un fichero subido, no
  const storedModels = useStoredModels<StoredSeriesModel_t>(TASKS.TIME_SERIES, dataset, !isUpload && series !== null, (stored) => {
    if (series === null) return
    const restored = stored.flatMap(({ model, data }): TrainedSeriesModel_t[] => (canPrepare(series.values.length, data.prep)
      ? [{ ...data, model, prepared: prepareSeries(series.values, data.prep), evaluation: null }]
      : []))
    if (restored.length === 0) return
    setModels((current) => [...restored, ...current])
    setChosen((current) => (current === null ? null : current + restored.length))
    void restored.reduce((previous, entry) => previous.then(() => evaluate(entry, series.values)), Promise.resolve())
  })

  // region Sesión: exportar, importar y compartir la red, los hiperparámetros y la preparación
  const getSession = (): TrainingSession_t => ({
    app            : 'nets4learning',
    version        : 1,
    task           : TASKS.TIME_SERIES,
    dataset,
    layers         : layers,
    hyperparameters: {
      learningRate: hyper.learningRate,
      epochs      : hyper.epochs,
      testSize    : prep.testSize,
      optimizer   : hyper.optimizer,
      loss        : hyper.loss,
      metrics     : SERIES_METRICS,
    },
    series: { window: prep.window, difference: prep.difference, batchSize: hyper.batchSize },
  })
  const applySession = ({ layers: imported, hyperparameters: h, series: s }: TrainingSession_t) => {
    const valid = imported.every((layer) => (SERIES_LAYER_CLASSES as readonly unknown[]).includes(layer._class) && Number.isFinite(Number(layer.units)))
      && (s === undefined || (Number.isInteger(s.window) && s.window > 0 && typeof s.difference === 'boolean'))
    if (!valid) throw new SessionError('session.error-not-session')
    setLayers(imported.map((layer) => ({
      _class    : layer._class as SeriesLayer_t['_class'],
      units     : Number(layer.units),
      activation: String(layer.activation ?? 'relu'),
      ...(layer.is_disabled === true && { is_disabled: true }),
    })))
    setHyper((current) => ({
      ...current,
      learningRate: h.learningRate,
      epochs      : h.epochs,
      optimizer   : h.optimizer as IdOptimizer_t,
      loss        : h.loss as IdLoss_t,
      ...(s?.batchSize !== undefined && { batchSize: s.batchSize }),
    }))
    setPrep((current) => ({ ...current, testSize: h.testSize, ...(s !== undefined && { window: s.window, difference: s.difference }) }))
  }
  const { sessionVersion, importSession } = useTrainerSession(TASKS.TIME_SERIES, series !== null, applySession)
  // endregion

  const isValid = series !== null && canPrepare(series.values.length, prep)

  const handleSubmit_Train = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (series === null || !isValid) return
    if (!(await layersAreValid(t, checkSeriesLayers(layers)))) return
    const prepared = prepareSeries(series.values, prep)
    const trained = { layers: [...layers], prep: { ...prep }, hyper: { ...hyper } }
    training.start({ epochs: hyper.epochs, learningRate: hyper.learningRate, optimizer: hyper.optimizer, loss: hyper.loss, layers: layers.length })
    try {
      const { model, history } = await trainSeriesModel({
        prepared,
        layerList    : trained.layers,
        learningRate : hyper.learningRate,
        numberOfEpoch: hyper.epochs,
        batchSize    : hyper.batchSize,
        idOptimizer  : hyper.optimizer,
        idLoss       : hyper.loss,
        idMetrics    : SERIES_METRICS,
        ...training.callbacks,
      })
      const entry: TrainedSeriesModel_t = { ...trained, model, history: historyData(history), prepared, evaluation: null }
      setModels((current) => [...current, entry])
      setChosen(null)
      storedModels.save(model, { layers: entry.layers, prep: entry.prep, hyper: entry.hyper, history: entry.history })
      reportTrainResult({ history: history.history, layers: entry.layers })
      training.complete()
      void alertHelper.alertSuccess(t('alert.model-train-success'))
      await evaluate(entry, series.values)
    } catch (reason) {
      console.error('Error during model training:', reason)
    } finally {
      training.finish()
    }
  }

  const handleClear_StoredModels = async () => {
    await storedModels.clear()
    setModels([])
    setChosen(null)
  }

  if (!isUpload && (option === undefined || pkg === undefined)) return <Alert variant={'danger'}>{t('error.model-selected')}</Alert>
  const title = series === null ? '' : isUpload ? series.name : t(series.name)

  return (
    <N4LSectionLayout steps={steps}>
      <div data-testid={'Test-TimeSeries'}>
        <N4LPageHeader intro={'train'} title={<Trans i18nKey={'modality.time-series'} />} guideId={'train.time-series.' + dataset} guideSteps={guideSteps}
          getSession={getSession} onImport={importSession} className={'mt-2 mb-3'} />

        {/* INFORMACIÓN: cómo funciona y el conjunto de datos */}
        <N4LDivider i18nKey={'hr.information'} steps={steps} />
        <Accordion alwaysOpen defaultActiveKey={[]}>
          <Accordion.Item eventKey={'manual'} data-guide={'manual'}>
            <Accordion.Header as={'h3'} className={'n4l-accordion-h2'}><Trans i18nKey={prefix + 'manual.title'} /></Accordion.Header>
            <Accordion.Body data-testid={'Test-TimeSeries-Manual'}>
              {MANUAL.map((part) => (
                <section key={part} className={'mb-3'}>
                  <h3 className={'h6'}>{t(prefix + 'manual.' + part + '.title')}</h3>
                  <p className={'mb-0'}><Trans i18nKey={prefix + 'manual.' + part + '.text'} /></p>
                </section>
              ))}
              <p className={'small mb-0'}>
                <Trans i18nKey={'more-information-in-link'}
                  components={{ link1: <N4LHelpLink page={'glossary'} action={GLOSSARY_ACTIONS.TIME_SERIES.STEP_2_DATASET} /> }} />
              </p>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey={'dataset'} data-guide={'dataset-info'}>
            <Accordion.Header as={'h3'} className={'n4l-accordion-h2'}>
              {isUpload ? <Trans i18nKey={'pages.playground.generator.dataset.upload-dataset'} /> : t(option!.i18n)}
            </Accordion.Header>
            <Accordion.Body>
              {pkg !== undefined
                ? <N4LPackageDescription manifest={pkg.entry} namespace={n4lNamespace(pkg.entry.id)} task={TASKS.TIME_SERIES} />
                : <p className={'mb-0'}>{t(prefix + 'upload.info')}</p>}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        {/* SUBIR UNA SERIE */}
        {isUpload && <>
          <N4LDivider i18nKey={'hr.process-dataset'} steps={steps} />
          <div data-guide={'process'}><TimeSeriesUpload onLoaded={loadSeries} /></div>
        </>}

        {/* LA SERIE Y SU PREPARACIÓN */}
        <N4LDivider i18nKey={'hr.dataset'} steps={steps} />
        {error && <Alert variant={'danger'}>{t('error.file-upload')}</Alert>}
        {series === null && !isUpload && !error && <WaitingPlaceholder />}
        {series === null && isUpload && <p className={'text-body-secondary'}>{t(prefix + 'upload.waiting')}</p>}
        {series !== null &&
          <TimeSeriesPreparation series={series} title={title} prep={prep} season={season} onPrep={setPrep} onSeason={setSeason}
            disabled={training.isTraining} />}

        {/* LA RED */}
        <N4LDivider i18nKey={'hr.model'} steps={steps} />
        <Form onSubmit={handleSubmit_Train}>
          <Row className={'g-3'}>
            <Col xl={6} data-guide={'layer-design'}>
              <TimeSeriesEditorLayers layers={layers} onChange={setLayers} waiting={series === null} />
            </Col>
            <Col xl={6}>
              <TimeSeriesHyperparameters key={sessionVersion} hyper={hyper} onChange={setHyper} waiting={series === null} />
            </Col>
          </Row>
          <Row className={'mt-3'}>
            <Col xl={12} data-guide={'train'}>
              <N4LTrainButton lastRun={training.lastRun} isTraining={training.isTraining} progress={training.progress} isStopping={training.isStopping} onStop={training.stop}
                disabled={!isValid || training.isTraining}>
                <Trans i18nKey={'pages.playground.generator.models.button-submit'} />
              </N4LTrainButton>
              {!training.isTraining && <N4LTrainingDiagnosis history={models.at(-1)?.history.history} model={models.length} />}
            </Col>
          </Row>
        </Form>
        <hr />
        <N4LStoredModelsNotice count={storedModels.restored} onClear={handleClear_StoredModels} />
        <div data-guide={'models'}>
          <TimeSeriesModels models={models} selected={selected} onSelect={setChosen} />
        </div>

        {/* PREDECIR */}
        <N4LDivider i18nKey={'hr.predict'} steps={steps} />
        <div data-guide={'predict'}>
          {series !== null && <TimeSeriesForecast series={series} models={models} selected={selected} onSelect={setChosen} season={season} />}
        </div>
      </div>
    </N4LSectionLayout>
  )
}
