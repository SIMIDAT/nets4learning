import './Datasets.css'
import { lazy, Suspense, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'
import { Badge, Button, Card, Col, Container, Form, Row, Tab, Tabs } from 'react-bootstrap'

import { TASKS, UPLOAD, type TASKS_TYPE_V } from '@/TASKS'
import { taskOptions, type DatasetInfo_t } from '@/TASK_OPTIONS'
import N4LDatasetInfo from '@components/dataset/N4LDatasetInfo'
import N4LModal from '@components/modal/N4LModal'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import { hasMenuModel, useMenuModel } from '@hooks/useMenuModel'
import { EXTRA_DATASETS } from '@pages/datasets/extraDatasets'
import DatasetVariables from '@pages/datasets/DatasetVariables'
import { variablesSummary } from '@pages/datasets/datasetVariables'
import { datasetKey, fileName } from '@pages/analyze/projectDatasets'

// La tabla y el describe() del CSV usan danfo.js: se descargan solo al abrir esas pestañas
const DatasetDataFrame = lazy(() => import('@pages/datasets/DatasetDataFrame'))

/** Los textos de una pestaña: sus dos partes (los conjuntos de los modelos o de ejemplo y los de práctica) y su botón */
type TabTexts_t = { mainTitle: string, mainText: string, extraText: string, open: string }

const TRAIN_TEXTS: TabTexts_t = { mainTitle: 'datasets.models-title', mainText: 'datasets.models-text', extraText: 'datasets.extra-text', open: 'datasets.train' }
// En el agrupamiento no hay modelos ni se entrena: se agrupa, y las clases solo sirven para comparar
const CLUSTERING_TEXTS: TabTexts_t = {
  mainTitle: 'datasets.clustering.examples-title',
  mainText : 'datasets.clustering.examples-text',
  extraText: 'datasets.clustering.extra-text',
  open     : 'datasets.clustering.run',
}

// canAnalyze: sus conjuntos son CSV y se pueden abrir en el AED
const TASK_TABS = [
  { task: TASKS.TABULAR_CLASSIFICATION, title: 'pages.index.tabular-classification.1-title', canAnalyze: true, texts: TRAIN_TEXTS },
  { task: TASKS.REGRESSION, title: 'pages.index.regression.1-title', canAnalyze: true, texts: TRAIN_TEXTS },
  { task: TASKS.IMAGE_CLASSIFICATION, title: 'pages.index.image-classification.1-title', canAnalyze: false, texts: TRAIN_TEXTS },
  { task: TASKS.CLUSTERING, title: 'pages.index.clustering.1-title', canAnalyze: true, texts: CLUSTERING_TEXTS },
]

const tabTexts = (task: TASKS_TYPE_V) => TASK_TABS.find((tab) => tab.task === task)?.texts ?? TRAIN_TEXTS

// Los CSV se pueden abrir en el AED (/analyze?dataset=…); las imágenes (sprites de MNIST…) no
const isCSV = (file: string) => file.toLowerCase().endsWith('.csv')

/** Enlace de descarga de un fichero de public/ */
function DownloadLink({ file, label }: { file: string, label: React.ReactNode }) {
  return (
    <a href={import.meta.env.VITE_PATH + '/' + file} className={'btn btn-outline-secondary btn-sm text-nowrap'} download>
      {label}
    </a>
  )
}

/** Enlace que abre el CSV en el análisis exploratorio de datos */
function AnalyzeLink({ file, label, name }: { file: string, label: React.ReactNode, name: string }) {
  const { t } = useTranslation()
  return (
    <Link to={'/analyze?dataset=' + datasetKey(file)} className={'btn btn-outline-secondary btn-sm text-nowrap'}
      title={t('datasets.analyze-title', { name })} data-testid={'Test-DatasetAnalyze-' + datasetKey(file)}>
      {label}
    </Link>
  )
}

/** Con varios CSV, cuál se enseña en las pestañas de datos (los dos ficheros del vino, los de los alumnos…) */
function DataFileSelect({ files, value, onChange }: { files: string[], value: string, onChange: (file: string) => void }) {
  const { t } = useTranslation()
  if (files.length < 2) return null
  return (
    <Form.Group controlId={'dataset-data-file'} className={'d-flex align-items-center gap-2 mb-3'}>
      <Form.Label className={'small fw-semibold mb-0'}>{t('datasets.data.file')}</Form.Label>
      <Form.Select size={'sm'} className={'w-auto'} value={value} onChange={(event) => onChange(event.target.value)}>
        {files.map((file) => <option key={file} value={file}>{fileName(file)}</option>)}
      </Form.Select>
    </Form.Group>
  )
}

/** Dataset de una tarjeta (y cuya información se enseña en el modal) */
type SelectedDataset_t = {
  task   : TASKS_TYPE_V
  title  : string
  info   : DatasetInfo_t
  files  : string[]
  /** Clave i18n de su frase: de qué va */
  summary: string
  /** Clave del modelo (o del conjunto de ejemplo) que lo usa; sin ella es un dataset extra (sin descripción propia) */
  value? : string
}

/** El identificador de un conjunto en la página (y en sus data-testid): la clave de su modelo o su primer fichero */
const datasetId = (dataset: SelectedDataset_t) => dataset.value ?? dataset.files[0]

/** Los conjuntos de una tarea: los que usan sus modelos y los de práctica */
function taskDatasets(task: TASKS_TYPE_V): { models: SelectedDataset_t[], extra: SelectedDataset_t[] } {
  const models = taskOptions(task, 'dataset')
    .filter(({ info }) => info !== undefined)
    .map(({ value, i18n, info, summary }) => ({ task, title: i18n, info: info!, files: info!.files ?? [], summary: summary ?? `datasets.summary.${task}.${value}`, value }))
  // Los de práctica: columnas de entrada y objetivo según su ficha; en clasificación, las clases (no el objetivo)
  const extra = (EXTRA_DATASETS[task] ?? []).map(({ file, source, samples, classes, i18n, summary }) => {
    const { features, target } = variablesSummary([file])
    const info: DatasetInfo_t = { rows: [samples], source, features, ...(classes !== undefined ? { classes } : { target }) }
    return { task, title: i18n, info, files: [file], summary: summary ?? 'datasets.summary.extra.' + datasetKey(file) }
  })
  return { models, extra }
}

type DatasetCardProps = {
  dataset   : SelectedDataset_t
  /** AED: solo en las tareas con CSV */
  canAnalyze: boolean
  /** Clave i18n del botón principal: «Entrenar» o, en el agrupamiento, «Agrupar» */
  openLabel : string
  onInfo    : (dataset: SelectedDataset_t) => void
}

/**
 * Un conjunto de datos: de qué va y su tamaño, y lo que se puede hacer con él. Entrenar (con los de práctica, en la
 * página de subir datos, ya cargado), probar el modelo ya entrenado si lo hay, ver su información, analizarlo en el
 * AED y descargarlo (con varios ficheros, cada uno).
 */
function DatasetCard({ dataset, canAnalyze, openLabel, onInfo }: DatasetCardProps) {
  const { t } = useTranslation()
  const id = datasetId(dataset)
  const name = t(dataset.title)
  const csvFiles = dataset.files.filter(isCSV)
  const isExtra = dataset.value === undefined
  const trainTo = !isExtra
    ? `/playground/${dataset.task}/dataset/${dataset.value}`
    : csvFiles.length > 0 ? `/playground/${dataset.task}/dataset/${UPLOAD}?dataset=${datasetKey(csvFiles[0])}` : null
  const hasModel = !isExtra && taskOptions(dataset.task, 'model').some(({ value }) => value === dataset.value)
  const isMultiple = dataset.files.length > 1

  return (
    <Card className={'h-100 n4l-dataset-card'} data-testid={'Test-Dataset-' + id}>
      <Card.Body className={'d-flex flex-column'}>
        <h3 className={'h5 mb-1'}>{name}</h3>
        <N4LDatasetInfo info={dataset.info} className={'small text-body-secondary mb-2'} />
        <p className={'flex-grow-1'}>{t(dataset.summary)}</p>
        <div className={'d-flex flex-wrap gap-2'}>
          {trainTo !== null &&
            <Link to={trainTo} className={'btn btn-primary btn-sm'} data-testid={'Test-DatasetTrain-' + id}>{t(openLabel)}</Link>}
          {hasModel &&
            <Link to={`/playground/${dataset.task}/model/${dataset.value}`} className={'btn btn-outline-primary btn-sm'}
              data-testid={'Test-DatasetModel-' + id}>{t('datasets.try-model')}</Link>}
          <Button variant={'outline-secondary'} size={'sm'} onClick={() => onInfo(dataset)} data-testid={'Test-DatasetInfo-' + id}>
            {t('datasets.show-info')}
          </Button>
        </div>
        {/* Cada fichero, con su análisis (AED) y su descarga; con uno solo, sin su nombre */}
        {dataset.files.length > 0 &&
          <ul className={'list-unstyled mb-0 mt-2 pt-2 border-top d-grid gap-2 small'} aria-label={t('datasets.files')}>
            {dataset.files.map((file) => (
              <li key={file} className={'d-flex flex-wrap align-items-center gap-2'}>
                {isMultiple && <span className={'text-body-secondary me-auto text-break'}>{fileName(file)}</span>}
                {canAnalyze && isCSV(file) &&
                  <AnalyzeLink file={file} name={name}
                    label={isMultiple ? `${t('datasets.analyze-action')} ${datasetKey(file)}` : t('datasets.analyze-action')} />}
                <DownloadLink file={file} label={isMultiple ? `${t('download')} ${fileName(file)}` : t('download')} />
              </li>
            ))}
          </ul>}
      </Card.Body>
    </Card>
  )
}

/** Una parte de la pestaña (los de los modelos, los de práctica): su título, para qué sirven y sus tarjetas */
function DatasetsSection({ title, text, datasets, canAnalyze, openLabel, onInfo }: { title: string, text: string } & Omit<DatasetCardProps, 'dataset'> & { datasets: SelectedDataset_t[] }) {
  if (datasets.length === 0) return null
  return (
    <section className={'mt-3'}>
      <h2 className={'h5 mb-1'}>{title}</h2>
      <p className={'small text-body-secondary'}>{text}</p>
      <Row xs={1} md={2} xxl={3} className={'g-3'}>
        {datasets.map((dataset) => (
          <Col key={datasetId(dataset)}><DatasetCard dataset={dataset} canAnalyze={canAnalyze} openLabel={openLabel} onInfo={onInfo} /></Col>
        ))}
      </Row>
    </section>
  )
}

export default function Datasets() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<SelectedDataset_t | null>(null)
  // Descripción completa del dataset: la clase de su modelo, que solo se descarga al abrir el modal
  const description = useMenuModel(selected?.task, selected?.value ?? '')
  // Fichero de las pestañas "Datos" y "Estadísticas": el elegido si es de este conjunto; si no, su primer CSV
  const [chosenFile, setDataFile] = useState<string | null>(null)
  const selectedCSV = selected?.files.filter(isCSV) ?? []
  const dataFile = chosenFile !== null && selectedCSV.includes(chosenFile) ? chosenFile : selectedCSV[0]
  // La pestaña, en la dirección (/datasets?task=regression): se puede enlazar y se mantiene al volver atrás
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTask = TASK_TABS.find(({ task }) => task === searchParams.get('task'))?.task ?? TASKS.TABULAR_CLASSIFICATION

  return (
    <main className={'mb-3'} data-title={'Datasets'}>
      <Container id={'Datasets'} className={'mt-3 mb-3 n4l-container-wide'}>
        <h1 className={'mt-3'}><Trans i18nKey={'datasets.title'} /></h1>
        <p className={'lead'}>{t('datasets.intro')}</p>
        <Card className={'mt-3'}>
          <Card.Body>
            {/* Solo la pestaña abierta: un mismo conjunto puede estar en varias (el iris se clasifica y se agrupa) */}
            <Tabs activeKey={activeTask} justify className={'n4l-datasets-tabs'} mountOnEnter={true} unmountOnExit={true}
              onSelect={(task) => setSearchParams(task === null || task === TASKS.TABULAR_CLASSIFICATION ? {} : { task }, { replace: true })}>
              {TASK_TABS.map(({ task, title, canAnalyze, texts }) => {
                const { models, extra } = taskDatasets(task)
                return (
                  <Tab key={task} eventKey={task}
                    title={<>{t(title)} <Badge pill bg={'secondary'} className={'ms-1'}>{models.length + extra.length}</Badge></>}>
                    <DatasetsSection title={t(texts.mainTitle)} text={t(texts.mainText)}
                      datasets={models} canAnalyze={canAnalyze} openLabel={texts.open} onInfo={setSelected} />
                    <DatasetsSection title={t('datasets.extra-title')} text={t(texts.extraText)}
                      datasets={extra} canAnalyze={canAnalyze} openLabel={texts.open} onInfo={setSelected} />
                  </Tab>
                )
              })}
            </Tabs>
          </Card.Body>
        </Card>
      </Container>

      <N4LModal showModal={selected !== null}
        setShowModal={() => setSelected(null)}
        size={'xl'}
        title={selected !== null && t(selected.title)}
        ComponentBody={selected !== null &&
          <Tabs defaultActiveKey={'info'} className={'mb-3 n4l-dataset-modal-tabs'} mountOnEnter>
            <Tab eventKey={'info'} title={t('datasets.dataset-details')}>
              <N4LDatasetInfo info={selected.info} className={'text-body-secondary'} />
              {/* La descripción de su modelo; si no tiene (los de práctica, los del agrupamiento), su frase y para qué sirve */}
              {hasMenuModel(selected.task, selected.value ?? '')
                ? (description !== null ? description.DESCRIPTION() : <WaitingPlaceholder />)
                : <>
                  <p>{t(selected.summary)}</p>
                  <p className={'small text-body-secondary'}>{t(selected.value === undefined ? tabTexts(selected.task).extraText : tabTexts(selected.task).mainText)}</p>
                </>}
              {selected.info.source &&
                <p className={'mb-0'}>
                  <a className="link-secondary" href={selected.info.source} rel="noreferrer" target="_blank">{t('Reference')}</a>
                </p>
              }
            </Tab>
            {/* Las pestañas de los CSV (las imágenes de MNIST y KMNIST no tienen) */}
            {selectedCSV.length > 0 &&
              <Tab eventKey={'variables'} title={t('datasets.variables.title')}>
                <DatasetVariables files={selected.files} />
              </Tab>}
            {selectedCSV.length > 0 &&
              <Tab eventKey={'data'} title={t('datasets.data.title')}>
                <DataFileSelect files={selectedCSV} value={dataFile} onChange={setDataFile} />
                <Suspense fallback={<WaitingPlaceholder />}>
                  <DatasetDataFrame file={dataFile} view={'data'} />
                </Suspense>
              </Tab>}
            {selectedCSV.length > 0 &&
              <Tab eventKey={'describe'} title={t('datasets.data.describe')}>
                <DataFileSelect files={selectedCSV} value={dataFile} onChange={setDataFile} />
                <Suspense fallback={<WaitingPlaceholder />}>
                  <DatasetDataFrame file={dataFile} view={'describe'} />
                </Suspense>
              </Tab>}
          </Tabs>
        }
        ComponentFooter={selected !== null && <div className={'d-flex flex-wrap justify-content-end gap-2'}>
          {selected.files.filter(isCSV).map((file) => (
            <AnalyzeLink key={'analyze-' + file} file={file} name={t(selected.title)}
              label={selected.files.length > 1 ? `${t('datasets.analyze-action')} · ${datasetKey(file)}` : t('datasets.analyze-action')} />
          ))}
          {selected.files.map((file) => (
            <DownloadLink key={file} file={file} label={selected.files.length > 1 ? fileName(file) : t('download')} />
          ))}
        </div>}
      />
    </main>
  )
}
