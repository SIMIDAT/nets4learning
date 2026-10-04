import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { TASKS, UPLOAD } from '@/TASKS'
import { taskOptions } from '@/TASK_OPTIONS'
import { DataFrameReadCSV } from '@core/dataframe/DataFrameUtils'
import { DATASET_ACCEPT } from '@core/dataframe/datasetFormats'
import { readDatasetInWorker } from '@core/dataframe/datasetReaderClient'
import { compareWithLabels, elbow, kmeans, pca2, silhouette, standardize, type KMeansResult_t } from '@core/clustering/kmeans'
import { trackEvent } from '@core/analytics'
import { variableTables } from '@pages/datasets/datasetVariables'
import { datasetKey, projectDatasetByKey } from '@pages/analyze/projectDatasets'
import { useProjectDatasetUpload } from '@hooks/useProjectDatasetUpload'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import N4LPageHeader from '@components/neural-network/N4LPageHeader'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import { ClusterScatter, ElbowChart } from './ClusteringCharts'
import ClusteringComparison from './ClusteringComparison'
import { clusterColor } from './clusterColors'

const prefix = 'pages.playground.clustering.'
/** k del codo: de 1 a 8 grupos */
const ELBOW_KS = [1, 2, 3, 4, 5, 6, 7, 8]
const MIN_K = 2
const MAX_K = 10

/** Los datos: nombres de columna, filas (texto tal cual) y qué columnas son numéricas */
type Table_t = { columns: string[], rows: unknown[][], numeric: boolean[] }

type Run_t = {
  result     : KMeansResult_t
  /** Las filas usadas (sin las que tenían algún valor vacío en las columnas elegidas) */
  used       : number[]
  /** Puntos con los que se agrupó (escalados o no) */
  points     : number[][]
  silhouette : number
  elbow      : { k: number, inertia: number }[]
  features   : string[]
  labelColumn: string | null
}

/**
 * Agrupar (clustering) con k-means: se eligen las columnas y el número de grupos (k), y se ven los grupos en 2D, cómo se
 * forman iteración a iteración, la silueta, el codo y, si el conjunto trae las clases reales, cuánto se parecen.
 */
export default function Clustering({ dataset }: { dataset: string }) {
  const { t, i18n } = useTranslation()
  const option = taskOptions(TASKS.CLUSTERING, 'dataset').find(({ value }) => value === dataset)
  const file = option?.info?.files?.[0]
  const [table, setTable] = useState<Table_t | null>(null)
  // El nombre del fichero subido (o cargado desde /datasets), para el título
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [error, setError] = useState(false)

  // Las columnas que se usan, si se escalan, la de las etiquetas reales (opcional), k y la semilla
  const [features, setFeatures] = useState<string[]>([])
  const [labelColumn, setLabelColumn] = useState<string | null>(null)
  const [scale, setScale] = useState(true)
  const [k, setK] = useState(3)
  const [seed, setSeed] = useState(1)
  const [run, setRun] = useState<Run_t | null>(null)
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 }), [i18n.language])

  /** Al tener los datos: columnas numéricas de entrada y, según su ficha, la de las clases reales */
  const loadTable = (columns: string[], rows: unknown[][], dtypes: string[], sourceFile?: string) => {
    const numeric = dtypes.map((dtype) => dtype === 'float32' || dtype === 'int32')
    const variables = sourceFile === undefined ? undefined : variableTables([sourceFile])[0]?.variables
    const roleOf = (column: string) => variables?.find(({ name }) => name === column.trim())?.role
    // La de las clases: la que su ficha describe como objetivo o, si no, la última de texto con pocos valores
    const distinct = (column: string) => new Set(rows.map((row) => String(row[columns.indexOf(column)]))).size
    const target = columns.find((column) => roleOf(column) === 'Target')
      ?? [...columns].reverse().find((column) => !numeric[columns.indexOf(column)] && distinct(column) >= MIN_K && distinct(column) <= MAX_K)
      ?? null
    setTable({ columns, rows, numeric })
    setLabelColumn(target)
    setFeatures(columns.filter((column, index) => numeric[index] && column !== target && roleOf(column) !== 'ID'))
    if (target !== null) setK(Math.min(MAX_K, distinct(target)))
    setRun(null)
  }

  const onLoaded = useEffectEvent(loadTable)
  useEffect(() => {
    if (dataset === UPLOAD || file === undefined) return
    let isCancelled = false
    DataFrameReadCSV(import.meta.env.VITE_PATH + '/' + file)
      .then((dataframe) => {
        if (!isCancelled) onLoaded(dataframe.columns, dataframe.values as unknown[][], dataframe.dtypes as string[], file)
      })
      .catch((reason: unknown) => {
        console.error(reason)
        if (!isCancelled) setError(true)
      })
    return () => { isCancelled = true }
  }, [dataset, file])

  const handleUpload = async (files: File[]) => {
    if (files.length !== 1) return
    try {
      const { columns, rows, dtypes } = await readDatasetInWorker(files[0])
      // Un CSV del proyecto (desde /datasets, o descargado y vuelto a subir): con su ficha, sin agrupar por su identificador
      loadTable(columns, rows, dtypes, projectDatasetByKey(datasetKey(files[0].name))?.file)
      setUploadedName(files[0].name)
      setError(false)
    } catch (reason) {
      console.error(reason)
      setError(true)
    }
  }

  // Desde «Agrupar» en /datasets (?dataset=wdbc): se carga como si se hubiera subido
  useProjectDatasetUpload(TASKS.CLUSTERING, dataset === UPLOAD, (files) => { void handleUpload(files) })

  // La columna de las clases no se usa para agrupar, aunque sea numérica y estuviera marcada
  const chosen = features.filter((feature) => feature !== labelColumn)
  const handleRun = (withSeed = seed) => {
    if (table === null || chosen.length === 0) return
    const indices = chosen.map((feature) => table.columns.indexOf(feature))
    const used: number[] = []
    const raw: number[][] = []
    table.rows.forEach((row, index) => {
      const values = indices.map((column) => Number(row[column]))
      if (values.every(Number.isFinite)) {
        used.push(index)
        raw.push(values)
      }
    })
    if (raw.length < k) return
    const points = scale ? standardize(raw) : raw
    const result = kmeans(points, { k, seed: withSeed })
    setRun({
      result, used, points, features  : chosen, labelColumn,
      silhouette: silhouette(points, result.assignments, { seed: withSeed }),
      elbow     : elbow(points, ELBOW_KS.filter((value) => value <= raw.length), withSeed),
    })
    setStep(result.steps.length - 1)
    setIsPlaying(false)
    trackEvent('cluster_run', { k, features: chosen.length, scaled: scale, rows: raw.length })
  }

  // Ver cómo se forman los grupos: de la iteración 0 (los centroides iniciales) a la última
  // Se para sola al llegar a la última
  const isAnimating = isPlaying && run !== null && step < run.result.steps.length - 1
  useEffect(() => {
    if (!isAnimating) return
    const timer = window.setTimeout(() => setStep((current) => current + 1), 700)
    return () => window.clearTimeout(timer)
  }, [isAnimating, step])

  const projection = useMemo(() => (run === null ? null : pca2(run.points)), [run])
  const projected = useMemo(() => (run === null || projection === null ? [] : run.points.map(projection.project)), [run, projection])
  const comparison = useMemo(() => {
    if (run === null || run.labelColumn === null || table === null) return null
    const column = table.columns.indexOf(run.labelColumn)
    return compareWithLabels(run.result.assignments, run.used.map((index) => String(table.rows[index][column])), run.result.centroids.length)
  }, [run, table])
  // Cómo es cada grupo: cuántas filas y la media de cada columna, en sus unidades (sin escalar)
  const profiles = useMemo(() => {
    if (run === null || table === null) return []
    return run.result.centroids.map((_centroid, cluster) => {
      const members = run.used.filter((_index, position) => run.result.assignments[position] === cluster)
      const means = run.features.map((feature) => {
        const column = table.columns.indexOf(feature)
        return members.reduce((sum, index) => sum + Number(table.rows[index][column]), 0) / Math.max(1, members.length)
      })
      return { size: members.length, means }
    })
  }, [run, table])

  const silhouetteLevel = run === null ? null : run.silhouette > 0.5 ? 'good' : run.silhouette > 0.25 ? 'fair' : 'weak'
  const toggleFeature = (feature: string) =>
    setFeatures((current) => (current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature]))
  const datasetTitle = uploadedName ?? (option !== undefined ? t(option.i18n) : dataset)

  return (
    <Container className={'n4l-container-wide mb-4'} data-testid={'Test-Clustering'}>
      <N4LPageHeader title={<Trans i18nKey={'pages.index.clustering.1-title'} />} guideId={'clustering.' + dataset} guideSteps={null} className={'mt-2'} />
      <p className={'lead'}>{t(prefix + 'intro')}</p>

      {dataset === UPLOAD &&
        <Card className={'mb-3'}>
          <Card.Header><h2 className={'h5 mb-0'}>{t(prefix + 'upload')}</h2></Card.Header>
          <Card.Body>
            <DragAndDrop id={'drop-zone-clustering'} name={'csv'} accept={DATASET_ACCEPT} text={t('drag-and-drop.dataset')}
              labelFiles={t('drag-and-drop.label-files-one')} function_DropAccepted={handleUpload} />
          </Card.Body>
        </Card>}
      {error && <Alert variant={'danger'}>{t('error.file-upload')}</Alert>}
      {table === null && dataset !== UPLOAD && !error && <WaitingPlaceholder />}

      {table !== null && <Row className={'g-3'}>
        <Col xl={4}>
          <Card data-testid={'Test-Clustering-Controls'}>
            <Card.Header><h2 className={'h5 mb-0'}>{datasetTitle}</h2></Card.Header>
            <Card.Body>
              <p className={'small text-body-secondary'}>{t(prefix + 'rows', { count: table.rows.length })}</p>
              <fieldset className={'mb-3'}>
                <legend className={'fs-6 fw-semibold'}>{t(prefix + 'features')}</legend>
                {table.columns.map((column, index) => table.numeric[index] && column !== labelColumn && (
                  <Form.Check key={column} id={'clustering-feature-' + index} label={column}
                    checked={features.includes(column)} onChange={() => toggleFeature(column)} />
                ))}
                <Form.Text className={'text-muted'}>{t(prefix + 'features-help')}</Form.Text>
              </fieldset>
              <Form.Group className={'mb-3'} controlId={'clustering-label'}>
                <Form.Label className={'fw-semibold'}>{t(prefix + 'label')}</Form.Label>
                <Form.Select value={labelColumn ?? ''} onChange={(event) => setLabelColumn(event.target.value === '' ? null : event.target.value)}>
                  <option value={''}>{t(prefix + 'label-none')}</option>
                  {table.columns.map((column) => <option key={column} value={column}>{column}</option>)}
                </Form.Select>
                <Form.Text className={'text-muted'}>{t(prefix + 'label-help')}</Form.Text>
              </Form.Group>
              <Form.Check type={'switch'} id={'clustering-scale'} className={'mb-1'} label={t(prefix + 'scale')} checked={scale} onChange={() => setScale(!scale)} />
              <Form.Text className={'text-muted d-block mb-3'}>{t(prefix + 'scale-help')}</Form.Text>
              <Form.Group className={'mb-3'} controlId={'clustering-k'}>
                <Form.Label className={'fw-semibold'}>{t(prefix + 'k')}</Form.Label>
                <Form.Control type={'number'} min={MIN_K} max={MAX_K} value={k} onChange={(event) => setK(Math.min(MAX_K, Math.max(MIN_K, Number(event.target.value) || MIN_K)))} />
                <Form.Text className={'text-muted'}>{t(prefix + 'k-help')}</Form.Text>
              </Form.Group>
              <div className={'d-grid gap-2'}>
                <Button size={'lg'} onClick={() => handleRun()} disabled={chosen.length === 0} data-testid={'Test-Clustering-Run'}>{t(prefix + 'run')}</Button>
                {run !== null &&
                  <Button variant={'outline-primary'} onClick={() => {
                    setSeed(seed + 1)
                    handleRun(seed + 1)
                  }}>{t(prefix + 'reseed')}</Button>}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={8}>
          {run === null && <N4LEmptyState i18nKey={prefix + 'waiting'} />}
          {run !== null && projection !== null && <>
            <Card className={'mb-3'} data-testid={'Test-Clustering-Metrics'}>
              <Card.Body>
                <Row xs={2} md={4} className={'g-2 text-center'}>
                  <Col><div className={'small text-body-secondary'}>{t(prefix + 'groups')}</div><div className={'fs-4'}>{run.result.centroids.length}</div></Col>
                  <Col><div className={'small text-body-secondary'}>{t(prefix + 'iterations')}</div><div className={'fs-4'}>{run.result.steps.length - 1}</div></Col>
                  <Col><div className={'small text-body-secondary'}>{t(prefix + 'inertia')}</div><div className={'fs-4'}>{number.format(run.result.inertia)}</div></Col>
                  <Col data-testid={'Test-Clustering-Silhouette'}><div className={'small text-body-secondary'}>{t(prefix + 'silhouette')}</div><div className={'fs-4'}>{number.format(run.silhouette)}</div></Col>
                </Row>
                <p className={'small mt-3 mb-0'}>{t(prefix + 'silhouette-' + silhouetteLevel)}</p>
              </Card.Body>
            </Card>

            <Card className={'mb-3'} data-testid={'Test-Clustering-Scatter'}>
              <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
                <h2 className={'h5 mb-0'}>{t(prefix + 'scatter-title')}</h2>
                <div className={'d-flex align-items-center gap-2'}>
                  <Button size={'sm'} variant={'outline-primary'} onClick={() => {
                    if (step >= run.result.steps.length - 1) setStep(0)
                    setIsPlaying(!isAnimating)
                  }} data-testid={'Test-Clustering-Play'}>{t(prefix + (isAnimating ? 'pause' : 'play'))}</Button>
                  <Form.Range min={0} max={run.result.steps.length - 1} value={step} style={{ width: '10rem' }}
                    aria-label={t(prefix + 'iteration', { number: step })} onChange={(event) => {
                      setIsPlaying(false)
                      setStep(Number(event.target.value))
                    }} />
                  <Badge bg={'secondary'} data-testid={'Test-Clustering-Iteration'}>{t(prefix + 'iteration', { number: step })}</Badge>
                </div>
              </Card.Header>
              <Card.Body>
                <ClusterScatter points={projected} step={run.result.steps[step]} project={projection.project} explained={projection.explained} />
                <p className={'small text-body-secondary mt-2 mb-0'}>{t(prefix + 'scatter-help')}</p>
              </Card.Body>
            </Card>

            {comparison !== null && <ClusteringComparison comparison={comparison} labelColumn={run.labelColumn ?? ''} />}

            <Row className={'g-3'}>
              <Col lg={6}>
                <Card className={'h-100'} data-testid={'Test-Clustering-Elbow'}>
                  <Card.Header><h2 className={'h5 mb-0'}>{t(prefix + 'elbow-title')}</h2></Card.Header>
                  <Card.Body>
                    <ElbowChart values={run.elbow} k={run.result.centroids.length} />
                    <p className={'small text-body-secondary mt-2 mb-0'}>{t(prefix + 'elbow-help')}</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={6}>
                <Card className={'h-100'} data-testid={'Test-Clustering-Profiles'}>
                  <Card.Header><h2 className={'h5 mb-0'}>{t(prefix + 'profiles-title')}</h2></Card.Header>
                  <Card.Body>
                    {/* Una fila por columna y una columna por grupo: con muchas columnas (el vino tiene 13) cabe igual */}
                    {/* Con muchos grupos se desplaza: con el teclado también */}
                    <div className={'table-responsive'} tabIndex={0} role={'region'} aria-label={t(prefix + 'profiles-title')}>
                      <Table size={'sm'}>
                        <thead>
                          <tr>
                            <th scope={'col'}>{t(prefix + 'variable')}</th>
                            {profiles.map((_profile, cluster) => (
                              <th key={cluster} scope={'col'} className={'text-end text-nowrap'}>
                                <span className={'n4l-compare-swatch'} style={{ backgroundColor: clusterColor(cluster) }} aria-hidden={true} />
                                {t(prefix + 'cluster', { number: cluster + 1 })}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <th scope={'row'} className={'fw-normal'}>{t(prefix + 'size')}</th>
                            {profiles.map(({ size }, cluster) => <td key={cluster} className={'text-end'}>{size}</td>)}
                          </tr>
                          {run.features.map((feature, index) => (
                            <tr key={feature}>
                              <th scope={'row'} className={'fw-normal'}>{feature}</th>
                              {profiles.map(({ means }, cluster) => <td key={cluster} className={'text-end'}>{number.format(means[index])}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    <p className={'small text-body-secondary mb-0'}>{t(prefix + 'profiles-help')}</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>}
        </Col>
      </Row>}
    </Container>
  )
}
